export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          文件加密工具
        </h1>
        <p className="text-gray-700 mb-6">
          应用正在运行，正在恢复完整功能...
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ 服务器运行正常
            </p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              ℹ️ 这是一个简化版测试页面
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
