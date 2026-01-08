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
  if (canUseDatabase()) {
    try {
      const response = await fetch('/api/auth/init-admin', {
        method: 'POST',
        // 设置超时，避免长时间阻塞
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        // 如果 API 返回错误（比如 503），回退到 localStorage
        console.warn(`初始化管理员账号失败: ${response.status} ${response.statusText}`);
        await authLocalStorage.initAdminUser();
        return;
      }

      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('初始化管理员账号失败:', error);
      // 如果数据库失败，回退到localStorage
      await authLocalStorage.initAdminUser();
    }
  } else {
    await authLocalStorage.initAdminUser();
  }
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

      if (data.success && data.token) {
        // 保存token到localStorage
        localStorage.setItem(TOKEN_KEY, data.token);
        return { success: true, message: data.message, user: data.user };
      }

      return data;
    } catch (error) {
      console.error('登录失败（数据库），回退到localStorage:', error);
      // 如果数据库失败，回退到localStorage
    }
  }
  
  // 使用localStorage方案
  return authLocalStorage.loginUser(username, password);
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

  try {
    // 优先检查localStorage，快速返回
    try {
      const localUser = await authLocalStorage.getCurrentUser();
      if (localUser) {
        return localUser;
      }
    } catch (error) {
      console.log('localStorage读取失败，尝试API');
    }

    // 如果localStorage没有数据，才尝试API
    if (canUseDatabase()) {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return null;

        // 添加超时控制 - 缩短到1秒，快速回退
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1秒超时

        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
          // Token无效，清除本地存储
          localStorage.removeItem(TOKEN_KEY);
          return null;
        }

        const data = await response.json();
        if (data.success) {
          return data.user;
        }

        return null;
      } catch (error) {
        console.log('API请求超时或失败，回退到localStorage');
        // 如果数据库失败，回退到localStorage
      }
    }

    // 使用localStorage方案
    return await authLocalStorage.getCurrentUser();
  } catch (error) {
    console.error('获取当前用户失败:', error);
    return null;
  }
}

/**
 * 检查是否为管理员
 */
export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 先检查token中的角色（如果是数据库方案）
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    try {
      const sessionData = JSON.parse(atob(token));
      if (sessionData.role === 'admin') {
        return true;
      }
    } catch (error) {
      // 解析失败，继续使用localStorage检查
    }
  }
  
  // 使用localStorage检查
  return authLocalStorage.isAdmin();
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  try {
    if (typeof window === 'undefined') return false;

    // 检查token或localStorage会话
    return !!localStorage.getItem(TOKEN_KEY) || authLocalStorage.isLoggedIn();
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return false;
  }
}

/**
 * 获取Auth token（用于API调用）
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 从token中解析用户信息（服务器端使用）
 * @param token - 认证token
 * @returns 用户信息或null
 */
export function getCurrentUserFromToken(token: string): User | null {
  try {
    // 解析base64编码的token
    const sessionData = JSON.parse(atob(token));
    return {
      id: sessionData.id,
      username: sessionData.username,
      email: sessionData.email,
      role: sessionData.role,
    };
  } catch (error) {
    console.error('解析token失败:', error);
    return null;
  }
}

/**
 * 获取所有用户（仅管理员）
 */
export async function getAllUsers(): Promise<User[]> {
  if (canUseDatabase()) {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return [];

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        return [];
      }

      const data = await response.json();
      if (data.success) {
        return data.users;
      }

      return [];
    } catch (error) {
      console.error('获取用户列表失败（数据库），回退到localStorage:', error);
      // 如果数据库失败，回退到localStorage
    }
  }
  
  // 使用localStorage方案
  return authLocalStorage.getAllUsers();
}

/**
 * 删除用户（仅管理员）
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  if (canUseDatabase()) {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        return { success: false, message: '未登录' };
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('删除用户失败（数据库），回退到localStorage:', error);
      // 如果数据库失败，回退到localStorage
    }
  }
  
  // 使用localStorage方案
  return authLocalStorage.deleteUser(userId);
}
