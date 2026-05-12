"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Bot, Clock3, Key, TimerReset, TrendingUp, Users2, Activity, ShieldAlert, CalendarDays, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AnalyticsResponse = {
  apiKey: {
    id: string;
    name: string;
    key_value: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_used_at: string | null;
  };
  summary: {
    totalRequests: number;
    successRequests: number;
    failedRequests: number;
    successRate: number;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    avgTokensPerRequest: number;
    avgResponseTimeMs: number;
    todayRequests: number;
    todayTokens: number;
    yesterdayRequests: number;
    requestChangeFromYesterday: number;
  };
  dailyUsage: Array<{ date: string; label: string; requests: number; tokens: number; success: number; failed: number }>;
  sourceBreakdown: Array<{ name: string; requests: number; tokens: number }>;
  decisionBreakdown: Array<{ name: string; requests: number; tokens: number }>;
  topChatbots: Array<{ name: string; requests: number; tokens: number; failures: number }>;
  recentUsage: Array<{
    id: string;
    chatbot_name_snapshot: string | null;
    source: string;
    request_method: string;
    decision: string | null;
    total_tokens: number;
    response_time_ms: number | null;
    is_success: boolean;
    created_at: string;
  }>;
};

const COLORS = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function StatCard({ icon: Icon, label, value, description }: { icon: any; label: string; value: string; description: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApiKeyAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const apiKeyId = params?.id;
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!apiKeyId) return;

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/api-keys/${apiKeyId}/analytics`);
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error || 'Failed to load analytics');
        }
        setData(payload);
      } catch (error: any) {
        toast.error(error.message || 'Gagal memuat analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [apiKeyId]);

  const hourlyShape = useMemo(() => data?.dailyUsage ?? [], [data]);

  if (isLoading) {
    return <p className="text-muted-foreground">Memuat analytics...</p>;
  }

  if (!data) {
    return <p className="text-muted-foreground">Analytics tidak tersedia.</p>;
  }

  const successRequests = data.summary.successRequests;
  const failedRequests = data.summary.failedRequests;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/api-keys" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to API Keys
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">API Key Analytics</h1>
          <p className="text-muted-foreground">
            Statistik untuk <span className="font-semibold text-foreground">{data.apiKey.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-3">
          <Key className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm text-muted-foreground">{data.apiKey.key_value}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Total Requests"
          value={data.summary.totalRequests.toLocaleString('id-ID')}
          description={`${data.summary.todayRequests.toLocaleString('id-ID')} request hari ini`}
        />
        <StatCard
          icon={Zap}
          label="Total Tokens"
          value={data.summary.totalTokens.toLocaleString('id-ID')}
          description={`${Math.round(data.summary.avgTokensPerRequest)} token rata-rata per request`}
        />
        <StatCard
          icon={Clock3}
          label="Avg Response"
          value={`${Math.round(data.summary.avgResponseTimeMs)} ms`}
          description={`${successRequests} sukses, ${failedRequests} gagal`}
        />
        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={`${data.summary.successRate.toFixed(1)}%`}
          description={`${data.summary.requestChangeFromYesterday >= 0 ? '+' : ''}${data.summary.requestChangeFromYesterday.toFixed(1)}% vs kemarin`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Requests & Tokens Harian</CardTitle>
            <CardDescription>30 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyShape}>
                  <defs>
                    <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tokensGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tickMargin={10} minTickGap={18} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="requests" stroke="#4F46E5" fill="url(#requestsGradient)" name="Requests" />
                  <Area type="monotone" dataKey="tokens" stroke="#06B6D4" fill="url(#tokensGradient)" name="Tokens" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Split</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-muted-foreground">Prompt</p>
                  <p className="mt-1 text-lg font-semibold">{data.summary.promptTokens.toLocaleString('id-ID')}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-muted-foreground">Completion</p>
                  <p className="mt-1 text-lg font-semibold">{data.summary.completionTokens.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                {data.summary.totalRequests > 0
                  ? 'Token dihitung dari log request. Jika backend belum mengirim usage asli, estimator berbasis panjang prompt/response digunakan.'
                  : 'Belum ada usage untuk API key ini.'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Hari Ini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Requests</span>
                <span className="font-semibold">{data.summary.todayRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tokens</span>
                <span className="font-semibold">{data.summary.todayTokens.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">API Key Status</span>
                <span className={data.apiKey.is_active ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
                  {data.apiKey.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Used</span>
                <span className="font-semibold">
                  {data.apiKey.last_used_at ? new Date(data.apiKey.last_used_at).toLocaleString('id-ID') : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Chatbots</CardTitle>
            <CardDescription>Paling sering dipanggil dengan API key ini</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topChatbots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              <div className="space-y-3">
                {data.topChatbots.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.failures} failure(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.requests} req</p>
                      <p className="text-xs text-muted-foreground">{item.tokens.toLocaleString('id-ID')} token</p>
                    </div>
                    <div className="ml-3 h-8 w-8 rounded-full bg-primary/10 text-center text-sm font-semibold leading-8 text-primary">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Request</CardTitle>
            <CardDescription>Source dan decision breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.sourceBreakdown} dataKey="requests" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                      {data.sourceBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {data.sourceBreakdown.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.requests}</span>
                  </div>
                ))}
                <div className="pt-2">
                  {data.decisionBreakdown.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center justify-between py-1 text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{item.requests}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>20 request terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-3 pr-4">Time</th>
                  <th className="py-3 pr-4">Chatbot</th>
                  <th className="py-3 pr-4">Source</th>
                  <th className="py-3 pr-4">Decision</th>
                  <th className="py-3 pr-4">Tokens</th>
                  <th className="py-3 pr-4">Latency</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsage.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 whitespace-nowrap">{new Date(item.created_at).toLocaleString('id-ID')}</td>
                    <td className="py-3 pr-4">{item.chatbot_name_snapshot || '-'}</td>
                    <td className="py-3 pr-4">{item.source}</td>
                    <td className="py-3 pr-4">{item.decision || '-'}</td>
                    <td className="py-3 pr-4">{item.total_tokens.toLocaleString('id-ID')}</td>
                    <td className="py-3 pr-4">{item.response_time_ms ?? '-'} ms</td>
                    <td className="py-3 pr-4">
                      <span className={item.is_success ? 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700' : 'rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700'}>
                        {item.is_success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}