# Stock Analysis App

A modern web application for analyzing stocks, managing watchlists, and tracking market performance. Built with React and Docker.

## Features

- 📊 Real-time stock price monitoring
- 📈 Technical analysis tools
- 📱 Responsive design
- 👥 User authentication
- 📋 Customizable watchlists
- 📊 Market overview dashboard

## Tech Stack

- Frontend: React.js
- Routing: React Router
- Styling: CSS3
- Containerization: Docker
- Database: PostgreSQL
- API: Node.js/Express

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/stock-analysis-app.git
cd stock-analysis-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Docker Setup

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

2. Access the application:
- Frontend: http://localhost:3000
- API: http://localhost:5010

## Project Structure

## User Roles

### Regular User
- View stock data and perform analysis
- Create and manage personal watchlists
- Update personal profile

### Admin User
- All regular user capabilities
- Manage users (create, update, delete)
- Access admin dashboard with system-wide statistics

## Default Admin Account

On first run, a default admin account is created:

- Email: admin@example.com
- Password: admin123

**Important**: Change these credentials immediately after first login.

## Development

### Running in Development Mode

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This starts the application with volume mounts for live code reloading.

### Database Migrations

The application uses Sequelize to manage database schema. The models are automatically synchronized on startup.

## License

[The Unlicense](LICENSE)

## Acknowledgments

- [React](https://reactjs.org/)
- [Material UI](https://mui.com/)
- [Express](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [Chart.js](https://www.chartjs.org/) 