ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS course text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS selected_subject_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

UPDATE public.profiles SET course = 'bds' WHERE course = '' OR course IS NULL;