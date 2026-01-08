'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, isAdmin } from './auth';

/**
 * 需要登录的路由保护
 */
export function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
    }
  }, [router]);
}

/**
 * 需要管理员权限的路由保护
 */
export function useRequireAdmin() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }

    if (!isAdmin()) {
      router.push('/');
    }
  }, [router]);
}
