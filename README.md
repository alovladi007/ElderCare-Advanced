# ElderCare & HomeCare Services Platform

A comprehensive full-stack web application for elder care, home care, and home repair services. Built with React, Node.js, Express, and MongoDB.

## 🌟 Features

### Services Offered
- **Elder Care Services**
  - 24/7 Personal Care
  - Memory Care & Dementia Support
  - Health Monitoring
  - Medication Management
  - Companionship

- **Home Care Services**
  - Personal Care Assistance
  - Meal Preparation
  - Light Housekeeping
  - Flexible Scheduling

- **Home Repair & Maintenance**
  - General Repairs
  - Electrical Work
  - Plumbing Services
  - Safety Modifications
  - Emergency Services (24/7)

### Technical Features
- ✅ Responsive, modern UI with Tailwind CSS
- ✅ Interactive animations with Framer Motion
- ✅ RESTful API with Express.js
- ✅ MongoDB database integration
- ✅ JWT authentication system
- ✅ Form validation
- ✅ Admin dashboard
- ✅ Booking system
- ✅ Contact form
- ✅ Service catalog

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd ElderCare-Advanced
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm run install-all
   \`\`\`

3. **Configure environment variables**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. **Start the development servers**
   \`\`\`bash
   npm run dev
   \`\`\`

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

### Alternative: Start servers separately

\`\`\`bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
\`\`\`

## 📁 Project Structure

\`\`\`
ElderCare-Advanced/
├── client/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS files
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── server/                  # Node.js backend
│   ├── config/             # Configuration files
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   └── server.js           # Server entry point
│
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
└── README.md
\`\`\`

## 🔧 API Endpoints

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PATCH /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Delete booking

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contact messages

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Health Check
- `GET /api/health` - API health status

## 🎨 Frontend Routes

- `/` - Homepage
- `/elder-care` - Elder Care Services
- `/home-care` - Home Care Services
- `/repair-services` - Repair & Maintenance Services
- `/about` - About Us
- `/contact` - Contact Page
- `/booking` - Booking Form
- `/admin` - Admin Dashboard

## 🔐 Environment Variables

Create a `.env` file in the root directory:

\`\`\`env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/eldercare
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
\`\`\`

## 🛠️ Technologies Used

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- Framer Motion
- Lucide React Icons
- React Hook Form
- React Toastify
- Axios

### Backend
- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT)
- Bcrypt.js
- Express Validator
- Helmet (Security)
- Morgan (Logging)
- CORS

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Frontend (Vercel/Netlify)
\`\`\`bash
cd client
npm run build
# Deploy the build folder
\`\`\`

### Backend (Heroku/Railway)
\`\`\`bash
# Set environment variables
# Deploy from root directory
\`\`\`

## 📝 License

This project is licensed under the MIT License.

## 👥 Contact

For questions or support:
- Email: info@eldercare.com
- Phone: (123) 456-7890
- Address: 123 Care Street, New York, NY 10001

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Built with ❤️ for better elder care and home services**
