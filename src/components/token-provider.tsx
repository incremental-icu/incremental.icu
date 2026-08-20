"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { setClerkToken } from "@/lib/token-manager";

/**
 * 定期同步 Clerk JWT 到全局 token 缓存。
 * authFetch/clerkFetch 通过 getClerkToken() 同步读取，无需 await。
 */
export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 立即获取一次
    const syncToken = async () => {
      try {
        const token = await getToken();
        setClerkToken(token ?? null);
      } catch {
        setClerkToken(null);
      }
    };

    syncToken();

    // 每 50 秒刷新一次（Clerk JWT 默认 60s 过期）
    intervalRef.current = setInterval(syncToken, 50_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setClerkToken(null);
    };
  }, [getToken]);

  return <>{children}</>;
}
