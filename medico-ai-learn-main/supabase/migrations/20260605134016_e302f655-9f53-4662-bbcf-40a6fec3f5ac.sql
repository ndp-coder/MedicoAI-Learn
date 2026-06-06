
CREATE TABLE public.user_diagrams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'upload',
  custom_prompt TEXT,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_diagrams TO authenticated;
GRANT ALL ON public.user_diagrams TO service_role;

ALTER TABLE public.user_diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own diagrams" ON public.user_diagrams
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_diagrams_user_created ON public.user_diagrams(user_id, created_at DESC);

-- Storage policies (bucket already created via tool)
CREATE POLICY "Users read own diagram files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-diagrams' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own diagram files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-diagrams' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own diagram files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-diagrams' AND (storage.foldername(name))[1] = auth.uid()::text);
