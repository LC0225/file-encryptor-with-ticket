# 跨设备同步替代方案

## 概述

除了对象存储，还有多种跨设备同步方案可以选择。根据你的需求（安全、成本、复杂度），可以选择最适合的方案。

---

## 📊 方案对比

| 方案 | 成本 | 复杂度 | 安全性 | 实时性 | 推荐度 |
|------|------|--------|--------|--------|--------|
| 手动导出/导入 | 免费 | ⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐ |
| Firebase | 免费额度 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| Supabase | 免费额度 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| WebRTC P2P | 免费 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ |
| IPFS | 免费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ❌ | ⭐⭐ |
| WebDAV | 视服务商 | ⭐⭐ | ⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ |
| GitHub Gist | 免费 | ⭐⭐ | ⭐⭐⭐ | ❌ | ⭐⭐⭐ |

---

## 方案 1: 手动导出/导入 ⭐⭐⭐

### 特点
- ✅ 完全免费
- ✅ 最高安全性（数据在你的设备上）
- ✅ 无需配置任何服务
- ❌ 需要手动操作
- ❌ 非实时同步

### 实现方案

#### 1.1 导出加密历史

```typescript
// src/utils/exportImport.ts

export function exportEncryptionHistory() {
  const history = getEncryptionHistory();
  const data = {
    version: Date.now(),
    exportTime: new Date().toISOString(),
    data: history
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `encryption-history-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

export function importEncryptionHistory(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // 合并数据（避免重复）
        const existingHistory = getEncryptionHistory();
        const existingIds = new Set(existingHistory.map(h => h.id));
        
        const newItems = data.data.filter(
          (item: any) => !existingIds.has(item.id)
        );
        
        if (newItems.length > 0) {
          localStorage.setItem(
            'encryption_history',
            JSON.stringify([...newItems, ...existingHistory])
          );
          resolve({ success: true, imported: newItems.length });
        } else {
          resolve({ success: true, imported: 0, message: '没有新数据' });
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.readAsText(file);
  });
}
```

#### 1.2 在UI中添加按钮

```tsx
// src/app/profile/page.tsx

import { exportEncryptionHistory, importEncryptionHistory } from '@/utils/exportImport';

const [importing, setImporting] = useState(false);

// 导出功能
const handleExport = () => {
  exportEncryptionHistory();
  showToast({ type: 'success', message: '加密历史已导出', duration: 2000 });
};

// 导入功能
const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  setImporting(true);
  
  importEncryptionHistory(file)
    .then((result: any) => {
      if (result.imported > 0) {
        showToast({ 
          type: 'success', 
          message: `成功导入 ${result.imported} 条记录`, 
          duration: 2000 
        });
        loadHistory();
      } else {
        showToast({ 
          type: 'info', 
          message: result.message || '没有新数据', 
          duration: 2000 
        });
      }
    })
    .catch((error) => {
      showToast({ 
        type: 'error', 
        message: '导入失败：' + error.message, 
        duration: 3000 
      });
    })
    .finally(() => {
      setImporting(false);
    });
};
```

#### 1.3 使用方式

```tsx
{/* 导入/导出按钮组 */}
<div className="flex gap-3">
  <button
    onClick={handleExport}
    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
  >
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    导出历史
  </button>
  
  <label className="flex items-center gap-2 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
    导入历史
    <input
      type="file"
      accept=".json"
      onChange={handleImport}
      disabled={importing}
      className="hidden"
    />
  </label>
</div>
```

### 适用场景
- 偶尔需要同步数据
- 对数据安全要求极高
- 不想配置任何云服务
- 设备数量较少（2-3台）

---

## 方案 2: Firebase 实时数据库 ⭐⭐⭐⭐⭐

### 特点
- ✅ 完全免费（慷慨的免费额度）
- ✅ 实时同步
- ✅ 离线支持
- ✅ Google维护，稳定性高
- ⚠️ 需要配置Firebase项目

### 实现方案

#### 2.1 安装Firebase SDK

```bash
pnpm add firebase
```

#### 2.2 创建Firebase配置文件

```typescript
// src/utils/firebase.ts

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, onValue };
```

#### 2.3 实现同步功能

```typescript
// src/utils/firebaseSync.ts

