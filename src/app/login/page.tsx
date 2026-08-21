'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 兼容旧路由：项目从自定义登录迁移到 Clerk 后 `/login` 页面被移除，
 * 但仍有旧代码与 Clerk 重定向配置指向 `/login`，这里统一跳转到 Clerk 的 `/sign-in`。
 */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // 保留 query 参数（如 redirect_url），避免丢失登录后的回跳地址
    router.replace('/sign-in' + window.location.search);
  }, [router]);

  return null;
}
