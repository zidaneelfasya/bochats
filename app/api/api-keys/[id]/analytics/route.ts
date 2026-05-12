import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type UsageRow = {
  id: string;
  chatbot_id: string | null;
  chatbot_name_snapshot: string | null;
  session_id: string | null;
  source: string;
  request_path: string;
  request_method: string;
  request_ip: string | null;
  user_agent: string | null;
  message_length: number;
  response_length: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  token_source: string;
  decision: string | null;
  response_time_ms: number | null;
  is_success: boolean;
  error_message: string | null;
  created_at: string;
};

function toDateKey(dateValue: string) {
  return dateValue.slice(0, 10);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return startOfUtcDay(date);
}

function createDailySeries(rows: UsageRow[], days: number) {
  const series = Array.from({ length: days }, (_, index) => {
    const current = daysAgo(days - index - 1);
    return {
      date: current.toISOString().slice(0, 10),
      label: current.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
      requests: 0,
      tokens: 0,
      success: 0,
      failed: 0,
    };
  });

  const byDate = new Map(series.map((entry) => [entry.date, entry]));

  rows.forEach((row) => {
    const key = toDateKey(row.created_at);
    const target = byDate.get(key);
    if (!target) return;

    target.requests += 1;
    target.tokens += row.total_tokens || 0;
    if (row.is_success) {
      target.success += 1;
    } else {
      target.failed += 1;
    }
  });

  return series;
}

function groupBy<T extends { [key: string]: any }>(rows: T[], keyName: keyof T, valueName: keyof T) {
  const map = new Map<string, { name: string; requests: number; tokens: number }>();

  rows.forEach((row) => {
    const key = String(row[keyName] || 'Unknown');
    const entry = map.get(key) || { name: key, requests: 0, tokens: 0 };
    entry.requests += 1;
    entry.tokens += Number(row[valueName] || 0);
    map.set(key, entry);
  });

  return Array.from(map.values()).sort((a, b) => b.requests - a.requests);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data: apiKey, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('id, user_id, name, key_value, is_active, created_at, updated_at, last_used_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (apiKeyError || !apiKey) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 });
  }

  const { data: usageRows, error } = await supabase
    .from('api_key_usage_logs')
    .select('id, chatbot_id, chatbot_name_snapshot, session_id, source, request_path, request_method, request_ip, user_agent, message_length, response_length, prompt_tokens, completion_tokens, total_tokens, token_source, decision, response_time_ms, is_success, error_message, created_at')
    .eq('api_key_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (usageRows || []) as UsageRow[];
  const totalRequests = rows.length;
  const successRequests = rows.filter((row) => row.is_success).length;
  const failedRequests = totalRequests - successRequests;
  const totalTokens = rows.reduce((sum, row) => sum + (row.total_tokens || 0), 0);
  const promptTokens = rows.reduce((sum, row) => sum + (row.prompt_tokens || 0), 0);
  const completionTokens = rows.reduce((sum, row) => sum + (row.completion_tokens || 0), 0);
  const responseTimeRows = rows.filter((row) => typeof row.response_time_ms === 'number');
  const avgResponseTimeMs = responseTimeRows.length
    ? responseTimeRows.reduce((sum, row) => sum + (row.response_time_ms || 0), 0) / responseTimeRows.length
    : 0;

  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterdayKey = daysAgo(1).toISOString().slice(0, 10);
  const todayRows = rows.filter((row) => toDateKey(row.created_at) === todayKey);
  const yesterdayRows = rows.filter((row) => toDateKey(row.created_at) === yesterdayKey);

  const dailyUsage = createDailySeries(rows, 30);
  const sourceBreakdownMap = new Map<string, { name: string; requests: number; tokens: number }>();
  const decisionBreakdownMap = new Map<string, { name: string; requests: number; tokens: number }>();
  const chatbotBreakdown = new Map<string, { name: string; requests: number; tokens: number; failures: number }>();

  rows.forEach((row) => {
    const sourceKey = row.source || 'widget';
    const sourceEntry = sourceBreakdownMap.get(sourceKey) || { name: sourceKey, requests: 0, tokens: 0 };
    sourceEntry.requests += 1;
    sourceEntry.tokens += row.total_tokens || 0;
    sourceBreakdownMap.set(sourceKey, sourceEntry);

    const decisionKey = row.decision || 'UNKNOWN';
    const decisionEntry = decisionBreakdownMap.get(decisionKey) || { name: decisionKey, requests: 0, tokens: 0 };
    decisionEntry.requests += 1;
    decisionEntry.tokens += row.total_tokens || 0;
    decisionBreakdownMap.set(decisionKey, decisionEntry);

    const chatbotKey = row.chatbot_id || row.chatbot_name_snapshot || 'Unknown';
    const chatbotEntry = chatbotBreakdown.get(chatbotKey) || {
      name: row.chatbot_name_snapshot || chatbotKey,
      requests: 0,
      tokens: 0,
      failures: 0,
    };
    chatbotEntry.requests += 1;
    chatbotEntry.tokens += row.total_tokens || 0;
    if (!row.is_success) {
      chatbotEntry.failures += 1;
    }
    chatbotBreakdown.set(chatbotKey, chatbotEntry);
  });

  const topChatbots = Array.from(chatbotBreakdown.values())
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 5);

  const recentUsage = rows.slice(0, 20);

  return NextResponse.json({
    apiKey,
    summary: {
      totalRequests,
      successRequests,
      failedRequests,
      successRate: totalRequests ? (successRequests / totalRequests) * 100 : 0,
      totalTokens,
      promptTokens,
      completionTokens,
      avgTokensPerRequest: totalRequests ? totalTokens / totalRequests : 0,
      avgResponseTimeMs,
      todayRequests: todayRows.length,
      todayTokens: todayRows.reduce((sum, row) => sum + (row.total_tokens || 0), 0),
      yesterdayRequests: yesterdayRows.length,
      requestChangeFromYesterday: yesterdayRows.length
        ? ((todayRows.length - yesterdayRows.length) / yesterdayRows.length) * 100
        : todayRows.length > 0
          ? 100
          : 0,
    },
    dailyUsage,
    sourceBreakdown: Array.from(sourceBreakdownMap.values()).sort((a, b) => b.requests - a.requests),
    decisionBreakdown: Array.from(decisionBreakdownMap.values()).sort((a, b) => b.requests - a.requests),
    topChatbots,
    recentUsage,
  });
}