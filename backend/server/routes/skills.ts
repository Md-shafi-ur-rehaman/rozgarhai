import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const skillSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Skill name must be at least 2 characters'),
    category: z.string().min(2, 'Category must be at least 2 characters')
  })
});

const skillSearchSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional()
  })
});

// @route   GET /api/skills/search
// @desc    Search skills by name or category
// @access  Public
router.get('/search', validate(skillSearchSchema), async (req, res, next) => {
  try {
    const { search, category } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = { contains: category as string, mode: 'insensitive' };
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: skills
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/skills
// @desc    Get all skills
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: skills
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/skills/:id
// @desc    Get skill by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const skill = await prisma.skill.findUnique({
      where: { id: req.params.id },
      include: {
        freelancers: {
          include: {
            freelancer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                  }
                }
              }
            }
          }
        },
        projects: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                description: true,
                budget: true,
                deadline: true,
                status: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    clientProfile: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!skill) {
      const error = new Error('Skill not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // Get freelancer profiles separately
    const freelancerProfiles = await prisma.freelancerProfile.findMany({
      where: {
        userId: {
          in: skill.freelancers.map(f => f.freelancer.user.id)
        }
      }
    });

    // Combine the data
    const skillWithProfiles = {
      ...skill,
      freelancers: skill.freelancers.map(f => ({
        ...f,
        freelancer: {
          ...f.freelancer,
          profile: freelancerProfiles.find(p => p.userId === f.freelancer.user.id)
        }
      }))
    };

    res.json({
      success: true,
      data: skillWithProfiles
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/skills
// @desc    Create a new skill
// @access  Private (Admin only)
router.post('/', protect, authorize('ADMIN'), validate(skillSchema), async (req: AuthRequest, res, next) => {
  try {
    const { name, category } = req.body;

    // Check if skill already exists
    const existingSkill = await prisma.skill.findUnique({
      where: { name }
    });

    if (existingSkill) {
      const error = new Error('Skill already exists') as CustomError;
      error.statusCode = 400;
      throw error;
    }

    const skill = await prisma.skill.create({
      data: {
        name,
        category
      }
    });

    res.status(201).json({
      success: true,
      data: skill
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/skills/:id
// @desc    Update skill
// @access  Private (Admin only)
router.put('/:id', protect, authorize('ADMIN'), validate(skillSchema), async (req: AuthRequest, res, next) => {
  try {
    const { name, category } = req.body;

    // Check if skill exists
    const existingSkill = await prisma.skill.findUnique({
      where: { id: req.params.id }
    });

    if (!existingSkill) {
      const error = new Error('Skill not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    // Check if new name conflicts with existing skill
    if (name !== existingSkill.name) {
      const nameConflict = await prisma.skill.findUnique({
        where: { name }
      });

      if (nameConflict) {
        const error = new Error('Skill name already exists') as CustomError;
        error.statusCode = 400;
        throw error;
      }
    }

    const skill = await prisma.skill.update({
      where: { id: req.params.id },
      data: {
        name,
        category
      }
    });

    res.json({
      success: true,
      data: skill
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/skills/:id
// @desc    Delete skill
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    // Check if skill exists
    const existingSkill = await prisma.skill.findUnique({
      where: { id: req.params.id }
    });

    if (!existingSkill) {
      const error = new Error('Skill not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    await prisma.skill.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      data: null,
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 