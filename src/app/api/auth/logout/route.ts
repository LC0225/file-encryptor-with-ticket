import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 登出主要在前端清除token，这里返回成功即可
    return NextResponse.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('登出失败:', error);
    return NextResponse.json(
      { success: false, message: '登出失败' },
      { status: 500 }
    );
  }
}
