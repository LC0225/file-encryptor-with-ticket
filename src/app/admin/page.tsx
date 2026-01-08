'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAdmin, getAllUsers, deleteUser, logoutUser } from '@/utils/auth';

export default function Admin() {
  const router = useRouter();
  const [users, setUsers] = useState<ReturnType<typeof getAllUsers>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // 检查是否为管理员
    if (!isAdmin()) {
      router.push('/');
      return;
    }

    loadUsers();
  }, [router]);

  const loadUsers = () => {
    setUsers(getAllUsers());
    setLoading(false);
  };

  const handleDelete = (userId: string) => {
    setSelectedUser(userId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      const result = deleteUser(selectedUser);
      if (result.success) {
        loadUsers();
      } else {
        alert(result.message);
      }
    }
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回主页
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                管理员面板
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* 标题 */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              用户管理
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              管理系统中的所有用户账号
            </p>
          </div>

          {/* 统计信息 */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                总用户数
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {users.length}
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                普通用户
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {users.filter((u) => u.role === 'user').length}
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                管理员
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {users.filter((u) => u.role === 'admin').length}
              </div>
            </div>
          </div>

          {/* 用户列表 */}
          <div className="rounded-xl bg-white shadow dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      用户名
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      邮箱
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      角色
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      注册时间
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        暂无用户
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-400">
                          {user.email || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            }`}
                          >
                            {user.role === 'admin' ? '管理员' : '普通用户'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              删除
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 操作提示 */}
          <div className="rounded-xl bg-blue-50 p-6 dark:bg-blue-900/20">
            <h3 className="mb-3 font-semibold text-blue-900 dark:text-blue-300">
              操作说明
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li>• 管理员账号无法被删除</li>
              <li>• 删除用户后，该用户的加密历史将无法访问</li>
              <li>• 建议谨慎删除操作，确保已通知相关用户</li>
            </ul>
          </div>
        </div>
      </main>

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              确认删除用户
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              删除用户后，该用户的加密历史将无法访问。确定要删除吗？
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
