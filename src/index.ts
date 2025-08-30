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

// CORS 头部设置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 处理 CORS 预检请求
function handleOptions(request: Request): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
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

// 主处理函数
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  // 处理根路径 - 返回使用说明
  if (url.pathname === '/' && request.method === 'GET') {
    return new Response(
      JSON.stringify({
        name: 'Cloudflare OpenAI Worker',
        version: '1.0.0',
        description: '一个用于代理 OpenAI API 的 Cloudflare Worker',
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
      }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...corsHeaders,
        },
      }
    );
  }

  // 处理聊天请求
  if (url.pathname === '/chat' && request.method === 'POST') {
    try {
      // 解析请求体
      const body = await request.json() as ChatRequest;
      const { apiKey, message, model, temperature, max_tokens } = body;

      // 验证必需参数
      if (!apiKey || !message) {
        return new Response(
          JSON.stringify({
            error: '缺少必需参数',
            message: 'apiKey 和 message 参数是必需的',
            code: 'MISSING_PARAMETERS'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      // 验证 API Key 格式
      if (!validateApiKey(apiKey)) {
        return new Response(
          JSON.stringify({
            error: 'API Key 格式无效',
            message: 'API Key 必须以 sk- 开头且长度足够',
            code: 'INVALID_API_KEY'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
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
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: openaiResponse.choices[0]?.message?.content || '未收到有效回复',
            model: openaiResponse.model,
            usage: openaiResponse.usage,
            id: openaiResponse.id
          },
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );

    } catch (error) {
      console.error('处理请求时发生错误:', error);
      
      return new Response(
        JSON.stringify({
          error: '处理请求失败',
          message: error instanceof Error ? error.message : '未知错误',
          code: 'REQUEST_FAILED'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  }

  // 处理不支持的路径
  return new Response(
    JSON.stringify({
      error: '路径未找到',
      message: `不支持的路径: ${url.pathname}`,
      code: 'NOT_FOUND'
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

// 导出 fetch 事件处理器
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // 处理实际请求
    return handleRequest(request);
  },
};