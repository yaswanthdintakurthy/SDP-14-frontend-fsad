const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { dbRun, dbGet, dbAll } = require('../config/database');
const { authenticateToken, authorizeRoles, authorizeCourseAccess } = require('../middleware/auth');

const router = express.Router();

// Get assignments for a course
router.get('/course/:courseId', authenticateToken, authorizeCourseAccess, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
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

    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get assignments
    const assignments = await dbAll(
      `SELECT a.*, u.name as created_by_name
       FROM assignments a
       JOIN users u ON a.created_by = u.id
       WHERE a.course_id = ?
       ORDER BY a.due_date ASC
       LIMIT ? OFFSET ?`,
      [courseId, limit, offset]
    );

    // Get total count
    const countResult = await dbGet('SELECT COUNT(*) as total FROM assignments WHERE course_id = ?', [courseId]);
    const total = countResult.total;

    // If student, get submission status for each assignment
    if (userRole === 'student') {
      for (let assignment of assignments) {
        const submission = await dbGet(
          'SELECT id, status, marks_obtained FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
          [assignment.id, userId]
        );
        assignment.submission = submission || null;
      }
    }

    res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assignments'
    });
  }
});

// Get single assignment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const assignment = await dbGet(
      `SELECT a.*, u.name as created_by_name, c.course_name, c.course_code
       FROM assignments a
       JOIN users u ON a.created_by = u.id
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check access (must be enrolled in course or be faculty/admin)
    if (userRole === 'student') {
      const enrollment = await dbGet(
        'SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ? AND status = "enrolled"',
        [assignment.course_id, userId]
      );
      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (userRole === 'faculty') {
      if (assignment.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: { assignment }
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assignment'
    });
  }
});

// Create assignment (Faculty only)
router.post('/', authenticateToken, authorizeRoles('faculty'), [
  body('courseId').isInt().withMessage('Valid course ID required'),
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('description').optional().isLength({ max: 2000 }),
  body('dueDate').isISO8601().withMessage('Valid due date required'),
  body('totalMarks').isInt({ min: 1, max: 1000 }).withMessage('Valid total marks required'),
  body('instructions').optional().isLength({ max: 2000 }),
  body('attachmentUrl').optional().isURL()
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

    const { courseId, title, description, dueDate, totalMarks, instructions, attachmentUrl } = req.body;
    const facultyId = req.user.id;

    // Check if course exists and faculty teaches it
    const course = await dbGet(
      'SELECT id FROM courses WHERE id = ? AND faculty_id = ?',
      [courseId, facultyId]
    );

    if (!course) {
      return res.status(403).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Validate due date is in future
    const dueDateTime = new Date(dueDate);
    if (dueDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Due date must be in the future'
      });
    }

    const result = await dbRun(
      `INSERT INTO assignments (course_id, title, description, due_date, total_marks,
                               instructions, attachment_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, title, description || null, dueDate, totalMarks,
       instructions || null, attachmentUrl || null, facultyId]
    );

    // Get created assignment
    const assignment = await dbGet(
      `SELECT a.*, u.name as created_by_name
       FROM assignments a
       JOIN users u ON a.created_by = u.id
       WHERE a.id = ?`,
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment'
    });
  }
});

// Update assignment (Faculty only)
router.put('/:id', authenticateToken, authorizeRoles('faculty'), [
  body('title').optional().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 2000 }),
  body('dueDate').optional().isISO8601(),
  body('totalMarks').optional().isInt({ min: 1, max: 1000 }),
  body('instructions').optional().isLength({ max: 2000 }),
  body('attachmentUrl').optional().isURL()
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
    const { title, description, dueDate, totalMarks, instructions, attachmentUrl } = req.body;
    const facultyId = req.user.id;

    // Check if assignment exists and faculty owns it
    const assignment = await dbGet(
      'SELECT id, course_id FROM assignments WHERE id = ? AND created_by = ?',
      [id, facultyId]
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or access denied'
      });
    }

    // Validate due date if provided
    if (dueDate) {
      const dueDateTime = new Date(dueDate);
      if (dueDateTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Due date must be in the future'
        });
      }
    }

    // Build update query
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(dueDate);
    }
    if (totalMarks !== undefined) {
      updates.push('total_marks = ?');
      values.push(totalMarks);
    }
    if (instructions !== undefined) {
      updates.push('instructions = ?');
      values.push(instructions);
    }
    if (attachmentUrl !== undefined) {
      updates.push('attachment_url = ?');
      values.push(attachmentUrl);
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
      `UPDATE assignments SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated assignment
    const updatedAssignment = await dbGet(
      `SELECT a.*, u.name as created_by_name
       FROM assignments a
       JOIN users u ON a.created_by = u.id
       WHERE a.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment: updatedAssignment }
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment'
    });
  }
});

