
# 🅿️ Smart Parking System

A comprehensive web-based parking management system with real-time tracking, reservations, and multi-user roles.

parking system link: https://smart-parking-system-2lh9.onrender.com

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [File Structure](#file-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### 🚗 For Drivers
- Real-time parking spot search with map integration
- GPS-based location detection
- Reserve parking spots for 30 minutes
- Start/end parking sessions
- View active sessions and reservations
- Rate calculation based on hourly pricing
- Vehicle plate and model registration

### 🏢 For Parking Owners
- Dashboard with statistics and earnings
- Add/Edit/Delete parking spaces
- Upload parking images and legal documents
- Manage parking availability (activate/deactivate)
- View active sessions and pending reservations
- Confirm user arrivals
- Earnings tracking

### 👑 For Administrators
- Comprehensive admin dashboard
- User management (approve/reject owners)
- Parking space approval system
- Document verification
- Payment proof verification
- System statistics and monitoring
- Activity log tracking

### 🔧 General Features
- User authentication (JWT-based)
- Role-based access control
- Real-time notifications
- Responsive design (mobile-friendly)
- Dark/Light theme support
- File upload (images, documents)
- WebSocket support for real-time updates
- Email notifications

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for database
- **PostgreSQL** - Database (configurable)
- **JWT** - Authentication
- **WebSocket** - Real-time communication
- **Multer** - File upload handling
- **Bcrypt** - Password hashing

### Frontend
- **Vanilla JavaScript** - Core functionality
- **Leaflet.js** - Interactive maps
- **OpenStreetMap** - Map tiles
- **HTML5/CSS3** - Markup and styling
- **Font Awesome** - Icons
- **LocalStorage** - Client-side storage

### Tools & Services
- **Nominatim** - Geocoding service
- **dotenv** - Environment management
- **Nodemon** - Development server

## 📁 Project Structure

```
smart-parking-system/
├── public/                    # Frontend files
│   ├── css/                   # Stylesheets
│   ├── js/                    # Client-side JavaScript
│   ├── html/                  # HTML pages
│   └── Images/                # Static images
├── src/                       # Backend source
│   ├── config/                # Configuration files
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Custom middleware
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── app.js                 # Main application
│   └── migrate.js             # Database migration
├── uploads/                   # Uploaded files
│   ├── documents/             # Legal documents
│   ├── parking_images/        # Parking photos
│   └── payment_proofs/        # Payment screenshots
└── package.json              # Dependencies
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (or SQLite for development)
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd smart-parking-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

4. **Configure your `.env` file**
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/parking_db
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

5. **Run database migration**
```bash
npm run migrate
```

6. **Start the development server**
```bash
npm run dev
```

7. **Access the application**
- Frontend: `http://localhost:3000`
- API: `http://localhost:3000/api`
- Health check: `http://localhost:3000/api/health`

## ⚙️ Configuration

### Database Setup
1. Create a PostgreSQL database:
```sql
CREATE DATABASE parking_db;
```

2. Update `src/config/db.js` with your credentials
3. Run migration to create tables and default users

### Default Users
After migration, these users are created:
- **Admin**: `admin@parking.com` / `Admin@123`
- **Owner**: `owner@parking.com` / `Owner@123`
- **User**: `user@example.com` / `User@123`

**⚠️ Change these credentials in production!**

## 🎮 Usage

### Starting the System
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Run migration only
npm run migrate
```

### Key Pages
1. **Home** (`/`) - Landing page and parking search
2. **Login** (`/login.html`) - User authentication
3. **Register** (`/register.html`) - New user registration
4. **Admin Dashboard** (`/admin.html`) - Admin interface
5. **Owner Dashboard** (`/owner-dashboard.html`) - Parking owner interface
6. **Add Parking** (`/add-parking.html`) - Create parking spaces
7. **My Parkings** (`/my-parking.html`) - Manage owned parkings
8. **Reservations** (`/reservations.html`) - View/cancel reservations
9. **Active Session** (`/active-session.html`) - Monitor ongoing parking

## 📡 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- Middleware: JWT token required for protected routes

### Parking Operations
- `GET /api/parking/search` - Find nearby parking (lat, lng, radius)
- `GET /api/parking/:id` - Get parking details
- `POST /api/driver/reserve` - Reserve parking spot
- `POST /api/driver/session/start` - Start parking session
- `POST /api/driver/session/end` - End parking session

### Owner Operations
- `GET /api/owner/parkings` - Get owner's parking spaces
- `POST /api/owner/parkings` - Create new parking
- `PUT /api/owner/parkings/:id` - Update parking
- `DELETE /api/owner/parkings/:id` - Delete parking

### Admin Operations
- `GET /api/admin/dashboard` - Admin statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/owners/:id/verify` - Verify owner
- `POST /api/admin/parkings/:id/approve` - Approve parking

## 👥 User Roles

### 1. Driver/User
- Search and reserve parking spots
- Manage active sessions
- View reservation history
- Update profile

### 2. Parking Owner
- List and manage parking spaces
- Upload verification documents
- View earnings and sessions
- Manage reservations

### 3. Administrator
- Approve/reject owners and parkings
- Verify payment proofs
- Manage all users
- Monitor system activity
- Access to all features

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- File type and size restrictions
- HTTPS-ready (configure in production)
- SQL injection prevention (Sequelize)
- XSS protection

## 📱 Mobile Support

The application is fully responsive and supports:
- Mobile browsers
- Tablet devices
- Touch interactions
- Geolocation on mobile
- Mobile-optimized UI components

## 🚨 Error Handling

The system includes comprehensive error handling:
- API error responses with proper HTTP codes
- User-friendly error messages
- Logging for debugging
- Graceful degradation
- Form validation feedback

## 🔄 Real-time Features

- WebSocket connections for live updates
- Reservation expiration notifications
- Session status updates
- Admin approval notifications

## 📊 Database Models

Key models include:
- **User** - User accounts with roles
- **ParkingSpace** - Parking spot information
- **ParkingSession** - Active/reserved sessions
- **ParkingLocation** - Geographical data
- **ParkingImage** - Parking photos
- **UserDocument** - Verification documents
- **PaymentProof** - Payment verification
- **Notification** - User notifications
- **ActivityLog** - System activity tracking

## 🚀 Deployment

### Render.com (Recommended)
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Add environment variables
5. Deploy

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=your_production_db_url
JWT_SECRET=strong_production_secret
ALLOWED_ORIGINS=https://yourdomain.com
```

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Test API endpoints
curl http://localhost:3000/api/health

# Test database connection
npm run db:test
```

## 📈 Monitoring

- Health check endpoint: `/api/health`
- Server logs with timestamps
- Database connection monitoring
- Error tracking
- User activity logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Update documentation
- Test changes thoroughly
- Ensure backward compatibility

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check database credentials
   - Ensure PostgreSQL is running
   - Verify database exists

2. **File uploads not working**
   - Check uploads directory permissions
   - Verify file size limits
   - Check MIME type restrictions

3. **Map not loading**
   - Check internet connection
   - Verify Leaflet.js is loaded
   - Check browser console for errors

4. **Authentication issues**
   - Clear browser localStorage
   - Check JWT_SECRET in .env
   - Verify token expiration

### Debug Mode
```bash
DEBUG=* npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenStreetMap for map data
- Leaflet.js for interactive maps
- Font Awesome for icons
- Nominatim for geocoding
- The open-source community

## 📞 Support

For support, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details
4. Include error logs and steps to reproduce

---

**Made with ❤️ by Smart Parking System Team**

*Last Updated: February 2026*

