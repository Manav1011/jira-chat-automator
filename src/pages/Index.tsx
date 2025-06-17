
import React, { useState, useRef, useEffect } from 'react';
import { Send, History, MessageCircle, Bot, User, Sparkles, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '✨ Hey there! I\'m your AI-powered Jira automation assistant. Ready to streamline your workflow? What can I help you automate today?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(inputValue),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
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
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl`}>
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-purple-600">
          <Button
            onClick={startNewChat}
            className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 mb-6 flex items-center">
              <History className="w-4 h-4 mr-2" />
              Recent Conversations
            </h3>
            {chatHistory.map((chat) => (
              <Card
                key={chat.id}
                className={`p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                  currentChatId === chat.id ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-md' : 'border-gray-100'
                }`}
                onClick={() => loadChatHistory(chat)}
              >
                <h4 className="font-semibold text-sm text-gray-900 truncate">{chat.title}</h4>
                <p className="text-xs text-gray-500 mt-2 truncate">{chat.lastMessage}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {chat.timestamp.toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 hover:bg-gray-100/50 hover:scale-105 transition-all duration-200"
            >
              <History className="w-5 h-5" />
            </Button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Jira Automation Assistant
                </h1>
                <p className="text-sm text-gray-500">AI-powered workflow automation</p>
              </div>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Online
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.isUser ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                      message.isUser 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                    }`}>
                      {message.isUser ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                  <div className={`rounded-2xl px-5 py-3 shadow-lg ${
                    message.isUser
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-white border border-gray-200/50 text-gray-900 backdrop-blur-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.isUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex max-w-[80%]">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200/50 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm">
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
        <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about Jira automation..."
                  className="pr-14 py-4 text-sm border-gray-300/50 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm bg-white/70 backdrop-blur-sm placeholder:text-gray-400"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 rounded-lg shadow-md hover:scale-105 transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center flex items-center justify-center">
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
