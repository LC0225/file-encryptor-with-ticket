import { NextRequest, NextResponse } from 'next/server';
import {
  uploadUsers,
  downloadUsers,
  uploadUserHistory,
  downloadUserHistory,
  checkCloudDataExists,
} from '@/utils/supabaseStorage';
import type { AppData, SyncResult } from '@/types';

/**
 * POST /api/cloud-sync
 * 触发云端同步
 * body: { action: 'upload' | 'download' | 'check' | 'full', users?: User[], history?: EncryptionHistory[], userId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, users, history, userId } = body;

    if (action === 'upload') {
      // 分别上传用户列表和用户加密历史
      const usersResult = await uploadUsers(users || []);
      const historyResult = await uploadUserHistory(userId || 'unknown', history || []);

      if (!usersResult || !historyResult) {
        return NextResponse.json<SyncResult>({
          success: false,
          message: '上传云端失败',
        });
      }

      return NextResponse.json<SyncResult>({
        success: true,
        message: `已上传 ${users?.length || 0} 个用户和 ${history?.length || 0} 条加密记录到云端`,
        uploaded: true,
      });
    }

    if (action === 'download') {
      // 检查云端数据是否存在
      const cloudExists = await checkCloudDataExists();

      if (!cloudExists && !userId) {
        return NextResponse.json<SyncResult>({
          success: true,
          message: '云端暂无数据，将使用本地数据',
        });
      }

      // 分别下载用户列表和用户加密历史
      const cloudUsers = await downloadUsers();
      const cloudHistory = userId ? await downloadUserHistory(userId) : null;

      // 云端数据不存在
      if (!cloudUsers && !cloudHistory) {
        return NextResponse.json<SyncResult>({
          success: true,
          message: '云端暂无数据，将使用本地数据',
        });
      }

      const cloudData: AppData = {
        version: Date.now(),
        users: cloudUsers || [],
        history: cloudHistory || [],
      };

      return NextResponse.json<SyncResult>({
        success: true,
        cloudData,
        message: `已从云端同步 ${cloudData.users.length} 个用户和 ${cloudData.history.length} 条加密记录`,
        downloaded: true,
      });
    }

    if (action === 'check') {
      // 检查云端数据是否存在
      const cloudExists = await checkCloudDataExists();

      return NextResponse.json<SyncResult>({
        success: true,
        message: cloudExists ? '云端存在数据' : '云端暂无数据',
        cloudExists,
      });
    }

    if (action === 'check-user') {
      // 检查特定用户的加密历史是否存在
      if (!userId) {
        return NextResponse.json<SyncResult>({
          success: false,
          message: '缺少用户ID',
        });
      }

      const { checkUserHistoryExists } = await import('@/utils/supabaseStorage');
      const historyExists = await checkUserHistoryExists(userId);

      return NextResponse.json<SyncResult>({
        success: true,
        message: historyExists ? '用户加密历史存在' : '用户加密历史不存在',
        cloudExists: historyExists,
      });
    }

    return NextResponse.json<SyncResult>({
      success: false,
      message: '无效的操作类型',
    });
  } catch (error) {
    console.error('云同步API错误:', error);
    return NextResponse.json<SyncResult>(
      {
        success: false,
        message: `云同步失败: ${error instanceof Error ? error.message : '未知错误'}`,
      },
      { status: 500 }
    );
  }
}
