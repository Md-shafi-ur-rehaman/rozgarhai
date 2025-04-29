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

## API Routes

### Authentication Routes

#### POST /api/auth/register
Register a new user
- **Input:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "role": "FREELANCER" | "CLIENT"
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "FREELANCER" | "CLIENT",
        "createdAt": "date",
        "updatedAt": "date",
        "profile": null
      },
      "token": "string",
      "tokenExpiration": "date"
    }
  }
  ```

#### POST /api/auth/login
Login user
- **Input:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "FREELANCER" | "CLIENT",
        "createdAt": "date",
        "updatedAt": "date",
        "profile": object | null
      },
      "token": "string",
      "tokenExpiration": "date"
    }
  }
  ```

### User Routes

#### GET /api/users/me
Get current user profile (Protected)
- **Output:**
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "FreelancerProfile": object | null,
      "ClientProfile": object | null
    }
  }
  ```

#### PUT /api/users/profile
Update user profile (Protected)
- **Input:**
  ```json
  {
    "title": "string",
    "description": "string",
    "experience": "string",
    "education": "string",
    "location": "string",
    "languages": ["string"],
    "portfolio": "string",
    "companyName": "string",
    "website": "string",
    "industry": "string",
    "profileType": "freelancer" | "client"
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "data": {
      // Profile object based on profileType
    }
  }
  ```

### Project Routes

#### GET /api/projects
Get all projects with optional filters
- **Query Parameters:**
  - `status`: OPEN | IN_PROGRESS | COMPLETED | CANCELLED
  - `skill`: Filter by skill name
  - `search`: Search in title and description
  - `minBudget`: Minimum budget amount
  - `maxBudget`: Maximum budget amount
  - `sortBy`: createdAt | budget | deadline
  - `sortOrder`: asc | desc
- **Output:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "budget": number,
        "deadline": "date",
        "status": "string",
        "client": {
          "id": "string",
          "name": "string",
          "clientProfile": object
        },
        "skills": [
          {
            "skill": {
              "id": "string",
              "name": "string"
            }
          }
        ]
      }
    ]
  }
  ```

### Bid Routes

#### GET /api/bids/project/:projectId
Get all bids for a project
- **Output:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "amount": number,
        "duration": number,
        "coverLetter": "string",
        "status": "string",
        "freelancer": {
          "id": "string",
          "name": "string",
          "freelancerProfile": object
        }
      }
    ]
  }
  ```

#### PATCH /api/bids/:id/status
Update bid status (Protected - Client only)
- **Input:**
  ```json
  {
    "status": "ACCEPTED" | "REJECTED"
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "data": {
      "bid": {
        "id": "string",
        "amount": number,
        "duration": number,
        "coverLetter": "string",
        "status": "string",
        "createdAt": "date",
        "updatedAt": "date"
      },
      "project": {
        "id": "string",
        "title": "string",
        "budget": number,
        "deadline": "date",
        "status": "string",
        "client": {
          "id": "string",
          "name": "string",
          "profile": object
        }
      },
      "freelancer": {
        "id": "string",
        "name": "string",
        "profile": {
          "title": "string",
          "experience": number,
          "location": "string"
        }
      },
      "contract": {
        "id": "string",
        "terms": "string",
        "amount": number,
        "startDate": "date",
        "status": "string",
        "project": {
          "id": "string",
          "title": "string",
          "budget": number,
          "deadline": "date",
          "status": "string"
        },
        "client": {
          "id": "string",
          "name": "string",
          "profile": object
        },
        "freelancer": {
          "id": "string",
          "name": "string",
          "profile": {
            "title": "string",
            "experience": number,
            "location": "string"
          }
        }
      }
    }
  }
  ```

### Gig Routes

#### GET /api/gigs
Get all gigs with optional filters
- **Query Parameters:**
  - `category`: Filter by category
  - `subcategory`: Filter by subcategory
  - `minPrice`: Minimum price
  - `maxPrice`: Maximum price
  - `search`: Search in title and description
  - `sort`: Sort by price, rating, or date
- **Output:**
  ```json
  {
    "success": true,
    "data": {
      "gigs": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "pricing": {
            "amount": number,
            "currency": "USD",
            "deliveryTime": number,
            "revisions": number
          },
          "category": {
            "main": "string",
            "sub": "string"
          },
          "tags": ["string"],
          "images": ["string"],
          "requirements": ["string"],
          "stats": {
            "rating": number,
            "reviewCount": number,
            "orderCount": number
          },
          "freelancer": {
            "id": "string",
            "name": "string",
            "title": "string",
            "experience": "string",
            "location": "string"
          },
          "recentReviews": [
            {
              "rating": number,
              "comment": "string",
              "date": "date"
            }
          ],
          "createdAt": "date",
          "updatedAt": "date"
        }
      ],
      "meta": {
        "total": number,
        "filters": {
          "category": "string" | null,
          "subcategory": "string" | null,
          "priceRange": {
            "min": number | null,
            "max": number | null
          },
          "search": "string" | null,
          "sort": "price" | "rating" | "date" | null
        }
      }
    }
  }
  ```

#### POST /api/gigs/:id/order
Order a gig (Protected - Client only)
- **Input:**
  ```json
  {
    "requirements": "string",
    "deliveryTime": number,
    "revisions": number
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "gigId": "string",
      "clientId": "string",
      "requirements": "string",
      "deliveryTime": number,
      "revisions": number,
      "status": "PENDING",
      "createdAt": "date"
    }
  }
  ```

#### GET /api/gigs/orders
Get all orders for a user (Protected)
- **Query Parameters:**
  - `status`: PENDING | IN_PROGRESS | COMPLETED | CANCELLED
- **Output:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "gig": {
          "id": "string",
          "title": "string",
          "price": number,
          "description": "string",
          "deliveryTime": number,
          "revisions": number,
          "freelancer": {
            "id": "string",
            "name": "string",
            "freelancerProfile": {
              "title": "string",
              "experience": "string",
              "location": "string",
              "description": "string"
            }
          }
        },
        "client": {
          "id": "string",
          "name": "string"
        },
        "requirements": "string",
        "deliveryTime": number,
        "revisions": number,
        "status": "string",
        "createdAt": "date"
      }
    ]
  }
  ```

#### PATCH /api/gigs/orders/:id/status
Update order status (Protected - Freelancer only)
- **Input:**
  ```json
  {
    "status": "IN_PROGRESS" | "CANCELLED"
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "gig": {
        "id": "string",
        "title": "string",
        "price": number,
        "freelancer": {
          "id": "string",
          "name": "string",
          "freelancerProfile": {
            "title": "string",
            "experience": "string",
            "location": "string"
          }
        }
      },
      "client": {
        "id": "string",
        "name": "string"
      },
      "requirements": "string",
      "deliveryTime": number,
      "revisions": number,
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

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
