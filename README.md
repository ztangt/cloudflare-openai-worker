# Cloudflare Workers - OpenAI API 代理

一个基于 Cloudflare Workers 的 OpenAI API 代理服务，支持安全地调用 OpenAI API 并返回聊天回复。

## 🚀 功能特性

- ✅ **OpenAI API 代理** - 安全地调用 OpenAI Chat Completions API
- 🔒 **API Key 验证** - 验证 OpenAI API Key 格式
- 🌐 **CORS 支持** - 完整的跨域资源共享支持
- 📝 **TypeScript** - 完整的类型安全保障
- ⚡ **边缘计算** - 利用 Cloudflare 全球边缘网络
- 🛡️ **错误处理** - 完善的错误处理和响应
- 📊 **使用统计** - 返回 token 使用情况

## 🛠️ 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn
- Cloudflare 账号

### 安装

```bash
# 克隆项目
git clone https://github.com/ztangt/cloudflare-openai-worker.git
cd cloudflare-openai-worker

# 安装依赖
npm install

# 安装 Wrangler CLI (如果还未安装)
npm install -g wrangler
```

### 本地开发

```bash
# 启动本地开发服务器
npm run dev
```

访问 `http://localhost:8787` 查看 API 文档

### 部署到 Cloudflare

```bash
# 登录 Cloudflare (首次使用)
wrangler login

# 部署到 Cloudflare Workers
npm run deploy
```

## 📖 API 使用说明

### 基础信息

**Base URL**: `https://your-worker.your-subdomain.workers.dev`

### 端点

#### GET /
获取 API 使用说明和文档

```bash
curl https://your-worker.your-subdomain.workers.dev/
```

#### POST /chat
发送消息到 OpenAI 并获取回复

**请求体**:
```json
{
  "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "message": "你好，请介绍一下自己",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**参数说明**:
- `apiKey` (必需): OpenAI API Key
- `message` (必需): 要发送的消息
- `model` (可选): OpenAI 模型，默认 `gpt-3.5-turbo`
- `temperature` (可选): 温度参数，默认 `0.7`
- `max_tokens` (可选): 最大 token 数，默认 `1000`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "message": "你好！我是ChatGPT，一个由OpenAI开发的人工智能助手...",
    "model": "gpt-3.5-turbo-0613",
    "usage": {
      "prompt_tokens": 15,
      "completion_tokens": 87,
      "total_tokens": 102
    },
    "id": "chatcmpl-xxxxxxxxxxxxxxxxxxxxxx"
  },
  "timestamp": "2023-12-01T12:00:00.000Z"
}
```

## 🧪 测试示例

### 使用 curl

```bash
# 基础聊天请求
curl -X POST https://your-worker.your-subdomain.workers.dev/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "message": "什么是机器学习？"
  }'

# 自定义参数
curl -X POST https://your-worker.your-subdomain.workers.dev/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", 
    "message": "写一首关于春天的诗",
    "model": "gpt-4",
    "temperature": 0.9,
    "max_tokens": 500
  }'
```

### 使用 JavaScript

```javascript
async function chatWithOpenAI(apiKey, message) {
  const response = await fetch('https://your-worker.your-subdomain.workers.dev/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: apiKey,
      message: message,
      model: 'gpt-3.5-turbo',
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('AI回复:', data.data.message);
    console.log('使用统计:', data.data.usage);
  } else {
    console.error('错误:', data.message);
  }
}

// 使用示例
chatWithOpenAI('your-openai-api-key', '解释一下什么是区块链？');
```

### 使用 Python

```python
import requests
import json

def chat_with_openai(api_key, message):
    url = 'https://your-worker.your-subdomain.workers.dev/chat'
    
    payload = {
        'apiKey': api_key,
        'message': message,
        'model': 'gpt-3.5-turbo',
        'temperature': 0.7
    }
    
    response = requests.post(url, json=payload)
    data = response.json()
    
    if data.get('success'):
        print('AI回复:', data['data']['message'])
        print('使用统计:', data['data']['usage'])
    else:
        print('错误:', data.get('message'))

# 使用示例
chat_with_openai('your-openai-api-key', '什么是人工智能？')
```

## 📁 项目结构

```
cloudflare-openai-worker/
├── src/
│   └── index.ts          # 主要的 Worker 代码
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
├── wrangler.toml         # Wrangler 配置
└── README.md            # 项目文档
```

## 🔧 自定义配置

### 环境变量

在 `wrangler.toml` 中可以配置环境变量：

```toml
[vars]
OPENAI_BASE_URL = "https://api.openai.com"

[env.production]
vars = { ENVIRONMENT = "production" }
```

### 安全设置

如果需要更高的安全性，可以：

1. 使用 Cloudflare Workers 的 Secrets 存储敏感信息
2. 添加请求频率限制
3. 添加 IP 白名单

## ⚠️ 注意事项

- **API Key 安全**: 不要在客户端暴露 OpenAI API Key
- **费用控制**: OpenAI API 按使用量收费，请注意控制使用
- **速率限制**: 遵守 OpenAI 的 API 速率限制
- **数据隐私**: 不要发送敏感或隐私信息

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！