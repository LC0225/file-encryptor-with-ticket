import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database/userManager';
import { getCurrentUserFromToken } from '@/utils/auth';
import { Buffer } from 'buffer';

// 密码加密（使用SHA-256）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

/**
 * GET /api/admin/users
 * 获取所有用户列表（仅管理员）
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const currentUser = await getCurrentUserFromToken(token);

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '需要管理员权限' },
        { status: 403 }
      );
    }

    // 获取所有用户
    const users = await userManager.getUsers();

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * 添加新用户（仅管理员）
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const currentUser = await getCurrentUserFromToken(token);

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '需要管理员权限' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, email, role = 'user' } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码为必填项' },
        { status: 400 }
      );
    }

    // 验证用户名格式
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { success: false, message: '用户名长度必须在3-20个字符之间' },
        { status: 400 }
      );
    }

    // 验证密码格式（至少8位，包含大小写字母和数字）
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, message: '密码必须至少8位，包含大小写字母和数字' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await userManager.getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '用户名已存在' },
        { status: 400 }
      );
    }

    // 加密密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const newUser = await userManager.createUser({
      username,
      passwordHash,
      email: email || null,
      role: role === 'admin' ? 'admin' : 'user',
    });

    // 同步到云端
    try {
      const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/cloud-sync/users`, {
        method: 'POST',
      });
      await syncResponse.json();
    } catch (syncError) {
      console.error('同步用户到云端失败:', syncError);
      // 同步失败不影响用户创建
    }

    return NextResponse.json({
      success: true,
      message: '用户创建成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { success: false, message: '创建用户失败' },
      { status: 500 }
    );
  }
}
