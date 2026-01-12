'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Storage bucket policies for 'videos' bucket
      -- Note: The bucket itself must be created via Supabase Dashboard

      -- Policy: Users can upload to their own folder
      CREATE POLICY "Users can upload videos to own folder" ON storage.objects
        FOR INSERT
        WITH CHECK (
          bucket_id = 'videos' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );

      -- Policy: Users can update their own videos
      CREATE POLICY "Users can update own videos" ON storage.objects
        FOR UPDATE
        USING (
          bucket_id = 'videos' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );

      -- Policy: Users can delete their own videos
      CREATE POLICY "Users can delete own videos" ON storage.objects
        FOR DELETE
        USING (
          bucket_id = 'videos' AND
          auth.uid()::text = (storage.foldername(name))[1]
        );

      -- Policy: Anyone can view videos (public bucket)
      CREATE POLICY "Anyone can view videos" ON storage.objects
        FOR SELECT
        USING (bucket_id = 'videos');
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP POLICY IF EXISTS "Users can upload videos to own folder" ON storage.objects;
      DROP POLICY IF EXISTS "Users can update own videos" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;
      DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
    `);
  }
};
