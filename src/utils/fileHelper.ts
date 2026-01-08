/**
 * 获取文件类型标签
 */
export function getFileTypeLabel(fileType: string): string {
  if (!fileType) return '未知类型';
  if (fileType.includes('pdf')) return 'PDF';
  if (fileType.includes('word') || fileType.includes('document')) return 'Word';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'PPT';
  if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpeg') || fileType.includes('jpg')) return '图片';
  if (fileType.includes('video')) return '视频';
  if (fileType.includes('audio')) return '音频';
  if (fileType.includes('text') || fileType.includes('plain')) return '文本';
  return '文件';
}

/**
 * 获取文件类型颜色
 */
export function getFileTypeColor(fileType: string): string {
  if (!fileType) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  if (fileType.includes('pdf')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  if (fileType.includes('word') || fileType.includes('document')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  if (fileType.includes('image')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
  if (fileType.includes('video')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
  if (fileType.includes('audio')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 格式化日期
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 下载加密文件
 */
export function downloadEncryptedFile(
  encryptedData: string,
  iv: string,
  fileName: string,
  fileType: string
): void {
  const content = JSON.stringify(
    {
      data: encryptedData,
      iv,
      fileName,
      fileType,
    },
    null,
    2
  );
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.encrypted`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 下载解密文件
 */
export function downloadDecryptedFile(data: Blob, fileName: string): void {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // 降级方案：使用 document.execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}
