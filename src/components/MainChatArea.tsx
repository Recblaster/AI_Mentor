
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Settings, Send, Brain, Leaf, Zap } from "lucide-react";

type Personality = 'jarvis' | 'calm-guru' | 'vegeta';

interface MainChatAreaProps {
  selectedPersonality: Personality;
  onPersonalitySelect: (personality: Personality) => void;
}

const personalities = [
  { 
    id: 'jarvis' as const, 
    name: 'Jarvis', 
    description: 'Smart, analytical, and efficient', 
    icon: Brain,
    color: 'from-blue-400 to-cyan-400'
  },
  { 
    id: 'calm-guru' as const, 
    name: 'Calm Guru', 
    description: 'Peaceful, mindful, and wise', 
    icon: Leaf,
    color: 'from-emerald-400 to-green-400'
  },
  { 
    id: 'vegeta' as const, 
    name: 'Vegeta', 
    description: 'Fierce, motivating, and powerful', 
    icon: Zap,
    color: 'from-orange-400 to-red-400'
  }
];

export const MainChatArea = ({ selectedPersonality, onPersonalitySelect }: MainChatAreaProps) => {
  const [message, setMessage] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      onPersonalitySelect(selectedPersonality);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const DynamicOrb = () => (
    <div className="relative">
      <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse">
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-300 via-purple-400 to-pink-400 animate-pulse" style={{ animationDelay: '0.5s' }}>
            <div className="absolute inset-3 rounded-full bg-background/20 backdrop-blur-sm"></div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-pink-500/20 animate-ping"></div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Central Content */}
      <div className="flex flex-col items-center space-y-8 max-w-2xl w-full">
        {/* Dynamic Orb */}
        <DynamicOrb />
        
        {/* Welcome Text */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground font-light">Welcome to Mantrik AI</p>
          <h1 className="text-3xl font-bold text-foreground">How can I help you today?</h1>
        </div>
      </div>

      {/* Chat Input Area */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-6">
        <div className="relative">
          <div className="bg-background/80 backdrop-blur-lg border border-border rounded-2xl shadow-lg">
            <div className="flex items-end p-4 space-x-3">
              {/* Settings Button */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full shrink-0 text-muted-foreground hover:text-foreground"
                    data-testid="settings-button"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" side="top" align="start">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Choose Personality</h3>
                    <p className="text-sm text-muted-foreground">Select your AI assistant</p>
                  </div>
                  <div className="p-2 space-y-1">
                    {personalities.map((personality) => {
                      const IconComponent = personality.icon;
                      return (
                        <Card
                          key={personality.id}
                          className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${
                            selectedPersonality === personality.id ? 'bg-primary/10 border-primary/20' : ''
                          }`}
                          onClick={() => {
                            onPersonalitySelect(personality.id);
                            setIsPopoverOpen(false);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${personality.color} flex items-center justify-center`}>
                              <IconComponent className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{personality.name}</p>
                              <p className="text-xs text-muted-foreground">{personality.description}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Text Input */}
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 min-h-0 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={1}
              />

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                className="rounded-full shrink-0"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
