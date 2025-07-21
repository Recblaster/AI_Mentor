/*
  # Add additional profile fields

  1. Changes
    - Add `bio` column to user_profile table for user biography
    - Add `preferred_name` column to user_profile table for how users want to be addressed
  
  2. Security
    - No changes to RLS policies needed as existing policies cover these new fields
*/

-- Add bio column to user_profile table
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add preferred_name column to user_profile table  
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS preferred_name TEXT;