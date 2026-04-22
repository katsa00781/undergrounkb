CREATE TABLE IF NOT EXISTS kb_complexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 3,
  rest_between_rounds INTEGER NOT NULL DEFAULT 60,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE kb_complexes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own kb_complexes"
  ON kb_complexes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_kb_complexes_user_id ON kb_complexes(user_id);
