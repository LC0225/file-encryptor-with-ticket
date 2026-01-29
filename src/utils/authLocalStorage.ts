import { syncToCloud, syncFromCloud } from './dataSync';
import type { User as UserType } from '@/types';

export type { UserType as User };

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
 * 将 ArrayBuffer 转换为十六进制字符串（浏览器兼容）
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * 检查 crypto.subtle 是否可用
 */
function isCryptoSubtleAvailable(): boolean {
  return typeof crypto !== 'undefined' && crypto.subtle !== undefined;
}

/**
 * 备用密码哈希函数（当 crypto.subtle 不可用时使用）
 * 注意：这不是安全的哈希函数，仅作为备用方案
 * 在生产环境中，应该升级浏览器或使用 HTTPS
 */
function fallbackHashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16) + '_fallback';
}

/**
 * 密码加密（使用SHA-256）
 */
async function hashPassword(password: string): Promise<string> {
  if (!isCryptoSubtleAvailable()) {
    console.warn('⚠️ crypto.subtle 不可用，使用备用哈希函数');
    return fallbackHashPassword(password);
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToHex(hash);
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
function getUsers(): UserType[] {
  if (typeof window === 'undefined') {
    console.log('⚠️ [getUsers] 服务端环境，返回空数组');
    return [];
  }

  try {
    const data = localStorage.getItem(USERS_KEY);
    console.log('📦 [getUsers] localStorage 数据:', data ? data.substring(0, 100) + '...' : 'null');
    const users = data ? JSON.parse(data) : [];
    console.log('👥 [getUsers] 解析后的用户数量:', users.length);
    return users;
  } catch (error) {
    console.error('❌ [getUsers] 读取用户数据失败:', error);
    return [];
  }
}

/**
 * 保存用户数据
 */
function saveUsers(users: UserType[]): void {
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
  console.log('🔍 [initAdminUser] crypto.subtle 可用性:', isCryptoSubtleAvailable());

  const users = getUsers();
  console.log('👥 [initAdminUser] 当前用户数量:', users.length);

  // 查找是否已存在 root 用户
  const existingAdmin = users.find(u => u.username === 'root');

  if (existingAdmin) {
    console.log('✅ [initAdminUser] 管理员账号已存在，检查 role 字段...');

    // 确保 root 用户有正确的 role 字段
    let needsUpdate = false;

    if (!existingAdmin.role) {
      existingAdmin.role = 'admin';
      needsUpdate = true;
    }

    if (needsUpdate) {
      saveUsers(users);
      console.log('✅ 已更新管理员账号的 role 字段');

      // 如果当前登录的是 root 用户，清除 session 强制重新登录
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (session.username === 'root') {
            localStorage.removeItem(SESSION_KEY);
            console.log('✅ 已清除旧 session，请重新登录');
          }
        } catch (error) {
          // 解析失败，忽略
        }
      }
    }
  } else {
    // 创建新的管理员账号
    console.log('🆕 [initAdminUser] 创建新的管理员账号');
    const admin: UserType = {
      id: 'admin_' + Date.now(),
      username: 'root',
      passwordHash: await hashPassword('BGSN123.321'),
      createdAt: new Date().toISOString(),
      role: 'admin',
    };
    users.push(admin);
    saveUsers(users);
    console.log('✅ 已创建管理员账号');
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
  const newUser: UserType = {
    id: 'user_' + Date.now(),
    username,
    passwordHash: await hashPassword(password),
    email,
    createdAt: new Date().toISOString(),
    role: 'user',
  };

  users.push(newUser);
  saveUsers(users);

  // 触发云同步
  syncToCloud().catch(error => console.error('注册后云同步失败:', error));

  return { success: true, message: '注册成功' };
}

/**
 * 用户登录
 */
export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: any }> {
  // 先同步云端数据
  try {
    await syncFromCloud();
  } catch (error) {
    console.error('登录前云同步失败:', error);
    // 同步失败不影响登录，继续使用本地数据
  }

  const users = getUsers();
  const user = users.find((u) => u.username === username);

  if (!user) {
    return { success: false, message: '用户名或密码错误' };
  }

  if (!user.passwordHash) {
    return { success: false, message: '用户数据不完整，无法登录' };
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

  // 返回完整的用户对象（排除密码哈希）
  const { passwordHash, ...userWithoutPassword } = user;
  return { success: true, message: '登录成功', user: userWithoutPassword };
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
export function getCurrentUser(): UserType | null {
  if (typeof window === 'undefined') return null;
  try {
    console.log('🔍 [authLocalStorage] 开始获取当前用户');
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) {
      console.log('⚠️ [authLocalStorage] 没有找到 session 数据');
      return null;
    }

    console.log('✅ [authLocalStorage] 找到 session 数据');
    const session = JSON.parse(sessionData);
    console.log('📋 [authLocalStorage] session:', session);

    const users = getUsers();
    console.log('👥 [authLocalStorage] 用户列表数量:', users.length);

    const user = users.find((u) => u.id === session.userId);
    if (!user) {
      console.log('⚠️ [authLocalStorage] Session中记录的用户不存在，userId:', session.userId);
      // Session中记录的用户不存在，清除session
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    console.log('✅ [authLocalStorage] 找到用户:', user.username);
    // 返回用户对象（排除密码哈希）
    const { passwordHash, ...userWithoutPassword } = user;

    // 如果是 root 用户但没有 role 字段，默认设置为 admin
    if (userWithoutPassword.username === 'root' && !userWithoutPassword.role) {
      userWithoutPassword.role = 'admin';
    }

    console.log('✅ [authLocalStorage] 返回用户信息');
    return userWithoutPassword;
  } catch (error) {
    console.error('❌ [authLocalStorage] 获取当前用户失败:', error);
    // 如果解析失败，清除可能损坏的数据
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * 检查是否为管理员
 */
export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return false;

    const session = JSON.parse(sessionData);
    const users = getUsers();
    const user = users.find((u) => u.id === session.userId);

    // 如果是 root 用户，默认为管理员
    if (user?.username === 'root') {
      return true;
    }

    return user?.role === 'admin';
  } catch (error) {
    return false;
  }
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(SESSION_KEY);
}

/**
 * 获取所有用户（仅管理员）
 */
export function getAllUsers(): any[] {
  const users = getUsers();
  return users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }));
}

/**
 * 删除用户（仅管理员）
 */
export function deleteUser(userId: string): { success: boolean; message: string } {
  const users = getUsers();
  const userToDelete = users.find(u => u.id === userId);

  if (!userToDelete) {
    return { success: false, message: '用户不存在' };
  }

  if (userToDelete.role === 'admin') {
    return { success: false, message: '无法删除管理员账号' };
  }

  const updatedUsers = users.filter(u => u.id !== userId);
  saveUsers(updatedUsers);

  // 触发云同步
  syncToCloud().catch(error => console.error('删除用户后云同步失败:', error));

  return { success: true, message: '用户删除成功' };
}
