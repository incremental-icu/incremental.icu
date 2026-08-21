"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { setClerkToken } from "@/lib/token-manager";

/**
 * 定期同步 Clerk JWT 到全局 token 缓存。
 * authFetch/clerkFetch 通过 getClerkToken() 同步读取，无需 await。
 */
export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, getToken } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 等待 Clerk 完成加载（会话状态就绪）后再同步 token
    if (!isLoaded) return;

    let cancelled = false;

    // 立即获取一次
    const syncToken = async () => {
      try {
        const token = await getToken();
        if (!cancelled) setClerkToken(token ?? null);
      } catch {
        if (!cancelled) setClerkToken(null);
      } finally {
        // 首次同步完成后放行子组件渲染，避免无 token 时发起请求导致 401
        if (!cancelled) setReady(true);
      }
    };

    syncToken();

    // 每 50 秒刷新一次（Clerk JWT 默认 60s 过期）
    intervalRef.current = setInterval(syncToken, 50_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setClerkToken(null);
    };
  }, [isLoaded, getToken]);

  // 等首次 token 同步完成再渲染子组件
  if (!ready) return null;

  return <>{children}</>;
}
