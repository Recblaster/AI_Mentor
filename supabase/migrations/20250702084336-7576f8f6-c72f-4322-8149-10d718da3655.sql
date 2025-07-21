-- Fix authentication issues and enable email verification

-- Drop existing policies and functions that might be causing issues
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profile;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_user_profile();

-- Create improved function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profile (user_id, display_name, created_at, updated_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''), 
    NOW(), 
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create trigger that fires after user is created and confirmed
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Create RLS policies that work properly
CREATE POLICY "Enable read access for users to their own profile"
ON public.user_profile
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for users to create their own profile"
ON public.user_profile
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for users to their own profile"
ON public.user_profile
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Make sure RLS is enabled
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;