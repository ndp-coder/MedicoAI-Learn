
-- 1. Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text DEFAULT '',
  year_of_study text DEFAULT '',
  exam_date text DEFAULT '',
  exam_name text DEFAULT '',
  settings_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 2. user_progress
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id text NOT NULL,
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  topics_reviewed text[] DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.user_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. user_flashcards
CREATE TABLE public.user_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term text NOT NULL,
  definition text NOT NULL,
  subject_id text DEFAULT '',
  ease_factor real DEFAULT 2.5,
  interval integer DEFAULT 0,
  repetitions integer DEFAULT 0,
  next_review timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_flashcards TO authenticated;
GRANT ALL ON public.user_flashcards TO service_role;
ALTER TABLE public.user_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own flashcards" ON public.user_flashcards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. user_mistakes
CREATE TABLE public.user_mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  correct_index integer DEFAULT 0,
  user_answer integer DEFAULT 0,
  explanation text DEFAULT '',
  subject_id text DEFAULT '',
  source text DEFAULT '',
  times_wrong integer DEFAULT 1,
  times_correct_after integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_mistakes TO authenticated;
GRANT ALL ON public.user_mistakes TO service_role;
ALTER TABLE public.user_mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mistakes" ON public.user_mistakes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. user_bookmarks
CREATE TABLE public.user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  correct_index integer DEFAULT 0,
  explanation text DEFAULT '',
  book_reference text DEFAULT '',
  subject_id text DEFAULT '',
  user_answer integer DEFAULT 0,
  saved_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_bookmarks TO authenticated;
GRANT ALL ON public.user_bookmarks TO service_role;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.user_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. user_notes
CREATE TABLE public.user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id text DEFAULT '',
  title text NOT NULL DEFAULT 'Untitled',
  content text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;
GRANT ALL ON public.user_notes TO service_role;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.user_notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. user_test_marks
CREATE TABLE public.user_test_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id text DEFAULT '',
  test_name text DEFAULT '',
  test_type text DEFAULT '',
  marks_obtained real DEFAULT 0,
  total_marks real DEFAULT 100,
  faculty_name text DEFAULT '',
  date text DEFAULT '',
  remarks text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_test_marks TO authenticated;
GRANT ALL ON public.user_test_marks TO service_role;
ALTER TABLE public.user_test_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own test marks" ON public.user_test_marks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. user_quiz_history
CREATE TABLE public.user_quiz_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_date text NOT NULL,
  score integer DEFAULT 0,
  total integer DEFAULT 0,
  subject_id text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_quiz_history TO authenticated;
GRANT ALL ON public.user_quiz_history TO service_role;
ALTER TABLE public.user_quiz_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own quiz history" ON public.user_quiz_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. user_activity_log
CREATE TABLE public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  quiz boolean DEFAULT false,
  recap boolean DEFAULT false,
  flashcards boolean DEFAULT false,
  UNIQUE(user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_activity_log TO authenticated;
GRANT ALL ON public.user_activity_log TO service_role;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own activity" ON public.user_activity_log FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. user_gamification (with leaderboard read)
CREATE TABLE public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp integer DEFAULT 0,
  daily_xp integer DEFAULT 0,
  daily_xp_date text DEFAULT '',
  daily_xp_goal integer DEFAULT 50,
  history jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_gamification TO authenticated;
GRANT ALL ON public.user_gamification TO service_role;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own gamification" ON public.user_gamification FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leaderboard readable" ON public.user_gamification FOR SELECT TO authenticated USING (true);

-- 11. user_study_plans
CREATE TABLE public.user_study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_name text DEFAULT '',
  exam_date text DEFAULT '',
  subjects text[] DEFAULT '{}',
  days jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_study_plans TO authenticated;
GRANT ALL ON public.user_study_plans TO service_role;
ALTER TABLE public.user_study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study plans" ON public.user_study_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. user_pomodoro_sessions
CREATE TABLE public.user_pomodoro_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer DEFAULT 25,
  subject_id text DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_pomodoro_sessions TO authenticated;
GRANT ALL ON public.user_pomodoro_sessions TO service_role;
ALTER TABLE public.user_pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pomodoro" ON public.user_pomodoro_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 13. user_study_hours
CREATE TABLE public.user_study_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  hours_studied real DEFAULT 0,
  UNIQUE(user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_study_hours TO authenticated;
GRANT ALL ON public.user_study_hours TO service_role;
ALTER TABLE public.user_study_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study hours" ON public.user_study_hours FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile + gamification row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, student_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'student_name', ''));
  INSERT INTO public.user_gamification (user_id, total_xp, daily_xp, daily_xp_date, daily_xp_goal)
  VALUES (NEW.id, 0, 0, '', 50);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
