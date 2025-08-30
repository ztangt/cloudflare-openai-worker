/**
 * Cloudflare Workers - OpenAI API 代理
 * 这个 Worker 接收 OpenAI API Key 和用户问题，调用 OpenAI API 并返回答案
 */

// OpenAI API 响应类型定义
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 请求参数类型定义
interface ChatRequest {
  apiKey: string;
  message: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// 🔧 增强的 CORS 头部设置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false',
  'Vary': 'Origin',
};

// 处理 CORS 预检请求
function handleOptions(request: Request): Response {
  // 获取请求的 Origin
  const origin = request.headers.get('Origin');
  const requestHeaders = request.headers.get('Access-Control-Request-Headers');
  
  // 构建响应头
  const responseHeaders = {
    ...corsHeaders,
  };
  
  // 如果有特定的请求头，添加到允许列表
  if (requestHeaders) {
    responseHeaders['Access-Control-Allow-Headers'] = requestHeaders;
  }
  
  return new Response(null, {
    status: 204, // 使用 204 No Content 而不是 200
    headers: responseHeaders,
  });
}

// 验证 API Key 格式
function validateApiKey(apiKey: string): boolean {
  return apiKey && apiKey.startsWith('sk-') && apiKey.length > 20;
}

// 调用 OpenAI API
async function callOpenAI(request: ChatRequest): Promise<OpenAIResponse> {
  const { apiKey, message, model = 'gpt-3.5-turbo', temperature = 0.7, max_tokens = 1000 } = request;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API 请求失败: ${response.status} - ${error}`);
  }

  return await response.json() as OpenAIResponse;
}

// 🔧 创建带 CORS 的响应
function createCorsResponse(data: any, status: number = 200, additionalHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

// 主处理函数
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  // 🛡️ 添加调试日志
  console.log(`${request.method} ${url.pathname} - Origin: ${request.headers.get('Origin')}`);
  
  // 处理根路径 - 返回使用说明
  if (url.pathname === '/' && request.method === 'GET') {
    return createCorsResponse({
      name: 'Cloudflare OpenAI Worker',
      version: '1.0.0',
      description: '一个用于代理 OpenAI API 的 Cloudflare Worker',
      cors: {
        status: 'enabled',
        origin: '*',
        methods: corsHeaders['Access-Control-Allow-Methods'],
        headers: corsHeaders['Access-Control-Allow-Headers'],
      },
      endpoints: {
        'POST /chat': {
          description: '发送消息到 OpenAI 并获取回复',
          parameters: {
            apiKey: 'OpenAI API Key (必需)',
            message: '要发送的消息 (必需)',
            model: 'OpenAI 模型 (可选，默认: gpt-3.5-turbo)',
            temperature: '温度参数 (可选，默认: 0.7)',
            max_tokens: '最大令牌数 (可选，默认: 1000)'
          },
          example: {
            apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            message: '你好，请介绍一下自己',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            max_tokens: 1000
          }
        },
        'GET /': '查看此使用说明'
      }
    });
  }

  // 处理聊天请求
  if (url.pathname === '/chat' && request.method === 'POST') {
    try {
      // 解析请求体
      const body = await request.json() as ChatRequest;
      const { apiKey, message, model, temperature, max_tokens } = body;

      // 验证必需参数
      if (!apiKey || !message) {
        return createCorsResponse({
          error: '缺少必需参数',
          message: 'apiKey 和 message 参数是必需的',
          code: 'MISSING_PARAMETERS'
        }, 400);
      }

      // 验证 API Key 格式
      if (!validateApiKey(apiKey)) {
        return createCorsResponse({
          error: 'API Key 格式无效',
          message: 'API Key 必须以 sk- 开头且长度足够',
          code: 'INVALID_API_KEY'
        }, 400);
      }

      // 调用 OpenAI API
      console.log(`收到聊天请求: ${message.substring(0, 100)}...`);
      const openaiResponse = await callOpenAI({
        apiKey,
        message,
        model,
        temperature,
        max_tokens
      });

      // 返回成功响应
      return createCorsResponse({
        success: true,
        data: {
          message: openaiResponse.choices[0]?.message?.content || '未收到有效回复',
          model: openaiResponse.model,
          usage: openaiResponse.usage,
          id: openaiResponse.id
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('处理请求时发生错误:', error);
      
      return createCorsResponse({
        error: '处理请求失败',
        message: error instanceof Error ? error.message : '未知错误',
        code: 'REQUEST_FAILED'
      }, 500);
    }
  }

  // 处理不支持的路径
  return createCorsResponse({
    error: '路径未找到',
    message: `不支持的路径: ${url.pathname}`,
    code: 'NOT_FOUND'
  }, 404);
}

// 导出 fetch 事件处理器
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // 🔧 始终处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // 处理实际请求
    try {
      return await handleRequest(request);
    } catch (error) {
      console.error('Worker 执行错误:', error);
      return createCorsResponse({
        error: 'Worker 执行失败',
        message: error instanceof Error ? error.message : '未知错误',
        code: 'WORKER_ERROR'
      }, 500);
    }
  },
};