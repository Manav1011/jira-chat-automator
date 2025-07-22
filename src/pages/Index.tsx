import React, { useState, useRef, useEffect } from 'react';
import { Send, History, MessageCircle, Bot, User, Sparkles, Zap, Menu, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import LoginButton, { logout } from "@/components/LoginButton";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      id: '1',
      title: '🚀 Ticket Creation Automation',
      lastMessage: 'Create a new ticket for bug reporting',
      timestamp: new Date(Date.now() - 3600000),
      messages: []
    },
    {
      id: '2',
      title: '📋 Sprint Management',
      lastMessage: 'Help me manage sprint planning',
      timestamp: new Date(Date.now() - 7200000),
      messages: []
    },
    {
      id: '3',
      title: '📝 User Story Templates',
      lastMessage: 'Generate user story templates',
      timestamp: new Date(Date.now() - 10800000),
      messages: []
    }
  ]);
  const [currentChatId, setCurrentChatId] = useState('current');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const streamingMessageIdRef = useRef<string | null>(null);
  const [currentToolCall, setCurrentToolCall] = useState<{tool: string, args: any} | null>(null);
  const [lastTokenUsage, setLastTokenUsage] = useState<{token_usage: any, cost: number} | null>(null);
  const [cumulativeCost, setCumulativeCost] = useState<number>(0);
  const [cumulativeTokens, setCumulativeTokens] = useState({
    input_tokens: 0,
    output_tokens: 0,
    thinking_tokens: 0,
    total_tokens: 0
  });

  useEffect(() => {
    // Check for access_token and cloud_id in URL (after redirect)
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    console.log(accessToken)
    const cloudId = params.get('cloud_id');
    if (accessToken) {
      document.cookie = `access_token=${accessToken}; domain=.mnv-dev.site; path=/; max-age=${60 * 60 * 2}; SameSite=None; Secure`;
      if (cloudId) {
        document.cookie = `cloud_id=${cloudId}; domain=.mnv-dev.site; path=/; max-age=${60 * 60 * 2}; SameSite=None; Secure`;
      }


      window.history.replaceState({}, document.title, '/');
      setIsAuthenticated(true);
      return;
    }
    // Check for access_token cookie
    const match = document.cookie.match(/(^|;)\s*access_token=([^;]+)/);
    setIsAuthenticated(!!match);
  }, []);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;
    function connectWebSocket() {
      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      
      console.log('Connecting to WebSocket...');
      ws.current = new WebSocket('wss://jira-automation.mnv-dev.site/ws/chat');
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsWsConnected(true);
      };
      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsWsConnected(false);
        setIsTyping(false);
        streamingMessageIdRef.current = null;
        // Try to reconnect after 2 seconds
        reconnectTimeout = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      };
      ws.current.onerror = () => {
        console.log('WebSocket error');
        setIsWsConnected(false);
        setIsTyping(false);
        streamingMessageIdRef.current = null;
        // Try to reconnect after 2 seconds
        reconnectTimeout = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      };
      ws.current.onmessage = async (event) => {
        console.log('Received message:', event.data);
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && typeof parsed === 'object' && ('tool' in parsed && 'args' in parsed) || ('token_usage' in parsed && 'cost' in parsed)) {
            return;
          }
        } catch (e) {
          // Not JSON, continue normal flow
        }
        if (event.data === "__END_STREAM__") {
          console.log('Stream ended');
          setIsTyping(false);
          streamingMessageIdRef.current = null;
          return;
        }
        if (event.data === "__TOOL_CALL_START__") {
          // Next message will be the tool details
          const nextMessage = await new Promise<string>((resolve) => {
            const handler = (e: MessageEvent) => {
              ws.current?.removeEventListener('message', handler);
              resolve(e.data);
            };
            ws.current?.addEventListener('message', handler);
          });
          try {
            const toolData = JSON.parse(nextMessage);
            setCurrentToolCall(toolData);
            
            // Add tool call message to chat history
            const toolCallMessage: Message = {
              id: `tool-${Date.now()}`,
              content: `🔧 **Tool Executed:** ${toolData.tool.replace('mcp_atlassian-uv_jira_', '').replace(/_/g, ' ')}\n\n**Parameters:**\n\`\`\`json\n${JSON.stringify(toolData.args, null, 2)}\n\`\`\``,
              isUser: false,
              timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, toolCallMessage]);
          } catch (e) {
            console.error('Failed to parse tool data:', e);
          }
          return;
        }
        if (event.data === "__TOOL_CALL_END__") {
          setCurrentToolCall(null);
          return;
        }
        if (event.data === "__TOKEN_USAGE__") {
          // Next message will be the token usage data
          const nextMessage = await new Promise<string>((resolve) => {
            const handler = (e: MessageEvent) => {
              ws.current?.removeEventListener('message', handler);
              resolve(e.data);
            };
            ws.current?.addEventListener('message', handler);
          });
          try {
            const tokenData = JSON.parse(nextMessage);
            setLastTokenUsage(tokenData);
            // Add current cost to cumulative cost
            setCumulativeCost(prev => prev + tokenData.cost);
            // Add current tokens to cumulative tokens
            setCumulativeTokens(prev => ({
              input_tokens: prev.input_tokens + tokenData.token_usage.input_tokens,
              output_tokens: prev.output_tokens + tokenData.token_usage.output_tokens,
              thinking_tokens: prev.thinking_tokens + tokenData.token_usage.thinking_tokens,
              total_tokens: prev.total_tokens + tokenData.token_usage.input_tokens + tokenData.token_usage.output_tokens + tokenData.token_usage.thinking_tokens
            }));
          } catch (e) {
            console.error('Failed to parse token usage data:', e);
          }
          return;
        }
        // Ignore TOOL_RESULT marker
        if (event.data === "__TOOL_RESULT__") {
          return;
        }
        setMessages(prev => {
          // If we're already streaming (have a streamingMessageId), append to that message
          if (streamingMessageIdRef.current) {
            console.log('Appending to existing message:', streamingMessageIdRef.current);
            return prev.map(msg => 
              msg.id === streamingMessageIdRef.current 
                ? { ...msg, content: msg.content + event.data }
                : msg
            );
          } 
          // Start a new bot message
          const newMessageId = Date.now().toString();
          console.log('Starting new message:', newMessageId);
          streamingMessageIdRef.current = newMessageId;
          setIsTyping(true);
          return [
            ...prev,
            {
              id: newMessageId,
              content: event.data,
              isUser: false,
              timestamp: new Date(),
            }
          ];
        });
      };
    }
    if (isAuthenticated && !ws.current) {
      connectWebSocket();
    }
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [isAuthenticated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !ws.current || ws.current.readyState !== 1) return;

    // Reset streaming state and last token usage before sending new message
    // Keep cumulative cost intact
    streamingMessageIdRef.current = null;
    setIsTyping(false);
    setLastTokenUsage(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue('');
    console.log('Sending message:', messageToSend);
    ws.current.send(messageToSend);
  };

  const getBotResponse = (userInput: string): string => {
    const responses = [
      '🎯 I can help you create Jira tickets automatically. What type of issue would you like to create?',
      '⚡ Let me assist you with that Jira automation. I can help with ticket creation, assignment, and workflow management.',
      '🚀 Great! I can set up automated workflows for your Jira project. What specific automation are you looking for?',
      '💡 I understand you need help with Jira. I can create tickets, update statuses, assign users, and much more.',
      '✨ That\'s a fantastic question about Jira automation. Let me help you streamline your project management workflow.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: '1',
        content: '✨ Hey there! I\'m your AI-powered Jira automation assistant. Ready to streamline your workflow? What can I help you automate today?',
        isUser: false,
        timestamp: new Date(),
      }
    ]);
    setCurrentChatId('new-' + Date.now());
    setSidebarOpen(false);
    // Reset cumulative cost and tokens for new chat
    setCumulativeCost(0);
    setCumulativeTokens({
      input_tokens: 0,
      output_tokens: 0,
      thinking_tokens: 0,
      total_tokens: 0
    });
    setLastTokenUsage(null);
  };

  const loadChatHistory = (chat: ChatHistory) => {
    setMessages(chat.messages.length > 0 ? chat.messages : [
      {
        id: '1',
        content: chat.lastMessage,
        isUser: true,
        timestamp: chat.timestamp,
      },
      {
        id: '2',
        content: '🎯 I can help you with that. Let me know what specific automation you need.',
        isUser: false,
        timestamp: new Date(chat.timestamp.getTime() + 60000),
      }
    ]);
    setCurrentChatId(chat.id);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {/* <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:relative z-50 lg:z-auto transition-transform duration-300 ease-in-out w-full sm:w-80 lg:w-80 xl:w-96 h-full bg-white/90 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl`}>
        <div className="lg:hidden absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="p-2 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 lg:p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-purple-600">
          <Button
            onClick={startNewChat}
            className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105 text-sm lg:text-base"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-3 lg:p-4">
          <div className="space-y-3">
            <h3 className="text-xs lg:text-sm font-semibold text-gray-600 mb-4 lg:mb-6 flex items-center">
              <History className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
              Recent Conversations
            </h3>
            {chatHistory.map((chat) => (
              <Card
                key={chat.id}
                className={`p-3 lg:p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                  currentChatId === chat.id ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-md' : 'border-gray-100'
                }`}
                onClick={() => loadChatHistory(chat)}
              >
                <h4 className="font-semibold text-xs lg:text-sm text-gray-900 truncate">{chat.title}</h4>
                <p className="text-xs text-gray-500 mt-1 lg:mt-2 truncate">{chat.lastMessage}</p>
                <p className="text-xs text-gray-400 mt-1 lg:mt-2">
                  {chat.timestamp.toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div> */}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 lg:p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="mr-2 lg:mr-4 hover:bg-gray-100/50 hover:scale-105 transition-all duration-200 p-2 h-8 w-8"
            >
              <Menu className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
            <div className="flex items-center min-w-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3 lg:mr-4 shadow-lg flex-shrink-0">
                <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent truncate">
                  Jira Assistant
                </h1>
                <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">AI-powered automation</p>
              </div>
            </div>
          </div>
          {/* Add logout button in header */}
          <div className="flex items-center text-xs lg:text-sm text-gray-500 flex-shrink-0">
            {/* <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="hidden sm:inline">Online</span> */}
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="ml-4 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
{messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex max-w-[90%] sm:max-w-[85%] lg:max-w-[70%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.isUser ? 'ml-2 lg:ml-3' : 'mr-2 lg:mr-3'}`}>
                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shadow-lg ${
                      message.isUser 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                    }`}>
                      {message.isUser ? (
                        <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      )}
                    </div>
                  </div>
                  <div className={`rounded-2xl px-3 py-2 lg:px-5 lg:py-3 shadow-lg ${
                    message.isUser
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-white border border-gray-200/50 text-gray-900 backdrop-blur-sm'
                  }`}>
                    <div className="text-sm leading-relaxed break-words markdown-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => {
                            console.log('Table component rendered:', props);
                            return (
                              <div className="my-3 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
                                <table className="w-full border-collapse text-xs" {...props} />
                              </div>
                            );
                          },
                          th: ({node, ...props}) => {
                            console.log('TH component rendered:', props);
                            return (
                              <th className="border-b border-gray-300 bg-gray-50 px-3 py-2 text-left font-medium text-gray-900" {...props} />
                            );
                          },
                          td: ({node, ...props}) => {
                            console.log('TD component rendered:', props);
                            return (
                              <td className="border-b border-gray-200 px-3 py-2 text-gray-700 last:border-b-0" {...props} />
                            );
                          },
                          tr: ({node, ...props}) => (
                            <tr className="hover:bg-gray-50" {...props} />
                          ),
                          p: ({node, ...props}) => (
                            <p className="mb-2 last:mb-0" {...props} />
                          ),
                          code: ({node, className, ...props}: any) => {
                            const isInline = !className || !className.includes('language-');
                            return isInline ? (
                              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-800" {...props} />
                            ) : (
                              <pre className="rounded bg-gray-100 p-2 text-xs font-mono text-gray-800 overflow-x-auto">
                                <code {...props} />
                              </pre>
                            );
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <p className={`text-xs mt-1 lg:mt-2 ${
                      message.isUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Tool Call Indicator */}
            {currentToolCall && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex max-w-[90%] sm:max-w-[85%] lg:max-w-[70%]">
                  <div className="flex-shrink-0 mr-2 lg:mr-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 text-white animate-spin" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-3 py-2 lg:px-5 lg:py-3 shadow-lg backdrop-blur-sm">
                    <div className="text-sm leading-relaxed">
                      <p className="font-medium text-amber-800">
                        🔧 Executing: {currentToolCall.tool.replace('mcp_atlassian-uv_jira_', '').replace(/_/g, ' ')}
                      </p>
                      {currentToolCall.args && Object.keys(currentToolCall.args).length > 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          Processing your request...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Token Usage Display */}
            {lastTokenUsage && (
              <div className="flex justify-center animate-fade-in">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                  <div className="space-y-2">
                    {/* Current Message Stats */}
                    <div className="text-xs text-gray-600 flex items-center flex-wrap gap-2 sm:gap-4">
                      <span className="text-gray-700 font-semibold">This Message:</span>
                      <span className="flex items-center">
                        � <strong className="ml-1">In:</strong>
                        <span className="ml-1 text-blue-600">{lastTokenUsage.token_usage.input_tokens}</span>
                      </span>
                      <span className="flex items-center">
                        � <strong className="ml-1">Out:</strong>
                        <span className="ml-1 text-purple-600">{lastTokenUsage.token_usage.output_tokens}</span>
                      </span>
                      <span className="flex items-center">
                        🧠 <strong className="ml-1">Think:</strong>
                        <span className="ml-1 text-amber-600">{lastTokenUsage.token_usage.thinking_tokens}</span>
                      </span>
                      <span className="flex items-center">
                        💰 <strong className="ml-1">Cost:</strong>
                        <span className="ml-1 text-green-600">${lastTokenUsage.cost.toFixed(4)}</span>
                      </span>
                    </div>
                    
                    {/* Cumulative Stats */}
                    <div className="text-xs text-gray-600 flex items-center flex-wrap gap-2 sm:gap-4 pt-1 border-t border-gray-300">
                      <span className="text-gray-700 font-semibold">Session Total:</span>
                      <span className="flex items-center">
                        📥 <strong className="ml-1">In:</strong>
                        <span className="ml-1 text-blue-700 font-medium">{cumulativeTokens.input_tokens}</span>
                      </span>
                      <span className="flex items-center">
                        📤 <strong className="ml-1">Out:</strong>
                        <span className="ml-1 text-purple-700 font-medium">{cumulativeTokens.output_tokens}</span>
                      </span>
                      <span className="flex items-center">
                        🧠 <strong className="ml-1">Think:</strong>
                        <span className="ml-1 text-amber-700 font-medium">{cumulativeTokens.thinking_tokens}</span>
                      </span>
                      <span className="flex items-center">
                        � <strong className="ml-1">Total:</strong>
                        <span className="ml-1 text-gray-700 font-medium">{cumulativeTokens.total_tokens}</span>
                      </span>
                      <span className="flex items-center">
                        💰 <strong className="ml-1">Cost:</strong>
                        <span className="ml-1 text-red-600 font-medium">${cumulativeCost.toFixed(4)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex max-w-[90%] sm:max-w-[85%] lg:max-w-[70%]">
                  <div className="flex-shrink-0 mr-2 lg:mr-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Bot className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200/50 rounded-2xl px-3 py-2 lg:px-5 lg:py-3 shadow-lg backdrop-blur-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-3 lg:p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about Jira automation..."
                  className="pr-12 lg:pr-14 py-3 lg:py-4 text-sm border-gray-300/50 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm bg-white/70 backdrop-blur-sm placeholder:text-gray-400"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 rounded-lg shadow-md hover:scale-105 transition-all duration-200 p-2 h-8 w-8"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 lg:mt-3 text-center flex items-center justify-center">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by AI • Press Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