// Delete assignment (Faculty only)
router.delete('/:id', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.user.id;

    // Check if assignment exists and faculty owns it
    const assignment = await dbGet(
      'SELECT id FROM assignments WHERE id = ? AND created_by = ?',
      [id, facultyId]
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or access denied'
      });
    }

    // Check if there are submissions
    const submissionCount = await dbGet(
      'SELECT COUNT(*) as count FROM assignment_submissions WHERE assignment_id = ?',
      [id]
    );

    if (submissionCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete assignment with existing submissions'
      });
    }

    await dbRun('DELETE FROM assignments WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment'
    });
  }
});

// Submit assignment (Students only)
router.post('/:id/submit', authenticateToken, authorizeRoles('student'), [
  body('submissionText').optional().isLength({ max: 5000 }),
  body('attachmentUrl').optional().isURL()
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
    const { submissionText, attachmentUrl } = req.body;
    const studentId = req.user.id;

    // Check if assignment exists
    const assignment = await dbGet('SELECT * FROM assignments WHERE id = ?', [id]);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if student is enrolled in the course
    const enrollment = await dbGet(
      'SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ? AND status = "enrolled"',
      [assignment.course_id, studentId]
    );

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Check if already submitted
    const existingSubmission = await dbGet(
      'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [id, studentId]
    );

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: 'Assignment already submitted'
      });
    }

    // Check if past due date
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isLate = now > dueDate;

    const result = await dbRun(
      `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, attachment_url, status)
       VALUES (?, ?, ?, ?, ?)`,
      [id, studentId, submissionText || null, attachmentUrl || null, isLate ? 'late' : 'submitted']
    );

    res.status(201).json({
      success: true,
      message: `Assignment submitted successfully${isLate ? ' (Late submission)' : ''}`,
      data: { submissionId: result.id, isLate }
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment'
    });
  }
});

// Get assignment submissions (Faculty only)
router.get('/:id/submissions', authenticateToken, authorizeRoles('faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.user.id;

    // Check if assignment exists and faculty owns it
    const assignment = await dbGet(
      'SELECT id FROM assignments WHERE id = ? AND created_by = ?',
      [id, facultyId]
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or access denied'
      });
    }

    const submissions = await dbAll(
      `SELECT s.*, u.name as student_name, u.email as student_email, u.student_id
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = ?
       ORDER BY s.submitted_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: { submissions }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get submissions'
    });
  }
});

// Grade submission (Faculty only)
router.put('/:id/submissions/:submissionId', authenticateToken, authorizeRoles('faculty'), [
  body('marks').isInt({ min: 0 }).withMessage('Valid marks required'),
  body('feedback').optional().isLength({ max: 1000 })
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

    const { id, submissionId } = req.params;
    const { marks, feedback } = req.body;
    const facultyId = req.user.id;

    // Check if assignment exists and faculty owns it
    const assignment = await dbGet(
      'SELECT id, total_marks FROM assignments WHERE id = ? AND created_by = ?',
      [id, facultyId]
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found or access denied'
      });
    }

    // Validate marks
    if (marks > assignment.total_marks) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed total marks (${assignment.total_marks})`
      });
    }

    // Update submission
    const result = await dbRun(
      `UPDATE assignment_submissions
       SET marks_obtained = ?, feedback = ?, graded_by = ?, graded_at = CURRENT_TIMESTAMP, status = 'graded'
       WHERE id = ? AND assignment_id = ?`,
      [marks, feedback || null, facultyId, submissionId, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Submission graded successfully'
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade submission'
    });
  }
});

module.exports = router;