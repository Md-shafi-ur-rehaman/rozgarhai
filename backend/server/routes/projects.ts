import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const projectQuerySchema = z.object({
  query: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    skill: z.string().optional(),
    search: z.string().optional(),
    minBudget: z.string().transform(val => {
      const num = parseFloat(val);
      if (isNaN(num)) {
        throw new Error('minBudget must be a valid number');
      }
      return num;
    }).optional(),
    maxBudget: z.string().transform(val => {
      const num = parseFloat(val);
      if (isNaN(num)) {
        throw new Error('maxBudget must be a valid number');
      }
      return num;
    }).optional(),
    sortBy: z.enum(['createdAt', 'budget', 'deadline']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  }).optional()
});

// @route   GET /api/projects
// @desc    Get all projects with optional filters
// @access  Public
router.get('/', validate(projectQuerySchema), async (req, res, next) => {
  try {
    const { status, skill, search, minBudget, maxBudget, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = Number(minBudget);
      if (maxBudget) where.budget.lte = Number(maxBudget);
    }

    if (skill) {
      where.skills = {
        some: {
          skill: {
            name: { contains: skill as string, mode: 'insensitive' },
          },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientProfile: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        bids: {
          include: {
            freelancer: {
              select: {
                id: true,
                name: true,
                freelancerProfile: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
    });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientProfile: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        bids: {
          include: {
            freelancer: {
              select: {
                id: true,
                name: true,
                freelancerProfile: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        contract: {
          include: {
            freelancer: {
              select: {
                id: true,
                name: true,
                freelancerProfile: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      const error = new Error('Project not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private (Client only)
router.post('/', protect, authorize('CLIENT'), async (req: AuthRequest, res, next) => {
  try {
    const {
      title,
      description,
      budget,
      deadline,
      skills
    } = req.body;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        budget: Number(budget),
        deadline: new Date(deadline),
        clientId: req.user!.id,
        skills: {
          create: skills.map((skillId: string) => ({
            skill: {
              connect: { id: skillId }
            }
          }))
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientProfile: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Client only)
router.put('/:id', protect, authorize('CLIENT'), async (req: AuthRequest, res, next) => {
  try {
    const {
      title,
      description,
      budget,
      deadline,
      status,
      skills
    } = req.body;

    // Check if project exists and belongs to the client
    const existingProject = await prisma.project.findUnique({
      where: { id: req.params.id }
    });

    if (!existingProject) {
      const error = new Error('Project not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    if (existingProject.clientId !== req.user!.id) {
      const error = new Error('Not authorized to update this project') as CustomError;
      error.statusCode = 403;
      throw error;
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        budget: Number(budget),
        deadline: new Date(deadline),
        status,
        skills: {
          deleteMany: {},
          create: skills.map((skillId: string) => ({
            skill: {
              connect: { id: skillId }
            }
          }))
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            clientProfile: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Client only)
router.delete('/:id', protect, authorize('CLIENT'), async (req: AuthRequest, res, next) => {
  try {
    // Check if project exists and belongs to the client
    const existingProject = await prisma.project.findUnique({
      where: { id: req.params.id }
    });

    if (!existingProject) {
      const error = new Error('Project not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    if (existingProject.clientId !== req.user!.id) {
      const error = new Error('Not authorized to delete this project') as CustomError;
      error.statusCode = 403;
      throw error;
    }

    await prisma.project.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      data: null,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 