const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { dbRun, dbGet, dbAll } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all workbooks
router.get('/', authenticateToken, [
  query('subject').optional().isString(),
  query('type').optional().isIn(['pdf', 'doc', 'ppt', 'other']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { subject, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let whereClause = '1=1';
    const params = [];

    if (subject) {
      whereClause += ' AND subject = ?';
      params.push(subject);
    }

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    // Get total count
    const countResult = await dbGet(`SELECT COUNT(*) as total FROM workbooks WHERE ${whereClause}`, params);
    const total = countResult.total;

    // Get workbooks
    const workbooks = await dbAll(
      `SELECT w.*, u.name as uploaded_by_name
       FROM workbooks w
       LEFT JOIN users u ON w.uploaded_by = u.id
       WHERE ${whereClause}
       ORDER BY w.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        workbooks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get workbooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workbooks'
    });
  }
});

// Get workbook by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const workbook = await dbGet(
      `SELECT w.*, u.name as uploaded_by_name
       FROM workbooks w
       LEFT JOIN users u ON w.uploaded_by = u.id
       WHERE w.id = ?`,
      [id]
    );

    if (!workbook) {
      return res.status(404).json({
        success: false,
        message: 'Workbook not found'
      });
    }

    res.json({
      success: true,
      data: { workbook }
    });
  } catch (error) {
    console.error('Get workbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workbook'
    });
  }
});

// Upload workbook (Faculty/Admin only)
router.post('/', authenticateToken, authorizeRoles('faculty', 'admin'), [
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('subject').isLength({ min: 1, max: 100 }).withMessage('Subject is required'),
  body('type').isIn(['pdf', 'doc', 'ppt', 'other']).withMessage('Valid type required'),
  body('fileUrl').isURL().withMessage('Valid file URL required'),
  body('description').optional().isLength({ max: 1000 })
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

    const { title, subject, type, fileUrl, description } = req.body;
    const uploadedBy = req.user.id;

    const result = await dbRun(
      `INSERT INTO workbooks (title, subject, type, file_url, description, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, subject, type, fileUrl, description || null, uploadedBy]
    );

    // Get created workbook
    const workbook = await dbGet(
      `SELECT w.*, u.name as uploaded_by_name
       FROM workbooks w
       LEFT JOIN users u ON w.uploaded_by = u.id
       WHERE w.id = ?`,
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Workbook uploaded successfully',
      data: { workbook }
    });
  } catch (error) {
    console.error('Upload workbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload workbook'
    });
  }
});

// Update workbook (Uploader or Admin only)
router.put('/:id', authenticateToken, [
  body('title').optional().isLength({ min: 1, max: 200 }),
  body('subject').optional().isLength({ min: 1, max: 100 }),
  body('type').optional().isIn(['pdf', 'doc', 'ppt', 'other']),
  body('fileUrl').optional().isURL(),
  body('description').optional().isLength({ max: 1000 })
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
    const { title, subject, type, fileUrl, description } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if workbook exists
    const workbook = await dbGet('SELECT * FROM workbooks WHERE id = ?', [id]);
    if (!workbook) {
      return res.status(404).json({
        success: false,
        message: 'Workbook not found'
      });
    }

    // Check permissions (only uploader or admin can edit)
    if (userRole !== 'admin' && workbook.uploaded_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (subject !== undefined) {
      updates.push('subject = ?');
      values.push(subject);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
    }
    if (fileUrl !== undefined) {
      updates.push('file_url = ?');
      values.push(fileUrl);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    await dbRun(
      `UPDATE workbooks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated workbook
    const updatedWorkbook = await dbGet(
      `SELECT w.*, u.name as uploaded_by_name
       FROM workbooks w
       LEFT JOIN users u ON w.uploaded_by = u.id
       WHERE w.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Workbook updated successfully',
      data: { workbook: updatedWorkbook }
    });
  } catch (error) {
    console.error('Update workbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workbook'
    });
  }
});

// Delete workbook (Uploader or Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if workbook exists
    const workbook = await dbGet('SELECT * FROM workbooks WHERE id = ?', [id]);
    if (!workbook) {
      return res.status(404).json({
        success: false,
        message: 'Workbook not found'
      });
    }

    // Check permissions (only uploader or admin can delete)
    if (userRole !== 'admin' && workbook.uploaded_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await dbRun('DELETE FROM workbooks WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Workbook deleted successfully'
    });
  } catch (error) {
    console.error('Delete workbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workbook'
    });
  }
});

// Download workbook (increment download count)
router.post('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if workbook exists
    const workbook = await dbGet('SELECT id FROM workbooks WHERE id = ?', [id]);
    if (!workbook) {
      return res.status(404).json({
        success: false,
        message: 'Workbook not found'
      });
    }

    // Increment download count
    await dbRun('UPDATE workbooks SET downloads = downloads + 1 WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Download recorded successfully'
    });
  } catch (error) {
    console.error('Download workbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record download'
    });
  }
});

// Get workbook statistics (Admin only)
router.get('/stats/overview', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const stats = await dbAll(`
      SELECT
        subject,
        COUNT(*) as count,
        SUM(downloads) as total_downloads
      FROM workbooks
      GROUP BY subject
      ORDER BY total_downloads DESC
    `);

    const totalWorkbooks = await dbGet('SELECT COUNT(*) as total FROM workbooks');
    const totalDownloads = await dbGet('SELECT SUM(downloads) as total FROM workbooks');

    res.json({
      success: true,
      data: {
        totalWorkbooks: totalWorkbooks.total,
        totalDownloads: totalDownloads.total || 0,
        subjectBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Get workbook stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workbook statistics'
    });
  }
});

module.exports = router;