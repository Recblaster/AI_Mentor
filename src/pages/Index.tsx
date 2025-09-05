import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { TopBar } from '@/components/TopBar';
import { ChatSidebar } from '@/components/ChatSidebar';
import { MainChatArea } from '@/components/MainChatArea';
import { ChatInterface } from '@/components/ChatInterface';

type Personality = 'jarvis' | 'calm-guru' | 'vegeta';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedPersonality, setSelectedPersonality] = useState<Personality>('jarvis');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    console.log('Auth state:', { user: !!user, loading });
    if (!loading && !user) {
      console.log('No user found, redirecting to landing page');
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <div className="text-muted-foreground text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handlePersonalitySelect = async (personality: Personality) => {
    try {
      console.log('Creating new session with personality:', personality);
      
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          personality_used: personality,
          message_count: 0,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('Session created successfully:', data.id);
      setSelectedPersonality(personality);
      setCurrentSessionId(data.id);
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create new session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSessionSelect = (sessionId: string, personality: string) => {
    setCurrentSessionId(sessionId);
    setSelectedPersonality(personality as Personality);
    setShowSidebar(false);
  };

  const handleNewSession = () => {
    setSelectedPersonality('jarvis');
    setCurrentSessionId(null);
    setShowSidebar(false);
  };

  const handleBackToMain = () => {
    setSelectedPersonality('jarvis');
    setCurrentSessionId(null);
  };

  const getThemeClasses = () => {
    switch (selectedPersonality) {
      case 'calm-guru':
        return 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20';
      case 'vegeta':
        return 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20';
      default:
        return 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20';
    }
  };

  // Chat Interface View
  if (currentSessionId) {
    return (
      <div className={`min-h-screen transition-all duration-700 ${getThemeClasses()}`}>
        <TopBar onSignOut={handleSignOut} onToggleSidebar={() => setShowSidebar(true)} />
        
        {showSidebar && (
          <ChatSidebar
            onSessionSelect={handleSessionSelect}
            onClose={() => setShowSidebar(false)}
            onNewSession={handleNewSession}
            currentSessionId={currentSessionId}
            onDeleteSession={handleBackToMain}
          />
        )}

        <ChatInterface
          sessionId={currentSessionId}
          personality={selectedPersonality}
          personalityName={selectedPersonality}
          onBack={handleBackToMain}
        />
      </div>
    );
  }

  // Main Chat Area View
  return (
    <div className={`min-h-screen transition-all duration-700 ${getThemeClasses()}`}>
      <TopBar onSignOut={handleSignOut} onToggleSidebar={() => setShowSidebar(true)} />
      
      {showSidebar && (
        <ChatSidebar
          onSessionSelect={handleSessionSelect}
          onClose={() => setShowSidebar(false)}
          onNewSession={handleNewSession}
          currentSessionId={currentSessionId}
          onDeleteSession={handleBackToMain}
        />
      )}

      <MainChatArea 
        selectedPersonality={selectedPersonality}
        onPersonalitySelect={handlePersonalitySelect}
      />
    </div>
  );
};

export default Index;
