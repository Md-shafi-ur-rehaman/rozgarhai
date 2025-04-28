import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect as authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects with optional filters
router.get('/', async (req, res) => {
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
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

// Get single project by ID
router.get('/:id', async (req, res) => {
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
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching project' });
  }
});

// Create new project
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
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
    res.status(500).json({ error: 'Error creating project' });
  }
});

// Update project
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, description, budget, deadline, status } = req.body;
    const projectId = req.params.id;
    const userId = req.user!.id;

    // Check if user owns the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.clientId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
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
    res.status(500).json({ error: 'Error updating project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user!.id;

    // Check if user owns the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.clientId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting project' });
  }
});

export default router; 