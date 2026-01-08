'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  encryptFile,
  encryptFiles,
  decryptFile,
  generateTicket,
} from '@/utils/crypto';
import { addEncryptionHistory } from '@/utils/storage';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [ticket, setTicket] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [encryptedFile, setEncryptedFile] = useState<{
    data: string;
    iv: string;
    fileName: string;
    fileType: string;
  } | null>(null);
  const [decryptedFile, setDecryptedFile] = useState<{
    data: Blob;
    fileName: string;
    fileType: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const decryptDataInputRef = useRef<HTMLInputElement>(null);

  // 从session storage读取ticket
  useEffect(() => {
    const savedTicket = sessionStorage.getItem('decrypt_ticket');
    if (savedTicket) {
      setMode('decrypt');
      setTicket(savedTicket);
      sessionStorage.removeItem('decrypt_ticket');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setError('');
  };

  const handleEncrypt = async () => {
    if (files.length === 0) {
      setError('请选择要加密的文件');
      return;
    }

    const ticketToUse = ticket || generateTicket();
    if (!ticket) {
      setTicket(ticketToUse);
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (files.length === 1) {
        const result = await encryptFile(files[0], ticketToUse);
        setEncryptedFile({
          data: result.encryptedData,
          iv: result.iv,
          fileName: result.fileName,
          fileType: result.fileType,
        });
        
        // 保存到历史记录
        addEncryptionHistory(result, ticketToUse, files[0].size);
      } else {
        const results = await encryptFiles(files, ticketToUse);
        
        // 保存到历史记录
        for (let i = 0; i < results.length; i++) {
          addEncryptionHistory(results[i], ticketToUse, files[i].size);
        }
        
        setSuccess(`成功加密 ${files.length} 个文件`);
      }
      setSuccess('文件加密成功！');
    } catch (err) {
      setError('加密失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
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
      // 这里假设上传的文件是加密数据文件
      const file = files[0];
      const fileContent = await file.text();
      
      // 尝试解析加密数据格式
      let encryptedData: string;
      let iv: string;
      let fileName: string;
      let fileType: string;

      try {
        // 尝试从文件内容解析JSON格式
        const jsonData = JSON.parse(fileContent);
        encryptedData = jsonData.data;
        iv = jsonData.iv;
        fileName = jsonData.fileName;
        fileType = jsonData.fileType || 'application/octet-stream';
      } catch {
        // 如果不是JSON格式，直接使用文件内容
        encryptedData = fileContent;
        iv = '';
        fileName = file.name.replace('.encrypted', '');
        fileType = 'application/octet-stream';
      }

      const result = await decryptFile(
        encryptedData,
        iv,
        ticket,
        fileName,
        fileType
      );
      
      setDecryptedFile({
        data: result.decryptedData,
        fileName: result.fileName,
        fileType: result.fileType,
      });
      
      setSuccess('文件解密成功！');
    } catch (err) {
      setError('解密失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const downloadEncryptedFile = () => {
    if (!encryptedFile) return;

    const content = JSON.stringify(encryptedFile, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${encryptedFile.fileName}.encrypted`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    setEncryptedFile(null);
    setDecryptedFile(null);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              文件加密工具
            </h1>
            <Link
              href="/profile"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              个人中心
            </Link>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* 标题 */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              安全文件加密
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              使用ticket保护您的文件安全，只有拥有ticket的人才能解密
            </p>
          </div>

          {/* 模式切换 */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setMode('encrypt');
                reset();
              }}
              className={`rounded-lg px-6 py-3 font-medium transition-colors ${
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
              className={`rounded-lg px-6 py-3 font-medium transition-colors ${
                mode === 'decrypt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              解密文件
            </button>
          </div>

          {/* 主卡片 */}
          <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
            {/* 文件上传 */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {mode === 'encrypt' ? '选择文件' : '选择加密文件'}
              </label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  multiple={mode === 'encrypt'}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                <button
                  onClick={reset}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  重置
                </button>
              </div>
              {files.length > 0 && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  已选择 {files.length} 个文件
                </p>
              )}
            </div>

            {/* Ticket输入 */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ticket（密钥）
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={ticket}
                  onChange={(e) => setTicket(e.target.value)}
                  placeholder={
                    mode === 'encrypt'
                      ? '输入ticket或留空自动生成'
                      : '输入解密ticket'
                  }
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                {mode === 'encrypt' && !ticket && (
                  <button
                    onClick={() => setTicket(generateTicket())}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    生成Ticket
                  </button>
                )}
              </div>
              {ticket && mode === 'encrypt' && (
                <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                  ⚠️ 请保存好此ticket，文件解密时需要使用
                </p>
              )}
            </div>

            {/* 操作按钮 */}
            <button
              onClick={mode === 'encrypt' ? handleEncrypt : handleDecrypt}
              disabled={loading || files.length === 0}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:hover:bg-blue-700 dark:disabled:bg-gray-600"
            >
              {loading
                ? '处理中...'
                : mode === 'encrypt'
                ? '加密文件'
                : '解密文件'}
            </button>

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
            {mode === 'encrypt' && encryptedFile && (
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                  加密成功
                </h3>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                  文件名：{encryptedFile.fileName}
                </p>
                <button
                  onClick={downloadEncryptedFile}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-700"
                >
                  下载加密文件
                </button>
              </div>
            )}

            {/* 解密结果 */}
            {mode === 'decrypt' && decryptedFile && (
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                  解密成功
                </h3>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                  文件名：{decryptedFile.fileName}
                </p>
                <button
                  onClick={downloadDecryptedFile}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-700"
                >
                  下载解密文件
                </button>
              </div>
            )}
          </div>

          {/* 说明 */}
          <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
              使用说明
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                • 支持单个或批量文件加密，所有文件使用同一个ticket
              </li>
              <li>• 加密后的文件会保存为.json格式的加密文件</li>
              <li>• 解密时需要使用加密时的ticket</li>
              <li>• 所有加密历史记录保存在个人中心</li>
              <li>• 请妥善保管ticket，丢失后无法解密文件</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
