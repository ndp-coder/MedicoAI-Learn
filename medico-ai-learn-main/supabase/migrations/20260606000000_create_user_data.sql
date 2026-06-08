CREATE TABLE user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data_key text NOT NULL,
  data_value jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, data_key)
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own data" ON user_data
  FOR ALL USING (auth.uid() = user_id);
