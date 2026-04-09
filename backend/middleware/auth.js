const jwt = require('jsonwebtoken');
const { dbGet } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Check if session exists and is valid
    const session = await dbGet(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
      [token]
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Get user details
    const user = await dbGet(
      'SELECT id, name, email, role, student_id, faculty_id, department, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

const authorizeCourseAccess = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'admin') {
      return next();
    }

    if (userRole === 'faculty') {
      // Check if faculty teaches this course
      const course = await dbGet(
        'SELECT * FROM courses WHERE id = ? AND faculty_id = ?',
        [courseId, userId]
      );
      if (course) return next();
    }

    if (userRole === 'student') {
      // Check if student is enrolled in this course
      const enrollment = await dbGet(
        'SELECT * FROM course_enrollments WHERE course_id = ? AND student_id = ? AND status = "enrolled"',
        [courseId, userId]
      );
      if (enrollment) return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this course'
    });
  } catch (error) {
    console.error('Course access authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization failed'
    });
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeCourseAccess
};