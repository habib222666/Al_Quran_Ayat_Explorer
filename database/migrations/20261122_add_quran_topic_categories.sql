-- Add category support without deleting existing Quran topics.
ALTER TABLE public.quran_topics
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'অন্যান্য বিষয়';

-- Keep category browsing efficient.
CREATE INDEX IF NOT EXISTS idx_quran_topics_category_title
ON public.quran_topics (category, title);

COMMENT ON COLUMN public.quran_topics.category IS
'Bangla category assigned to a Quran topic. Existing topics default to অন্যান্য বিষয়.';
