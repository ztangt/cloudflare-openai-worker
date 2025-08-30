/**
 * 测试 Cloudflare OpenAI Worker 的示例代码
 * 这个文件展示了如何使用不同的方式调用 Worker API
 */

// 配置
const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev';
const OPENAI_API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // 请替换为你的真实 API Key

/**
 * 1. 基础聊天测试
 */
async function basicChatTest() {
  console.log('🧪 测试基础聊天功能...');
  
  try {
    const response = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: OPENAI_API_KEY,
        message: '你好，请简单介绍一下你自己。',
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 基础聊天测试成功');
      console.log('AI 回复:', data.data.message);
      console.log('使用统计:', data.data.usage);
      console.log('模型:', data.data.model);
    } else {
      console.error('❌ 基础聊天测试失败:', data.message);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

/**
 * 2. 自定义参数测试
 */
async function customParametersTest() {
  console.log('\\n🧪 测试自定义参数功能...');
  
  try {
    const response = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: OPENAI_API_KEY,
        message: '写一首关于科技的短诗',
        model: 'gpt-3.5-turbo',
        temperature: 0.9,
        max_tokens: 200,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 自定义参数测试成功');
      console.log('AI 回复:', data.data.message);
      console.log('使用统计:', data.data.usage);
    } else {
      console.error('❌ 自定义参数测试失败:', data.message);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

/**
 * 3. 错误处理测试
 */
async function errorHandlingTest() {
  console.log('\\n🧪 测试错误处理功能...');
  
  // 测试无效 API Key
  try {
    const response = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: 'invalid-api-key',
        message: '这应该会失败',
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.log('✅ 错误处理测试成功 - 正确检测到无效 API Key');
      console.log('错误信息:', data.message);
    } else {
      console.error('❌ 错误处理测试失败 - 应该检测到无效 API Key');
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
  
  // 测试缺少参数
  try {
    const response = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: OPENAI_API_KEY,
        // message 参数缺失
      }),
    });
    
    const data = await response.json();
    
    if (!data.success && data.code === 'MISSING_PARAMETERS') {
      console.log('✅ 参数验证测试成功 - 正确检测到缺失参数');
      console.log('错误信息:', data.message);
    } else {
      console.error('❌ 参数验证测试失败 - 应该检测到缺失参数');
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

/**
 * 4. API 文档测试
 */
async function apiDocumentationTest() {
  console.log('\\n🧪 测试 API 文档功能...');
  
  try {
    const response = await fetch(WORKER_URL);
    const data = await response.json();
    
    if (data.name && data.endpoints) {
      console.log('✅ API 文档测试成功');
      console.log('Worker 名称:', data.name);
      console.log('版本:', data.version);
      console.log('可用端点:', Object.keys(data.endpoints));
    } else {
      console.error('❌ API 文档测试失败');
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

/**
 * 5. 多轮对话测试
 */
async function multiTurnConversationTest() {
  console.log('\\n🧪 测试多轮对话功能...');
  
  const conversations = [
    '我想学习编程，你有什么建议？',
    '我应该先学哪种编程语言？',
    'Python 适合初学者吗？'
  ];
  
  for (let i = 0; i < conversations.length; i++) {
    try {
      console.log(`\\n第 ${i + 1} 轮对话:`);
      console.log('用户:', conversations[i]);
      
      const response = await fetch(`${WORKER_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: OPENAI_API_KEY,
          message: conversations[i],
          temperature: 0.7,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('AI:', data.data.message.substring(0, 100) + '...');
        console.log('Tokens 使用:', data.data.usage.total_tokens);
      } else {
        console.error('❌ 对话失败:', data.message);
      }
      
      // 添加延迟避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('❌ 请求失败:', error);
    }
  }
}

/**
 * 6. 性能测试
 */
async function performanceTest() {
  console.log('\\n🧪 测试性能...');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: OPENAI_API_KEY,
        message: '请用一句话回答：什么是人工智能？',
        max_tokens: 50,
      }),
    });
    
    const endTime = Date.now();
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 性能测试成功');
      console.log('响应时间:', endTime - startTime, 'ms');
      console.log('AI 回复:', data.data.message);
    } else {
      console.error('❌ 性能测试失败:', data.message);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始运行 Cloudflare OpenAI Worker 测试套件');
  console.log('='.repeat(50));
  
  // 检查配置
  if (WORKER_URL.includes('your-worker') || OPENAI_API_KEY.startsWith('sk-xxx')) {
    console.warn('⚠️  请先更新 WORKER_URL 和 OPENAI_API_KEY 配置');
    return;
  }
  
  try {
    await apiDocumentationTest();
    await basicChatTest();
    await customParametersTest();
    await errorHandlingTest();
    await performanceTest();
    await multiTurnConversationTest();
  } catch (error) {
    console.error('测试套件执行失败:', error);
  }
  
  console.log('\\n' + '='.repeat(50));
  console.log('🏁 测试套件执行完成');
}

// 如果在 Node.js 环境中运行
if (typeof require !== 'undefined' && require.main === module) {
  // 需要安装 node-fetch: npm install node-fetch
  const fetch = require('node-fetch');
  runAllTests();
}

// 如果在浏览器中运行
if (typeof window !== 'undefined') {
  window.runAllTests = runAllTests;
  window.basicChatTest = basicChatTest;
  window.customParametersTest = customParametersTest;
  window.errorHandlingTest = errorHandlingTest;
  window.apiDocumentationTest = apiDocumentationTest;
  window.performanceTest = performanceTest;
  window.multiTurnConversationTest = multiTurnConversationTest;
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    basicChatTest,
    customParametersTest,
    errorHandlingTest,
    apiDocumentationTest,
    performanceTest,
    multiTurnConversationTest,
  };
}