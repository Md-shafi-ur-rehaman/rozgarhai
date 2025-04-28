import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect as authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get contracts for a user (either as client or freelancer)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          { clientId: userId },
          { freelancerId: userId },
        ],
      },
      include: {
        project: true,
        client: {
          select: {
            id: true,
            name: true,
            clientProfile: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            freelancerProfile: true,
          },
        },
        payments: true,
        reviews: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching contracts' });
  }
});

// Get single contract by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        client: {
          select: {
            id: true,
            name: true,
            clientProfile: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            freelancerProfile: true,
          },
        },
        payments: true,
        reviews: true,
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is part of the contract
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching contract' });
  }
});

// Update contract status
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const userId = req.user!.id;
    const contractId = req.params.id;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        project: true,
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is part of the contract
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status,
        endDate: status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        project: true,
        payments: true,
        reviews: true,
      },
    });

    // Update project status if contract is completed or terminated
    if (status === 'COMPLETED' || status === 'TERMINATED') {
      await prisma.project.update({
        where: { id: contract.projectId },
        data: { status },
      });
    }

    res.json(updatedContract);
  } catch (error) {
    res.status(500).json({ error: 'Error updating contract status' });
  }
});

// Add a review to the contract
router.post('/:id/reviews', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user!.id;
    const contractId = req.params.id;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is part of the contract
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Determine who is reviewing whom
    const fromUserId = userId;
    const toUserId = userId === contract.clientId ? contract.freelancerId : contract.clientId;

    // Check if user has already submitted a review
    const existingReview = await prisma.review.findUnique({
      where: {
        contractId_fromUserId_toUserId: {
          contractId,
          fromUserId,
          toUserId,
        },
      },
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already submitted a review' });
    }

    const review = await prisma.review.create({
      data: {
        contractId,
        fromUserId,
        toUserId,
        rating,
        comment,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Error creating review' });
  }
});

export default router; 