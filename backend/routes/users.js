const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult, query } = require('express-validator');
const { dbRun, dbGet, dbAll } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), [
  query('role').optional().isIn(['student', 'faculty', 'admin']),
  query('department').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { role, department, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let whereClause = '1=1';
    const params = [];

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (department) {
      whereClause += ' AND department = ?';
      params.push(department);
    }

    // Get total count
    const countResult = await dbGet(`SELECT COUNT(*) as total FROM users WHERE ${whereClause}`, params);
    const total = countResult.total;

    // Get users
    const users = await dbAll(
      `SELECT id, name, email, role, student_id, faculty_id, department, year, semester,
              profile_image, phone, is_active, created_at, updated_at
       FROM users
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Users can only view their own profile unless they're admin
    if (currentUser.role !== 'admin' && currentUser.id != id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await dbGet(
      `SELECT id, name, email, role, student_id, faculty_id, department, year, semester,
              profile_image, phone, address, date_of_birth, gender, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['student', 'faculty', 'admin']),
  body('department').optional().isLength({ min: 1, max: 100 }),
  body('year').optional().isInt({ min: 1, max: 4 }),
  body('semester').optional().isIn(['Fall', 'Spring', 'Summer']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, email, role, department, year, semester, isActive } = req.body;

    // Check if user exists
    const existingUser = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check email uniqueness if email is being updated
    if (email) {
      const emailUser = await dbGet('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Build update query
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department);
    }
    if (year !== undefined) {
      updates.push('year = ?');
      values.push(year);
    }
    if (semester !== undefined) {
      updates.push('semester = ?');
      values.push(semester);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await dbRun(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user
    const user = await dbGet(
      `SELECT id, name, email, role, student_id, faculty_id, department, year, semester,
              is_active, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await dbGet('SELECT id, role FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Soft delete by deactivating
    await dbRun('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Reset user password (Admin only)
router.post('/:id/reset-password', authenticateToken, authorizeRoles('admin'), [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    // Check if user exists
    const user = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await dbRun('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, id]);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// Get user statistics (Admin only)
router.get('/stats/overview', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const stats = await dbAll(`
      SELECT
        role,
        COUNT(*) as count,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
      FROM users
      GROUP BY role
    `);

    const totalUsers = await dbGet('SELECT COUNT(*) as total FROM users');
    const activeUsers = await dbGet('SELECT COUNT(*) as total FROM users WHERE is_active = 1');

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers.total,
        activeUsers: activeUsers.total,
        roleBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

module.exports = router;