# 登录注册失败 - 调试方案

## 🔍 需要诊断信息

请按照以下步骤操作，把结果告诉我：

---

## 步骤 1：检查 localStorage 数据

### 在浏览器控制台（F12 → Console）中运行以下代码：

```javascript
// 查看所有 localStorage 数据
console.log('=== 所有 localStorage 数据 ===');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, ':', localStorage.getItem(key));
}

// 查看用户数据
console.log('\n=== 用户数据 ===');
const users = localStorage.getItem('crypto_users');
console.log('crypto_users:', users ? JSON.parse(users) : '(空)');

// 查看会话数据
console.log('\n=== 会话数据 ===');
const session = localStorage.getItem('crypto_session');
console.log('crypto_session:', session ? JSON.parse(session) : '(空)');
```

**把输出结果复制给我。**

---

## 步骤 2：手动初始化管理员账号

在控制台中运行：

```javascript
// 手动初始化管理员账号
async function initAdmin() {
  const encoder = new TextEncoder();
  const data = encoder.encode('BGSN123.321');
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const admin = {
    id: 'admin_' + Date.now(),
    username: 'root',
    passwordHash: hashHex,
    createdAt: new Date().toISOString(),
    role: 'admin'
  };
  
  const users = JSON.parse(localStorage.getItem('crypto_users') || '[]');
  const existing = users.find(u => u.username === 'root');
  
  if (existing) {
    console.log('root 账号已存在');
    console.log('存储的密码哈希:', existing.passwordHash);
    console.log('计算的新密码哈希:', hashHex);
    console.log('是否匹配:', existing.passwordHash === hashHex);
  } else {
    users.push(admin);
    localStorage.setItem('crypto_users', JSON.stringify(users));
    console.log('✅ root 账号已创建');
    console.log('密码哈希:', hashHex);
  }
}

initAdmin();
```

**把输出结果复制给我。**

---

## 步骤 3：手动测试登录

在控制台中运行：

```javascript
// 手动测试登录
async function testLogin() {
  const encoder = new TextEncoder();
  const data = encoder.encode('BGSN123.321');
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const users = JSON.parse(localStorage.getItem('crypto_users') || '[]');
  const user = users.find(u => u.username === 'root');
  
  if (user) {
    console.log('找到 root 用户');
    console.log('用户数据:', user);
    console.log('存储的密码哈希:', user.passwordHash);
    console.log('输入的密码哈希:', hashHex);
    console.log('密码是否匹配:', user.passwordHash === hashHex);
    
    if (user.passwordHash === hashHex) {
      console.log('✅ 密码验证成功');
      
      // 创建会话
      const session = {
        userId: user.id,
        username: user.username,
        role: user.role,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('crypto_session', JSON.stringify(session));
      console.log('✅ 会话已创建');
    } else {
      console.log('❌ 密码不匹配');
    }
  } else {
    console.log('❌ 未找到 root 用户');
  }
}

testLogin();
```

**把输出结果复制给我。**

---

## 步骤 4：检查环境变量

在控制台中运行：

```javascript
console.log('=== 环境变量检查 ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', window.location.hostname.includes('localhost') ? '(开发环境)' : '(生产环境)');
```

---

## 📋 预期输出

### 如果一切正常，你应该看到：

**步骤 1 输出**：
```
=== 所有 localStorage 数据 ===
crypto_users: [{"id":"admin_...","username":"root","passwordHash":"...","role":"admin"}]
crypto_session: (空)
```

**步骤 2 输出**：
```
root 账号已存在
存储的密码哈希: (十六进制字符串)
计算的新密码哈希: (十六进制字符串)
是否匹配: true
```

**步骤 3 输出**：
```
找到 root 用户
用户数据: {...}
存储的密码哈希: (十六进制字符串)
输入的密码哈希: (十六进制字符串)
密码是否匹配: true
✅ 密码验证成功
✅ 会话已创建
```

---

## 🎯 如果手动测试成功

如果步骤 3 中显示"密码验证成功"和"会话已创建"，那么：

1. 刷新页面（F5）
2. 尝试再次登录
3. 应该能成功登录

---

## 🚨 如果手动测试失败

如果步骤 3 显示"密码不匹配"或"未找到 root 用户"，那么：

1. 把所有输出结果告诉我
2. 我会根据具体问题提供解决方案

---

## 💡 快速修复方案

如果手动测试成功，但网页登录仍然失败，可能是：

### 原因：事件处理函数问题

**临时解决方案**：

1. 使用步骤 3 的代码在控制台中手动创建会话
2. 刷新页面
3. 应该能直接进入主页

这可以帮助你暂时使用应用，同时我们进一步诊断问题。

---

## 📝 请回复以下内容

请把以下结果复制给我：

```
=== 步骤 1 输出 ===
[复制步骤 1 的输出]

=== 步骤 2 输出 ===
[复制步骤 2 的输出]

=== 步骤 3 输出 ===
[复制步骤 3 的输出]
```

**根据输出结果，我会提供具体的解决方案。**