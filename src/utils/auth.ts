import { Buffer } from 'buffer';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  email?: string;
  createdAt: string;
  role: 'admin' | 'user';
}

const USERS_KEY = 'crypto_users';
const SESSION_KEY = 'crypto_session';

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
 * 密码加密（使用SHA-256）
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

/**
 * 验证密码
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * 获取所有用户
 */
function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('读取用户数据失败:', error);
    return [];
  }
}

/**
 * 保存用户数据
 */
function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('保存用户数据失败:', error);
  }
}

/**
 * 初始化管理员账号
 */
export async function initAdminUser(): Promise<void> {
  const users = getUsers();
  if (users.length === 0) {
    const admin: User = {
      id: 'admin_' + Date.now(),
      username: 'root',
      passwordHash: await hashPassword('BGSN123.321'),
      createdAt: new Date().toISOString(),
      role: 'admin',
    };
    users.push(admin);
    saveUsers(users);
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
  // 检查用户名是否已存在
  const users = getUsers();
  const existingUser = users.find((u) => u.username === username);
  if (existingUser) {
    return { success: false, message: '用户名已存在' };
  }

  // 验证密码
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, message: passwordValidation.message };
  }

  // 创建新用户
  const newUser: User = {
    id: 'user_' + Date.now(),
    username,
    passwordHash: await hashPassword(password),
    email,
    createdAt: new Date().toISOString(),
    role: 'user',
  };

  users.push(newUser);
  saveUsers(users);

  return { success: true, message: '注册成功' };
}

/**
 * 用户登录
 */
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  const users = getUsers();
  const user = users.find((u) => u.username === username);

  if (!user) {
    return { success: false, message: '用户名或密码错误' };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, message: '用户名或密码错误' };
  }

  // 保存会话
  const session = {
    userId: user.id,
    username: user.username,
    role: user.role,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return { success: true, message: '登录成功', user };
}

/**
 * 用户登出
 */
export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

/**
 * 获取当前登录用户
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);
    return user || null;
  } catch (error) {
    console.error('获取当前用户失败:', error);
    return null;
  }
}

/**
 * 检查是否为管理员
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

/**
 * 获取所有用户（仅管理员）
 */
export function getAllUsers(): Omit<User, 'passwordHash'>[] {
  if (!isAdmin()) return [];
  const users = getUsers();
  return users.map(({ passwordHash, ...user }) => user);
}

/**
 * 删除用户（仅管理员）
 */
export function deleteUser(userId: string): { success: boolean; message: string } {
  if (!isAdmin()) {
    return { success: false, message: '权限不足' };
  }

  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  
  if (!user) {
    return { success: false, message: '用户不存在' };
  }

  // 不允许删除管理员
  if (user.role === 'admin') {
    return { success: false, message: '无法删除管理员账号' };
  }

  const filtered = users.filter((u) => u.id !== userId);
  saveUsers(filtered);

  return { success: true, message: '删除成功' };
}

/**
 * 修改用户密码
 */
export async function changePassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: '未登录' };
  }

  // 普通用户只能修改自己的密码
  if (currentUser.role !== 'admin' && currentUser.id !== userId) {
    return { success: false, message: '权限不足' };
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return { success: false, message: passwordValidation.message };
  }

  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, message: '用户不存在' };
  }

  users[userIndex].passwordHash = await hashPassword(newPassword);
  saveUsers(users);

  return { success: true, message: '密码修改成功' };
}
