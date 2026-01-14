'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/utils/auth';
import { isAdmin } from '@/utils/auth';

export default function Debug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    const info: any = {};

    // 读取 localStorage 数据
    info.session = localStorage.getItem('crypto_session');
    info.token = localStorage.getItem('crypto_auth_token');
    info.users = localStorage.getItem('crypto_users');

    try {
      if (info.session) {
        info.sessionParsed = JSON.parse(info.session);
      }
    } catch (e) {
      info.sessionParseError = '无法解析session';
    }

    try {
      if (info.users) {
        const users = JSON.parse(info.users);
        const rootUser = users.find((u: any) => u.username === 'root');
        info.rootUser = rootUser;
        info.usersCount = users.length;
      }
    } catch (e) {
      info.usersParseError = '无法解析users';
    }

    // 获取当前用户
    const currentUser = await getCurrentUser();
    info.currentUser = currentUser;

    // 检查是否管理员
    info.isAdmin = isAdmin();

    setDebugInfo(info);
  };

  const forceInitAdmin = async () => {
    const { initAdminUser } = await import('@/utils/auth');
    await initAdminUser();
    alert('管理员账号已初始化，请刷新页面');
    loadDebugInfo();
  };

  const clearSession = () => {
    localStorage.removeItem('crypto_session');
    localStorage.removeItem('crypto_auth_token');
    alert('会话已清除，请重新登录');
    loadDebugInfo();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">调试信息</h1>

        <div className="mb-6 space-x-4">
          <button
            onClick={loadDebugInfo}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            刷新信息
          </button>
          <button
            onClick={forceInitAdmin}
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            强制初始化管理员
          </button>
          <button
            onClick={clearSession}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            清除会话
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold">当前用户</h2>
            <pre className="overflow-auto bg-gray-100 p-4 text-sm">
              {JSON.stringify(debugInfo.currentUser, null, 2)}
            </pre>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold">是否管理员: {debugInfo.isAdmin ? '是' : '否'}</h2>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold">Session数据</h2>
            <pre className="overflow-auto bg-gray-100 p-4 text-sm">
              {JSON.stringify(debugInfo.sessionParsed, null, 2)}
            </pre>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold">Root用户数据</h2>
            <pre className="overflow-auto bg-gray-100 p-4 text-sm">
              {JSON.stringify(debugInfo.rootUser, null, 2)}
            </pre>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold">Token</h2>
            <p className="text-sm">{debugInfo.token ? '存在' : '不存在'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
