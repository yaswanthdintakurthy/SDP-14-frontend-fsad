# Educational Management System - Backend

A comprehensive backend API for an Educational Management System built with Node.js, Express, and SQLite.

## Features

- **User Management**: Student, Faculty, and Admin role-based authentication
- **Course Management**: Create, update, and manage courses with enrollment
- **Assignment System**: Create assignments, submit work, and grade submissions
- **Library Management**: Book catalog with borrowing/returning functionality
- **Workbook Repository**: Upload and manage educational resources
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user types

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs
- **File Handling**: Multer (for future file uploads)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env` file and update the values
   - Change the JWT secret for production
   - Update email settings if needed

4. Start the development server:
   ```bash
   npm run dev
   ```

5. For production:
   ```bash
   npm start
   ```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/reset-password` - Reset user password

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Faculty/Admin)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `GET /api/courses/:id/enrollments` - Get course enrollments
- `POST /api/courses/:id/enroll` - Enroll in course
- `DELETE /api/courses/:id/enroll` - Unenroll from course

### Assignments
- `GET /api/assignments/course/:courseId` - Get assignments for course
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments` - Create assignment (Faculty)
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment
- `POST /api/assignments/:id/submit` - Submit assignment
- `GET /api/assignments/:id/submissions` - Get submissions (Faculty)
- `PUT /api/assignments/:id/submissions/:submissionId` - Grade submission

### Students
- `GET /api/students` - Get all students (Faculty/Admin)
- `GET /api/students/:id` - Get student profile

### Library
- `GET /api/library` - Get all books
- `GET /api/library/:id` - Get book by ID
- `POST /api/library` - Add new book (Admin/Faculty)
- `PUT /api/library/:id` - Update book
- `DELETE /api/library/:id` - Delete book
- `POST /api/library/:id/borrow` - Borrow book
- `POST /api/library/:id/return` - Return book
- `GET /api/library/:id/borrowings` - Get borrowing history

### Workbooks
- `GET /api/workbooks` - Get all workbooks
- `GET /api/workbooks/:id` - Get workbook by ID
- `POST /api/workbooks` - Upload workbook (Faculty/Admin)
- `PUT /api/workbooks/:id` - Update workbook
- `DELETE /api/workbooks/:id` - Delete workbook
- `POST /api/workbooks/:id/download` - Record download

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `courses` - Course information
- `course_enrollments` - Student course enrollments
- `assignments` - Assignment details
- `assignment_submissions` - Student submissions
- `books` - Library book catalog
- `book_borrowings` - Book borrowing records
- `workbooks` - Educational resources
- `announcements` - System announcements
- `sessions` - User authentication sessions

## Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Tokens**: Stateless authentication with expiration
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Comprehensive validation using express-validator
- **CORS**: Configured for frontend integration
- **Helmet**: Security headers
- **SQL Injection Protection**: Parameterized queries

## User Roles & Permissions

### Student
- View enrolled courses and assignments
- Submit assignments
- Borrow/return library books
- Access workbooks
- Update own profile

### Faculty
- Create and manage courses
- Create and grade assignments
- View student submissions
- Add library books
- Upload workbooks
- View student information

### Admin
- All faculty permissions
- User management (create, update, delete)
- System-wide access
- Delete courses and books
- System announcements

## Development

### Project Structure
```
backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js             # Authentication middleware
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── users.js            # User management
│   ├── courses.js          # Course management
│   ├── assignments.js      # Assignment system
│   ├── students.js         # Student operations
│   ├── library.js          # Library management
│   └── workbooks.js        # Workbook repository
├── uploads/                # File uploads directory
├── database/               # SQLite database files
├── .env                    # Environment variables
├── server.js               # Main application file
└── package.json            # Dependencies and scripts
```

### Running Tests
```bash
npm test
```

### Database Migrations
The database is automatically initialized when the server starts. No manual migrations needed.

## Deployment

1. Set `NODE_ENV=production` in environment variables
2. Use a process manager like PM2
3. Configure a reverse proxy (nginx)
4. Set up SSL certificates
5. Use environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.