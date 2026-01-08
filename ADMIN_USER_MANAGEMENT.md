# 管理员用户管理功能文档

## 功能概述

管理员（root）现在拥有完整的用户管理功能，包括：

1. ✅ **新增用户** - 创建新用户账号
2. ✅ **修改密码** - 修改普通用户的密码
3. ✅ **删除用户** - 删除普通用户账号
4. ✅ **查找用户** - 搜索用户名或邮箱

## 访问方式

### 管理员页面

- **URL**: `/admin`
- **登录要求**: 必须使用 root 管理员账号登录
- **自动检查**: 非管理员访问会自动重定向到首页

## 功能详情

### 1. 新增用户

**操作步骤**:
1. 登录 root 管理员账号
2. 进入管理员面板 (`/admin`)
3. 点击右上角"新增用户"按钮
4. 填写用户信息：
   - 用户名（3-20字符）
   - 密码（至少8位，包含大小写字母和数字）
   - 邮箱（可选）
   - 角色（普通用户/管理员）
5. 点击"添加"按钮

**API 路由**:
```
POST /api/admin/users
Headers: Authorization: Bearer {token}
Body: {
  username: string,
  password: string,
  email?: string,
  role?: 'admin' | 'user'
}
```

**验证规则**:
- 用户名长度：3-20字符
- 密码：至少8位，包含大小写字母和数字
- 用户名不能重复

**自动同步**: 新增用户后会自动同步到 Supabase Storage 云端

---

### 2. 修改密码

**操作步骤**:
1. 在用户列表中找到目标用户
2. 点击该用户操作列的"修改密码"按钮
3. 输入新密码（至少8位，包含大小写字母和数字）
4. 点击"修改"按钮

**限制**:
- 不能修改管理员账号的密码（root 除外）
- 修改后用户需要使用新密码重新登录

**API 路由**:
```
PATCH /api/admin/users/[id]/password
Headers: Authorization: Bearer {token}
Body: {
  newPassword: string
}
```

**自动同步**: 修改密码后会自动同步到 Supabase Storage 云端

---

### 3. 删除用户

**操作步骤**:
1. 在用户列表中找到目标用户
2. 点击该用户操作列的"删除"按钮
3. 确认删除操作

**限制**:
- 管理员账号无法被删除
- 删除后该用户的加密历史将无法访问
- 操作不可撤销

**API 路由**:
```
DELETE /api/admin/users/[id]
Headers: Authorization: Bearer {token}
```

**自动同步**: 删除用户后会自动同步到 Supabase Storage 云端

---

### 4. 搜索用户

**操作步骤**:
1. 在管理员页面的搜索框中输入关键词
2. 实时过滤用户列表

**搜索范围**:
- 用户名
- 邮箱

**特点**:
- 实时搜索，无需点击按钮
- 大小写不敏感
- 支持部分匹配

---

## 统计信息

管理员页面顶部显示：
- **总用户数**: 系统中所有用户的数量
- **普通用户**: 角色为 user 的用户数量
- **管理员**: 角色为 admin 的用户数量

---

## 安全特性

1. **权限验证**: 所有 API 路由都验证管理员权限
2. **Token 认证**: 使用 Bearer Token 进行身份验证
3. **密码加密**: 密码使用 SHA-256 加密存储
4. **密码验证**: 新增和修改密码时强制验证密码强度
5. **管理员保护**: 管理员账号无法被删除

---

## 操作说明提示

在管理员页面底部显示重要操作提示：
- 管理员账号无法被删除
- 删除用户后，该用户的加密历史将无法访问
- 修改密码后，用户需要使用新密码重新登录
- 建议谨慎删除操作，确保已通知相关用户

---

## 当前用户列表

### 管理员
- **用户名**: root
- **角色**: admin
- **创建时间**: 2026-01-08

### 普通用户
- **test3** (test3@example.com)
- **testuser** (test@example.com)

---

## API 测试示例

### 测试新增用户
```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "username": "newuser",
    "password": "Test1234",
    "email": "newuser@example.com",
    "role": "user"
  }'
```

### 测试修改密码
```bash
curl -X PATCH http://localhost:5000/api/admin/users/{user_id}/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "newPassword": "NewPass123"
  }'
```

### 测试删除用户
```bash
curl -X DELETE http://localhost:5000/api/admin/users/{user_id} \
  -H "Authorization: Bearer {token}"
```

---

## 常见问题

### Q: 如何获取管理员 token？
A: 登录 root 账号后，token 会自动存储在浏览器的 localStorage 中（key: `crypto_auth_token`）

### Q: 可以删除自己（root 管理员）吗？
A: 不可以，系统保护管理员账号不被删除

### Q: 删除用户后还能恢复吗？
A: 不能，删除是永久性的。建议在删除前通知用户备份重要数据。

### Q: 密码修改后用户会收到通知吗？
A: 不会自动通知，管理员需要手动告知用户新密码。

### Q: 可以修改管理员密码吗？
A: 可以，通过用户列表中的"修改密码"按钮修改任何用户的密码。

---

## 后续优化建议

1. **批量操作**: 支持批量删除/修改用户
2. **用户导出**: 导出用户列表为 Excel/CSV
3. **操作日志**: 记录所有管理员操作
4. **密码重置**: 发送密码重置邮件
5. **用户状态**: 添加用户禁用/启用功能
6. **审计日志**: 完整的操作审计追踪

---

## 技术实现

### 前端组件
- `src/app/admin/page.tsx` - 管理员页面

### API 路由
- `src/app/api/admin/users/route.ts` - 用户列表和新增
- `src/app/api/admin/users/[id]/route.ts` - 删除用户
- `src/app/api/admin/users/[id]/password/route.ts` - 修改密码

### 工具函数
- `src/utils/auth.ts` - 认证相关函数

---

**文档更新时间**: 2026-01-08
**版本**: v1.0
