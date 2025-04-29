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
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "string"
      },
      "token": "string"
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
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "string"
      },
      "token": "string"
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

#### GET /api/users/:id
Get user by ID (Protected)
- **Output:**
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "freelancerProfile": object | null,
      "clientProfile": object | null
    }
  }
  ```

### Project Routes

#### GET /api/projects
Get all projects with optional filters
- **Query Parameters:**
  - `status`: Project status
  - `skill`: Filter by skill
  - `search`: Search in title and description
- **Output:**
  ```json
  [
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
      ],
      "bids": [
        {
          "id": "string",
          "amount": number,
          "status": "string"
        }
      ]
    }
  ]
  ```

#### GET /api/projects/:id
Get single project by ID
- **Output:**
  ```json
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
    ],
    "bids": [
      {
        "id": "string",
        "amount": number,
        "status": "string",
        "freelancer": {
          "id": "string",
          "name": "string",
          "freelancerProfile": object
        }
      }
    ],
    "messages": array,
    "contract": object
  }
  ```

#### POST /api/projects
Create new project (Protected - Client only)
- **Input:**
  ```json
  {
    "title": "string",
    "description": "string",
    "budget": number,
    "deadline": "date",
    "skills": ["string"]
  }
  ```
- **Output:**
  ```json
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "budget": number,
    "deadline": "date",
    "skills": [
      {
        "skill": {
          "id": "string",
          "name": "string"
        }
      }
    ]
  }
  ```

#### PUT /api/projects/:id
Update project (Protected - Client only)
- **Input:**
  ```json
  {
    "title": "string",
    "description": "string",
    "budget": number,
    "deadline": "date",
    "status": "string"
  }
  ```
- **Output:**
  ```json
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "budget": number,
    "deadline": "date",
    "status": "string"
  }
  ```

#### DELETE /api/projects/:id
Delete project (Protected - Client only)
- **Output:**
  ```json
  {
    "message": "Project deleted successfully"
  }
  ```

### Bid Routes

#### GET /api/bids/project/:projectId
Get all bids for a project
- **Output:**
  ```json
  [
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
  ```

#### GET /api/bids/freelancer/:freelancerId
Get all bids by a freelancer
- **Output:**
  ```json
  [
    {
      "id": "string",
      "amount": number,
      "duration": number,
      "coverLetter": "string",
      "status": "string",
      "project": {
        "id": "string",
        "title": "string",
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
    }
  ]
  ```

#### POST /api/bids
Create a bid (Protected - Freelancer only)
- **Input:**
  ```json
  {
    "projectId": "string",
    "amount": number,
    "duration": number,
    "coverLetter": "string"
  }
  ```
- **Output:**
  ```json
  {
    "id": "string",
    "amount": number,
    "duration": number,
    "coverLetter": "string",
    "status": "PENDING",
    "freelancer": {
      "id": "string",
      "name": "string",
      "freelancerProfile": object
    }
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
  ```

#### DELETE /api/bids/:id
Withdraw bid (Protected - Freelancer only)
- **Output:**
  ```json
  {
    "message": "Bid withdrawn successfully"
  }
  ```

### Gig Routes

#### POST /api/gigs
Create a new gig (Protected - Freelancer only)
- **Input:**
  ```json
  {
    "title": "string",
    "description": "string",
    "price": number,
    "deliveryTime": number,
    "revisions": number,
    "category": "string",
    "subcategory": "string",
    "tags": ["string"],
    "images": ["string"],
    "requirements": ["string"]
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "title": "string",
      "description": "string",
      "price": number,
      "deliveryTime": number,
      "revisions": number,
      "category": "string",
      "subcategory": "string",
      "tags": ["string"],
      "images": ["string"],
      "requirements": ["string"],
      "freelancer": {
        "id": "string",
        "name": "string",
        "freelancerProfile": object
      },
      "createdAt": "date",
      "status": "ACTIVE"
    }
  }
  ```

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
  [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "price": number,
      "deliveryTime": number,
      "revisions": number,
      "category": "string",
      "subcategory": "string",
      "tags": ["string"],
      "images": ["string"],
      "requirements": ["string"],
      "freelancer": {
        "id": "string",
        "name": "string",
        "freelancerProfile": object
      },
      "rating": number,
      "reviews": number,
      "createdAt": "date",
      "status": "string"
    }
  ]
  ```

#### GET /api/gigs/:id
Get single gig by ID
- **Output:**
  ```json
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "price": number,
    "deliveryTime": number,
    "revisions": number,
    "category": "string",
    "subcategory": "string",
    "tags": ["string"],
    "images": ["string"],
    "requirements": ["string"],
    "freelancer": {
      "id": "string",
      "name": "string",
      "freelancerProfile": object
    },
    "rating": number,
    "reviews": [
      {
        "id": "string",
        "rating": number,
        "comment": "string",
        "client": {
          "id": "string",
          "name": "string"
        },
        "createdAt": "date"
      }
    ],
    "createdAt": "date",
    "status": "string"
  }
  ```

#### PUT /api/gigs/:id
Update gig (Protected - Freelancer only)
- **Input:**
  ```json
  {
    "title": "string",
    "description": "string",
    "price": number,
    "deliveryTime": number,
    "revisions": number,
    "category": "string",
    "subcategory": "string",
    "tags": ["string"],
    "images": ["string"],
    "requirements": ["string"],
    "status": "ACTIVE" | "PAUSED" | "DELETED"
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "title": "string",
      "description": "string",
      "price": number,
      "deliveryTime": number,
      "revisions": number,
      "category": "string",
      "subcategory": "string",
      "tags": ["string"],
      "images": ["string"],
      "requirements": ["string"],
      "status": "string",
      "updatedAt": "date"
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
      "freelancerId": "string",
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
  - `status`: Filter by order status
  - `role`: "client" or "freelancer"
- **Output:**
  ```json
  [
    {
      "id": "string",
      "gig": {
        "id": "string",
        "title": "string",
        "price": number
      },
      "client": {
        "id": "string",
        "name": "string"
      },
      "freelancer": {
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

# Rozgarhai API Documentation

## Authentication Routes

### Register User
- **POST** `/api/auth/register`
- **Description**: Register a new user
- **Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "role": "FREELANCER" | "CLIENT"
  }
  ```

### Login User
- **POST** `/api/auth/login`
- **Description**: Login user
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

## User Routes

### Get Current User Profile
- **GET** `/api/users/me`
- **Description**: Get current user profile
- **Auth**: Required

### Update User Profile
- **PUT** `/api/users/profile`
- **Description**: Update user profile
- **Auth**: Required
- **Body**:
  ```json
  {
    "profileType": "freelancer" | "client",
    "title": "string",
    "description": "string",
    "experience": "number",
    "education": "string",
    "location": "string",
    "languages": ["string"],
    "portfolio": "string",
    "companyName": "string",
    "website": "string",
    "industry": "string"
  }
  ```

### Get User by ID
- **GET** `/api/users/:id`
- **Description**: Get user by ID
- **Auth**: Required

## Project Routes

### Get All Projects
- **GET** `/api/projects`
- **Description**: Get all projects with filters
- **Query Parameters**:
  - `status`: OPEN | IN_PROGRESS | COMPLETED | CANCELLED
  - `skill`: string
  - `search`: string
  - `minBudget`: number
  - `maxBudget`: number
  - `sortBy`: createdAt | budget | deadline
  - `sortOrder`: asc | desc

### Get Project by ID
- **GET** `/api/projects/:id`
- **Description**: Get project by ID

### Create Project
- **POST** `/api/projects`
- **Description**: Create a new project
- **Auth**: Required (Client only)
- **Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "budget": "number",
    "deadline": "date",
    "skills": ["skillId"]
  }
  ```

## Bid Routes

### Get Bids for Project
- **GET** `/api/bids/project/:projectId`
- **Description**: Get all bids for a project

### Get Bids by Freelancer
- **GET** `/api/bids/freelancer/:freelancerId`
- **Description**: Get all bids by a freelancer

### Create Bid
- **POST** `/api/bids`
- **Description**: Create a new bid
- **Auth**: Required (Freelancer only)
- **Body**:
  ```json
  {
    "projectId": "string",
    "amount": "number",
    "duration": "number",
    "coverLetter": "string"
  }
  ```

### Update Bid Status
- **PATCH** `/api/bids/:id/status`
- **Description**: Update bid status
- **Auth**: Required (Client only)
- **Body**:
  ```json
  {
    "status": "ACCEPTED" | "REJECTED"
  }
  ```

### Withdraw Bid
- **DELETE** `/api/bids/:id`
- **Description**: Withdraw a bid
- **Auth**: Required (Freelancer only)

## Contract Routes

### Get User Contracts
- **GET** `/api/contracts`
- **Description**: Get all contracts for a user
- **Auth**: Required

### Get Contract by ID
- **GET** `/api/contracts/:id`
- **Description**: Get contract by ID
- **Auth**: Required

### Update Contract Status
- **PATCH** `/api/contracts/:id/status`
- **Description**: Update contract status
- **Auth**: Required
- **Body**:
  ```json
  {
    "status": "ACTIVE" | "COMPLETED" | "TERMINATED" | "DISPUTED"
  }
  ```

### Add Contract Review
- **POST** `/api/contracts/:id/reviews`
- **Description**: Add a review to the contract
- **Auth**: Required
- **Body**:
  ```json
  {
    "rating": "number",
    "comment": "string"
  }
  ```

## Payment Routes

### Get Contract Payments
- **GET** `/api/payments/contract/:contractId`
- **Description**: Get all payments for a contract
- **Auth**: Required

### Create Payment
- **POST** `/api/payments`
- **Description**: Create a new payment
- **Auth**: Required (Client only)
- **Body**:
  ```json
  {
    "contractId": "string",
    "amount": "number",
    "description": "string"
  }
  ```

### Update Payment Status
- **PATCH** `/api/payments/:id/status`
- **Description**: Update payment status
- **Auth**: Required (Client only)
- **Body**:
  ```json
  {
    "status": "COMPLETED" | "FAILED" | "REFUNDED"
  }
  ```

## Gig Routes

### Get All Gigs
- **GET** `/api/gigs`
- **Description**: Get all gigs with filters
- **Query Parameters**:
  - `category`: string
  - `subcategory`: string
  - `minPrice`: number
  - `maxPrice`: number
  - `search`: string
  - `sort`: price | rating | date

### Get Gig by ID
- **GET** `/api/gigs/:id`
- **Description**: Get gig by ID

### Create Gig
- **POST** `/api/gigs`
- **Description**: Create a new gig
- **Auth**: Required (Freelancer only)
- **Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "price": "number",
    "deliveryTime": "number",
    "revisions": "number",
    "category": "string",
    "subcategory": "string",
    "tags": ["string"],
    "images": ["string"],
    "requirements": ["string"]
  }
  ```

### Update Gig
- **PUT** `/api/gigs/:id`
- **Description**: Update gig
- **Auth**: Required (Freelancer only)
- **Body**: Same as Create Gig

### Order Gig
- **POST** `/api/gigs/:id/order`
- **Description**: Order a gig
- **Auth**: Required (Client only)
- **Body**:
  ```json
  {
    "requirements": "string",
    "deliveryTime": "number",
    "revisions": "number"
  }
  ```

### Get User Orders
- **GET** `/api/gigs/orders`
- **Description**: Get all orders for a user
- **Auth**: Required
- **Query Parameters**:
  - `status`: PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  - `role`: client | freelancer

## Skill Routes

### Get All Skills
- **GET** `/api/skills`
- **Description**: Get all skills

### Search Skills
- **GET** `/api/skills/search`
- **Description**: Search skills by name or category
- **Query Parameters**:
  - `search`: string
  - `category`: string

### Get Skill by ID
- **GET** `/api/skills/:id`
- **Description**: Get skill by ID
