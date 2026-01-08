export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt?: string;
  role: 'admin' | 'user';
}

export interface Session {
  userId: string;
  username: string;
  role: string;
  loginTime: string;
}

const TOKEN_KEY = 'crypto_auth_token';

/**
 * 密码要求检查
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  return { valid: true, message: '密码符合要求' };
}

/**
 * 初始化管理员账号
 */
export async function initAdminUser(): Promise<void> {
  try {
    const response = await fetch('/api/auth/init-admin', {
      method: 'POST',
    });
    const data = await response.json();
    console.log(data.message);
  } catch (error) {
    console.error('初始化管理员账号失败:', error);
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
    return { success: false, message: '注册失败，请重试' };
  }
}

/**
 * 用户登录
 */
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
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
    return { success: false, message: '登录失败，请重试' };
  }
}

/**
 * 用户登出
 */
export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === 'undefined') return null;

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const response = await fetch('/api/auth/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

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
    console.error('获取当前用户失败:', error);
    return null;
  }
}

/**
 * 检查是否为管理员
 */
export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    const sessionData = JSON.parse(atob(token));
    return sessionData.role === 'admin';
  } catch (error) {
    return false;
  }
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(TOKEN_KEY);
}

/**
 * 获取Auth token（用于API调用）
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 获取所有用户（仅管理员）
 */
export async function getAllUsers(): Promise<User[]> {
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
    console.error('获取用户列表失败:', error);
    return [];
  }
}

/**
 * 删除用户（仅管理员）
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
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
    return { success: false, message: '删除用户失败' };
  }
}
