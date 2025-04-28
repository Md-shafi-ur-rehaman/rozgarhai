import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect as authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get bids for a project
router.get('/project/:projectId', async (req, res) => {
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
    res.status(500).json({ error: 'Error fetching bids' });
  }
});

// Get bids by freelancer
router.get('/freelancer/:freelancerId', async (req, res) => {
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
    res.status(500).json({ error: 'Error fetching bids' });
  }
});

// Create a bid
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { projectId, amount, duration, coverLetter } = req.body;
    const freelancerId = req.user!.id;

    // Check if project exists and is open
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'OPEN') {
      return res.status(400).json({ error: 'Project is not open for bids' });
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
      return res.status(400).json({ error: 'You have already bid on this project' });
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
    res.status(500).json({ error: 'Error creating bid' });
  }
});

// Update bid status (accept/reject)
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
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
      return res.status(404).json({ error: 'Bid not found' });
    }

    // Only project owner can accept/reject bids
    if (bid.project.clientId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
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
    res.status(500).json({ error: 'Error updating bid status' });
  }
});

// Withdraw bid
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const bidId = req.params.id;
    const userId = req.user!.id;

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
    });

    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (bid.freelancerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.bid.delete({
      where: { id: bidId },
    });

    res.json({ message: 'Bid withdrawn successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error withdrawing bid' });
  }
});

export default router; 