import { ref, set, get } from '@/utils/firebase';
import { getEncryptionHistory } from '@/utils/storage';

const USER_DATA_PATH = 'users';

export async function uploadToFirebase(userId: string) {
  const history = getEncryptionHistory();
  
  const userRef = ref(db, `${USER_DATA_PATH}/${userId}`);
  await set(userRef, {
    history,
    lastUpdate: Date.now(),
  });
}

export async function downloadFromFirebase(userId: string) {
  const userRef = ref(db, `${USER_DATA_PATH}/${userId}`);
  const snapshot = await get(userRef);
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    return data.history || [];
  }
  
  return null;
}

export function listenToFirebaseChanges(userId: string, callback: (data: any[]) => void) {
  const userRef = ref(db, `${USER_DATA_PATH}/${userId}`);
  
  const unsubscribe = onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(data.history || []);
    }
  });
  
  return unsubscribe;
}
```

#### 2.4 配置环境变量

```env
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### 2.5 如何获取Firebase配置

1. 访问 https://console.firebase.google.com/
2. 创建新项目
3. 选择"Realtime Database"
4. 创建数据库
5. 进入项目设置 → 通用 → 配置 → 复制配置

### 适用场景
- 需要实时同步
- 设备数量较多
- 希望使用免费服务
- 需要离线支持

### 费用
- **免费额度**：每天100次读取 + 100次写入
- **超出后**：$5/GB 存储 + $0.05/GB 传输

---

## 方案 3: Supabase ⭐⭐⭐⭐⭐

### 特点
- ✅ 开源（可自部署）
- ✅ 免费额度慷慨
- ✅ PostgreSQL数据库
- ✅ 类似Firebase但更灵活
- ✅ 支持实时订阅

### 实现方案

#### 3.1 安装Supabase客户端

```bash
pnpm add @supabase/supabase-js
```

#### 3.2 创建Supabase客户端

```typescript
// src/utils/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

#### 3.3 实现同步功能

```typescript
// src/utils/supabaseSync.ts

import { supabase } from '@/utils/supabase';
import { getEncryptionHistory } from '@/utils/storage';

export async function uploadToSupabase(userId: string) {
  const history = getEncryptionHistory();
  
  const { data, error } = await supabase
    .from('encryption_history')
    .upsert({
      user_id: userId,
      history,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });
  
  if (error) throw error;
  return data;
}

export async function downloadFromSupabase(userId: string) {
  const { data, error } = await supabase
    .from('encryption_history')
    .select('history')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data?.history || [];
}

export function subscribeToChanges(userId: string, callback: (data: any[]) => void) {
  return supabase
    .channel('encryption_history_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'encryption_history',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new?.history || []);
      }
    )
    .subscribe();
}
```

#### 3.4 创建数据库表

```sql
-- 在Supabase SQL编辑器中执行

