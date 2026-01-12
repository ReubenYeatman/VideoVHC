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
      SET search_path = public
      AS $$
      DECLARE
        old_video RECORD;
      BEGIN
        -- Find videos older than 30 days
        FOR old_video IN
          SELECT id, storage_path, user_id
          FROM public.videos
          WHERE created_at < NOW() - INTERVAL '30 days'
        LOOP
          -- Delete associated shares first (cascade should handle this, but being explicit)
          DELETE FROM public.shares WHERE video_id = old_video.id;

          -- Delete the video record (this will trigger storage cleanup via app or we handle separately)
          DELETE FROM public.videos WHERE id = old_video.id;

          -- Log the deletion
          RAISE NOTICE 'Deleted video % with storage path %', old_video.id, old_video.storage_path;
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
