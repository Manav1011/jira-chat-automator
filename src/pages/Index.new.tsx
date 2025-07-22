import { useState, useRef, useEffect } from 'react';
import { Loader2, Menu, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import LoginButton from '../components/LoginButton';

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
  // States
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    content: '✨ Hey there! I\'m your AI-powered Jira automation assistant. Ready to streamline your workflow? What can I help you automate today?',
    isUser: false,
    timestamp: new Date(),
  }]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentToolCall, setCurrentToolCall] = useState<{tool: string, args: any} | null>(null);
  const [currentChatId, setCurrentChatId] = useState('current');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isToolCallJson = (text: string): boolean => {
    try {
      const data = JSON.parse(text);
      return data && typeof data === 'object' && 'tool' in data && 'args' in data;
    } catch {
      return false;
    }
  };

  const handleWebSocketMessage = async (event: MessageEvent) => {
    if (event.data === "__TOOL_CALL_START__") {
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
      } catch (e) {
        console.error('Failed to parse tool data:', e);
      }
      return;
    }

    if (event.data === "__TOOL_CALL_END__") {
      setCurrentToolCall(null);
      return;
    }

    if (event.data === "__TOOL_RESULT__" || event.data === "__END_STREAM__") {
      if (event.data === "__END_STREAM__") {
        setIsTyping(false);
        streamingMessageIdRef.current = null;
      }
      return;
    }

    if (isToolCallJson(event.data)) {
      return;
    }

    setMessages(prev => {
      if (streamingMessageIdRef.current) {
        return prev.map(msg => 
          msg.id === streamingMessageIdRef.current 
            ? { ...msg, content: msg.content + event.data }
            : msg
        );
      }

      const newMessageId = Date.now().toString();
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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !ws.current || ws.current.readyState !== 1) return;

    streamingMessageIdRef.current = null;
    setIsTyping(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    ws.current.send(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
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

    const match = document.cookie.match(/(^|;)\s*access_token=([^;]+)/);
    setIsAuthenticated(!!match);
  }, []);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connectWebSocket() {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }

      ws.current = new WebSocket('wss://jira-automation.mnv-dev.site/ws/chat');
      
      ws.current.onopen = () => setIsWsConnected(true);
      
      ws.current.onclose = () => {
        setIsWsConnected(false);
        setIsTyping(false);
        streamingMessageIdRef.current = null;
        reconnectTimeout = setTimeout(connectWebSocket, 2000);
      };

      ws.current.onerror = () => {
        setIsWsConnected(false);
        setIsTyping(false);
        streamingMessageIdRef.current = null;
        reconnectTimeout = setTimeout(connectWebSocket, 2000);
      };

      ws.current.onmessage = handleWebSocketMessage;
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
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
          </div>
        </div>

        <ScrollArea className="flex-1 p-3 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg p-4 max-w-[80%] ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200/50'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {currentToolCall && (
              <div className="flex items-center space-x-2 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-blue-200 mb-4 animate-pulse">
                <div className="flex-shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700">
                    Executing tool: {currentToolCall.tool}
                  </p>
                  {currentToolCall.args && (
                    <p className="text-xs text-blue-500 mt-1 truncate">
                      {Object.entries(currentToolCall.args)
                        .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-3 lg:p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || !isWsConnected}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