CREATE TABLE encryption_history (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  history JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE encryption_history ADD CONSTRAINT encryption_history_user_id_key UNIQUE (user_id);

-- 启用行级安全策略
ALTER TABLE encryption_history ENABLE ROW LEVEL SECURITY;

-- 允许用户读写自己的数据
CREATE POLICY "Users can view own history"
  ON encryption_history
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own history"
  ON encryption_history
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own history"
  ON encryption_history
  FOR UPDATE
  USING (auth.uid()::text = user_id);
```

#### 3.5 配置环境变量

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### 3.6 如何获取Supabase配置

1. 访问 https://supabase.com/
2. 创建新项目
3. 进入项目设置 → API
4. 复制Project URL和anon key

### 适用场景
- 需要实时同步
- 喜欢开源方案
- 需要SQL查询能力
- 想要自部署

### 费用
- **免费额度**：500MB数据库 + 1GB存储 + 2GB带宽
- **付费计划**：$25/月起

---

## 方案 4: WebRTC P2P同步 ⭐⭐⭐

### 特点
- ✅ 完全免费
- ✅ 端到端加密（最安全）
- ✅ 无需服务器
- ❌ 需要两个设备同时在线
- ❌ 实现复杂

### 实现方案

#### 4.1 安装依赖

```bash
pnpm add simple-peer
```

#### 4.2 实现P2P同步

```typescript
// src/utils/p2pSync.ts

import Peer from 'simple-peer';

export class P2PSync {
  private peer: any;
  private dataCallbacks: ((data: any) => void)[] = [];

  constructor(initiator: boolean) {
    this.peer = new Peer({ initiator, trickle: false });
    
    this.peer.on('data', (data: any) => {
      const parsed = JSON.parse(data);
      this.dataCallbacks.forEach(cb => cb(parsed));
    });
    
    this.peer.on('error', (err: any) => {
      console.error('P2P Error:', err);
    });
  }

  on(event: string, callback: (data: any) => void) {
    this.peer.on(event, callback);
  }

  onData(callback: (data: any) => void) {
    this.dataCallbacks.push(callback);
  }

  send(data: any) {
    this.peer.send(JSON.stringify(data));
  }

  signal(data: any) {
    this.peer.signal(data);
  }

  destroy() {
    this.peer.destroy();
  }
}
```

#### 4.3 使用方式

```typescript
// 设备A（发起者）
const p2pA = new P2PSync(true);

p2pA.on('signal', (data: any) => {
  // 将signal数据发送给设备B（通过二维码、消息等）
  console.log('Signal A:', JSON.stringify(data));
});

p2pA.on('connect', () => {
  // 连接建立后发送数据
  const history = getEncryptionHistory();
  p2pA.send({ type: 'history', data: history });
});

// 设备B（接收者）
const p2pB = new P2PSync(false);

p2pB.on('signal', (data: any) => {
  // 将signal数据发送给设备A
  console.log('Signal B:', JSON.stringify(data));
});

// 接收来自A的数据
p2pB.onData((data) => {
  if (data.type === 'history') {
    console.log('Received history:', data.data);
  }
});
```

### 适用场景
- 对安全性要求极高
- 两个设备同时在线
- 不想使用任何云服务
- 技术能力强

---

## 方案 5: GitHub Gist ⭐⭐⭐

### 特点
- ✅ 免费
- ✅ 简单易用
- ✅ 版本控制
- ❌ 需要GitHub账号
- ❌ 公开Gist可能泄露数据

### 实现方案

#### 5.1 安装Octokit

```bash
pnpm add octokit
```

#### 5.2 实现Gist同步

```typescript
// src/utils/gistSync.ts

import { Octokit } from 'octokit';

const GIST_ID = 'your_gist_id'; // 可以存储在localStorage

export async function uploadToGist(token: string, history: any[]) {
  const octokit = new Octokit({ auth: token });
  
  const gistId = localStorage.getItem('gist_id');
  
  if (gistId) {
    // 更新现有Gist
    await octokit.rest.gists.update({
      gist_id: gistId,
      files: {
        'encryption-history.json': {
          content: JSON.stringify({
            version: Date.now(),
            data: history
          }, null, 2)
        }
      }
    });
  } else {
    // 创建新Gist
    const gist = await octokit.rest.gists.create({
      description: 'File Encryptor - Encryption History',
      public: false, // 私有
      files: {
        'encryption-history.json': {
          content: JSON.stringify({
            version: Date.now(),
            data: history
          }, null, 2)
        }
      }
    });
    
    localStorage.setItem('gist_id', gist.data.id);
  }
}

export async function downloadFromGist(token: string) {
  const octokit = new Octokit({ auth: token });
  const gistId = localStorage.getItem('gist_id');
  
  if (!gistId) {
    throw new Error('No Gist ID found');
  }
  
  const gist = await octokit.rest.gists.get({ gist_id: gistId });
  const content = gist.data.files['encryption-history.json']?.content;
  
  if (!content) {
    throw new Error('No encryption history found in Gist');
  }
  
  const data = JSON.parse(content);
  return data.data || [];
}
```

#### 5.3 配置环境变量

```env
# .env.local
NEXT_PUBLIC_GITHUB_TOKEN=your_github_personal_access_token
```

### 适用场景
- 已经使用GitHub
- 需要版本控制
- 数据量不大
- 可以接受手动同步

### 费用
- **完全免费**

---

## 方案 6: WebDAV ⭐⭐⭐⭐

### 特点
- ✅ 支持多种云服务
- ✅ 使用标准协议
- ✅ 可以使用现有的云服务
- ❌ 需要支持WebDAV的服务

### 支持的服务
- Nextcloud（自建）
- Seafile（自建）
- 坚果云
- Dropbox（通过第三方工具）
- Google Drive（通过第三方工具）

### 实现方案

#### 6.1 安装WebDAV客户端

```bash
pnpm add webdav
```

#### 6.2 实现WebDAV同步

```typescript
// src/utils/webdavSync.ts

import { createClient } from 'webdav';

export function getWebDAVClient() {
  return createClient(process.env.NEXT_PUBLIC_WEBDAV_URL!, {
    username: process.env.NEXT_PUBLIC_WEBDAV_USERNAME!,
    password: process.env.NEXT_PUBLIC_WEBDAV_PASSWORD!,
  });
}

export async function uploadToWebDAV(history: any[]) {
  const client = getWebDAVClient();
  
  const content = JSON.stringify({
    version: Date.now(),
    data: history
  }, null, 2);
  
  await client.putFileContents('/file-encrypt/history.json', content);
}

export async function downloadFromWebDAV() {
  const client = getWebDAVClient();
  
  try {
    const content = await client.getFileContents('/file-encrypt/history.json', { format: 'text' }) as string;
    const data = JSON.parse(content);
    return data.data || [];
  } catch (error) {
    if (error.status === 404) {
      return null; // 文件不存在
    }
    throw error;
  }
}
```

#### 6.3 配置环境变量

```env
# .env.local
NEXT_PUBLIC_WEBDAV_URL=https://nextcloud.example.com/remote.php/dav/files/username/
NEXT_PUBLIC_WEBDAV_USERNAME=your_username
NEXT_PUBLIC_WEBDAV_PASSWORD=your_password
```

### 适用场景
- 已经有WebDAV服务
- 使用Nextcloud/Seafile
- 需要自己控制数据

---

## 🎯 推荐方案

### 1. 最简单：手动导出/导入
- 无需配置
- 完全免费
- 适合偶尔同步

### 2. 最推荐：Firebase
- 完全免费
- 实时同步
- 简单易用
- Google背书

### 3. 最灵活：Supabase
- 开源
- 功能强大
- 可自部署
- 类似Firebase

### 4. 最安全：WebRTC P2P
- 端到端加密
- 不经过服务器
- 完全私有

---

## 📝 总结

| 需求场景 | 推荐方案 |
|----------|----------|
| 我不想配置任何服务 | 手动导出/导入 |
| 我需要实时同步 | Firebase / Supabase |
| 我有Nextcloud/WebDAV | WebDAV |
| 我对安全性要求极高 | WebRTC P2P |
| 我已经使用GitHub | GitHub Gist |
| 我想自建服务 | Supabase自部署 |

---

## 🔧 快速实现

如果你选择 **Firebase** 或 **Supabase**，我可以帮你快速实现完整功能。只需要：

1. 创建对应的服务账号
2. 告诉我你选择的方案
3. 我会生成完整的代码

需要我帮你实现哪个方案吗？
