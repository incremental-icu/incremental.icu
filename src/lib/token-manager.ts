/**
 * 全局 token 缓存，用于 authFetch 同步读取 Clerk JWT。
 *
 * 工作原理：
 * 1. TokenProvider 组件定期调用 Clerk getToken() 刷新 token
 * 2. 刷新后写入全局缓存（_clerkToken）
 * 3. authFetch 直接从缓存读取，无需 await，保持同步调用签名不变
 */

let _clerkToken: string | null = null;
let _tokenExpiresAt: number = 0;

export function setClerkToken(token: string | null, expiresIn?: number) {
  _clerkToken = token;
  // Clerk token 通常 60s 过期，提前 10s 刷新
  _tokenExpiresAt = Date.now() + ((expiresIn ?? 60) - 10) * 1000;
}

export function getClerkToken(): string | null {
  if (Date.now() >= _tokenExpiresAt) {
    return null; // 已过期，等 TokenProvider 刷新
  }
  return _clerkToken;
}
