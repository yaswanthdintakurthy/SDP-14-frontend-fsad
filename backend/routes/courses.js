const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { dbRun, dbGet, dbAll } = require('../config/database');
const { authenticateToken, authorizeRoles, authorizeCourseAccess } = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', authenticateToken, [
  query('department').optional().isString(),
  query('facultyId').optional().isInt(),
  query('status').optional().isIn(['active', 'inactive', 'completed']),
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

    const { department, facultyId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Build query based on user role
    let whereClause = '1=1';
    const params = [];

    if (department) {
      whereClause += ' AND department = ?';
      params.push(department);
    }

    if (facultyId) {
      whereClause += ' AND faculty_id = ?';
      params.push(facultyId);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Role-based filtering
    if (userRole === 'faculty') {
      whereClause += ' AND faculty_id = ?';
      params.push(userId);
    } else if (userRole === 'student') {
      // Students see courses they're enrolled in or all active courses
      whereClause += ` AND (status = 'active' OR id IN (
        SELECT course_id FROM course_enrollments
        WHERE student_id = ? AND status = 'enrolled'
      ))`;
      params.push(userId);
    }

    // Get total count
    const countResult = await dbGet(`SELECT COUNT(*) as total FROM courses WHERE ${whereClause}`, params);
    const total = countResult.total;

    // Get courses with faculty info
    const courses = await dbAll(
      `SELECT c.*, u.name as faculty_name, u.email as faculty_email
       FROM courses c
       LEFT JOIN users u ON c.faculty_id = u.id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses'
    });
  }
});

// Get course by ID
router.get('/:id', authenticateToken, authorizeCourseAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const course = await dbGet(
      `SELECT c.*, u.name as faculty_name, u.email as faculty_email
       FROM courses c
       LEFT JOIN users u ON c.faculty_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get enrolled students count
    const enrollmentCount = await dbGet(
      'SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = ? AND status = "enrolled"',
      [id]
    );

    course.enrolled_students = enrollmentCount.count;

    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course'
    });
  }
});

