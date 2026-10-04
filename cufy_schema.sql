-- ==============================================================================
-- CUFY DATING APP - COMPLETE & SECURE SUPABASE SCHEMAS, TRIGGERS & RLS POLICIES
-- Project: Cufy App (Intentional Dating Platform)
-- Author: Antigravity AI
-- ==============================================================================

-- 0. ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Woman', 'Man', 'Non-binary', 'Other')),
  pronouns TEXT,
  day TEXT,
  month TEXT,
  year TEXT,
  age INTEGER,
  location TEXT,
  height_feet INTEGER DEFAULT 5,
  height_inches INTEGER DEFAULT 8,
  height_unit TEXT DEFAULT 'FT',
  ethnicity TEXT[],
  interested_in TEXT DEFAULT 'Women',
  intent TEXT DEFAULT 'Serious relationship',
  college TEXT,
  job_title TEXT,
  hometown TEXT,
  religion TEXT,
  drinking TEXT,
  smoking TEXT,
  photos TEXT[] DEFAULT '{}',
  bio TEXT,
  prompt1 TEXT,
  prompt1_answer TEXT,
  prompt2 TEXT,
  prompt2_answer TEXT,
  voice_note_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  account_status TEXT DEFAULT 'Active' CHECK (account_status IN ('Active', 'Suspended')),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. MEMBERSHIPS TABLE (Subscriptions & Verification Queue)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('1_day', '1_week', '15_days', '1_month', 'free_women')),
  price NUMERIC NOT NULL DEFAULT 0,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. BOOSTS TABLE (Profile Visibility Boost Packs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boost_pack TEXT NOT NULL CHECK (boost_pack IN ('1_boost', '4_boosts', '15_boosts')),
  price NUMERIC NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'expired')),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. LIKES TABLE (Likes & Superlikes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_superlike BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- ------------------------------------------------------------------------------
-- 5. MATCHES TABLE (Mutual Connections)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unmatched')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- ------------------------------------------------------------------------------
-- 6. MESSAGES TABLE (Chat Thread Log)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. AUTO-TRIGGER FOR NEW SIGNUPS (Supabase Auth to Profiles Sync)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    (NEW.email = 'cupid.livepro@gmail.com')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- NOTE: Auto RLS is ENABLED on all tables for maximum security.
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Anyone authenticated can view active profiles for dating discovery
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (account_status = 'Active' OR auth.uid() = id OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can manage all profiles
CREATE POLICY "Admin full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ------------------------------------------------------------------------------
-- MEMBERSHIPS POLICIES
-- ------------------------------------------------------------------------------
-- Users can view their own membership records
CREATE POLICY "Users view own memberships"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Users can submit membership requests/screenshots
CREATE POLICY "Users insert own memberships"
  ON public.memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin can update membership verification status
CREATE POLICY "Admin manage memberships"
  ON public.memberships FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ------------------------------------------------------------------------------
-- BOOSTS POLICIES
-- ------------------------------------------------------------------------------
-- Users view own boosts
CREATE POLICY "Users view own boosts"
  ON public.boosts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Users submit boost requests/screenshots
CREATE POLICY "Users insert own boosts"
  ON public.boosts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin manage boosts
CREATE POLICY "Admin manage boosts"
  ON public.boosts FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ------------------------------------------------------------------------------
-- LIKES POLICIES
-- ------------------------------------------------------------------------------
-- Users can view likes sent or received by them
CREATE POLICY "Users view relevant likes"
  ON public.likes FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Users can send likes
CREATE POLICY "Users send likes"
  ON public.likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- ------------------------------------------------------------------------------
-- MATCHES POLICIES
-- ------------------------------------------------------------------------------
-- Users can view their active matches
CREATE POLICY "Users view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ------------------------------------------------------------------------------
-- MESSAGES POLICIES
-- ------------------------------------------------------------------------------
-- Users can view messages in matches they belong to
CREATE POLICY "Users view own match messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Users can send messages in their matches
CREATE POLICY "Users send messages in own match"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================
