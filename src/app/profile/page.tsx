'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getEncryptionHistory,
  deleteEncryptionHistory,
  clearEncryptionHistory,
  formatFileSize,
  formatDate,
} from '@/utils/storage';
import { getCurrentUser, logoutUser, isLoggedIn } from '@/utils/auth';

export default function Profile() {
  const router = useRouter();
  const [history, setHistory] = useState<ReturnType<typeof getEncryptionHistory>>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  useEffect(() => {
    // 登录检查
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    loadHistory();
  }, [router]);

  const loadHistory = () => {
    setHistory(getEncryptionHistory());
  };

  const handleCopyTicket = (ticket: string) => {
    navigator.clipboard.writeText(ticket);
    alert('Ticket已复制到剪贴板');
  };

  const handleDownloadEncryptedFile = (item: any) => {
    const content = JSON.stringify(
      {
        data: item.encryptedData,
        iv: item.iv,
        fileName: item.fileName,
        fileType: item.fileType,
      },
      null,
      2
    );
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.fileName}.encrypted`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    setSelectedItem(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteEncryptionHistory(selectedItem);
      loadHistory();
    }
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有加密历史记录吗？此操作不可恢复。')) {
      clearEncryptionHistory();
      loadHistory();
    }
  };

  const getFileTypeLabel = (fileType: string) => {
    if (!fileType) return '未知类型';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'Word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'PPT';
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpeg') || fileType.includes('jpg')) return '图片';
    if (fileType.includes('video')) return '视频';
    if (fileType.includes('audio')) return '音频';
    if (fileType.includes('text') || fileType.includes('plain')) return '文本';
    return '其他';
  };

  const getFileTypeColor = (fileType: string) => {
    if (!fileType) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (fileType.includes('word') || fileType.includes('document')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    if (fileType.includes('image')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    if (fileType.includes('video')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
    if (fileType.includes('audio')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const downloadAllEncryptedFiles = () => {
    history.forEach((item, index) => {
      setTimeout(() => {
        handleDownloadEncryptedFile(item);
      }, index * 500);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回主页
              </Link>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentUser?.username}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {currentUser?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                  管理员面板
                </Link>
              )}
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                个人中心
              </div>
              <button
                onClick={() => {
                  logoutUser();
                  router.push('/login');
                }}
                className="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                加密历史
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                管理您的加密文件历史记录，每个文件都有独立的ticket
              </p>
            </div>
            <div className="flex gap-3">
              {history.length > 1 && (
                <button
                  onClick={downloadAllEncryptedFiles}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-700"
                >
                  下载所有文件
                </button>
              )}
              {history.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-700"
                >
                  清空所有记录
                </button>
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                加密文件总数
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {history.length}
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                总文件大小
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {formatFileSize(
                  history.reduce((sum, item) => sum + item.fileSize, 0)
                )}
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                最近加密
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {history.length > 0
                  ? formatDate(history[0].createdAt).split(' ')[0]
                  : '-'}
              </div>
            </div>
          </div>

          {/* 历史记录列表 */}
          {history.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center shadow dark:bg-gray-800">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <svg
                  className="h-8 w-8 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                暂无加密历史
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                去加密一些文件吧，它们会显示在这里
              </p>
              <Link
                href="/"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-700"
              >
                开始加密
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-white p-6 shadow dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.fileName}
                        </h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getFileTypeColor(item.fileType)}`}>
                          {getFileTypeLabel(item.fileType)}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>文件大小：{formatFileSize(item.fileSize)}</p>
                        <p>加密时间：{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="删除记录"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Ticket区域 */}
                  <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ticket（解密密钥）
                      </span>
                      <button
                        onClick={() => handleCopyTicket(item.ticket)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        复制
                      </button>
                    </div>
                    <code className="block break-all rounded bg-white p-3 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      {item.ticket}
                    </code>
                  </div>

                  {/* 操作按钮 */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleDownloadEncryptedFile(item)}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-700"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      下载加密文件
                    </button>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('decrypt_ticket', item.ticket);
                        window.location.href = '/';
                      }}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                      解密此文件
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              确认删除
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              删除此记录后，该加密文件的ticket将无法找回。确定要删除吗？
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedItem(null);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
