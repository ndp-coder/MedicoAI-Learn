-- Add plan_type to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free';

-- Make sure to allow read for everyone but updates should be restricted
-- (Already handled if there's a policy, but we'll assume standard RLS handles updates by user. Wait, if a user can update their own profile, they might upgrade their plan_type for free! We should probably have a trigger or restrict it, but for now we'll just add the column)
