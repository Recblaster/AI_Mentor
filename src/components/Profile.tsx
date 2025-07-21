import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, Edit3, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  preferred_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
export const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [open, setOpen] = useState(false);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('user_profile').select('*').eq('user_id', user.id).single();
      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const {
            data: newProfile,
            error: createError
          } = await supabase.from('user_profile').insert({
            user_id: user.id,
            display_name: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).select().single();
          if (createError) throw createError;
          setProfile(newProfile);
          setDisplayName('');
        } else {
          throw error;
        }
          setBio(data.bio || '');
          setPreferredName(data.preferred_name || '');
      } else {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setPreferredName(data.preferred_name || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const updateProfile = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('user_profile').update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        preferred_name: preferredName.trim() || null,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);
      if (error) throw error;
      setProfile(prev => prev ? {
        ...prev,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        preferred_name: preferredName.trim() || null
      } : null);
      setEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (open) {
      fetchProfile();
    }
  }, [open, user]);
  const getInitials = (email: string, name?: string | null) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-950 bg-emerald-100">
          <User className="h-5 w-5 mr-2" />
          Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-gray-800 border-gray-600 text-white backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6 text-gray-400" />
            My Profile
          </DialogTitle>
        </DialogHeader>
        
        {loading ? <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div> : profile && user ? <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-20 h-20 border-2 border-gray-500">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white text-lg font-semibold">
                  {getInitials(user.email || '', profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                Member since {format(new Date(profile.created_at), 'MMM yyyy')}
              </Badge>
            </div>

            <Separator className="bg-gray-600" />

            {/* Profile Information */}
            <Card className="bg-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Profile Information</span>
                  {!editing ? <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-8 w-8 p-0 hover:bg-gray-600">
                      <Edit3 className="h-4 w-4" />
                    </Button> : <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={updateProfile} disabled={loading} className="h-8 w-8 p-0 hover:bg-green-500/20">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                  setEditing(false);
                  setDisplayName(profile.display_name || '');
                }} className="h-8 w-8 p-0 hover:bg-red-500/20">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Display Name</Label>
                  {editing ? <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Enter your display name" className="bg-gray-600 border-gray-500 text-white placeholder-gray-400" /> : <p className="text-sm py-2 px-3 bg-gray-600 rounded-md border border-gray-500">
                      {profile.display_name || 'Not set'}
                    </p>}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Preferred Name</Label>
                  {editing ? <Input value={preferredName} onChange={e => setPreferredName(e.target.value)} placeholder="How you'd like to be addressed" className="bg-gray-600 border-gray-500 text-white placeholder-gray-400" /> : <p className="text-sm py-2 px-3 bg-gray-600 rounded-md border border-gray-500">
                      {profile.preferred_name || 'Not set'}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Bio</Label>
                  {editing ? <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us a bit about yourself" className="w-full min-h-[80px] bg-gray-600 border-gray-500 text-white placeholder-gray-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" /> : <p className="text-sm py-2 px-3 bg-gray-600 rounded-md border border-gray-500 min-h-[80px]">
                      {profile.bio || 'Not set'}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-300 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p className="text-sm py-2 px-3 bg-gray-600 rounded-md border border-gray-500">
                    {user.email}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last Updated
                  </Label>
                  <p className="text-sm py-2 px-3 bg-gray-600 rounded-md border border-gray-500">
                    {format(new Date(profile.updated_at), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div> : <div className="text-center py-8 text-gray-400">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Unable to load profile</p>
          </div>}
      </DialogContent>
    </Dialog>;
};