import { getClerkToken } from '@/lib/token-manager';

function buildHeaders(existingHeaders?: HeadersInit) {
  const headers = new Headers(existingHeaders);
  // 优先使用 Clerk JWT，fallback 到旧 localStorage token（过渡期兼容）
  const clerkToken = getClerkToken();
  if (clerkToken) {
    headers.set('Authorization', `Bearer ${clerkToken}`);
  } else {
    // 旧 localStorage token（过渡期兼容，后续可移除）
    if (typeof window !== 'undefined') {
      const legacyToken = localStorage.getItem('accessToken');
      if (legacyToken) {
        headers.set('Authorization', `Bearer ${legacyToken}`);
      }
    }
  }
  return headers;
}

/**
 * 带 Clerk JWT 的 fetch 封装。
 * 自动附加 Authorization header，401 时触发 Clerk 登录。
 */
export async function clerkFetch(input: RequestInfo, init?: RequestInit) {
  const headers = buildHeaders(init?.headers);
  const requestInit: RequestInit = { ...init, headers };

  const response = await fetch(input, requestInit);

  if (response.status === 401 && typeof window !== 'undefined') {
    // Clerk middleware 会在下次导航时拦截，这里直接跳转触发重定向
    window.location.href = '/sign-in';
  }

  return response;
}

// 保留旧的 authFetch 供现有代码使用（过渡期兼容）
export async function authFetch(input: RequestInfo, init?: RequestInit) {
  return clerkFetch(input, init);
}
