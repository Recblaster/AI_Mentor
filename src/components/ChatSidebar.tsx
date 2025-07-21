
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageCircle, Trash2, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface Session {
  id: string;
  personality_used: string;
  started_at: string;
  ended_at: string | null;
  message_count: number;
}

interface ChatSidebarProps {
  onSessionSelect: (sessionId: string, personality: string) => void;
  onClose: () => void;
  onNewSession: () => void;
  currentSessionId?: string;
  onDeleteSession?: () => void;
}

const personalities: Record<string, { name: string; color: string }> = {
  jarvis: { name: 'Jarvis', color: 'bg-blue-500' },
  'calm-guru': { name: 'Calm Guru', color: 'bg-green-500' },
  vegeta: { name: 'Vegeta', color: 'bg-red-500' }
};

export const ChatSidebar = ({ onSessionSelect, onClose, onNewSession, currentSessionId, onDeleteSession }: ChatSidebarProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const deleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If deleted session was current, go back to main
      if (sessionId === currentSessionId && onDeleteSession) {
        onDeleteSession();
      }
      
      toast({
        title: "Chat Deleted",
        description: "The chat has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getSessionTitle = (session: Session) => {
    const personality = personalities[session.personality_used]?.name || session.personality_used;
    const date = format(new Date(session.started_at), 'MMM dd');
    return `${personality} - ${date}`;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-80 bg-background border-r border-border z-50 flex flex-col shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Chat History</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewSession}
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No chats yet. Start your first conversation!</p>
            </div>
          ) : (
            sessions.map((session) => (
              <Card 
                key={session.id} 
                className={`p-3 cursor-pointer transition-all hover:shadow-sm ${
                  currentSessionId === session.id 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onSessionSelect(session.id, session.personality_used)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full ${personalities[session.personality_used]?.color || 'bg-gray-500'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {getSessionTitle(session)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {session.message_count} messages
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {session.ended_at ? 'Completed' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deletingId === session.id}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <Trash2 className="h-5 w-5 text-destructive" />
                          Delete Chat
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this chat with {personalities[session.personality_used]?.name || session.personality_used}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteSession(session.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete Chat
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
};
