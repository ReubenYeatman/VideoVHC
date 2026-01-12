'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      -- Enable pg_cron extension
      CREATE EXTENSION IF NOT EXISTS pg_cron;

      -- Grant usage on cron schema to postgres
      GRANT USAGE ON SCHEMA cron TO postgres;

      -- Function to delete old videos and their storage files
      CREATE OR REPLACE FUNCTION delete_old_videos()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, storage
      AS $$
      DECLARE
        old_video RECORD;
      BEGIN
        FOR old_video IN
          SELECT id, storage_path
          FROM public.videos
          WHERE created_at < NOW() - INTERVAL '30 days'
        LOOP
          -- Delete from storage.objects (removes the actual file)
          DELETE FROM storage.objects
          WHERE bucket_id = 'videos'
          AND name = old_video.storage_path;

          -- Delete the video record (cascades to shares)
          DELETE FROM public.videos WHERE id = old_video.id;
        END LOOP;
      END;
      $$;

      -- Schedule the cleanup to run daily at 3 AM UTC
      SELECT cron.schedule(
        'delete-old-videos',
        '0 3 * * *',
        'SELECT delete_old_videos();'
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      -- Unschedule the cron job
      SELECT cron.unschedule('delete-old-videos');

      -- Drop the function
      DROP FUNCTION IF EXISTS delete_old_videos();
    `);
  }
};
