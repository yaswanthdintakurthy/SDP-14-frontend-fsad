const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { dbRun, dbGet, dbAll } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all books
router.get('/', authenticateToken, [
  query('subject').optional().isString(),
  query('category').optional().isString(),
  query('available').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { subject, category, available, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let whereClause = '1=1';
    const params = [];

    if (subject) {
      whereClause += ' AND subject = ?';
      params.push(subject);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (available !== undefined) {
      if (available === 'true') {
        whereClause += ' AND available_copies > 0';
      } else {
        whereClause += ' AND available_copies = 0';
      }
    }

    // Get total count
    const countResult = await dbGet(`SELECT COUNT(*) as total FROM books WHERE ${whereClause}`, params);
    const total = countResult.total;

    // Get books
    const books = await dbAll(
      `SELECT b.*, u.name as added_by_name
       FROM books b
       LEFT JOIN users u ON b.added_by = u.id
       WHERE ${whereClause}
       ORDER BY b.title
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get books'
    });
  }
});

// Get book by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const book = await dbGet(
      `SELECT b.*, u.name as added_by_name
       FROM books b
       LEFT JOIN users u ON b.added_by = u.id
       WHERE b.id = ?`,
      [id]
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      data: { book }
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get book'
    });
  }
});

// Add new book (Admin/Faculty only)
router.post('/', authenticateToken, authorizeRoles('admin', 'faculty'), [
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('author').isLength({ min: 1, max: 100 }).withMessage('Author is required'),
  body('isbn').optional().isLength({ min: 10, max: 13 }),
  body('subject').isLength({ min: 1, max: 100 }).withMessage('Subject is required'),
  body('category').isLength({ min: 1, max: 100 }).withMessage('Category is required'),
  body('totalCopies').isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
  body('publisher').optional().isLength({ max: 100 }),
  body('publicationYear').optional().isInt({ min: 1000, max: new Date().getFullYear() })
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
      title, author, isbn, subject, category, description,
      coverImageUrl, pdfUrl, totalCopies, publisher, publicationYear
    } = req.body;
    const addedBy = req.user.id;

    // Check if ISBN already exists (if provided)
    if (isbn) {
      const existingBook = await dbGet('SELECT id FROM books WHERE isbn = ?', [isbn]);
      if (existingBook) {
        return res.status(409).json({
          success: false,
          message: 'Book with this ISBN already exists'
        });
      }
    }

    const result = await dbRun(
      `INSERT INTO books (title, author, isbn, subject, category, description,
                         cover_image_url, pdf_url, total_copies, available_copies,
                         publisher, publication_year, added_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, isbn || null, subject, category, description || null,
       coverImageUrl || null, pdfUrl || null, totalCopies, totalCopies,
       publisher || null, publicationYear || null, addedBy]
    );

    // Get created book
    const book = await dbGet(
      `SELECT b.*, u.name as added_by_name
       FROM books b
       LEFT JOIN users u ON b.added_by = u.id
       WHERE b.id = ?`,
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: { book }
    });
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add book'
    });
  }
});

