import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';


const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:username', async (req, res, next) => {
    try {
        console.log('Fetching user by username:', req.params.username);
      const user = await prisma.user.findUnique({
        where: { username: req.params.username },
        select:{
            createdAt: true,
            email: true,
            freelancerProfile: true,
            id: true,
            isActive: true,
            name: true,
            updatedAt:true,
            username:true,
        }

      });
  
      if (!user) {
        const error = new Error('User not found') as CustomError;
        error.statusCode = 404;
        throw error;
      }
  
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  });

  export default router;
  