import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get bids for a project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { projectId: req.params.projectId },
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
    });

    res.json(bids);
  } catch (error) {
    next(error);
  }
});

// Get bids by freelancer
router.get('/freelancer/:freelancerId', async (req, res, next) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { freelancerId: req.params.freelancerId },
      include: {
        project: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(bids);
  } catch (error) {
    next(error);
  }
});

// Create a bid (Freelancer only)
router.post('/', 
  protect, 
  authorize('FREELANCER'),
  async (req: AuthRequest, res, next) => {
    try {
      const { projectId, amount, duration, coverLetter } = req.body;
      const freelancerId = req.user!.id;

      // Check if project exists and is open
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        const error = new Error('Project not found') as CustomError;
        error.statusCode = 404;
        throw error;
      }

      if (project.status !== 'OPEN') {
        const error = new Error('Project is not open for bids') as CustomError;
        error.statusCode = 400;
        throw error;
      }

      // Check if user has already bid on this project
      const existingBid = await prisma.bid.findUnique({
        where: {
          projectId_freelancerId: {
            projectId,
            freelancerId,
          },
        },
      });

      if (existingBid) {
        const error = new Error('You have already bid on this project') as CustomError;
        error.statusCode = 400;
        throw error;
      }

      const bid = await prisma.bid.create({
        data: {
          projectId,
          freelancerId,
          amount,
          duration,
          coverLetter,
        },
        include: {
          freelancer: {
            select: {
              id: true,
              name: true,
              freelancerProfile: true,
            },
          },
        },
      });

      res.status(201).json(bid);
    } catch (error) {
      next(error);
    }
  }
);

// Update bid status (Client only)
router.patch('/:id/status', 
  protect, 
  authorize('CLIENT'),
  async (req: AuthRequest, res, next) => {
    try {
      const { status } = req.body;
      const bidId = req.params.id;
      const userId = req.user!.id;

      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: {
          project: true,
        },
      });

      if (!bid) {
        const error = new Error('Bid not found') as CustomError;
        error.statusCode = 404;
        throw error;
      }

      // Only project owner can accept/reject bids
      if (bid.project.clientId !== userId) {
        const error = new Error('Not authorized') as CustomError;
        error.statusCode = 403;
        throw error;
      }

      const updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: { status },
        include: {
          freelancer: {
            select: {
              id: true,
              name: true,
              freelancerProfile: true,
            },
          },
        },
      });

      // If bid is accepted, create a contract
      if (status === 'ACCEPTED') {
        await prisma.contract.create({
          data: {
            projectId: bid.projectId,
            bidId: bid.id,
            clientId: bid.project.clientId,
            freelancerId: bid.freelancerId,
            terms: `Contract for project: ${bid.project.title}`,
            amount: bid.amount,
            startDate: new Date(),
          },
        });

        // Update project status
        await prisma.project.update({
          where: { id: bid.projectId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      res.json(updatedBid);
    } catch (error) {
      next(error);
    }
  }
);

// Withdraw bid (Freelancer only)
router.delete('/:id', 
  protect, 
  authorize('FREELANCER'),
  async (req: AuthRequest, res, next) => {
    try {
      const bidId = req.params.id;
      const userId = req.user!.id;

      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
      });

      if (!bid) {
        const error = new Error('Bid not found') as CustomError;
        error.statusCode = 404;
        throw error;
      }

      if (bid.freelancerId !== userId) {
        const error = new Error('Not authorized') as CustomError;
        error.statusCode = 403;
        throw error;
      }

      await prisma.bid.delete({
        where: { id: bidId },
      });

      res.json({ message: 'Bid withdrawn successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 