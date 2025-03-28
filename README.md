# Stock Analysis Application

A web-based application for analyzing stock market data and trends, built with React and Docker.

## Features

- User authentication system
- Interactive stock data visualization
- Real-time market data analysis
- Responsive dashboard interface
- Secure API integration

## Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd stock-analysis-app
```

2. Install dependencies:
```bash
npm install
npm install chart.js react-chartjs-2
```

3. Build and run with Docker:
```bash
docker-compose up -d --build
```

The application will be available at `http://localhost:3000`

## Development

To run the application in development mode:

```bash
npm start
```

To build for production:

```bash
npm run build
```

## Docker Configuration

The application uses a multi-stage Docker build process:
- Build stage: Node.js environment for building the React application
- Production stage: Nginx server for serving the static files

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