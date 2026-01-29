'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  encryptFileGCM,
  encryptFileCBC,
  generateTicket,
} from '@/utils/crypto';
import {
  encryptFileWithWorker,
  decryptFileWithWorker,
  decryptFileWithWorkerRaw,
  type WorkerEncryptionResult
} from '@/utils/cryptoWorker';
import { addEncryptionHistory } from '@/utils/storage';
import { getCurrentUser, logoutUser, isLoggedIn } from '@/utils/auth';
import { useToast } from '@/components/ToastContext';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

interface EncryptedFileResult {
  encryptedData: Uint8Array;
  encryptedDataBase64: string;
  iv: Uint8Array;
  ivBase64: string;
  fileName: string;
  fileType: string;
  ticket: string;
  algorithm: 'AES-GCM' | 'AES-CBC';
  fileSize: number;
  chunkCount?: number;
  isLargeFile?: boolean;
  createdAt?: string;
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
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [encryptionProgress, setEncryptionProgress] = useState({
    progress: 0,
    currentChunk: 0,
    totalChunks: 0
  });
  const [showProgress, setShowProgress] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [processedBytes, setProcessedBytes] = useState(0);
  const [isTicketAutoFilled, setIsTicketAutoFilled] = useState(false);
  const [detectedAlgorithm, setDetectedAlgorithm] = useState<'AES-GCM' | 'AES-CBC' | null>(null);

