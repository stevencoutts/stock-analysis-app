# Stock Analysis Application

A full-stack application for analyzing stock market data with user management capabilities.

## Features

- Real-time stock market data visualization
- User authentication and authorization
- Admin dashboard for user management
- Interactive stock performance charts
- Market overview with multiple stock symbols
- Secure data storage and API integration

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: PostgreSQL
- Authentication: JWT
- Containerization: Docker
- Stock Data: Alpha Vantage API

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Alpha Vantage API key

## Environment Setup

1. Create a `.env` file in the root directory:

```env
# Frontend Configuration
REACT_APP_API_URL=http://localhost:8081

# API Configuration
API_PORT=8081
JWT_SECRET=your_secure_jwt_secret_key

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=stockdb
DB_PORT=5432

# Alpha Vantage API
ALPHA_VANTAGE_API_KEY=your_api_key
```

## Installation & Running

1. Clone the repository:
```bash
git clone <repository-url>
cd stock-analysis-app
```

2. Build and start the containers:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:8082
- API: http://localhost:8081

## Default Credentials

- Admin User:
  - Email: admin@example.com
  - Password: admin123

## Development

For development with hot-reloading:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## API Endpoints

### Authentication
- POST /api/auth/login - User login

### User Management (Admin only)
- GET /api/users - List all users
- POST /api/users - Create new user
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user
- GET /api/users/:id/activity - Get user activity

### Stock Data
- GET /api/market-overview - Get market overview
- GET /api/stock-performance/:symbol - Get stock performance data

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Activity logging
- Session management
- Rate limiting for API calls

## Database Schema

### Users Table
- id (Primary Key)
- name
- email (Unique)
- password (Hashed)
- role
- status
- last_login
- created_at
- updated_at

### User Activity Log
- id (Primary Key)
- user_id (Foreign Key)
- action
- details
- created_at

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[Your License] 