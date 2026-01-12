'use strict';

/** @type {import('sequelize-cli').Migration} */
// ClipVault initial schema - v1.0
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Profiles table (extends Supabase auth.users)
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        display_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Videos table
      CREATE TABLE IF NOT EXISTS public.videos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        storage_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type TEXT NOT NULL,
        duration_seconds INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Shares table
      CREATE TABLE IF NOT EXISTS public.shares (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
        share_code TEXT NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
      CREATE INDEX IF NOT EXISTS idx_shares_video_id ON public.shares(video_id);
      CREATE INDEX IF NOT EXISTS idx_shares_share_code ON public.shares(share_code);

      -- Enable RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

      -- Profiles policies
      CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);

      CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);

      CREATE POLICY "Users can insert own profile" ON public.profiles
        FOR INSERT WITH CHECK (auth.uid() = id);

      -- Videos policies
      CREATE POLICY "Users can view own videos" ON public.videos
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert own videos" ON public.videos
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update own videos" ON public.videos
        FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete own videos" ON public.videos
        FOR DELETE USING (auth.uid() = user_id);

      -- Shares policies
      CREATE POLICY "Users can view own shares" ON public.shares
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.videos
            WHERE videos.id = shares.video_id
            AND videos.user_id = auth.uid()
          )
        );

      CREATE POLICY "Users can insert shares for own videos" ON public.shares
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.videos
            WHERE videos.id = shares.video_id
            AND videos.user_id = auth.uid()
          )
        );

      CREATE POLICY "Users can update own shares" ON public.shares
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.videos
            WHERE videos.id = shares.video_id
            AND videos.user_id = auth.uid()
          )
        );

      CREATE POLICY "Users can delete own shares" ON public.shares
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.videos
            WHERE videos.id = shares.video_id
            AND videos.user_id = auth.uid()
          )
        );

      CREATE POLICY "Public can view active shares" ON public.shares
        FOR SELECT USING (is_active = true);

      -- Function to handle new user profile creation
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, display_name)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
        RETURN NEW;
      END;
      $$;

      -- Trigger for new user signup
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

      -- Function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SET search_path = public
      AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$;

      -- Triggers for updated_at
      DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
      CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

      DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
      CREATE TRIGGER update_videos_updated_at
        BEFORE UPDATE ON public.videos
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

      DROP TRIGGER IF EXISTS update_shares_updated_at ON public.shares;
      CREATE TRIGGER update_shares_updated_at
        BEFORE UPDATE ON public.shares
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

      -- Function to create share with collision handling
      CREATE OR REPLACE FUNCTION public.create_share(p_video_id UUID)
      RETURNS TEXT
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      DECLARE
        chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        v_code TEXT;
        v_attempts INT := 0;
        i INTEGER;
      BEGIN
        -- Verify caller owns the video
        IF NOT EXISTS (SELECT 1 FROM public.videos WHERE id = p_video_id AND user_id = auth.uid()) THEN
          RAISE EXCEPTION 'Video not found or access denied';
        END IF;

        LOOP
          v_code := '';
          FOR i IN 1..8 LOOP
            v_code := v_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
          END LOOP;

          BEGIN
            INSERT INTO public.shares (video_id, share_code) VALUES (p_video_id, v_code);
            RETURN v_code;
          EXCEPTION WHEN unique_violation THEN
            v_attempts := v_attempts + 1;
            IF v_attempts > 5 THEN
              RAISE EXCEPTION 'Could not generate unique share code after 5 attempts';
            END IF;
          END;
        END LOOP;
      END;
      $$;

      -- Function to increment view count atomically
      CREATE OR REPLACE FUNCTION public.increment_view_count(p_share_code TEXT)
      RETURNS VOID
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        UPDATE public.shares
        SET view_count = view_count + 1
        WHERE share_code = p_share_code AND is_active = true;
      END;
      $$;

      -- Function to get public video data by share code
      CREATE OR REPLACE FUNCTION public.get_public_video(p_share_code TEXT)
      RETURNS TABLE (
        video_id UUID,
        title TEXT,
        description TEXT,
        storage_path TEXT,
        view_count INTEGER
      )
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          v.id as video_id,
          v.title,
          v.description,
          v.storage_path,
          s.view_count
        FROM public.shares s
        JOIN public.videos v ON v.id = s.video_id
        WHERE s.share_code = p_share_code AND s.is_active = true;
      END;
      $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Drop functions
      DROP FUNCTION IF EXISTS public.get_public_video(TEXT);
      DROP FUNCTION IF EXISTS public.increment_view_count(TEXT);
      DROP FUNCTION IF EXISTS public.create_share(UUID);
      DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
      DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

      -- Drop tables (cascades policies)
      DROP TABLE IF EXISTS public.shares CASCADE;
      DROP TABLE IF EXISTS public.videos CASCADE;
      DROP TABLE IF EXISTS public.profiles CASCADE;
    `);
  }
};
