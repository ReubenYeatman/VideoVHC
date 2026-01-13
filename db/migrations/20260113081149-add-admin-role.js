'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the orphaned trigger that references non-existent updated_at column
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    `);

    // Add is_admin column to profiles
    await queryInterface.sequelize.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);

    // Set initial admin user
    await queryInterface.sequelize.query(`
      UPDATE profiles SET is_admin = TRUE WHERE email = 'reuben.yeatman@colaunch.co.uk';
    `);

    // Create admin stats function
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION get_admin_stats()
      RETURNS JSON
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        caller_is_admin BOOLEAN;
      BEGIN
        -- Check if caller is admin
        SELECT is_admin INTO caller_is_admin FROM profiles WHERE id = auth.uid();
        IF NOT caller_is_admin THEN
          RAISE EXCEPTION 'Unauthorized: Admin access required';
        END IF;

        RETURN json_build_object(
          'total_users', (SELECT COUNT(*) FROM profiles),
          'total_videos', (SELECT COUNT(*) FROM videos),
          'total_shares', (SELECT COUNT(*) FROM shares),
          'total_views', (SELECT COALESCE(SUM(view_count), 0) FROM shares),
          'users', (
            SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json)
            FROM (
              SELECT
                p.id,
                p.email,
                p.display_name,
                p.created_at,
                p.is_admin,
                (SELECT COUNT(*) FROM videos v WHERE v.user_id = p.id) as video_count,
                (SELECT COALESCE(SUM(s.view_count), 0) FROM shares s
                 JOIN videos v ON s.video_id = v.id WHERE v.user_id = p.id) as total_views
              FROM profiles p
              ORDER BY p.created_at DESC
            ) u
          )
        );
      END;
      $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop the admin stats function
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS get_admin_stats();
    `);

    // Remove is_admin column
    await queryInterface.sequelize.query(`
      ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;
    `);
  }
};
