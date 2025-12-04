# KhaoGully Restaurant Order Management - Frontend

This is the frontend application for the KhaoGully Restaurant Order Management System built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Restaurant Owner Portal**
  - Sign up and login
  - View and manage pooled orders
  - Accept/decline orders with quantity control
  - View individual customer orders

- **Admin Panel**
  - Approve/reject restaurant owner registrations
  - Assign restaurant UIDs to approved owners
  - Manage all restaurant owners

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Navigate to the frontend directory:
```bash
cd Frontent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update the `.env` file with your backend API URL:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at: http://localhost:5173

## Build for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.tsx
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── pages/              # Page components
│   ├── Auth/
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   ├── Admin/
│   │   ├── AdminLogin.tsx
│   │   └── AdminDashboard.tsx
│   ├── Orders/
│   │   ├── OrdersPage.tsx
│   │   ├── CumulativeView.tsx
│   │   ├── IndividualView.tsx
│   │   └── DeclineModal.tsx
│   └── Pending.tsx
├── services/           # API services
│   ├── api.ts
│   ├── auth.ts
│   ├── orders.ts
│   └── admin.ts
├── types/              # TypeScript types
│   ├── user.types.ts
│   └── order.types.ts
├── utils/              # Utility functions
│   ├── formatters.ts
│   └── validators.ts
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Routes

### Public Routes
- `/login` - Restaurant owner login
- `/signup` - Restaurant owner signup
- `/admin/login` - Admin login

### Protected Routes (Restaurant Owner)
- `/orders` - Orders dashboard

### Protected Routes (Admin)
- `/admin/dashboard` - Admin dashboard

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: http://localhost:8000/api)

## Key Features Implementation

### Authentication
- JWT-based authentication
- Token stored in localStorage
- Automatic redirect on 401 errors
- Role-based access control (Owner/Admin)

### Orders Management
- Fetch orders from backend
- Cumulative view with aggregated items
- Individual orders view with customer details
- Accept/Decline functionality with quantity control
- Validation before submission

### Admin Panel
- View all restaurant owners
- Filter by approval status
- Approve/reject owners
- Assign restaurant UIDs from dropdown

## Styling

The application uses Tailwind CSS for styling. Key design principles:
- Clean and modern UI
- Responsive design for mobile/tablet/desktop
- Color-coded status indicators
- Loading states for async operations
- Error and success notifications

## API Integration

All API calls are made through service layers:
- `authService` - Authentication endpoints
- `ordersService` - Order management endpoints
- `adminService` - Admin panel endpoints

The API service automatically adds JWT tokens to requests and handles 401 errors.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - KhaoGully Restaurant Management System
