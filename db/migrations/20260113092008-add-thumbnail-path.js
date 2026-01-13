'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Add thumbnail_path column
      ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

      -- Drop existing function first (return type is changing)
      DROP FUNCTION IF EXISTS public.get_public_video(TEXT);

      -- Recreate get_public_video with thumbnail_path
      CREATE FUNCTION public.get_public_video(p_share_code TEXT)
      RETURNS TABLE (
        video_id UUID,
        title TEXT,
        description TEXT,
        storage_path TEXT,
        thumbnail_path TEXT,
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
          v.thumbnail_path,
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
      -- Drop the updated function
      DROP FUNCTION IF EXISTS public.get_public_video(TEXT);

      -- Recreate original function without thumbnail_path
      CREATE FUNCTION public.get_public_video(p_share_code TEXT)
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

      -- Remove thumbnail_path column
      ALTER TABLE public.videos DROP COLUMN IF EXISTS thumbnail_path;
    `);
  }
};
