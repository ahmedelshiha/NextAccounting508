// components/AIAssistant.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, ThumbsUp, ThumbsDown, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  relatedEvents?: any[];
  confidence?: number;
}

interface AIAssistantProps {
  teamId?: string;
  eventContext?: any;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  teamId, 
  eventContext, 
  isMinimized = false,
  onToggleMinimize 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your UAE tax compliance assistant. I can help you understand VAT, Corporate Tax, and Excise Tax requirements. What would you like to know?",
      timestamp: new Date(),
      confidence: 1.0,
      suggestions: [
        "What are the VAT filing deadlines?",
        "How does Corporate Tax apply to my business?",
        "What products are subject to Excise Tax?",
        "How do I register for VAT in UAE?"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isMinimized);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setIsExpanded(!isMinimized);
  }, [isMinimized]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user'
        },
        body: JSON.stringify({
          query: inputMessage,
          context: {
            teamId,
            eventContext,
            previousMessages: messages.slice(-5)
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          suggestions: data.suggestions,
          relatedEvents: data.relatedEvents,
          confidence: data.confidence
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later or contact support if the issue persists.",
        timestamp: new Date(),
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const provideFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user'
        },
        body: JSON.stringify({
          messageId,
          helpful
        })
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => {
            setIsExpanded(true);
            onToggleMinimize?.();
          }}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          size="lg"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[32rem] z-50 flex flex-col p-0 shadow-xl">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-medium">Tax Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsExpanded(false);
              onToggleMinimize?.();
            }}
            className="text-white/80 hover:text-white p-1 rounded"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsExpanded(false);
              onToggleMinimize?.();
            }}
            className="text-white/80 hover:text-white p-1 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-lg ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 shadow-sm border'
            }`}>
              <div className="flex items-start gap-2">
                {message.type === 'assistant' && <Bot className="w-4 h-4 mt-1 flex-shrink-0 text-blue-600" />}
                {message.type === 'user' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-gray-600">Try asking:</p>
                      {message.suggestions.slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 px-2 py-1.5 rounded border transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.confidence !== undefined && message.confidence < 0.8 && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Please verify with official sources
                    </p>
                  )}
                </div>
              </div>

              {message.type === 'assistant' && (
                <div className="flex justify-end gap-1 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => provideFeedback(message.id, true)}
                    className="p-1 hover:bg-blue-100 rounded transition-colors"
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => provideFeedback(message.id, false)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 px-4 py-3 rounded-lg shadow-sm border">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about UAE tax requirements..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// components/AnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Calendar, Users, Clock, Filter, Download, RefreshCw } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';