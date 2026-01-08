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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // 检查要删除的用户是否是管理员
    const userToDelete = await userManager.getUserById(id);
    if (!userToDelete) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    if (userToDelete.role === 'admin') {
      return NextResponse.json(
        { success: false, message: '无法删除管理员账号' },
        { status: 403 }
      );
    }

    // 删除用户
    const success = await userManager.deleteUser(id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: '用户删除成功',
      });
    } else {
      return NextResponse.json(
        { success: false, message: '用户删除失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { success: false, message: '删除用户失败' },
      { status: 500 }
    );
  }
}
