const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { dbGet, dbAll } = require('../config/database');

const router = express.Router();

// Get all students (Faculty/Admin only)
router.get('/', authenticateToken, authorizeRoles('faculty', 'admin'), async (req, res) => {
  try {
    const students = await dbAll(
      `SELECT id, name, email, student_id, department, year, semester, profile_image, is_active
       FROM users
       WHERE role = 'student'
       ORDER BY name`
    );

    res.json({
      success: true,
      data: { students }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students'
    });
  }
});

// Get student profile
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Students can only view their own profile unless they're faculty/admin
    if (currentUser.role === 'student' && currentUser.id != id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const student = await dbGet(
      `SELECT id, name, email, student_id, department, year, semester,
              profile_image, phone, address, is_active
       FROM users WHERE id = ? AND role = 'student'`,
      [id]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: { student }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student'
    });
  }
});

module.exports = router;