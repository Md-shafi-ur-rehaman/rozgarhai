import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const freelancerProfileSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    experience: z.string().transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num)) {
        throw new Error('Experience must be a valid number');
      }
      return num;
    }),
    education: z.string().min(2, 'Education must be at least 2 characters'),
    location: z.string().min(2, 'Location must be at least 2 characters'),
    languages: z.array(z.string()).min(1, 'At least one language is required'),
    portfolio: z.string().url('Portfolio must be a valid URL').optional(),
    profileType: z.literal('freelancer')
  })
});

const clientProfileSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    website: z.string().url('Website must be a valid URL').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    industry: z.string().min(2, 'Industry must be at least 2 characters'),
    location: z.string().min(2, 'Location must be at least 2 characters'),
    profileType: z.literal('client')
  })
});

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        freelancerProfile: true,
        clientProfile: true
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

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req: AuthRequest, res, next) => {
  try {
    const { profileType } = req.body;

    if (!profileType || !['freelancer', 'client'].includes(profileType)) {
      const error = new Error('Profile type must be either freelancer or client') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    let profile;
    if (profileType === 'freelancer') {
      // Validate freelancer profile data
      const result = await freelancerProfileSchema.parseAsync({ body: req.body });
      const {
        title,
        description,
        experience,
        education,
        location,
        languages,
        portfolio
      } = result.body;

      // Check if freelancer profile exists
      let freelancerProfile = await prisma.freelancerProfile.findUnique({
        where: { userId: req.user!.id }
      });

      const freelancerData = {
        title,
        description,
        experience,
        education,
        location,
        languages: languages || [],
        portfolio: portfolio || undefined
      };

      if (freelancerProfile) {
        // Update freelancer profile
        profile = await prisma.freelancerProfile.update({
          where: { userId: req.user!.id },
          data: freelancerData
        });
      } else {
        // Create freelancer profile
        profile = await prisma.freelancerProfile.create({
          data: {
            ...freelancerData,
            userId: req.user!.id
          }
        });
      }
    } else {
      // Validate client profile data
      const result = await clientProfileSchema.parseAsync({ body: req.body });
      const {
        companyName,
        website,
        description,
        industry,
        location
      } = result.body;

      // Check if client profile exists
      let clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: req.user!.id }
      });

      const clientData = {
        companyName,
        website: website || undefined,
        description,
        industry,
        location
      };

      if (clientProfile) {
        // Update client profile
        profile = await prisma.clientProfile.update({
          where: { userId: req.user!.id },
          data: clientData
        });
      } else {
        // Create client profile
        profile = await prisma.clientProfile.create({
          data: {
            ...clientData,
            userId: req.user!.id
          }
        });
      }
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        freelancerProfile: true,
        clientProfile: true
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