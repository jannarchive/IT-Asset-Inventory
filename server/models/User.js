import pool from '../config/Database.js';

// Get user by email — joins user_status so the controller can check active/inactive
export const getUserByEmail = async (email) => {
  try {
    const query = `
      SELECT
        su.system_users_id,
        su.email,
        su.password,
        su.full_name,
        su.user_status_id,
        su.created_at,
        us.user_status
      FROM system_users su
      JOIN user_status us ON su.user_status_id = us.user_status_id
      WHERE su.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const query =
      "SELECT system_users_id, email, full_name, created_at FROM system_users WHERE system_users_id = $1";
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const { full_name } = userData;
    const query =
      "UPDATE system_users SET full_name = $1, updated_at = NOW() WHERE system_users_id = $2 RETURNING *";
    const result = await pool.query(query, [full_name, userId]);
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const query = `
      SELECT su.system_users_id, su.email, su.full_name, su.created_at, us.user_status
      FROM system_users su
      JOIN user_status us ON su.user_status_id = us.user_status_id
      ORDER BY su.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};
