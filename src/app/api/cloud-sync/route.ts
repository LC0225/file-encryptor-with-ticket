import { NextRequest, NextResponse } from 'next/server';
import { uploadAppData, downloadAppData, checkCloudDataExists } from '@/utils/s3Storage';
import type { AppData, SyncResult } from '@/types';

/**
 * POST /api/cloud-sync
 * 触发云端同步
 * body: { action: 'upload' | 'download' | 'full', localData?: AppData }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, localData } = body;

    if (action === 'upload') {
      // 上传到云端
      await uploadAppData(localData);

      return NextResponse.json<SyncResult>({
        success: true,
        message: `已上传 ${localData.users.length} 个用户和 ${localData.history.length} 条加密记录到云端`,
        uploaded: true,
      });
    }

    if (action === 'download') {
      // 检查云端数据是否存在
      const cloudExists = await checkCloudDataExists();

      if (!cloudExists) {
        return NextResponse.json<SyncResult>({
          success: true,
          message: '云端暂无数据，将使用本地数据',
        });
      }

      // 下载云端数据
      const cloudData = await downloadAppData();

      if (!cloudData) {
        return NextResponse.json<SyncResult>({
          success: false,
          message: '下载云端数据失败',
        });
      }

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
