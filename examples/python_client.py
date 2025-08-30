#!/usr/bin/env python3
"""
Cloudflare OpenAI Worker Python 客户端示例
这个脚本展示了如何使用 Python 调用 Cloudflare OpenAI Worker
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class CloudflareOpenAIClient:
    """Cloudflare OpenAI Worker 客户端"""
    
    def __init__(self, worker_url: str, api_key: str):
        """
        初始化客户端
        
        Args:
            worker_url: Worker 的 URL
            api_key: OpenAI API Key
        """
        self.worker_url = worker_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'CloudflareOpenAIClient/1.0'
        })
    
    def chat(self, 
             message: str, 
             model: str = 'gpt-3.5-turbo',
             temperature: float = 0.7,
             max_tokens: int = 1000) -> Dict[str, Any]:
        """
        发送聊天消息
        
        Args:
            message: 要发送的消息
            model: OpenAI 模型
            temperature: 温度参数
            max_tokens: 最大 token 数
            
        Returns:
            API 响应数据
        """
        payload = {
            'apiKey': self.api_key,
            'message': message,
            'model': model,
            'temperature': temperature,
            'max_tokens': max_tokens
        }
        
        try:
            response = self.session.post(
                f'{self.worker_url}/chat',
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'请求失败: {str(e)}',
                'code': 'REQUEST_FAILED'
            }
        except json.JSONDecodeError as e:
            return {
                'success': False,
                'error': f'JSON 解析失败: {str(e)}',
                'code': 'JSON_DECODE_ERROR'
            }
    
    def get_api_info(self) -> Dict[str, Any]:
        """
        获取 API 信息
        
        Returns:
            API 信息
        """
        try:
            response = self.session.get(self.worker_url, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {
                'error': f'获取 API 信息失败: {str(e)}'
            }

def demo_basic_chat(client: CloudflareOpenAIClient):
    """基础聊天示例"""
    print("🤖 基础聊天示例")
    print("-" * 40)
    
    response = client.chat("你好，请简单介绍一下你自己。")
    
    if response.get('success'):
        print(f"AI: {response['data']['message']}")
        print(f"模型: {response['data']['model']}")
        print(f"Token 使用: {response['data']['usage']['total_tokens']}")
    else:
        print(f"错误: {response.get('error', '未知错误')}")
    
    print()

def demo_creative_writing(client: CloudflareOpenAIClient):
    """创意写作示例"""
    print("✍️ 创意写作示例")
    print("-" * 40)
    
    response = client.chat(
        "写一首关于人工智能的短诗",
        temperature=0.9,
        max_tokens=200
    )
    
    if response.get('success'):
        print(f"AI: {response['data']['message']}")
        print(f"Token 使用: {response['data']['usage']['total_tokens']}")
    else:
        print(f"错误: {response.get('error', '未知错误')}")
    
    print()

def demo_technical_qa(client: CloudflareOpenAIClient):
    """技术问答示例"""
    print("💻 技术问答示例")
    print("-" * 40)
    
    questions = [
        "什么是 REST API？",
        "解释一下什么是云计算？",
        "Python 和 JavaScript 有什么区别？"
    ]
    
    for i, question in enumerate(questions, 1):
        print(f"问题 {i}: {question}")
        
        response = client.chat(
            question,
            temperature=0.3,  # 较低的温度获得更准确的技术回答
            max_tokens=300
        )
        
        if response.get('success'):
            print(f"回答: {response['data']['message'][:200]}...")
            print(f"Token 使用: {response['data']['usage']['total_tokens']}")
        else:
            print(f"错误: {response.get('error', '未知错误')}")
        
        print()
        time.sleep(1)  # 避免过于频繁的请求

def demo_conversation_context(client: CloudflareOpenAIClient):
    """对话上下文示例（模拟多轮对话）"""
    print("💬 多轮对话示例")
    print("-" * 40)
    
    # 注意：当前的 Worker 不维护对话历史，每次都是独立的请求
    # 这里演示如何在客户端维护对话上下文
    
    conversation_history = []
    
    messages = [
        "我想学习机器学习，有什么建议？",
        "我数学基础一般，这会是问题吗？",
        "推荐一些适合初学者的资源吧。"
    ]
    
    for message in messages:
        # 构建包含历史对话的消息
        conversation_history.append(f"用户: {message}")
        
        # 将对话历史作为上下文发送
        context_message = "\\n".join(conversation_history[-6:])  # 保留最近6轮对话
        
        print(f"用户: {message}")
        
        response = client.chat(
            f"基于以下对话历史回答最新问题：\\n{context_message}\\n\\n请回答最后一个问题：",
            temperature=0.7,
            max_tokens=400
        )
        
        if response.get('success'):
            ai_response = response['data']['message']
            print(f"AI: {ai_response}")
            
            # 添加AI回复到历史中
            conversation_history.append(f"AI: {ai_response}")
            
            print(f"Token 使用: {response['data']['usage']['total_tokens']}")
        else:
            print(f"错误: {response.get('error', '未知错误')}")
        
        print("-" * 20)
        time.sleep(1)

def main():
    """主函数"""
    # 配置 - 请替换为你的真实值
    WORKER_URL = 'https://your-worker.your-subdomain.workers.dev'
    OPENAI_API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    
    # 检查配置
    if 'your-worker' in WORKER_URL or OPENAI_API_KEY.startswith('sk-xxx'):
        print("⚠️  请先更新 WORKER_URL 和 OPENAI_API_KEY 配置")
        return
    
    # 创建客户端
    client = CloudflareOpenAIClient(WORKER_URL, OPENAI_API_KEY)
    
    print("🚀 Cloudflare OpenAI Worker Python 示例")
    print("=" * 50)
    
    # 获取 API 信息
    api_info = client.get_api_info()
    if 'error' not in api_info:
        print(f"Worker 名称: {api_info.get('name', 'N/A')}")
        print(f"版本: {api_info.get('version', 'N/A')}")
        print(f"描述: {api_info.get('description', 'N/A')}")
        print()
    
    try:
        # 运行示例
        demo_basic_chat(client)
        demo_creative_writing(client)
        demo_technical_qa(client)
        demo_conversation_context(client)
        
    except KeyboardInterrupt:
        print("\\n👋 示例已中断")
    except Exception as e:
        print(f"❌ 运行示例时发生错误: {e}")
    
    print("=" * 50)
    print("🏁 示例运行完成")

if __name__ == '__main__':
    main()