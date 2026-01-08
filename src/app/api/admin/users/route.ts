import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database/userManager';
import { Buffer } from 'buffer';

// 验证token并获取用户信息
function verifyToken(token: string): { userId: string; username: string; role: string } | null {
  try {
    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());
    return sessionData;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 从Authorization header获取token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: '未提供认证token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const sessionData = verifyToken(token);

    if (!sessionData || sessionData.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '需要管理员权限' },
        { status: 403 }
      );
    }

    // 获取所有用户
    const users = await userManager.getUsers();

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取用户列表失败' },
      { status: 500 }
    );
  }
}
