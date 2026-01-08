'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUser, validatePassword } from '@/utils/auth';

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  // 实时验证密码
  useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password));
    } else {
      setPasswordValidation(null);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 验证密码
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    if (passwordValidation && !passwordValidation.valid) {
      setError(passwordValidation.message);
      setLoading(false);
      return;
    }

    try {
      const result = await registerUser(username, password, email);
      
      if (result.success) {
        // 注册成功，自动跳转到登录页
        router.push('/login');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordRequirement = (met: boolean, text: string) => (
    <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
      <svg className={`h-4 w-4 ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
        {met ? (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        )}
      </svg>
      <span>{text}</span>
    </div>
  );

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            文件加密工具
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            创建新账号
          </p>
        </div>

        {/* 注册卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-8 dark:bg-gray-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            注册新账号
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="请输入用户名"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* 邮箱（可选） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                邮箱（可选）
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="请输入密码"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              
              {/* 密码要求 */}
              {password && (
                <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    密码要求：
                  </div>
                  {getPasswordRequirement(passwordRequirements.length, '至少8个字符')}
                  {getPasswordRequirement(passwordRequirements.uppercase, '包含大写字母')}
                  {getPasswordRequirement(passwordRequirements.lowercase, '包含小写字母')}
                  {getPasswordRequirement(passwordRequirements.number, '包含数字')}
                </div>
              )}
            </div>

            {/* 确认密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="请再次输入密码"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  两次输入的密码不一致
                </p>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={loading || !passwordValidation?.valid || password !== confirmPassword}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:hover:bg-blue-700 dark:disabled:bg-gray-600"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            已有账号？{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
