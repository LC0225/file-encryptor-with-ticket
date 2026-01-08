'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAdmin, getAuthToken } from '@/utils/auth';
import type { User } from '@/utils/auth';
import { useToast } from '@/components/ToastContext';

export default function Admin() {
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 删除用户相关状态
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 新增用户相关状态
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    username: '',
    password: '',
    email: '',
    role: 'user' as 'admin' | 'user',
  });

  // 修改密码相关状态
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    userId: '',
    username: '',
    newPassword: '',
  });

  useEffect(() => {
    // 检查是否为管理员
    if (!isAdmin()) {
      router.push('/');
      return;
    }

    loadUsers();
  }, [router]);

  useEffect(() => {
    // 搜索过滤
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.username.toLowerCase().includes(term) ||
            (u.email && u.email.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        showToast({ type: 'error', message: '获取用户列表失败', duration: 3000 });
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      showToast({ type: 'error', message: '获取用户列表失败', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addUserForm),
      });

      const data = await response.json();

      if (data.success) {
        showToast({ type: 'success', message: data.message, duration: 2000 });
        setShowAddUserModal(false);
        setAddUserForm({ username: '', password: '', email: '', role: 'user' });
        loadUsers();
      } else {
        showToast({ type: 'error', message: data.message, duration: 3000 });
      }
    } catch (error) {
      console.error('添加用户失败:', error);
      showToast({ type: 'error', message: '添加用户失败', duration: 3000 });
    }
  };

  const handlePasswordChange = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/users/${passwordForm.userId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({ type: 'success', message: data.message, duration: 2000 });
        setShowPasswordModal(false);
        setPasswordForm({ userId: '', username: '', newPassword: '' });
      } else {
        showToast({ type: 'error', message: data.message, duration: 3000 });
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      showToast({ type: 'error', message: '修改密码失败', duration: 3000 });
    }
  };

  const handleDelete = (userId: string) => {
    setSelectedUser(userId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/users/${selectedUser}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showToast({ type: 'success', message: data.message, duration: 2000 });
        loadUsers();
      } else {
        showToast({ type: 'error', message: data.message, duration: 3000 });
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      showToast({ type: 'error', message: '删除用户失败', duration: 3000 });
    } finally {
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crypto_auth_token');
    }
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
          {/* 标题和操作 */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                用户管理
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                管理系统中的所有用户账号
              </p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增用户
            </button>
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

          {/* 搜索框 */}
          <div className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="搜索用户名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
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
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        {searchTerm ? '未找到匹配的用户' : '暂无用户'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
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
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          {user.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => {
                                  setPasswordForm({
                                    userId: user.id,
                                    username: user.username,
                                    newPassword: '',
                                  });
                                  setShowPasswordModal(true);
                                }}
                                className="mr-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                修改密码
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                删除
                              </button>
                            </>
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
              <li>• 修改密码后，用户需要使用新密码重新登录</li>
              <li>• 建议谨慎删除操作，确保已通知相关用户</li>
            </ul>
          </div>
        </div>
      </main>

      {/* 新增用户弹窗 */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              新增用户
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  用户名
                </label>
                <input
                  type="text"
                  value={addUserForm.username}
                  onChange={(e) =>
                    setAddUserForm({ ...addUserForm, username: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  密码
                </label>
                <input
                  type="password"
                  value={addUserForm.password}
                  onChange={(e) =>
                    setAddUserForm({ ...addUserForm, password: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  至少8位，包含大小写字母和数字
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  邮箱（可选）
                </label>
                <input
                  type="email"
                  value={addUserForm.email}
                  onChange={(e) =>
                    setAddUserForm({ ...addUserForm, email: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  角色
                </label>
                <select
                  value={addUserForm.role}
                  onChange={(e) =>
                    setAddUserForm({
                      ...addUserForm,
                      role: e.target.value as 'admin' | 'user',
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setAddUserForm({ username: '', password: '', email: '', role: 'user' });
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleAddUser}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-700"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              修改用户密码
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              用户：{passwordForm.username}
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                新密码
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                至少8位，包含大小写字母和数字
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ userId: '', username: '', newPassword: '' });
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={handlePasswordChange}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-700"
              >
                修改
              </button>
            </div>
          </div>
        </div>
      )}

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
