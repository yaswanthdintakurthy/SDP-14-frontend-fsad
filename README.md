# Educational Management System

A comprehensive full-stack educational management system with separate frontend and backend applications.

## Project Structure

```
educational-management-system/
├── frontend/          # React frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   ├── package.json  # Frontend dependencies
│   └── vite.config.ts # Vite configuration
├── backend/           # Node.js backend API
│   ├── routes/       # API route handlers
│   ├── middleware/   # Authentication & authorization
│   ├── config/       # Database configuration
│   ├── uploads/      # File upload directory
│   ├── database/     # SQLite database files
│   ├── server.js     # Main server file
│   ├── package.json  # Backend dependencies
│   └── README.md     # Backend documentation
└── README.md         # This file
```

## Features

### 🎓 Student Features
- Course enrollment and management
- Assignment submission and tracking
- Library book borrowing
- Access to workbooks and resources
- Profile management

### 👨‍🏫 Faculty Features
- Course creation and management
- Assignment creation and grading
- Student progress monitoring
- Resource uploading
- Library book management

### 👑 Admin Features
- User management (students, faculty, admins)
- System-wide course management
- Library administration
- System announcements
- Analytics and reporting

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yaswanthdintakurthy/SDP-14-frontend-fsad.git
   cd educational-management-system
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   # Copy and configure .env file
   cp .env.example .env  # Configure your environment variables
   npm run dev  # Development server on http://localhost:5000
   ```

3. **Setup Frontend (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev  # Development server on http://localhost:3000
   ```

## API Documentation

The backend provides a comprehensive REST API. See `backend/README.md` for detailed API documentation including:

- Authentication endpoints
- User management
- Course management
- Assignment system
- Library management
- Workbook repository

## Database Schema

The system uses SQLite with the following main entities:
- **Users** (students, faculty, admins)
- **Courses** with enrollment tracking
- **Assignments** and submissions
- **Library books** with borrowing records
- **Workbooks** and resources
- **Announcements** and notifications

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Security headers with Helmet

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests (if implemented)
cd frontend && npm test
```

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

## Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Use PM2 or similar process manager
3. Configure reverse proxy (nginx)
4. Set up SSL certificates
5. Use environment variables for secrets

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Serve static files from `dist/` directory
3. Configure API endpoints for production

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## User Roles & Permissions

### Student Permissions
- ✅ View enrolled courses
- ✅ Submit assignments
- ✅ Borrow library books
- ✅ Access workbooks
- ✅ Update profile

### Faculty Permissions
- ✅ All student permissions
- ✅ Create/manage courses
- ✅ Create/grade assignments
- ✅ Upload resources
- ✅ View student progress

### Admin Permissions
- ✅ All faculty permissions
- ✅ User management
- ✅ System administration
- ✅ Delete/modify any data

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@ems.com or create an issue in the GitHub repository.

## Roadmap

- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Video conferencing integration
- [ ] Payment system for courses
- [ ] Multi-language support
- [ ] Advanced reporting features

---

**Frontend Repository:** [SDP-14-frontend-fsad](https://github.com/yaswanthdintakurthy/SDP-14-frontend-fsad)

Built with ❤️ for educational excellence