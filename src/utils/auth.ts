import { canUseDatabase } from './config';
import * as authLocalStorage from './authLocalStorage';

export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt?: string;
  role: 'admin' | 'user';
}

const TOKEN_KEY = 'crypto_auth_token';
const SESSION_KEY = 'crypto_session';

/**
 * 获取认证token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 密码要求检查
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  return authLocalStorage.validatePassword(password);
}

/**
 * 初始化管理员账号
 */
export async function initAdminUser(): Promise<void> {
  // 直接使用 localStorage 模式，不尝试访问数据库
  // 这样可以避免数据库未配置时的错误
  console.log('📝 初始化管理员账号（localStorage 模式）');
  await authLocalStorage.initAdminUser();
  console.log('✅ 管理员账号初始化完成');
}

/**
 * 用户注册
 */
export async function registerUser(
  username: string,
  password: string,
  email?: string
): Promise<{ success: boolean; message: string }> {
  if (canUseDatabase()) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('注册失败（数据库），回退到localStorage:', error);
      // 如果数据库失败，回退到localStorage
    }
  }
  
  // 使用localStorage方案
  return authLocalStorage.registerUser(username, password, email);
}

/**
 * 用户登录
 */
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  console.log('🔐 开始登录流程，用户名:', username);

  // 优先使用 localStorage 登录（更可靠，不依赖数据库）
  const result = await authLocalStorage.loginUser(username, password);

  if (result.success) {
    console.log('✅ 通过 localStorage 登录成功:', result.user?.username);
    return result;
  }

  console.log('⚠️ localStorage 登录失败:', result.message);

  // 如果 localStorage 登录失败，尝试 API 登录（仅当数据库可用时）
  if (canUseDatabase()) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      console.log('📝 API登录响应:', data);

      if (data.success && data.token) {
        // 保存token到localStorage
        localStorage.setItem(TOKEN_KEY, data.token);
        console.log('✅ 已保存 token 到 localStorage');

        // 同时保存session到localStorage（用于 getCurrentUser）
        if (data.user) {
          const session = {
            userId: data.user.id,
            username: data.user.username,
            role: data.user.role,
            loginTime: new Date().toISOString(),
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          console.log('✅ 已保存 session 到 localStorage:', session.username);
        } else {
          console.warn('⚠️ API返回的数据中缺少user字段');
        }

        return { success: true, message: data.message, user: data.user };
      }

      return data;
    } catch (error) {
      console.error('登录失败（数据库）:', error);
      return { success: false, message: '登录失败，请重试' };
    }
  }

  return { success: false, message: '登录失败' };
}

/**
 * 用户登出
 */
export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  
  // 清除token
  localStorage.removeItem(TOKEN_KEY);
  
  // 清除localStorage中的会话
  authLocalStorage.logoutUser();
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === 'undefined') return null;

  // 调试：打印 localStorage 的所有相关内容
  const allKeys = Object.keys(localStorage);
  const relevantKeys = allKeys.filter(key =>
    key.includes('crypto') || key.includes('auth') || key.includes('session') || key.includes('user')
  );
  console.log('🔍 localStorage 相关键:', relevantKeys);
  relevantKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, value ? `${value.substring(0, 50)}...` : '(空)');
  });

  // 先尝试从 localStorage 获取（优先使用本地缓存）
  const localUser = authLocalStorage.getCurrentUser();
  if (localUser) {
    console.log('✅ 从 localStorage 获取到当前用户:', localUser.username);
    return localUser;
  }

  console.log('⚠️ localStorage 中没有 session，尝试从token恢复');

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    console.log('⚠️ 没有找到 token');
    return null;
  }

  // 尝试从token中提取用户信息（兼容旧token）
  try {
    const tokenData = JSON.parse(atob(token));
    if (tokenData && tokenData.id && tokenData.username) {
      console.log('🔧 从旧token恢复session:', tokenData.username);

      // 检查用户是否已在localStorage中存在
      const usersKey = 'crypto_users';
      const usersData = localStorage.getItem(usersKey);
      const users = usersData ? JSON.parse(usersData) : [];
      const existingUser = users.find((u: any) => u.id === tokenData.id);

      if (!existingUser) {
        console.log('🔧 用户不在localStorage中，从token添加用户信息');
        // 将token中的用户信息添加到localStorage（仅添加基本信息，无密码）
        // 注意：这样会导致用户无法通过密码登录，但至少可以保持session
        const newUser = {
          id: tokenData.id,
          username: tokenData.username,
          email: tokenData.email,
          role: tokenData.role || 'user',
          createdAt: tokenData.createdAt,
          passwordHash: '', // 空密码哈希，表示需要重新设置密码
        };
        users.push(newUser);
        localStorage.setItem(usersKey, JSON.stringify(users));
        console.log('✅ 已将用户添加到localStorage:', tokenData.username);
      } else {
        console.log('✅ 用户已在localStorage中:', tokenData.username);
      }

      // 保存session到localStorage
      const session = {
        userId: tokenData.id,
        username: tokenData.username,
        role: tokenData.role || 'user',
        loginTime: tokenData.loginTime || new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      // 再次尝试从localStorage获取完整用户信息
      const userFromSession = authLocalStorage.getCurrentUser();
      if (userFromSession) {
        console.log('✅ 从token恢复session并获取到用户:', userFromSession.username);
        return userFromSession;
      }

      // 如果仍然失败，直接返回token中的用户信息
      console.log('🔧 直接返回token中的用户信息');
      return {
        id: tokenData.id,
        username: tokenData.username,
        email: tokenData.email,
        role: tokenData.role || 'user',
        createdAt: tokenData.createdAt,
      };
    }
  } catch (error) {
    console.log('⚠️ 无法从token解析用户信息，尝试从数据库获取');
  }

  if (canUseDatabase()) {
    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // API 调用失败（401, 404, 500 等），回退到 localStorage
        console.warn(`API /api/auth/user 返回 ${response.status}，回退到 localStorage 方案`);
        if (response.status === 401) {
          // Token无效，清除本地存储
          localStorage.removeItem(TOKEN_KEY);
        }
        return authLocalStorage.getCurrentUser();
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ 从数据库获取到当前用户:', data.user.username);
        // 同时保存session到localStorage（用于下次直接获取）
        const session = {
          userId: data.user.id,
          username: data.user.username,
          role: data.user.role,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return data.user;
      }

      // API 返回失败，回退到 localStorage
      console.warn('API /api/auth/user 返回失败，回退到 localStorage 方案');
      return authLocalStorage.getCurrentUser();
    } catch (error) {
      console.error('获取当前用户失败（数据库），回退到localStorage:', error);
      // 如果数据库失败，回退到localStorage
      return authLocalStorage.getCurrentUser();
    }
  }

  // 使用localStorage方案
  return authLocalStorage.getCurrentUser();
}

/**
 * 从token获取用户信息（用于API路由）
 */
export function getCurrentUserFromToken(token: string): User | null {
  try {
    const tokenData = JSON.parse(atob(token));
    if (tokenData && tokenData.id && tokenData.username) {
      return {
        id: tokenData.id,
        username: tokenData.username,
        email: tokenData.email,
        role: tokenData.role || 'user',
        createdAt: tokenData.createdAt,
      };
    }
  } catch (error) {
    console.error('从token解析用户信息失败:', error);
  }
  return null;
}

/**
 * 检查用户是否已登录
 */
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(TOKEN_KEY);
  const session = localStorage.getItem(SESSION_KEY);
  return !!(token || session);
}

/**
 * 检查用户是否是管理员
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}