  // 确保在客户端挂载后再渲染动态内容
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 加载用户信息
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setIsAdminUser(user.role === 'admin');
      }
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
      setIsTicketAutoFilled(true);
      sessionStorage.removeItem('decrypt_ticket');
      setSuccess('已自动填充解密ticket，请选择加密文件后点击解密按钮');
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess('');

    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));

      // 如果是解密模式，检测算法
      if (mode === 'decrypt' && e.target.files.length === 1) {
        detectAlgorithm(e.target.files[0]);
      }
    }
  };

  const detectAlgorithm = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer || buffer.byteLength < 16) return;

        const data = new Uint8Array(buffer);
        const header = String.fromCharCode.apply(null, Array.from(data.slice(0, 10)));

        if (header.startsWith('CRYPTO:')) {
          setDetectedAlgorithm('AES-GCM');
          setAlgorithm('AES-GCM');
          setSuccess('检测到 AES-GCM 加密文件');
        } else {
          setDetectedAlgorithm('AES-CBC');
          setAlgorithm('AES-CBC');
          setSuccess('检测到 AES-CBC 加密文件');
        }
      } catch (err) {
        console.error('检测算法失败:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEncrypt = async (useAlgorithm: 'AES-GCM' | 'AES-CBC') => {
    if (files.length === 0) {
      setError('请选择要加密的文件');
      return;
    }

    if (!ticket) {
      const newTicket = generateTicket();
      setTicket(newTicket);
      showToast('已生成加密ticket', 'success');
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setShowProgress(true);
    setProcessingStartTime(Date.now());
    setProcessedBytes(0);

    try {
      const results: EncryptedFileResult[] = [];

      for (const file of files) {
        const fileData = await file.arrayBuffer();

        let result: WorkerEncryptionResult;
        if (useAlgorithm === 'AES-GCM') {
          result = await encryptFileWithWorker(
            fileData,
            ticket,
            (progress) => {
              setEncryptionProgress({
                progress: progress.progress,
                currentChunk: progress.currentChunk,
                totalChunks: progress.totalChunks
              });
              setProcessedBytes(progress.processedBytes);
            }
          );
        } else {
          result = await encryptFileWithWorker(
            fileData,
            ticket,
            (progress) => {
              setEncryptionProgress({
                progress: progress.progress,
                currentChunk: progress.currentChunk,
                totalChunks: progress.totalChunks
              });
              setProcessedBytes(progress.processedBytes);
            }
          );
        }

        const encryptedResult: EncryptedFileResult = {
          encryptedData: result.encryptedData,
          encryptedDataBase64: result.encryptedDataBase64,
          iv: result.iv,
          ivBase64: result.ivBase64,
          fileName: file.name + (useAlgorithm === 'AES-GCM' ? '.enc' : '.cbc'),
          fileType: 'application/octet-stream',
          ticket: ticket,
          algorithm: useAlgorithm,
          fileSize: result.encryptedData.length,
          chunkCount: result.chunkCount,
          isLargeFile: result.isLargeFile,
          createdAt: new Date().toISOString()
        };

        results.push(encryptedResult);
        await addEncryptionHistory(encryptedResult);
      }

      setEncryptedFiles(results);
      setSuccess(`成功加密 ${files.length} 个文件！`);
      showToast('加密成功！', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加密失败';
      setError(errorMessage);
      showToast('加密失败', 'error');
    } finally {
      setLoading(false);
      setShowProgress(false);
      setProcessingStartTime(null);
    }
  };

  const handleDecrypt = async (useAlgorithm: 'AES-GCM' | 'AES-CBC') => {
    if (files.length === 0) {
      setError('请选择要解密的文件');
      return;
    }

    if (!ticket) {
      setError('请输入解密ticket');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setShowProgress(true);
    setProcessingStartTime(Date.now());
    setProcessedBytes(0);

    try {
      for (const file of files) {
        const fileData = await file.arrayBuffer();

        let decryptedData: Uint8Array;
        let originalFileName: string;

        if (useAlgorithm === 'AES-GCM') {
          if (detectedAlgorithm && detectedAlgorithm !== 'AES-GCM') {
            setError(`检测到文件是 ${detectedAlgorithm} 格式，请点击 AES-CBC 解密按钮`);
            showToast('算法不匹配', 'error');
            continue;
          }

          const result = await decryptFileWithWorker(
            fileData,
            ticket,
            (progress) => {
              setEncryptionProgress({
                progress: progress.progress,
                currentChunk: progress.currentChunk,
                totalChunks: progress.totalChunks
              });
              setProcessedBytes(progress.processedBytes);
            }
          );
          decryptedData = result.decryptedData;
          originalFileName = result.originalFileName;
        } else {
          if (detectedAlgorithm && detectedAlgorithm !== 'AES-CBC') {
            setError(`检测到文件是 ${detectedAlgorithm} 格式，请点击 AES-GCM 解密按钮`);
            showToast('算法不匹配', 'error');
            continue;
          }

          decryptedData = await decryptFileWithWorkerRaw(
            fileData,
            ticket,
            (progress) => {
              setEncryptionProgress({
                progress: progress.progress,
                currentChunk: progress.currentChunk,
                totalChunks: progress.totalChunks
              });
              setProcessedBytes(progress.processedBytes);
            }
          );

          // 从文件名中移除 .enc 或 .cbc 后缀
          originalFileName = file.name.replace(/\\.(enc|cbc)$/, '');
        }

        const blob = new Blob([decryptedData]);
        setDecryptedFile({
          data: blob,
          fileName: originalFileName,
          fileType: 'application/octet-stream'
        });

        // 自动下载
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setSuccess(`成功解密 ${files.length} 个文件！`);
      showToast('解密成功！', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '解密失败';
      setError(errorMessage);
      showToast('解密失败', 'error');
    } finally {
      setLoading(false);
      setShowProgress(false);
      setProcessingStartTime(null);
    }
  };

  const downloadEncryptedFile = (result: EncryptedFileResult) => {
    const blob = new Blob([result.encryptedData], { type: result.fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  // 未挂载时不渲染
  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                文件加密工具
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    欢迎, {currentUser.username}
                  </span>
                  <Link
                    href="/profile"
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    个人中心
                  </Link>
                  {isAdminUser && (
                    <Link
                      href="/admin"
                      className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400"
                    >
                      管理员面板
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    登出
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 模式切换 */}
        <div className="mb-6 flex justify-center space-x-4">
          <button
            onClick={() => setMode('encrypt')}
            className={`px-6 py-2 rounded-lg font-medium ${
              mode === 'encrypt'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            加密模式
          </button>
          <button
            onClick={() => setMode('decrypt')}
            className={`px-6 py-2 rounded-lg font-medium ${
              mode === 'decrypt'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            解密模式
          </button>
        </div>

        {/* 主卡片 */}
        <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800">
          {/* 文件选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择文件
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-gray-700 dark:file:text-blue-300"
            />
            {files.length > 0 && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                已选择 {files.length} 个文件:
                {files.map((file, index) => (
                  <div key={index} className="text-xs">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket 输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {mode === 'encrypt' ? '加密 Ticket' : '解密 Ticket'}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder={mode === 'encrypt' ? '留空自动生成' : '请输入解密 ticket'}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {mode === 'encrypt' && (
                <button
                  onClick={() => setTicket(generateTicket())}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                >
                  生成
                </button>
              )}
            </div>
          </div>

          {/* 算法选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              加密算法
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="AES-GCM"
                  checked={algorithm === 'AES-GCM'}
                  onChange={(e) => setAlgorithm(e.target.value as 'AES-GCM' | 'AES-CBC')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  AES-GCM (推荐，小文件)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="AES-CBC"
                  checked={algorithm === 'AES-CBC'}
                  onChange={(e) => setAlgorithm(e.target.value as 'AES-GCM' | 'AES-CBC')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  AES-CBC (大文件)
                </span>
              </label>
            </div>
          </div>

          {/* 加密按钮 */}
          {mode === 'encrypt' && (
            <div className="flex space-x-4">
              <button
                onClick={() => handleEncrypt('AES-GCM')}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
              >
                {loading ? '加密中...' : 'AES-GCM 加密'}
              </button>
              <button
                onClick={() => handleEncrypt('AES-CBC')}
                disabled={loading}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
              >
                {loading ? '加密中...' : 'AES-CBC 加密'}
              </button>
            </div>
          )}

          {/* 解密按钮 */}
          {mode === 'decrypt' && (
            <div className="flex space-x-4">
              <button
                onClick={() => handleDecrypt('AES-GCM')}
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
              >
                {loading ? '解密中...' : 'AES-GCM 解密'}
              </button>
              <button
                onClick={() => handleDecrypt('AES-CBC')}
                disabled={loading}
                className="flex-1 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
              >
                {loading ? '解密中...' : 'AES-CBC 解密'}
              </button>
            </div>
          )}

          {/* 错误/成功消息 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg dark:bg-green-900/20 dark:text-green-400">
              {success}
            </div>
          )}

          {/* 加密结果 */}
          {encryptedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                加密结果
              </h3>
              <div className="space-y-3">
                {encryptedFiles.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:bg-gray-700"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.fileName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.algorithm} | {(result.fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => downloadEncryptedFile(result)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      下载
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 性能监控 */}
        <PerformanceMonitor />
      </div>
    </div>
  );
}
