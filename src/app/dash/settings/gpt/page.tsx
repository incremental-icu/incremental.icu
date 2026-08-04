'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authFetch } from '@/lib/api';
import { IconRefresh, IconCopy, IconCheck } from '@tabler/icons-react';

interface OauthCodeResponse {
  code: string;
  expires_at: string;
  expires_in: number;
}

export default function GptCodePage() {
  const t = useTranslations("GptCodePage");
  const [code, setCode] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadCode = useCallback(async (force: boolean) => {
    try {
      const url = force ? '/api/v1/user/oauth-code' : '/api/v1/user/oauth-code';
      const res = await authFetch(url, { method: force ? 'POST' : 'GET' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail || t("loadError"));
        return;
      }
      const data: OauthCodeResponse = await res.json();
      setCode(data.code);
      setExpiresAt(new Date(data.expires_at).getTime());
      setRemaining(Math.max(0, data.expires_in));
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCode(false);
  }, [loadCode]);

  // 倒计时：每秒更新，过期后自动重新获取
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => {
      const secs = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        setCode('');
        loadCode(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, loadCode]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCode(true);
      toast.success(t("refreshed"));
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("desc")}</p>
      </div>

      {/* 授权码展示卡片 */}
      <div className="rounded-xl bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{t("codeLabel")}</span>
          {code && (
            <span className="text-xs text-muted-foreground">
              {remaining > 0
                ? t("expireIn", { s: remaining })
                : t("expired")}
            </span>
          )}
        </div>

        {loading ? (
          <div className="h-16 flex items-center justify-center text-sm text-muted-foreground">
            {t("loading")}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg bg-muted px-4 py-4 text-center font-mono text-3xl font-semibold tracking-[0.4em]">
              {code || '······'}
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={handleCopy} disabled={!code}>
              {copied ? <IconCheck className="h-5 w-5 text-green-500" /> : <IconCopy className="h-5 w-5" />}
            </Button>
          </div>
        )}

        {/* 过期进度条 */}
        {code && (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${(remaining / 300) * 100}%` }}
            />
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{t("tips")}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
            <IconRefresh className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="rounded-xl bg-background p-6">
        <h2 className="mb-4 text-sm font-semibold">{t("howToTitle")}</h2>
        <ol className="space-y-3 text-sm text-foreground">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
            <span>{t("step1")}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
            <span>{t("step2")}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
            <span>{t("step3")}</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
