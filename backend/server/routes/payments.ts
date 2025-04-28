import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect as authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get payments for a contract
router.get('/contract/:contractId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const contractId = req.params.contractId;

    // Check if user is part of the contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const payments = await prisma.payment.findMany({
      where: { contractId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching payments' });
  }
});

// Create a payment
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { contractId, amount, description } = req.body;
    const userId = req.user!.id;

    // Check if user is the client of the contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.clientId !== userId) {
      return res.status(403).json({ error: 'Only clients can make payments' });
    }

    if (contract.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Cannot make payment for inactive contract' });
    }

    const payment = await prisma.payment.create({
      data: {
        contractId,
        amount,
        description,
      },
    });

    // Here you would typically integrate with a payment gateway
    // For now, we'll just mark the payment as completed
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
    });

    res.status(201).json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: 'Error creating payment' });
  }
});

// Update payment status (e.g., mark as failed or refunded)
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const userId = req.user!.id;
    const paymentId = req.params.id;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.contract.clientId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: 'Error updating payment status' });
  }
});

export default router; 