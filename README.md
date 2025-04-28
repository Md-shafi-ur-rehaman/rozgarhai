# Rozgarhai

Rozgarhai is a modern job platform built with Next.js and Express.js, designed to connect job seekers with employers in a seamless and efficient manner.

## Project Structure

The project is divided into two main parts:

### Frontend (`/frontend`)
- Built with Next.js 15.3.1
- React 19
- TypeScript
- TailwindCSS for styling
- Modern UI/UX design

### Backend (`/backend`)
- Express.js server
- TypeScript
- Prisma ORM for database management
- JWT authentication
- RESTful API architecture

## Features

- User authentication and authorization
- Job posting and application system
- Profile management
- Search and filter functionality
- Modern and responsive design

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn
- PostgreSQL database

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/rozgarhai"
   JWT_SECRET="your-jwt-secret"
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:3001`

## Technologies Used

### Frontend
- Next.js
- React
- TypeScript
- TailwindCSS
- ESLint

### Backend
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod for validation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
