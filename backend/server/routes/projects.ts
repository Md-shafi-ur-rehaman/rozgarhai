import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { status, skill, search } = req.query;
    
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
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Get single project by ID
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
        },
        messages: true,
        contract: true,
      },
    });

    if (!project) {
      const error = new Error('Project not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Create new project (Client only)
router.post('/', 
  protect, 
  authorize('CLIENT'),
  async (req: AuthRequest, res, next) => {
    try {
      const { title, description, budget, deadline, skills } = req.body;
      const clientId = req.user!.id;

      const project = await prisma.project.create({
        data: {
          title,
          description,
          budget,
          deadline: new Date(deadline),
          clientId,
          skills: {
            create: skills.map((skillId: string) => ({
              skill: {
                connect: { id: skillId },
              },
            })),
          },
        },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }
);

// Update project (Client only)
router.put('/:id', 
  protect, 
  authorize('CLIENT'),
  async (req: AuthRequest, res, next) => {
    try {
      const { title, description, budget, deadline, status } = req.body;
      const projectId = req.params.id;
      const userId = req.user!.id;

      // Check if user owns the project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        const error = new Error('Project not found') as CustomError;
        error.statusCode = 404;
        throw error;
      }

      if (project.clientId !== userId) {
        const error = new Error('Not authorized') as CustomError;
        error.statusCode = 403;
        throw error;
      }

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          title,
          description,
          budget,
          deadline: deadline ? new Date(deadline) : undefined,
          status,
        },
      });

      res.json(updatedProject);
    } catch (error) {
      next(error);
    }
  }
);

// Delete project (Client only)
router.delete('/:id', 
  protect, 
  authorize('CLIENT'),
  async (req: AuthRequest, res, next) => {
    try {
      const projectId = req.params.id;
      const userId = req.user!.id;

      // Check if user owns the project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        const error = new Error('Project not found') as CustomError;
        error.statusCode = 404;
        throw error;
      }

      if (project.clientId !== userId) {
        const error = new Error('Not authorized') as CustomError;
        error.statusCode = 403;
        throw error;
      }

      await prisma.project.delete({
        where: { id: projectId },
      });

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 