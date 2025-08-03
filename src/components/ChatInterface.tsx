import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Search, Grid3X3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { CanvasWorkspace } from './CanvasWorkspace';
import { FrequencyPlayer } from './FrequencyPlayer';
import { VegetaChallengeDisplay } from './VegetaChallengeDisplay';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  personality: string;
  personalityName: string;
  onBack: () => void;
}

export const ChatInterface = ({ sessionId, personality, personalityName, onBack }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasElements, setCanvasElements] = useState([]);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [showToolsPopover, setShowToolsPopover] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [sessionId, user]);

  const toggleTool = (toolName: string) => {
    setActiveTools(prev => 
      prev.includes(toolName) 
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName]
    );
  };

  const getAvailableTools = () => {
    switch (personality) {
      case 'jarvis':
        return [
          { id: 'web_search', name: 'Web search', icon: '🌐' },
          { id: 'canvas', name: 'Canvas', icon: '🎨' }
        ];
      case 'calm-guru':
        return [
          { id: 'frequency_player', name: 'Healing frequencies', icon: '🎵' }
        ];
      case 'vegeta':
        return [
          { id: 'vegeta_challenge', name: 'Saiyan challenges', icon: '⚡' }
        ];
      default:
        return [];
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('chat-with-mentor', {
        body: {
          message: userMessage,
          personality,
          sessionId,
          userId: user.id,
          activeTools
        }
      });

      if (response.error) throw response.error;

      // Refresh messages after sending
      await fetchMessages();
      
      // Update session message count
      await supabase
        .from('sessions')
        .update({ 
          message_count: messages.length + 2, // +2 for user message and AI response
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check if it's a Gemini API quota error
      const errorMessage = error?.message || '';
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        toast({
          title: "API Quota Exceeded",
          description: "The Gemini API quota has been exceeded. Please check your API plan or wait for the quota to reset.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    // Check for tool responses
    if (message.content.includes('CANVAS_TOOL:')) {
      const canvasData = message.content.match(/CANVAS_TOOL:(.+)/);
      if (canvasData) {
        try {
          const elements = JSON.parse(canvasData[1]);
          return (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Grid3X3 className="h-4 w-4" />
                <span>Canvas Blueprint Created</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  I've created a visual blueprint with {elements.length} elements. Click below to view and edit.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCanvasElements(elements);
                    setShowCanvas(true);
                  }}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Open Canvas
                </Button>
              </div>
            </div>
          );
        } catch (e) {
          console.error('Failed to parse canvas data:', e);
        }
      }
    }

    if (message.content.includes('FREQUENCY_PLAYER:')) {
      const frequencyData = message.content.match(/FREQUENCY_PLAYER:(.+)/);
      if (frequencyData) {
        try {
          const params = JSON.parse(frequencyData[1]);
          const frequency = parseInt(params.value) || 432;
          const duration = parseInt(params.duration) || 60;
          
          return (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <span>🎵</span>
                <span>Healing Frequency Generated</span>
              </div>
              <FrequencyPlayer frequency={frequency} duration={duration} />
            </div>
          );
        } catch (e) {
          console.error('Failed to parse frequency data:', e);
        }
      }
    }

    if (message.content.includes('VEGETA_CHALLENGE:')) {
      const challengeData = message.content.match(/VEGETA_CHALLENGE:(.+)/);
      if (challengeData) {
        try {
          const challenge = JSON.parse(challengeData[1]);
          return (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-red-600">
                <span>⚡</span>
                <span>Saiyan Challenge Issued</span>
              </div>
              <VegetaChallengeDisplay {...challenge} />
            </div>
          );
        } catch (e) {
          console.error('Failed to parse challenge data:', e);
        }
      }
    }

    return (
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            code: ({ inline, children, ...props }) => 
              inline ? (
                <code className="bg-gray-600/50 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              ) : (
                <pre className="bg-gray-600/50 p-3 rounded-lg overflow-x-auto">
                  <code {...props}>{children}</code>
                </pre>
              ),
            ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-gray-100">{children}</li>,
            h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-500 pl-4 italic">{children}</blockquote>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    );
  };

  const getPersonalityColor = (personality: string) => {
    switch (personality) {
      case 'jarvis': return 'from-blue-400 to-blue-600';
      case 'calm-guru': return 'from-green-400 to-green-600';
      case 'vegeta': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'jarvis': return '🤖';
      case 'calm-guru': return '🧘';
      case 'vegeta': return '⚡';
      default: return '💭';
    }
  };

  const getWelcomeMessage = (personality: string) => {
    switch (personality) {
      case 'jarvis': return "Hello! I'm Jarvis, your superintelligent AI assistant. I can search the web and create visual blueprints. How can I help you today?";
      case 'calm-guru': return "Welcome, dear friend. I am here to guide you toward inner peace with healing frequencies. How may I help you today?";
      case 'vegeta': return "Listen up! I'm Vegeta, and I'm here to push you beyond your limits with challenges. What do you need to overcome?";
      default: return "How can I assist you today?";
    }
  };

  if (loadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl">Loading conversation...</div>
      </div>
    );
  }

  return (
    <>
      {/* Canvas Workspace */}
      {showCanvas && (
        <CanvasWorkspace
          elements={canvasElements}
          onElementsChange={setCanvasElements}
          onClose={() => setShowCanvas(false)}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${getPersonalityColor(personality)} mb-6 text-3xl`}>
                {getPersonalityIcon(personality)}
              </div>
              <p className="text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
                {getWelcomeMessage(personality)}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl p-4 ${
                  message.role === 'user' 
                    ? `bg-gradient-to-r ${getPersonalityColor(personality)} text-white shadow-lg` 
                    : 'bg-gray-700/80 text-gray-100 backdrop-blur-sm'
                }`}>
                  <div className="space-y-2">
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    ) : (
                      renderMessage(message)
                    )}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-600/30">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getPersonalityColor(personality)} flex items-center justify-center text-xs`}>
                          {message.role === 'user' ? 'U' : getPersonalityIcon(personality)}
                        </div>
                        <span className="text-xs text-gray-400">
                          {message.role === 'user' ? 'You' : personalityName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-xs sm:max-w-md p-4 bg-gray-700/80 text-gray-100 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className={`w-2 h-2 bg-gradient-to-r ${getPersonalityColor(personality)} rounded-full animate-bounce`}></div>
                    <div className={`w-2 h-2 bg-gradient-to-r ${getPersonalityColor(personality)} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                    <div className={`w-2 h-2 bg-gradient-to-r ${getPersonalityColor(personality)} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-300">{personalityName} is thinking...</span>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center space-x-3">
          {/* Tools Popover */}
          {getAvailableTools().length > 0 && (
            <Popover open={showToolsPopover} onOpenChange={setShowToolsPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`relative ${activeTools.length > 0 ? 'bg-primary/10 border-primary/30' : ''}`}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Tools
                  {activeTools.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {activeTools.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" side="top" align="start">
                <div className="space-y-1">
                  <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                    Available Tools
                  </div>
                  {getAvailableTools().map((tool) => (
                    <Button
                      key={tool.id}
                      variant={activeTools.includes(tool.id) ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => toggleTool(tool.id)}
                    >
                      <span className="mr-2">{tool.icon}</span>
                      {tool.name}
                      {activeTools.includes(tool.id) && (
                        <Badge variant="secondary" className="ml-auto">
                          ON
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${personalityName}...`}
            className="flex-1 bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className={`bg-gradient-to-r ${getPersonalityColor(personality)} hover:opacity-80 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Active Tools Display */}
        {activeTools.length > 0 && (
          <div className="max-w-4xl mx-auto mt-2 flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Active tools:</span>
            {activeTools.map((toolId) => {
              const tool = getAvailableTools().find(t => t.id === toolId);
              return tool ? (
                <Badge key={toolId} variant="secondary" className="text-xs">
                  {tool.icon} {tool.name}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>
    </>
  );
};