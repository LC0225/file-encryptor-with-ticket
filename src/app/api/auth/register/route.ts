import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database/userManager';
import { Buffer } from 'buffer';

// 密码要求检查
function validatePassword(password: string): { valid: boolean; message: string } {
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

// 密码加密（使用SHA-256）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码为必填项' },
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

    // 验证密码
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      );
    }

    // 创建新用户
    const passwordHash = await hashPassword(password);
    const newUser = await userManager.createUser({
      username,
      passwordHash,
      email,
      role: 'user',
    });

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { success: false, message: '注册失败，请重试' },
      { status: 500 }
    );
  }
}
