const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../database/ems.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Promisify database operations
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const initDatabase = async () => {
  try {
    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('student', 'faculty', 'admin')) NOT NULL,
        student_id TEXT UNIQUE,
        faculty_id TEXT UNIQUE,
        department TEXT,
        year INTEGER,
        semester TEXT,
        profile_image TEXT,
        phone TEXT,
        address TEXT,
        date_of_birth DATE,
        gender TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Courses table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_code TEXT UNIQUE NOT NULL,
        course_name TEXT NOT NULL,
        description TEXT,
        credits INTEGER NOT NULL,
        department TEXT,
        faculty_id INTEGER,
        semester TEXT,
        year INTEGER,
        schedule TEXT,
        max_students INTEGER,
        current_students INTEGER DEFAULT 0,
        status TEXT CHECK(status IN ('active', 'inactive', 'completed')) DEFAULT 'active',
        syllabus_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (faculty_id) REFERENCES users(id)
      )
    `);

    // Course enrollments
    await dbRun(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        grade TEXT,
        status TEXT CHECK(status IN ('enrolled', 'completed', 'dropped')) DEFAULT 'enrolled',
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        UNIQUE(student_id, course_id)
      )
    `);

    // Assignments table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date DATETIME NOT NULL,
        total_marks INTEGER NOT NULL,
        instructions TEXT,
        attachment_url TEXT,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Assignment submissions
    await dbRun(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        submission_text TEXT,
        attachment_url TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        marks_obtained INTEGER,
        feedback TEXT,
        graded_by INTEGER,
        graded_at DATETIME,
        status TEXT CHECK(status IN ('submitted', 'graded', 'late')) DEFAULT 'submitted',
        FOREIGN KEY (assignment_id) REFERENCES assignments(id),
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (graded_by) REFERENCES users(id),
        UNIQUE(assignment_id, student_id)
      )
    `);

    // Books/Library table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT UNIQUE,
        subject TEXT,
        category TEXT,
        description TEXT,
        cover_image_url TEXT,
        pdf_url TEXT,
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1,
        publisher TEXT,
        publication_year INTEGER,
        added_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (added_by) REFERENCES users(id)
      )
    `);

    // Book borrowings
    await dbRun(`
      CREATE TABLE IF NOT EXISTS book_borrowings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        borrowed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        due_date DATETIME NOT NULL,
        returned_date DATETIME,
        status TEXT CHECK(status IN ('borrowed', 'returned', 'overdue')) DEFAULT 'borrowed',
        fine_amount REAL DEFAULT 0,
        FOREIGN KEY (book_id) REFERENCES books(id),
        FOREIGN KEY (student_id) REFERENCES users(id)
      )
    `);

    // Workbooks table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS workbooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT,
        type TEXT CHECK(type IN ('pdf', 'doc', 'ppt', 'other')) DEFAULT 'pdf',
        file_url TEXT NOT NULL,
        description TEXT,
        uploaded_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        downloads INTEGER DEFAULT 0,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    // Announcements table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        target_audience TEXT CHECK(target_audience IN ('all', 'students', 'faculty', 'admin')) DEFAULT 'all',
        priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Sessions/Authentication tokens
    await dbRun(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create indexes for better performance
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_courses_faculty ON courses(faculty_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id)`);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  initDatabase
};