// Update book (Admin/Faculty only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'faculty'), [
  body('title').optional().isLength({ min: 1, max: 200 }),
  body('author').optional().isLength({ min: 1, max: 100 }),
  body('isbn').optional().isLength({ min: 10, max: 13 }),
  body('subject').optional().isLength({ min: 1, max: 100 }),
  body('category').optional().isLength({ min: 1, max: 100 }),
  body('totalCopies').optional().isInt({ min: 1 })
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
    const { title, author, isbn, subject, category, description, coverImageUrl, pdfUrl, totalCopies } = req.body;

    // Check if book exists
    const existingBook = await dbGet('SELECT id, total_copies FROM books WHERE id = ?', [id]);
    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check ISBN uniqueness if changed
    if (isbn && isbn !== existingBook.isbn) {
      const isbnBook = await dbGet('SELECT id FROM books WHERE isbn = ? AND id != ?', [isbn, id]);
      if (isbnBook) {
        return res.status(409).json({
          success: false,
          message: 'ISBN already exists'
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
    if (author !== undefined) {
      updates.push('author = ?');
      values.push(author);
    }
    if (isbn !== undefined) {
      updates.push('isbn = ?');
      values.push(isbn);
    }
    if (subject !== undefined) {
      updates.push('subject = ?');
      values.push(subject);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (coverImageUrl !== undefined) {
      updates.push('cover_image_url = ?');
      values.push(coverImageUrl);
    }
    if (pdfUrl !== undefined) {
      updates.push('pdf_url = ?');
      values.push(pdfUrl);
    }
    if (totalCopies !== undefined) {
      updates.push('total_copies = ?');
      values.push(totalCopies);
      // Adjust available copies if total changed
      const currentAvailable = existingBook.total_copies - (existingBook.total_copies - existingBook.available_copies);
      const newAvailable = Math.min(currentAvailable, totalCopies);
      updates.push('available_copies = ?');
      values.push(newAvailable);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    await dbRun(
      `UPDATE books SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated book
    const book = await dbGet(
      `SELECT b.*, u.name as added_by_name
       FROM books b
       LEFT JOIN users u ON b.added_by = u.id
       WHERE b.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: { book }
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book'
    });
  }
});

// Delete book (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if book exists
    const book = await dbGet('SELECT id FROM books WHERE id = ?', [id]);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book is borrowed
    const borrowedCount = await dbGet(
      'SELECT COUNT(*) as count FROM book_borrowings WHERE book_id = ? AND status = "borrowed"',
      [id]
    );

    if (borrowedCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book that is currently borrowed'
      });
    }

    await dbRun('DELETE FROM books WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book'
    });
  }
});

// Borrow book (Students only)
router.post('/:id/borrow', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // Check if book exists and is available
    const book = await dbGet('SELECT * FROM books WHERE id = ? AND available_copies > 0', [id]);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found or not available'
      });
    }

    // Check if student already has this book borrowed
    const existingBorrowing = await dbGet(
      'SELECT id FROM book_borrowings WHERE book_id = ? AND student_id = ? AND status = "borrowed"',
      [id, studentId]
    );

    if (existingBorrowing) {
      return res.status(409).json({
        success: false,
        message: 'You already have this book borrowed'
      });
    }

    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create borrowing record
    await dbRun(
      'INSERT INTO book_borrowings (book_id, student_id, due_date) VALUES (?, ?, ?)',
      [id, studentId, dueDate.toISOString()]
    );

    // Update available copies
    await dbRun('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [id]);

    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      data: { dueDate: dueDate.toISOString() }
    });
  } catch (error) {
    console.error('Borrow book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to borrow book'
    });
  }
});

// Return book
router.post('/:id/return', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find borrowing record
    let borrowingQuery = 'SELECT * FROM book_borrowings WHERE book_id = ? AND status = "borrowed"';
    let params = [id];

    if (userRole === 'student') {
      borrowingQuery += ' AND student_id = ?';
      params.push(userId);
    }

    const borrowing = await dbGet(borrowingQuery, params);

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: 'Borrowing record not found'
      });
    }

    // Check if overdue
    const now = new Date();
    const dueDate = new Date(borrowing.due_date);
    const isOverdue = now > dueDate;

    // Update borrowing record
    await dbRun(
      'UPDATE book_borrowings SET status = "returned", returned_date = ? WHERE id = ?',
      [now.toISOString(), borrowing.id]
    );

    // Update available copies
    await dbRun('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Book returned successfully${isOverdue ? ' (Was overdue)' : ''}`,
      data: { isOverdue }
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return book'
    });
  }
});

// Get borrowing history
router.get('/:id/borrowings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT bb.*, u.name as student_name, u.email as student_email, u.student_id
      FROM book_borrowings bb
      JOIN users u ON bb.student_id = u.id
      WHERE bb.book_id = ?
    `;
    let params = [id];

    if (userRole === 'student') {
      query += ' AND bb.student_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY bb.borrowed_date DESC';

    const borrowings = await dbAll(query, params);

    res.json({
      success: true,
      data: { borrowings }
    });
  } catch (error) {
    console.error('Get borrowings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get borrowing history'
    });
  }
});

module.exports = router;