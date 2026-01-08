import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database/userManager';
import { uploadAppData, downloadAppData, checkCloudDataExists } from '@/utils/supabaseStorage';
import type { AppData, SyncResult, User } from '@/types';

/**
 * GET /api/cloud-sync/users
 * 从数据库获取用户数据并上传到云端
 */
export async function GET(request: NextRequest) {
  try {
    // 从数据库获取所有用户
    const dbUsers = await userManager.getUsers();

    // 转换为云端存储格式
    const cloudUsers = dbUsers.map(user => ({
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      email: user.email || undefined,
      role: user.role,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({
      success: true,
      users: cloudUsers,
      count: cloudUsers.length,
    });
  } catch (error) {
    console.error('获取用户数据失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: `获取用户数据失败: ${error instanceof Error ? error.message : '未知错误'}`,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cloud-sync/users
 * 将数据库用户数据同步到云端
 */
export async function POST(request: NextRequest) {
  try {
    // 从数据库获取所有用户
    const dbUsers = await userManager.getUsers();

    // 获取当前云端数据
    let cloudData: AppData = {
      version: Date.now(),
      users: [],
      history: [],
    };

    const cloudExists = await checkCloudDataExists();
    if (cloudExists) {
      const existingData = await downloadAppData();
      if (existingData) {
        cloudData = existingData;
      }
    }

    // 转换数据库用户为云端存储格式
    const cloudUsers = dbUsers.map(user => ({
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));

    // 合并用户数据（去重：以用户名为准）
    const mergedUsers = [...cloudData.users];
    dbUsers.forEach(dbUser => {
      const cloudUser: User = {
        id: dbUser.id,
        username: dbUser.username,
        passwordHash: dbUser.passwordHash,
        email: dbUser.email || undefined,
        role: dbUser.role as 'admin' | 'user',
        createdAt: dbUser.createdAt.toISOString(),
      };

      const existingIndex = mergedUsers.findIndex(u => u.username === dbUser.username);
      if (existingIndex >= 0) {
        // 更新已存在的用户
        mergedUsers[existingIndex] = cloudUser;
      } else {
        // 添加新用户
        mergedUsers.push(cloudUser);
      }
    });

    // 构造最终数据
    const finalData: AppData = {
      version: Date.now(),
      users: mergedUsers,
      history: cloudData.history, // 保留云端的历史记录
    };

    // 上传到云端
    await uploadAppData(finalData);

    return NextResponse.json<SyncResult>({
      success: true,
      message: `已同步 ${cloudUsers.length} 个数据库用户到云端（共 ${mergedUsers.length} 个用户）`,
      uploaded: true,
    });
  } catch (error) {
    console.error('同步用户数据到云端失败:', error);
    return NextResponse.json<SyncResult>(
      {
        success: false,
        message: `同步用户数据失败: ${error instanceof Error ? error.message : '未知错误'}`,
      },
      { status: 500 }
    );
  }
}
