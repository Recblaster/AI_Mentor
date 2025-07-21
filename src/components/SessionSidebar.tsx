
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

interface SessionSidebarProps {
  onSessionSelect: (sessionId: string, personality: string) => void;
  onClose: () => void;
  onNewSession: () => void;
  currentSessionId?: string;
}

const personalities: Record<string, { name: string; color: string }> = {
  jarvis: { name: 'Jarvis', color: 'bg-blue-500' },
  'calm-guru': { name: 'Calm Guru', color: 'bg-green-500' },
  vegeta: { name: 'Vegeta', color: 'bg-red-500' }
};

export const SessionSidebar = ({ onSessionSelect, onClose, onNewSession, currentSessionId }: SessionSidebarProps) => {
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
      toast({
        title: "Session Deleted",
        description: "The session has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
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
    <div className="fixed inset-y-0 left-0 w-80 bg-gray-800 border-r border-gray-700 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Sessions</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewSession}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sessions yet. Start your first conversation!</p>
          </div>
        ) : (
          sessions.map((session) => (
            <Card 
              key={session.id} 
              className={`p-3 cursor-pointer transition-colors ${
                currentSessionId === session.id 
                  ? 'bg-gray-600 border-gray-500' 
                  : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
              }`}
              onClick={() => onSessionSelect(session.id, session.personality_used)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full ${personalities[session.personality_used]?.color || 'bg-gray-500'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {getSessionTitle(session)}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs bg-gray-600 text-gray-300">
                        {session.message_count} messages
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-gray-600 text-gray-300">
                        {session.ended_at ? 'Completed' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      disabled={deletingId === session.id}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-800 border-gray-600 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-red-400" />
                        Delete Session
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Are you sure you want to delete this session with {personalities[session.personality_used]?.name || session.personality_used}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteSession(session.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete Session
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
  );
};
