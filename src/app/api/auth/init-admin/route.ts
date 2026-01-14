import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database/userManager';
import { canUseDatabase } from '@/utils/config';
import { Buffer } from 'buffer';

// 静态导出配置

// 密码加密（使用SHA-256）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    // 检查是否可以使用数据库
    if (!canUseDatabase()) {
      return NextResponse.json(
        {
          success: false,
          message: '数据库未配置。请设置 USE_DATABASE=true 和 DATABASE_URL 环境变量，或使用浏览器本地存储模式。',
        },
        { status: 503 }
      );
    }

    // 检查是否已有管理员
    const users = await userManager.getUsers();
    const existingAdmin = users.find(u => u.role === 'admin');

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: '管理员账号已存在',
      });
    }

    // 创建管理员账号
    const passwordHash = await hashPassword('BGSN123.321');
    const adminUser = await userManager.createUser({
      username: 'root',
      passwordHash,
      role: 'admin',
    });

    return NextResponse.json({
      success: true,
      message: '管理员账号初始化成功',
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error('初始化管理员账号失败:', error);
    return NextResponse.json(
      { success: false, message: '初始化管理员账号失败' },
      { status: 500 }
    );
  }
}
