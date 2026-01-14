'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getEncryptionHistory,
  deleteEncryptionHistory,
  clearEncryptionHistory,
} from '@/utils/storage';
import { getCurrentUser, logoutUser, isLoggedIn, isAdmin } from '@/utils/auth';
import {
  getSyncStatus,
  fullSync,
  initSyncStatus,
  formatSyncTime,
} from '@/utils/dataSync';
import type { SyncStatus } from '@/types';
import {
  getFileTypeLabel,
  getFileTypeColor,
  formatFileSize,
  formatDate,
  downloadEncryptedFile as downloadEncryptedFileUtil,
  copyToClipboard,
} from '@/utils/fileHelper';
import { useToast } from '@/components/ToastContext';

export default function Profile() {
  const router = useRouter();
  const { showToast } = useToast();
  const [history, setHistory] = useState<ReturnType<typeof getEncryptionHistory>>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id:string; username:string; email?: string; role:'admin'|'user'} | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    enabled: true,
    lastSyncTime: null,
    syncing: false,
    cloudExists: false,
  });
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncMessageType, setSyncMessageType] = useState<'success' | 'error' | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 确保在客户端挂载后再渲染动态内容
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // 登录检查
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }

    // 加载用户信息
    const loadUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();

    loadHistory();

    // 初始化同步状态
    const initSync = async () => {
      await initSyncStatus();
      setSyncStatus(getSyncStatus());
    };
    initSync();
  }, [router]);

  const loadHistory = () => {
    setHistory(getEncryptionHistory());
  };

  const handleCopyTicket = async (ticket: string) => {
    const success = await copyToClipboard(ticket);
    if (success) {
      showToast({ type: 'success', message: 'Ticket已复制到剪贴板', duration: 2000 });
    } else {
      showToast({ type: 'error', message: '复制失败，请手动复制', duration: 3000 });
    }
  };

  const handleDownloadEncryptedFile = (item: any) => {
    downloadEncryptedFileUtil(
      item.encryptedData,
      item.iv,
      item.fileName,
      item.fileType
    );
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

  const downloadAllEncryptedFiles = () => {
    history.forEach((item, index) => {
      setTimeout(() => {
        handleDownloadEncryptedFile(item);
      }, index * 500);
    });
  };

  const handleManualSync = async () => {
    setSyncMessage(null);
    setSyncMessageType(null);

    try {
      const result = await fullSync();

      // 更新同步状态
      setSyncStatus(getSyncStatus());

      if (result.success) {
        setSyncMessage(result.message);
        setSyncMessageType('success');
        // 重新加载历史记录
        loadHistory();
      } else {
        setSyncMessage(result.message);
        setSyncMessageType('error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '同步失败，请稍后重试';
      setSyncMessage(message);
      setSyncMessageType('error');
    }

    // 5秒后自动隐藏消息
    setTimeout(() => {
      setSyncMessage(null);
      setSyncMessageType(null);
    }, 5000);
  };

  // 高亮搜索关键词
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <span key={index} className="text-red-600 dark:text-red-400 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // 过滤历史记录
  const filteredHistory = history.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.fileName.toLowerCase().includes(query) ||
      item.ticket.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">返回主页</span>
                <span className="sm:hidden">返回</span>
              </Link>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                {currentUser?.username}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {isMounted && isAdmin() && (
                <Link
                  href="/admin"
                  className="rounded-lg px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                  <span className="hidden sm:inline">管理员面板</span>
                  <span className="sm:hidden">管理</span>
                </Link>
              )}
              <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                个人中心
              </div>
              <button
                onClick={() => {
                  logoutUser();
                  router.push('/login');
                }}
                className="rounded-lg border border-red-600 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <span className="hidden sm:inline">退出登录</span>
                <span className="sm:hidden">退出</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* 标题 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                加密历史
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                管理您的加密文件历史记录，每个文件都有独立的ticket
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {history.length > 1 && (
                <button
                  onClick={downloadAllEncryptedFiles}
                  className="w-full sm:w-auto rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-700"
                >
                  下载所有文件
                </button>
              )}
              {history.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="w-full sm:w-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-700"
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
                {searchQuery ? '搜索结果' : '加密文件总数'}
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {searchQuery ? filteredHistory.length : history.length}
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {searchQuery ? '搜索结果总大小' : '总文件大小'}
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {formatFileSize(
                  (searchQuery ? filteredHistory : history).reduce((sum, item) => sum + item.fileSize, 0)
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

          {/* 云同步状态 */}
          <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                云端同步
              </h3>
              <button
                onClick={handleManualSync}
                disabled={syncStatus.syncing}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-blue-700"
              >
                {syncStatus.syncing ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    同步中...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    立即同步
                  </>
                )}
              </button>
            </div>

            {syncMessage && (
              <div
                className={`mb-4 rounded-lg p-4 text-sm ${
                  syncMessageType === 'success'
                    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                }`}
              >
                {syncMessage}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  云端数据状态
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      syncStatus.cloudExists
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {syncStatus.cloudExists ? '已存在' : '暂无数据'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  最后同步时间
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatSyncTime(syncStatus.lastSyncTime)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  同步功能
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {syncStatus.enabled ? '已启用' : '已禁用'}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              云端同步功能会将您的加密历史和用户数据备份到云端，支持多设备访问。
              数据加密存储，仅您本人可访问。
            </p>
          </div>

          {/* 搜索框 */}
          {history.length > 0 && (
            <div className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索文件名或ticket..."
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    title="清除搜索"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  找到 {filteredHistory.length} 条结果
                </p>
              )}
            </div>
          )}

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
              {filteredHistory.length === 0 ? (
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    未找到匹配结果
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    尝试使用不同的关键词搜索
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-700"
                  >
                    清除搜索
                  </button>
                </div>
              ) : (
                <>
                  {filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-white p-4 sm:p-6 shadow dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-all">
                              {highlightText(item.fileName, searchQuery)}
                            </h3>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getFileTypeColor(item.fileType)}`}>
                              {getFileTypeLabel(item.fileType)}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <p>文件大小：{formatFileSize(item.fileSize)}</p>
                            <p>加密时间：{formatDate(item.createdAt)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-medium">加密类型：</span>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.algorithm === 'AES-GCM' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'}`}>
                                {item.algorithm}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
                      <div className="mt-4 rounded-lg bg-gray-50 p-3 sm:p-4 dark:bg-gray-900">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ticket（解密密钥）
                          </span>
                          <button
                            onClick={() => handleCopyTicket(item.ticket)}
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            复制
                          </button>
                        </div>
                        <code className="block break-all rounded bg-white p-2 sm:p-3 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          {searchQuery ? highlightText(item.ticket, searchQuery) : item.ticket}
                        </code>
                      </div>

                      {/* 操作按钮 */}
                      <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          onClick={() => handleDownloadEncryptedFile(item)}
                          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-700"
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
                          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
                </>
              )}
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
