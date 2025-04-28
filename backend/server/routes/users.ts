import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        FreelancerProfile: true,
        ClientProfile: true
      }
    });

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
    const {
      title,
      description,
      experience,
      education,
      location,
      languages,
      portfolio,
      companyName,
      website,
      industry,
      profileType // 'freelancer' or 'client'
    } = req.body;

    if (!profileType || !['freelancer', 'client'].includes(profileType)) {
      const error = new Error('Profile type must be either freelancer or client') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    let profile;
    if (profileType === 'freelancer') {
      // Check if freelancer profile exists
      let freelancerProfile = await prisma.freelancerProfile.findUnique({
        where: { userId: req.user.id }
      });

      const freelancerData = {
        title,
        description,
        experience,
        education,
        location,
        languages: languages || [],
        portfolio: portfolio || null
      };

      if (freelancerProfile) {
        // Update freelancer profile
        profile = await prisma.freelancerProfile.update({
          where: { userId: req.user.id },
          data: freelancerData
        });
      } else {
        // Create freelancer profile
        profile = await prisma.freelancerProfile.create({
          data: {
            ...freelancerData,
            userId: req.user.id
          }
        });
      }
    } else {
      // Check if client profile exists
      let clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: req.user.id }
      });

      const clientData = {
        companyName,
        website,
        description,
        industry,
        location
      };

      if (clientProfile) {
        // Update client profile
        profile = await prisma.clientProfile.update({
          where: { userId: req.user.id },
          data: clientData
        });
      } else {
        // Create client profile
        profile = await prisma.clientProfile.create({
          data: {
            ...clientData,
            userId: req.user.id
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