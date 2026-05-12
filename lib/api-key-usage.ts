import { createClient } from '@/lib/supabase/server';

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  name: string;
  key_value: string;
  is_active: boolean;
}

export interface ApiKeyUsageContext {
  apiKey: ApiKeyRecord;
  chatbotId?: string;
  chatbotName?: string;
  sessionId?: string;
  source?: string;
  requestPath?: string;
  requestMethod?: string;
  requestIp?: string;
  userAgent?: string;
  message?: string;
  response?: string;
  decision?: string;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    tokenSource?: string;
  };
}

type CachedApiKey = {
  record: ApiKeyRecord | null;
  expires: number;
};

const API_KEY_CACHE = new Map<string, CachedApiKey>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 60;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;

function trimText(text?: string | null) {
  return text?.trim() || '';
}

export function estimateTokens(text?: string | null) {
  const normalized = trimText(text);
  if (!normalized) return 0;

  return Math.max(1, Math.ceil(normalized.length / 4));
}

export function extractClientIp(request: { headers: Headers }) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-client-ip') ||
    null
  );
}

export async function authenticateApiKey(apiKey: string, supabase?: any) {
  const client = supabase || (await createClient());
  const now = Date.now();
  const cached = API_KEY_CACHE.get(apiKey);

  if (cached && cached.expires > now) {
    return cached.record;
  }

  const { data, error } = await client
    .from('api_keys')
    .select('id, user_id, name, key_value, is_active')
    .eq('key_value', apiKey)
    .single();

  const record: ApiKeyRecord | null = !error && data && data.is_active ? data : null;

  if (API_KEY_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = API_KEY_CACHE.keys().next().value;
    if (firstKey) {
      API_KEY_CACHE.delete(firstKey);
    }
  }

  API_KEY_CACHE.set(apiKey, { record, expires: now + CACHE_TTL_MS });
  return record;
}

export async function checkApiKeyRateLimit(
  apiKeyId: string,
  supabase: any,
  options?: {
    limitPerMinute?: number;
    windowMs?: number;
  }
) {
  const limitPerMinute = options?.limitPerMinute ?? DEFAULT_RATE_LIMIT_PER_MINUTE;
  const windowMs = options?.windowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS;

  if (limitPerMinute <= 0) {
    return { allowed: true, currentCount: 0, limitPerMinute, windowMs };
  }

  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await supabase
    .from('api_key_usage_logs')
    .select('id', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('created_at', since);

  if (error) {
    return { allowed: true, currentCount: 0, limitPerMinute, windowMs };
  }

  const currentCount = count ?? 0;
  return {
    allowed: currentCount < limitPerMinute,
    currentCount,
    limitPerMinute,
    windowMs,
  };
}

export function buildTokenUsage(message?: string, response?: string, tokenUsage?: ApiKeyUsageContext['tokenUsage']) {
  const promptTokens =
    tokenUsage?.promptTokens ??
    estimateTokens(message);

  const completionTokens =
    tokenUsage?.completionTokens ??
    estimateTokens(response);

  const totalTokens =
    tokenUsage?.totalTokens ??
    promptTokens + completionTokens;

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    tokenSource: tokenUsage?.tokenSource || 'estimated',
  };
}

export async function recordApiKeyUsage(supabase: any, context: ApiKeyUsageContext) {
  const tokenUsage = buildTokenUsage(context.message, context.response, context.tokenUsage);
  const requestMethod = context.requestMethod || 'POST';
  const requestPath = context.requestPath || '/api/chatbots/[id]/chat';
  const source = context.source || 'widget';

  const { error } = await supabase.from('api_key_usage_logs').insert({
    api_key_id: context.apiKey.id,
    api_key_user_id: context.apiKey.user_id,
    api_key_name_snapshot: context.apiKey.name,
    api_key_value_prefix: context.apiKey.key_value.slice(0, 12),
    chatbot_id: context.chatbotId || null,
    chatbot_name_snapshot: context.chatbotName || null,
    session_id: context.sessionId || null,
    source,
    request_path: requestPath,
    request_method: requestMethod,
    request_ip: context.requestIp || null,
    user_agent: context.userAgent || null,
    message_length: context.message?.length || 0,
    response_length: context.response?.length || 0,
    prompt_tokens: tokenUsage.promptTokens,
    completion_tokens: tokenUsage.completionTokens,
    total_tokens: tokenUsage.totalTokens,
    token_source: tokenUsage.tokenSource,
    decision: context.decision || null,
    response_time_ms: context.durationMs ?? null,
    is_success: context.success !== false,
    error_message: context.errorMessage || null,
  });

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', context.apiKey.id);

  return { ok: !error, tokenUsage };
}