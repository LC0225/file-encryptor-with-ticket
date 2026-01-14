'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  encryptFileGCM,
  encryptFileCBC,
  decryptFile,
  generateTicket,
} from '@/utils/crypto';
import { addEncryptionHistory } from '@/utils/storage';
import { getCurrentUser, logoutUser, isLoggedIn, isAdmin } from '@/utils/auth';
import { useToast } from '@/components/ToastContext';

interface EncryptedFileResult {
  encryptedData: string;
  iv: string;
  fileName: string;
  fileType: string;
  ticket: string;
  algorithm: 'AES-GCM' | 'AES-CBC';
}

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [ticket, setTicket] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [encryptedFiles, setEncryptedFiles] = useState<EncryptedFileResult[]>([]);
  const [decryptedFile, setDecryptedFile] = useState<{
    data: Blob;
    fileName: string;
    fileType: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<{id:string; username:string; email?: string; role:'admin'|'user'} | null>(null);
  const [algorithm, setAlgorithm] = useState<'AES-GCM' | 'AES-CBC'>('AES-GCM');
  const [isMounted, setIsMounted] = useState(false);

  // 确保在客户端挂载后再渲染动态内容
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 加载用户信息
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  // 登录检查
  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
    }
  }, [router]);

  // 从session storage读取ticket
  useEffect(() => {
    const savedTicket = sessionStorage.getItem('decrypt_ticket');
    if (savedTicket) {
      setMode('decrypt');
      setTicket(savedTicket);
      sessionStorage.removeItem('decrypt_ticket');
      // 显示提示信息
      setSuccess('已自动填充解密ticket，请选择加密文件后点击解密按钮');
      // 3秒后清除提示
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setEncryptedFiles([]);
    setDecryptedFile(null);
    setError('');
    setSuccess('');
  };

  const handleEncryptGCM = async () => {
    if (files.length === 0) {
      setError('请选择要加密的文件');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setEncryptedFiles([]);

    try {
      if (files.length === 1) {
        // 单文件加密：使用手动输入的ticket或自动生成
        const ticketToUse = ticket || generateTicket();
        if (!ticket) {
          setTicket(ticketToUse);
        }
        const result = await encryptFileGCM(files[0], ticketToUse);
        const encryptedResult: EncryptedFileResult = {
          encryptedData: result.encryptedData,
          iv: result.iv,
          fileName: result.fileName,
          fileType: result.fileType,
          ticket: ticketToUse,
          algorithm: 'AES-GCM',
        };
        setEncryptedFiles([encryptedResult]);

        // 保存到历史记录
        addEncryptionHistory(result, ticketToUse, files[0].size);
      } else {
        // 多文件加密：每个文件独立ticket
        const results: EncryptedFileResult[] = [];
        for (const file of files) {
          const ticket = generateTicket();
          const result = await encryptFileGCM(file, ticket);
          results.push({
            encryptedData: result.encryptedData,
            iv: result.iv,
            fileName: result.fileName,
            fileType: result.fileType,
            ticket,
            algorithm: 'AES-GCM',
          });
          // 保存到历史记录
          addEncryptionHistory(result, ticket, file.size);
        }
        setEncryptedFiles(results);

        setSuccess(`成功使用AES-GCM加密 ${files.length} 个文件，每个文件都有独立的ticket`);
      }

      if (files.length === 1) {
        setSuccess('AES-GCM文件加密成功！');
      }
    } catch (err) {
      setError('加密失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEncryptCBC = async () => {
    if (files.length === 0) {
      setError('请选择要加密的文件');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setEncryptedFiles([]);

    try {
      if (files.length === 1) {
        // 单文件加密：使用手动输入的ticket或自动生成
        const ticketToUse = ticket || generateTicket();
        if (!ticket) {
          setTicket(ticketToUse);
        }
        const result = await encryptFileCBC(files[0], ticketToUse);
        const encryptedResult: EncryptedFileResult = {
          encryptedData: result.encryptedData,
          iv: result.iv,
          fileName: result.fileName,
          fileType: result.fileType,
          ticket: ticketToUse,
          algorithm: 'AES-CBC',
        };
        setEncryptedFiles([encryptedResult]);

        // 保存到历史记录
        addEncryptionHistory(result, ticketToUse, files[0].size);
      } else {
        // 多文件加密：每个文件独立ticket
        const results: EncryptedFileResult[] = [];
        for (const file of files) {
          const ticket = generateTicket();
          const result = await encryptFileCBC(file, ticket);
          results.push({
            encryptedData: result.encryptedData,
            iv: result.iv,
            fileName: result.fileName,
            fileType: result.fileType,
            ticket,
            algorithm: 'AES-CBC',
          });
          // 保存到历史记录
          addEncryptionHistory(result, ticket, file.size);
        }
        setEncryptedFiles(results);

        setSuccess(`成功使用AES-CBC加密 ${files.length} 个文件，每个文件都有独立的ticket`);
      }

      if (files.length === 1) {
        setSuccess('AES-CBC文件加密成功！');
      }
    } catch (err) {
      setError('加密失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptGCM = async () => {
    if (files.length === 0) {
      setError('请选择加密的文件');
      return;
    }

    if (!ticket) {
      setError('请输入解密ticket');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const file = files[0];
      const fileContent = await file.text();

      let encryptedData: string;
      let iv: string;
      let fileName: string;
      let fileType: string;
      let algorithm: 'AES-GCM' | 'AES-CBC' = 'AES-GCM';

      try {
        const jsonData = JSON.parse(fileContent);
        encryptedData = jsonData.data;
        iv = jsonData.iv;
        fileName = jsonData.fileName;
        fileType = jsonData.fileType || 'application/octet-stream';
        algorithm = jsonData.algorithm || 'AES-GCM';
      } catch {
        encryptedData = fileContent;
        iv = '';
        fileName = file.name.replace('.encrypted', '');
        fileType = 'application/octet-stream';
      }

      // 如果文件是用AES-CBC加密的，提示用户使用AES-CBC解密
      if (algorithm === 'AES-CBC') {
        setError('此文件使用AES-CBC加密，请使用AES-CBC解密按钮');
        setLoading(false);
        return;
      }

      const result = await decryptFile(
        encryptedData,
        iv,
        ticket,
        fileName,
        fileType,
        'AES-GCM'
      );

      setDecryptedFile({
        data: result.decryptedData,
        fileName: result.fileName,
        fileType: result.fileType,
      });

      setSuccess('AES-GCM文件解密成功！');
    } catch (err) {
      setError('AES-GCM解密失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptCBC = async () => {
    if (files.length === 0) {
      setError('请选择加密的文件');
      return;
    }

    if (!ticket) {
      setError('请输入解密ticket');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const file = files[0];
      const fileContent = await file.text();

      let encryptedData: string;
      let iv: string;
      let fileName: string;
      let fileType: string;
      let algorithm: 'AES-GCM' | 'AES-CBC' = 'AES-CBC';

      try {
        const jsonData = JSON.parse(fileContent);
        encryptedData = jsonData.data;
        iv = jsonData.iv;
        fileName = jsonData.fileName;
        fileType = jsonData.fileType || 'application/octet-stream';
        algorithm = jsonData.algorithm || 'AES-CBC';
      } catch {
        encryptedData = fileContent;
        iv = '';
        fileName = file.name.replace('.encrypted', '');
        fileType = 'application/octet-stream';
      }

      // 如果文件是用AES-GCM加密的，提示用户使用AES-GCM解密
      if (algorithm === 'AES-GCM') {
        setError('此文件使用AES-GCM加密，请使用AES-GCM解密按钮');
        setLoading(false);
        return;
      }

      const result = await decryptFile(
        encryptedData,
        iv,
        ticket,
        fileName,
        fileType,
        'AES-CBC'
      );

      setDecryptedFile({
        data: result.decryptedData,
        fileName: result.fileName,
        fileType: result.fileType,
      });

      setSuccess('AES-CBC文件解密成功！');
    } catch (err) {
      setError('AES-CBC解密失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const downloadEncryptedFile = (item: EncryptedFileResult) => {
    const content = JSON.stringify(
      {
        data: item.encryptedData,
        iv: item.iv,
        fileName: item.fileName,
        fileType: item.fileType,
        algorithm: item.algorithm,
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

  const downloadAllEncryptedFiles = () => {
    encryptedFiles.forEach((item, index) => {
      setTimeout(() => {
        downloadEncryptedFile(item);
      }, index * 500);
    });
  };

  const downloadDecryptedFile = () => {
    if (!decryptedFile) return;

    const url = URL.createObjectURL(decryptedFile.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = decryptedFile.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFiles([]);
    setTicket('');
    setEncryptedFiles([]);
    setDecryptedFile(null);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF文档';
    if (fileType.includes('word') || fileType.includes('document')) return 'Word文档';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel文档';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'PPT文档';
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpeg') || fileType.includes('jpg')) return '图片';
    if (fileType.includes('video')) return '视频';
    if (fileType.includes('audio')) return '音频';
    if (fileType.includes('text') || fileType.includes('plain')) return '文本';
    return '文件';
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (fileType.includes('word') || fileType.includes('document')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    if (fileType.includes('image')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    if (fileType.includes('video')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
    if (fileType.includes('audio')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
              文件加密工具
            </h1>
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
              <Link
                href="/profile"
                className="rounded-lg px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <span className="hidden sm:inline">个人中心</span>
                <span className="sm:hidden">我的</span>
              </Link>
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
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* 标题 */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              安全文件加密
            </h2>
            <p className="mt-2 px-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              支持文档、图片、视频、音频等常用文件类型，每个文件独立ticket保护
            </p>
          </div>

          {/* 支持的文件类型 */}
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-red-800 dark:bg-red-900 dark:text-red-300">PDF</span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Word</span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-green-800 dark:bg-green-900 dark:text-green-300">Excel</span>
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-orange-800 dark:bg-orange-900 dark:text-orange-300">PPT</span>
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-purple-800 dark:bg-purple-900 dark:text-purple-300">图片</span>
            <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-pink-800 dark:bg-pink-900 dark:text-pink-300">视频</span>
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">音频</span>
          </div>

          {/* 模式切换 */}
          <div className="flex justify-center gap-3 sm:gap-4">
            <button
              onClick={() => {
                setMode('encrypt');
                reset();
              }}
              className={`rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-colors ${
                mode === 'encrypt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              加密文件
            </button>
            <button
              onClick={() => {
                setMode('decrypt');
                reset();
              }}
              className={`rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-colors ${
                mode === 'decrypt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              解密文件
            </button>
          </div>

          {/* 主卡片 */}
          <div className="rounded-xl bg-white p-4 sm:p-8 shadow-lg dark:bg-gray-800">
            {/* 文件上传 */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {mode === 'encrypt' ? '选择文件（支持多选）' : '选择加密文件'}
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  multiple={mode === 'encrypt'}
                  className="block w-full flex-1 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                {(files.length > 0 || ticket || encryptedFiles.length > 0 || decryptedFile) && (
                  <button
                    onClick={() => {
                      if (confirm('确定要清空所有内容吗？')) {
                        reset();
                      }
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-400 transition-colors"
                    title="清空所有内容"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">清空</span>
                  </button>
                )}
              </div>
              {files.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    已选择 {files.length} 个文件
                  </p>
                  {mode === 'encrypt' && files.length > 1 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      批量加密时，每个文件将生成独立的ticket
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Ticket输入（仅单文件加密时显示） */}
            {mode === 'encrypt' && files.length === 1 && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ticket（密钥）
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={ticket}
                    onChange={(e) => setTicket(e.target.value)}
                    placeholder="输入ticket或留空自动生成"
                    className="flex-1 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                  {!ticket && (
                    <button
                      onClick={() => setTicket(generateTicket())}
                      className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      生成Ticket
                    </button>
                  )}
                </div>
                {ticket && (
                  <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                    ⚠️ 请保存好此ticket，文件解密时需要使用
                  </p>
                )}
              </div>
            )}

            {/* Ticket输入（解密模式） */}
            {mode === 'decrypt' && (
              <div className="mb-6 space-y-3">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ticket（解密密钥）
                </label>
                <input
                  type="text"
                  value={ticket}
                  onChange={(e) => setTicket(e.target.value)}
                  placeholder="输入解密ticket"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                {ticket && files.length === 0 && (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium">已自动填充解密ticket</p>
                        <p className="text-xs sm:text-sm mt-1 opacity-90">
                          请先选择加密文件，然后点击解密按钮完成解密
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            {mode === 'encrypt' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={handleEncryptGCM}
                  disabled={loading || files.length === 0}
                  className="w-full rounded-lg bg-blue-600 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:hover:bg-blue-700 dark:disabled:bg-gray-600"
                >
                  {loading
                    ? '处理中...'
                    : files.length > 1
                    ? `AES-GCM批量加密 ${files.length} 个文件`
                    : 'AES-GCM加密文件'}
                </button>
                <button
                  onClick={handleEncryptCBC}
                  disabled={loading || files.length === 0}
                  className="w-full rounded-lg bg-purple-600 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:hover:bg-purple-700 dark:disabled:bg-gray-600"
                >
                  {loading
                    ? '处理中...'
                    : files.length > 1
                    ? `AES-CBC批量加密 ${files.length} 个文件`
                    : 'AES-CBC加密文件'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={handleDecryptGCM}
                  disabled={loading || files.length === 0}
                  className="w-full rounded-lg bg-blue-600 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:hover:bg-blue-700 dark:disabled:bg-gray-600"
                >
                  {loading ? '处理中...' : 'AES-GCM解密文件'}
                </button>
                <button
                  onClick={handleDecryptCBC}
                  disabled={loading || files.length === 0}
                  className="w-full rounded-lg bg-purple-600 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:hover:bg-purple-700 dark:disabled:bg-gray-600"
                >
                  {loading ? '处理中...' : 'AES-CBC解密文件'}
                </button>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* 成功提示 */}
            {success && (
              <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {success}
              </div>
            )}

            {/* 加密结果 */}
            {mode === 'encrypt' && encryptedFiles.length > 0 && (
              <div className="mt-6 space-y-4">
                {encryptedFiles.length > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>加密成功！共 {encryptedFiles.length} 个文件</span>
                    </div>
                    <button
                      onClick={downloadAllEncryptedFiles}
                      className="w-full sm:w-auto rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-700"
                    >
                      下载所有加密文件
                    </button>
                  </div>
                )}
                {encryptedFiles.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="mb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white break-all">
                            {item.fileName}
                          </h3>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getFileTypeColor(item.fileType)}`}>
                            {getFileTypeLabel(item.fileType)}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.algorithm === 'AES-GCM' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'}`}>
                            {item.algorithm}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadEncryptedFile(item)}
                        className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-700"
                      >
                        下载
                      </button>
                    </div>
                    <div className="rounded-lg bg-white p-3 dark:bg-gray-800">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Ticket（解密密钥）
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.ticket);
                            showToast({ type: 'success', message: 'Ticket已复制到剪贴板', duration: 2000 });
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          复制
                        </button>
                      </div>
                      <code className="block break-all rounded bg-gray-100 p-2 text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {item.ticket}
                      </code>
                    </div>
                  </div>
                ))}
                {/* 继续加密按钮 */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setFiles([]);
                      setEncryptedFiles([]);
                      setError('');
                      setSuccess('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 rounded-lg border border-blue-600 px-6 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    继续加密其他文件
                  </button>
                </div>
              </div>
            )}

            {/* 解密结果 */}
            {mode === 'decrypt' && decryptedFile && (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-3 text-green-600 dark:text-green-400">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-semibold text-green-600 dark:text-green-400">
                      解密成功
                    </h3>
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      文件名：{decryptedFile.fileName}
                    </p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getFileTypeColor(decryptedFile.fileType)}`}>
                      {getFileTypeLabel(decryptedFile.fileType)}
                    </span>
                  </div>
                  <button
                    onClick={downloadDecryptedFile}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-700"
                  >
                    下载解密文件
                  </button>
                </div>
                {/* 继续解密按钮 */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setFiles([]);
                      setDecryptedFile(null);
                      setError('');
                      setSuccess('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 rounded-lg border border-blue-600 px-6 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    继续解密其他文件
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 说明 */}
          <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
              使用说明
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• 支持PDF、Word、Excel、PPT、图片、视频、音频等常用文件类型</li>
              <li>• 批量加密时，每个文件会生成独立的ticket，更安全</li>
              <li>• 加密后的文件保存为.json格式的加密文件</li>
              <li>• 解密时需要使用对应文件的ticket和正确的加密算法</li>
              <li>• 所有加密历史记录保存在个人中心</li>
              <li>• 请妥善保管ticket，丢失后无法解密文件</li>
            </ul>

            <h4 className="mt-4 mb-2 font-semibold text-gray-900 dark:text-white">
              加密算法说明
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <h5 className="mb-2 font-medium text-blue-900 dark:text-blue-300">AES-GCM</h5>
                <p className="text-gray-700 dark:text-gray-300">
                  • 认证加密模式，同时提供机密性和完整性
                  <br/>• 推荐：适合大多数场景，安全性更高
                  <br/>• IV长度：12字节
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                <h5 className="mb-2 font-medium text-purple-900 dark:text-purple-300">AES-CBC</h5>
                <p className="text-gray-700 dark:text-gray-300">
                  • 经典加密模式，提供机密性
                  <br/>• 兼容性：与更多旧系统兼容
                  <br/>• IV长度：16字节
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
