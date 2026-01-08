# 云端同步功能配置指南

## 概述

云端同步功能使用 **对象存储 (S3 Storage)** 集成，将您的加密历史和用户数据备份到云端，支持多设备访问。

## 所需环境变量

云端同步功能需要配置以下两个环境变量：

```env
COZE_BUCKET_ENDPOINT_URL=https://your-bucket-endpoint.com
COZE_BUCKET_NAME=your-bucket-name
```

## 环境变量说明

### COZE_BUCKET_ENDPOINT_URL
- **描述**：对象存储服务的端点URL
- **示例**：`https://s3.cn-north-1.amazonaws.com.cn`
- **获取方式**：从云服务提供商获取（如阿里云OSS、腾讯云COS、AWS S3等）

### COZE_BUCKET_NAME
- **描述**：存储桶（Bucket）名称
- **示例**：`my-encrypt-data-bucket`
- **获取方式**：在云服务提供商的控制台中创建存储桶

## 配置方法

### 方法 1：本地开发环境（推荐）

在项目根目录创建 `.env.local` 文件：

```bash
# 在项目根目录下创建 .env.local 文件
touch .env.local
```

编辑 `.env.local` 文件，添加以下内容：

```env
# 对象存储配置（用于云端数据同步）
COZE_BUCKET_ENDPOINT_URL=https://your-bucket-endpoint.com
COZE_BUCKET_NAME=your-bucket-name

# 数据库配置（本地开发使用）
DATABASE_URL=postgresql://user:password@localhost:5432/fileencrypt
```

**⚠️ 重要提醒：**
- `.env.local` 文件已添加到 `.gitignore`，不会被提交到 Git
- 不要将 `.env.local` 文件分享给他人
- 确保 `.env.local` 文件不会被意外提交

### 方法 2：生产环境部署

#### Vercel 部署

1. 登录 Vercel 控制台
2. 进入你的项目设置
3. 选择 **Environment Variables**
4. 添加以下环境变量：

| 名称 | 值 | 环境 |
|------|-----|------|
| `COZE_BUCKET_ENDPOINT_URL` | 你的存储端点URL | Production, Preview, Development |
| `COZE_BUCKET_NAME` | 你的存储桶名称 | Production, Preview, Development |

5. 保存并重新部署项目

#### 其他平台部署

在部署平台的配置中添加环境变量：

- **Netlify**: Site Settings → Environment variables
- **Render**: Environment → Environment Variables
- **Railway**: Project Settings → Variables
- **Docker**: 使用 `-e` 参数或 `docker-compose.yml`

## 如何获取对象存储服务

### 免费方案（推荐用于测试）

1. **MinIO** - 本地对象存储
   - 下载：https://min.io/download
   - 端点：`http://localhost:9000`
   - 需要本地运行服务

2. **Cloudflare R2** - 免费存储
   - 注册：https://developers.cloudflare.com/r2/
   - 提供免费额度
   - S3兼容API

### 付费方案（推荐用于生产）

1. **阿里云 OSS**
   - 注册：https://www.aliyun.com/product/oss
   - 文档：https://help.aliyun.com/product/31815.html
   - 有免费额度

2. **腾讯云 COS**
   - 注册：https://cloud.tencent.com/product/cos
   - 文档：https://cloud.tencent.com/document/product/436
   - 有免费额度

3. **AWS S3**
   - 注册：https://aws.amazon.com/s3/
   - 全球最成熟的对象存储服务
   - 有免费额度

## 验证配置

配置完成后，可以通过以下步骤验证：

### 1. 检查环境变量是否加载

启动开发服务器后，在控制台应该能看到：

```bash
# 如果环境变量未配置，会看到警告
# Cloud sync will be disabled: Missing COZE_BUCKET_ENDPOINT_URL or COZE_BUCKET_NAME
```

### 2. 测试云端同步API

使用 curl 测试：

```bash
# 测试云端状态检查
curl -X POST http://localhost:5000/api/cloud-sync \
  -H "Content-Type: application/json" \
  -d '{"action":"check"}'

# 预期响应（已配置）
# {"success":true,"message":"云端暂无数据","cloudExists":false}

# 预期响应（未配置）
# 可能会返回错误或云端不可用的提示
```

### 3. 在应用中测试

1. 登录到应用
2. 进入个人中心
3. 点击"立即同步"按钮
4. 查看同步结果提示

## 智能回退机制

应用已经实现了智能回退机制：

- ✅ **如果云端配置正确**：自动启用云端同步
- ✅ **如果云端未配置或不可用**：自动使用 localStorage，不影响基本功能
- ✅ **数据安全**：云端和本地数据独立存储，互不影响

## 安全建议

1. **环境变量安全**
   - 不要将 `.env.local` 文件提交到 Git
   - 不要在代码中硬编码密钥
   - 定期更换访问密钥

2. **数据安全**
   - 加密历史数据已经过加密
   - Ticket 是解密密钥，请妥善保管
   - 建议定期备份重要数据

3. **访问控制**
   - 配置存储桶访问权限为私有
   - 使用 HTTPS 端点
   - 限制访问 IP（如需要）

## 故障排除

### 问题1：同步失败

**症状**：点击"立即同步"后显示"同步失败"

**解决方案**：
1. 检查环境变量是否正确配置
2. 检查网络连接
3. 检查存储桶权限
4. 查看浏览器控制台错误信息

### 问题2：云端数据不同步

**症状**：在不同设备上看到的数据不一致

**解决方案**：
1. 在每个设备上都点击"立即同步"
2. 确保使用相同的用户账号
3. 检查存储桶名称是否一致

### 问题3：本地数据丢失

**症状**：清除浏览器缓存后数据丢失

**解决方案**：
1. 从云端同步恢复数据
2. 如果云端也没有数据，则数据无法恢复
3. 建议定期导出加密历史

## 无需云端同步

如果你不需要云端同步功能，可以：

1. **不配置环境变量**：系统会自动使用 localStorage
2. **功能完全正常**：所有核心功能（加密、解密、历史记录）都可以正常使用
3. **数据本地存储**：数据仅保存在浏览器中

## 总结

- ✅ 云端同步是**可选功能**，不配置也能正常使用应用
- ✅ 配置后可以实现**多设备数据同步**
- ✅ 系统已实现**智能回退机制**，配置错误不影响基本功能
- ✅ 建议生产环境**配置对象存储**以支持多设备访问
- ✅ 推荐使用**阿里云OSS**或**腾讯云COS**（有免费额度）

## 技术支持

如果遇到问题：

1. 查看浏览器控制台错误信息
2. 检查环境变量配置
3. 参考对象存储服务提供商的文档
4. 提交 Issue 到项目仓库

---

**注意**：本文档基于当前应用版本编写，如有更新请参考最新文档。
