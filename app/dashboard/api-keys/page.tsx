"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Key, LineChart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsageLoading, setIsUsageLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsageStats = async () => {
    try {
      const res = await fetch('/api/api-keys/usage');
      const data = await res.json();
      if (res.ok) setUsageStats(data.usage || []);
    } catch (e) {
      console.error(e);
      toast.error('Gagal mendapatkan statistik penggunaan');
    } finally {
      setIsUsageLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/api-keys");
      const data = await res.json();
      if (res.ok) setApiKeys(data.apiKeys || []);
    } catch (e) {
      console.error(e);
      toast.error("Gagal mendapatkan API keys");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
    fetchUsageStats();
  }, []);

  const usageByKeyId = new Map(usageStats.map((stat) => [stat.api_key_id, stat]));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return toast.error("Nama API Key harus diisi");
    
    setIsCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("API Key berhasil dibuat!");
        setNewKeyName("");
        fetchApiKeys();
      } else {
        toast.error(data.error || "Gagal membuat API Key");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus API key ini? Fitur yang memakainya mungkin akan berhenti berfungsi.")) return;
    
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("API Key dihapus");
        setApiKeys(apiKeys.filter((k) => k.id !== id));
      } else {
        toast.error("Gagal menghapus API Key");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Tersalin ke clipboard!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
        <p className="text-muted-foreground mt-2">
          Kelola API key Anda untuk autentikasi permintaan dari embed chat room Eksternal. 
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buat API Key Baru</CardTitle>
          <CardDescription>Beri nama key untuk membedakan penggunaannya nanti.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="keyName">Nama Key</Label>
              <Input
                id="keyName"
                placeholder="Misal: Website Produksi Utama"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <Button type="submit" disabled={isCreating || !newKeyName.trim()}>
              {isCreating ? "Menyimpan..." : <><Plus size={16} className="mr-2" /> Generate Key</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key size={20} />
            Daftar API Keys Anda
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-4">Memuat...</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Anda belum memiliki API Key.</p>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card">
                  <div>
                    <h4 className="font-semibold text-foreground">{key.name}</h4>
                    <p className="text-sm text-muted-foreground font-mono mt-1 blur-sm hover:blur-none transition-all duration-200 cursor-pointer">
                      {key.key_value}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <p>
                        Digunakan terakhir: {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Belum pernah digunakan'}
                      </p>
                      <p>
                        Total request: {usageByKeyId.get(key.id)?.total_requests ?? 0} | Total token: {usageByKeyId.get(key.id)?.total_tokens ?? 0}
                        {isUsageLoading ? ' (memuat statistik...)' : ''}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Dibuat pada: {new Date(key.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/dashboard/api-keys/${key.id}/analytics`}>
                        <LineChart size={16} className="mr-2" />
                        Analytics
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(key.key_value)}>
                      <Copy size={16} />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(key.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}