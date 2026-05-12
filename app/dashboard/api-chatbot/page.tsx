"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Code2, Copy, Key, MessageSquareText, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const endpointExample = `POST /api/chatbots/{chatbotId}/chat

Headers:
  Content-Type: application/json
  Authorization: Bearer <YOUR_API_KEY>

Body:
  {
    "message": "Apa kebijakan refund?",
    "sessionId": "client-session-123"
  }`;

const fetchExample = `const response = await fetch('https://your-domain.com/api/chatbots/{chatbotId}/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_API_KEY>',
  },
  body: JSON.stringify({
    message: 'Apa kebijakan refund?',
    sessionId: 'client-session-123',
  }),
});

const data = await response.json();
console.log(data.reply);`;

const curlExample = `curl -X POST "https://your-domain.com/api/chatbots/{chatbotId}/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -d '{
    "message": "Apa kebijakan refund?",
    "sessionId": "client-session-123"
  }'`;

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Copied ${title}`);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80">
      <CardHeader className="p-2 flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border/60 bg-muted/30">
        <div>
          <CardTitle className="text-sm">{title}</CardTitle>
          {/* <CardDescription>Copy-paste ready</CardDescription> */}
        </div>
        <Button variant="secondary" size="sm" onClick={copy}>
          <Copy size={14} className="mr-2" />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <pre className="overflow-x-auto bg-slate-950 p-4 text-xs text-slate-100">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

export default function ApiChatbotGuidePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-lg shadow-slate-950/20">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-300">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          API Only Mode
          <Badge className="border border-white/15 bg-white/10 text-white hover:bg-white/15">No widget required</Badge>
        </div>
        <div className="mt-4 max-w-3xl space-y-3">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">API Chatbot Guide</h1>
          <p className="text-sm leading-6 text-slate-300 md:text-base">
            Gunakan Ragly langsung lewat API tanpa widget. Developer cukup memanggil endpoint chat yang sama seperti widget, lalu membangun UI sendiri di frontend mereka.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"><Key className="h-4 w-4" /> API Key as Bearer token</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"><MessageSquareText className="h-4 w-4" /> Session-based chat</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5"><ShieldCheck className="h-4 w-4" /> Usage tracking enabled</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ArrowLeft className="h-4 w-4 rotate-180" /> 1. Choose chatbot</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Ambil <span className="font-semibold text-foreground">chatbotId</span> dari halaman detail chatbot. ID ini dipakai di URL endpoint.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Key className="h-4 w-4" /> 2. Send API key</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Kirim API key lewat header <span className="font-semibold text-foreground">Authorization: Bearer ...</span>. Tidak perlu tampilkan key di UI publik.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><MessageSquareText className="h-4 w-4" /> 3. Send message</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Kirim body minimal: <span className="font-semibold text-foreground">message</span> dan opsional <span className="font-semibold text-foreground">sessionId</span> untuk menjaga konteks percakapan.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <CodeBlock title="API Endpoint" code={endpointExample} />
          <CodeBlock title="JavaScript / fetch" code={fetchExample} />
          <CodeBlock title="cURL" code={curlExample} />
        </div>

        <div className="space-y-4">
          <Card className="border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-100">
                <TriangleAlert className="h-4 w-4" /> No mode needed
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-900/80 dark:text-amber-100/80">
              Untuk sekarang, cukup gunakan endpoint chat langsung. Tidak perlu mengirim parameter mode dari frontend.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Code2 className="h-4 w-4" /> Response shape</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">success</span>: status request.</p>
              <p><span className="font-semibold text-foreground">reply</span>: jawaban chatbot.</p>
              <p><span className="font-semibold text-foreground">decision</span>: routing internal, jika diperlukan.</p>
              <p><span className="font-semibold text-foreground">duration</span>: waktu proses dalam ms.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Best practice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Gunakan UI Anda sendiri untuk chat history, input, dan streaming jika dibutuhkan.</p>
              <p>Simpan <span className="font-semibold text-foreground">sessionId</span> per user agar percakapan konsisten.</p>
              <p>Jangan hardcode API key di aplikasi publik; simpan di server Anda jika memungkinkan.</p>
              <p>Jika Anda ingin sepenuhnya API-first, endpoint ini sudah cukup tanpa widget atau embed script.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
        <span>Need the full dashboard? Open chatbot details or API key analytics.</span>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/chatbots">Chatbots</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/api-keys">API Keys</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}