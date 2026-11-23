-- Create persistent Quran topic categories without deleting existing data.

CREATE TABLE IF NOT EXISTS public.quran_topic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '📚',
  description TEXT NOT NULL DEFAULT 'কুরআনের গুরুত্বপূর্ণ বিষয়সমূহ',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin verification using the existing quran_admins table.
CREATE OR REPLACE FUNCTION public.is_quran_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quran_admins
    WHERE user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_quran_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_quran_admin() TO authenticated;

-- Public users may view categories; only Quran admins may manage them.
ALTER TABLE public.quran_topic_categories ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.quran_topic_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quran_topic_categories TO authenticated;

DROP POLICY IF EXISTS "Anyone can view Quran topic categories"
  ON public.quran_topic_categories;
CREATE POLICY "Anyone can view Quran topic categories"
  ON public.quran_topic_categories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Quran admins can insert categories"
  ON public.quran_topic_categories;
CREATE POLICY "Quran admins can insert categories"
  ON public.quran_topic_categories
  FOR INSERT TO authenticated
  WITH CHECK (public.is_quran_admin());

DROP POLICY IF EXISTS "Quran admins can update categories"
  ON public.quran_topic_categories;
CREATE POLICY "Quran admins can update categories"
  ON public.quran_topic_categories
  FOR UPDATE TO authenticated
  USING (public.is_quran_admin())
  WITH CHECK (public.is_quran_admin());

DROP POLICY IF EXISTS "Quran admins can delete categories"
  ON public.quran_topic_categories;
CREATE POLICY "Quran admins can delete categories"
  ON public.quran_topic_categories
  FOR DELETE TO authenticated
  USING (public.is_quran_admin());

-- Seed the existing built-in categories.
INSERT INTO public.quran_topic_categories (name, icon, description, sort_order)
VALUES
  ('আল্লাহ, ঈমান ও আকিদা', '☪', 'আল্লাহ, ঈমান, আকিদা ও নবী-রাসূল', 1),
  ('ইবাদত ও ধর্মীয় বিধান', '🤲', 'সালাত, হজ্জ, রমজান ও ধর্মীয় বিধান', 2),
  ('চরিত্র, নৈতিকতা ও ব্যক্তিগত গুণাবলি', '🌿', 'সততা, ধৈর্য, কৃতজ্ঞতা ও উত্তম চরিত্র', 3),
  ('পরিবার, আত্মীয়তা ও সামাজিক সম্পর্ক', '👨‍👩‍👧', 'পরিবার, আত্মীয়তা ও সামাজিক দায়িত্ব', 4),
  ('পাপ, অন্যায় ও নিষিদ্ধ কাজ', '⚖️', 'পাপ, অন্যায় ও নিষিদ্ধ বিষয়', 5),
  ('বিচার, ন্যায়বিচার ও মানবাধিকার', '⚖️', 'ন্যায়বিচার, অধিকার ও মানুষের প্রতি সুবিচার', 6),
  ('সৃষ্টি, প্রকৃতি ও অদৃশ্য জগৎ', '🌍', 'সৃষ্টি, প্রকৃতি, জিন ও অদৃশ্য জগৎ', 7),
  ('পরকাল, জান্নাত ও আখিরাত', '🌙', 'পরকাল, বিচার দিবস ও জান্নাত', 8),
  ('জ্ঞান, শিক্ষা ও দোয়া', '📖', 'জ্ঞান, শিক্ষা, দোয়া ও কুরআনের আয়াত', 9),
  ('অর্থনীতি, সম্পদ ও লেনদেন', '💰', 'সম্পদ, দান, ব্যবসা ও লেনদেন', 10),
  ('ব্যক্তিগত জীবন ও অন্যান্য বিষয়', '📚', 'ব্যক্তিগত জীবন ও অন্যান্য কুরআনিক বিষয়', 11)
ON CONFLICT (name) DO NOTHING;

-- Preserve every additional category already used by existing topics.
INSERT INTO public.quran_topic_categories (name, icon, description, sort_order)
SELECT DISTINCT
  btrim(category),
  '📚',
  'কুরআনের গুরুত্বপূর্ণ বিষয়সমূহ',
  100
FROM public.quran_topics
WHERE category IS NOT NULL
  AND btrim(category) <> ''
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE public.quran_topic_categories IS
'Persistent categories for Quran topics. Only Quran admins may manage categories.';

-- Rename a category atomically; merge into an existing category when needed.
CREATE OR REPLACE FUNCTION public.rename_quran_topic_category(
  p_old_name TEXT,
  p_new_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_old_name TEXT := btrim(p_old_name);
  v_new_name TEXT := btrim(p_new_name);
BEGIN
  IF NOT public.is_quran_admin() THEN
    RAISE EXCEPTION 'প্রশাসকের অনুমতি প্রয়োজন';
  END IF;

  IF v_old_name IS NULL OR v_old_name = ''
     OR v_new_name IS NULL OR v_new_name = '' THEN
    RAISE EXCEPTION 'শ্রেণির নাম ফাঁকা রাখা যাবে না';
  END IF;

  IF v_old_name = v_new_name THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.quran_topic_categories
    WHERE name = v_old_name
  ) THEN
    RAISE EXCEPTION 'পুরোনো শ্রেণিটি পাওয়া যায়নি';
  END IF;

  UPDATE public.quran_topics
  SET category = v_new_name
  WHERE category = v_old_name;

  IF EXISTS (
    SELECT 1 FROM public.quran_topic_categories
    WHERE name = v_new_name
  ) THEN
    DELETE FROM public.quran_topic_categories
    WHERE name = v_old_name;
  ELSE
    UPDATE public.quran_topic_categories
    SET name = v_new_name
    WHERE name = v_old_name;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.rename_quran_topic_category(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rename_quran_topic_category(TEXT, TEXT) TO authenticated;

-- Delete only an empty category; never delete topics or their ayahs.
CREATE OR REPLACE FUNCTION public.delete_quran_topic_category(
  p_category_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_category_name TEXT := btrim(p_category_name);
BEGIN
  IF NOT public.is_quran_admin() THEN
    RAISE EXCEPTION 'প্রশাসকের অনুমতি প্রয়োজন';
  END IF;

  IF v_category_name IS NULL OR v_category_name = '' THEN
    RAISE EXCEPTION 'শ্রেণির নাম পাওয়া যায়নি';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.quran_topics
    WHERE category = v_category_name
  ) THEN
    RAISE EXCEPTION 'এই শ্রেণিতে বিষয় রয়েছে; আগে বিষয়গুলো অন্য শ্রেণিতে সরান';
  END IF;

  DELETE FROM public.quran_topic_categories
  WHERE name = v_category_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'শ্রেণিটি পাওয়া যায়নি';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_quran_topic_category(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_quran_topic_category(TEXT) TO authenticated;
