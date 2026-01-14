import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database/userManager';
import { Buffer } from 'buffer';

// 静态导出配置

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

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    const sessionData = verifyToken(token);

    if (!sessionData) {
      return NextResponse.json(
        { success: false, message: '无效的token' },
        { status: 401 }
      );
    }

    // 从数据库获取最新用户信息
    const user = await userManager.getUserById(sessionData.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { success: false, message: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
