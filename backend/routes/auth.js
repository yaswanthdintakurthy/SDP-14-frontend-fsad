const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { dbRun, dbGet, dbAll } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Create session
const createSession = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await dbRun(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt.toISOString()]
  );
};

// Register new user
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'faculty', 'admin']).withMessage('Invalid role'),
  body('studentId').optional().isLength({ min: 1, max: 20 }),
  body('facultyId').optional().isLength({ min: 1, max: 20 }),
  body('department').optional().isLength({ min: 1, max: 100 })
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

    const { name, email, password, role, studentId, facultyId, department, year, semester } = req.body;

    // Check if user already exists
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check ID uniqueness based on role
    if (role === 'student' && studentId) {
      const existingStudent = await dbGet('SELECT id FROM users WHERE student_id = ?', [studentId]);
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }

    if (role === 'faculty' && facultyId) {
      const existingFaculty = await dbGet('SELECT id FROM users WHERE faculty_id = ?', [facultyId]);
      if (existingFaculty) {
        return res.status(409).json({
          success: false,
          message: 'Faculty ID already exists'
        });
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await dbRun(
      `INSERT INTO users (name, email, password, role, student_id, faculty_id, department, year, semester)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, studentId || null, facultyId || null, department || null, year || null, semester || null]
    );

    // Generate token and create session
    const token = generateToken(result.id);
    await createSession(result.id, token);

    // Get user data (without password)
    const user = await dbGet(
      'SELECT id, name, email, role, student_id, faculty_id, department, year, semester, created_at FROM users WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password is required'),
  body('role').isIn(['student', 'faculty', 'admin']).withMessage('Invalid role')
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

    const { email, password, role } = req.body;

    // Find user
    const user = await dbGet(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email, role]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token and create session
    const token = generateToken(user.id);
    await createSession(user.id, token);

    // Return user data (without password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      student_id: user.student_id,
      faculty_id: user.faculty_id,
      department: user.department,
      year: user.year,
      semester: user.semester
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers['authorization'].split(' ')[1];

    // Remove session
    await dbRun('DELETE FROM sessions WHERE token = ?', [token]);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      `SELECT id, name, email, role, student_id, faculty_id, department, year, semester,
              profile_image, phone, address, date_of_birth, gender, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.user.id]
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone(),
  body('department').optional().isLength({ min: 1, max: 100 }),
  body('address').optional().isLength({ min: 1, max: 500 }),
  body('gender').optional().isIn(['male', 'female', 'other'])
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

    const { name, phone, department, address, gender } = req.body;
    const userId = req.user.id;

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      values.push(gender);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    await dbRun(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user data
    const user = await dbGet(
      `SELECT id, name, email, role, student_id, faculty_id, department, year, semester,
              profile_image, phone, address, date_of_birth, gender, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current user
    const user = await dbGet('SELECT password FROM users WHERE id = ?', [userId]);

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await dbRun('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, userId]);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;