// Create new course (Faculty and Admin only)
router.post('/', authenticateToken, authorizeRoles('faculty', 'admin'), [
  body('courseCode').isLength({ min: 1, max: 20 }).withMessage('Course code is required'),
  body('courseName').isLength({ min: 1, max: 200 }).withMessage('Course name is required'),
  body('description').optional().isLength({ max: 1000 }),
  body('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be 1-6'),
  body('department').isLength({ min: 1, max: 100 }).withMessage('Department is required'),
  body('semester').isIn(['Fall', 'Spring', 'Summer']).withMessage('Invalid semester'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Invalid year'),
  body('maxStudents').optional().isInt({ min: 1, max: 500 }),
  body('schedule').optional().isLength({ max: 500 })
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

    const {
      courseCode, courseName, description, credits, department,
      semester, year, maxStudents, schedule, syllabusUrl
    } = req.body;
    const facultyId = req.user.role === 'faculty' ? req.user.id : req.body.facultyId;

    // Check if course code already exists
    const existingCourse = await dbGet('SELECT id FROM courses WHERE course_code = ?', [courseCode]);
    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: 'Course code already exists'
      });
    }

    // If admin is creating course, verify faculty exists
    if (req.user.role === 'admin' && facultyId) {
      const faculty = await dbGet('SELECT id FROM users WHERE id = ? AND role = "faculty"', [facultyId]);
      if (!faculty) {
        return res.status(400).json({
          success: false,
          message: 'Invalid faculty ID'
        });
      }
    }

    const result = await dbRun(
      `INSERT INTO courses (course_code, course_name, description, credits, department,
                           faculty_id, semester, year, max_students, schedule, syllabus_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseCode, courseName, description || null, credits, department,
       facultyId, semester, year, maxStudents || 100, schedule || null, syllabusUrl || null]
    );

    // Get created course
    const course = await dbGet(
      `SELECT c.*, u.name as faculty_name
       FROM courses c
       LEFT JOIN users u ON c.faculty_id = u.id
       WHERE c.id = ?`,
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
});

// Update course (Faculty/Admin with access)
router.put('/:id', authenticateToken, authorizeCourseAccess, [
  body('courseName').optional().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('credits').optional().isInt({ min: 1, max: 6 }),
  body('department').optional().isLength({ min: 1, max: 100 }),
  body('semester').optional().isIn(['Fall', 'Spring', 'Summer']),
  body('year').optional().isInt({ min: 2020, max: 2030 }),
  body('maxStudents').optional().isInt({ min: 1, max: 500 }),
  body('schedule').optional().isLength({ max: 500 }),
  body('status').optional().isIn(['active', 'inactive', 'completed'])
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
    const {
      courseName, description, credits, department, semester, year,
      maxStudents, schedule, status, syllabusUrl
    } = req.body;

    // Check if course exists
    const existingCourse = await dbGet('SELECT id FROM courses WHERE id = ?', [id]);
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (courseName !== undefined) {
      updates.push('course_name = ?');
      values.push(courseName);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (credits !== undefined) {
      updates.push('credits = ?');
      values.push(credits);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department);
    }
    if (semester !== undefined) {
      updates.push('semester = ?');
      values.push(semester);
    }
    if (year !== undefined) {
      updates.push('year = ?');
      values.push(year);
    }
    if (maxStudents !== undefined) {
      updates.push('max_students = ?');
      values.push(maxStudents);
    }
    if (schedule !== undefined) {
      updates.push('schedule = ?');
      values.push(schedule);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (syllabusUrl !== undefined) {
      updates.push('syllabus_url = ?');
      values.push(syllabusUrl);
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
      `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated course
    const course = await dbGet(
      `SELECT c.*, u.name as faculty_name
       FROM courses c
       LEFT JOIN users u ON c.faculty_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course'
    });
  }
});

// Delete course (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const course = await dbGet('SELECT id FROM courses WHERE id = ?', [id]);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if students are enrolled
    const enrollmentCount = await dbGet(
      'SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = ? AND status = "enrolled"',
      [id]
    );

    if (enrollmentCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with enrolled students'
      });
    }

    await dbRun('DELETE FROM courses WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course'
    });
  }
});

// Get course enrollments
router.get('/:id/enrollments', authenticateToken, authorizeCourseAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const enrollments = await dbAll(
      `SELECT ce.*, u.name, u.email, u.student_id
       FROM course_enrollments ce
       JOIN users u ON ce.student_id = u.id
       WHERE ce.course_id = ?
       ORDER BY ce.enrollment_date DESC`,
      [id]
    );

    res.json({
      success: true,
      data: { enrollments }
    });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course enrollments'
    });
  }
});

// Enroll student in course
router.post('/:id/enroll', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;

    // Check if course exists and is active
    const course = await dbGet('SELECT * FROM courses WHERE id = ? AND status = "active"', [courseId]);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not active'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await dbGet(
      'SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Check course capacity
    const enrollmentCount = await dbGet(
      'SELECT COUNT(*) as count FROM course_enrollments WHERE course_id = ? AND status = "enrolled"',
      [courseId]
    );

    if (enrollmentCount.count >= course.max_students) {
      return res.status(400).json({
        success: false,
        message: 'Course is full'
      });
    }

    // Enroll student
    await dbRun(
      'INSERT INTO course_enrollments (student_id, course_id) VALUES (?, ?)',
      [studentId, courseId]
    );

    // Update current students count
    await dbRun(
      'UPDATE courses SET current_students = current_students + 1 WHERE id = ?',
      [courseId]
    );

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course'
    });
  }
});

// Unenroll student from course
router.delete('/:id/enroll', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;

    const result = await dbRun(
      'UPDATE course_enrollments SET status = "dropped" WHERE course_id = ? AND student_id = ? AND status = "enrolled"',
      [courseId, studentId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update current students count
    await dbRun(
      'UPDATE courses SET current_students = current_students - 1 WHERE id = ?',
      [courseId]
    );

    res.json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unenroll from course'
    });
  }
});

module.exports = router;