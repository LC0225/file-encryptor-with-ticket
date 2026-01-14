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
 * PATCH /api/admin/users/[id]/password
 * 修改用户密码（仅管理员）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // 查找用户
    const user = await userManager.getUserById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { newPassword } = body;

    // 验证必填字段
    if (!newPassword) {
      return NextResponse.json(
        { success: false, message: '新密码为必填项' },
        { status: 400 }
      );
    }

    // 验证密码格式（至少8位，包含大小写字母和数字）
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { success: false, message: '密码必须至少8位，包含大小写字母和数字' },
        { status: 400 }
      );
    }

    // 加密新密码
    const passwordHash = await hashPassword(newPassword);

    // 更新密码
    const updatedUser = await userManager.updateUser(id, {
      passwordHash,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: '密码修改失败' },
        { status: 500 }
      );
    }

    // 同步到云端
    try {
      const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/cloud-sync/users`, {
        method: 'POST',
      });
      await syncResponse.json();
    } catch (syncError) {
      console.error('同步用户到云端失败:', syncError);
      // 同步失败不影响密码修改
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
      },
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json(
      { success: false, message: '修改密码失败' },
      { status: 500 }
    );
  }
}
