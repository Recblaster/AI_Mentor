-- Add DELETE policy for sessions so users can delete their own sessions
CREATE POLICY "Users can delete their own sessions"
ON public.sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);