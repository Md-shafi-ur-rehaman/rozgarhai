import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import {
  createGigSchema,
  updateGigSchema,
  orderGigSchema,
  gigQuerySchema,
  orderQuerySchema
} from '../validations/gig';

const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/gigs
// @desc    Create a new gig
// @access  Private (Freelancer only)
router.post('/', 
  protect, 
  authorize('FREELANCER'),
  validate(createGigSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const {
        title,
        description,
        price,
        deliveryTime,
        revisions,
        category,
        subcategory,
        tags,
        images,
        requirements
      } = req.body;

      const gig = await prisma.gig.create({
        data: {
          title,
          description,
          price,
          deliveryTime,
          revisions,
          category,
          subcategory,
          tags,
          images,
          requirements,
          freelancerId: req.user!.id
        },
        include: {
          freelancer: {
            select: {
              id: true,
              name: true,
              freelancerProfile: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: gig
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/gigs
// @desc    Get all gigs with filters
// @access  Public
router.get('/',
  validate(gigQuerySchema),
  async (req, res, next) => {
    try {
      const {
        category,
        subcategory,
        minPrice,
        maxPrice,
        search,
        sort
      } = req.query;

      const where: any = {
        status: 'ACTIVE'
      };

      if (category) {
        where.category = category;
      }

      if (subcategory) {
        where.subcategory = subcategory;
      }

      if (minPrice || maxPrice) {
        where.price = {
          ...(minPrice && { gte: Number(minPrice) }),
          ...(maxPrice && { lte: Number(maxPrice) })
        };
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const orderBy: any = {};
      if (sort === 'price') {
        orderBy.price = 'asc';
      } else if (sort === 'rating') {
        orderBy.rating = 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      const gigs = await prisma.gig.findMany({
        where,
        orderBy,
        include: {
          freelancer: {
            select: {
              id: true,
              name: true,
              freelancerProfile: true
            }
          }
        }
      });

      res.json(gigs);
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/gigs/:id
// @desc    Get single gig by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const gig = await prisma.gig.findUnique({
      where: { id: req.params.id },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            freelancerProfile: true
          }
        },
        reviews: {
          include: {
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!gig) {
      const error = new Error('Gig not found') as CustomError;
      error.statusCode = 404;
      throw error;
    }

    res.json(gig);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/gigs/:id
// @desc    Update gig
// @access  Private (Freelancer only)
router.put('/:id',
  protect,
  authorize('FREELANCER'),
  validate(updateGigSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const {
        title,
        description,
        price,
        deliveryTime,
        revisions,
        category,
        subcategory,
        tags,
        images,
        requirements,
        status
      } = req.body;

      const gig = await prisma.gig.findUnique({
        where: { id: req.params.id }
      });

      if (!gig) {
        const error = new Error('Gig not found') as CustomError;
        error.statusCode = 404;
        throw error;
      }

      if (gig.freelancerId !== req.user!.id) {
        const error = new Error('Not authorized') as CustomError;
        error.statusCode = 403;
        throw error;
      }

      const updatedGig = await prisma.gig.update({
        where: { id: req.params.id },
        data: {
          title,
          description,
          price,
          deliveryTime,
          revisions,
          category,
          subcategory,
          tags,
          images,
          requirements,
          status
        }
      });

      res.json({
        success: true,
        data: updatedGig
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/gigs/:id/order
// @desc    Order a gig
// @access  Private (Client only)
router.post('/:id/order',
  protect,
  authorize('CLIENT'),
  validate(orderGigSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { requirements, deliveryTime, revisions } = req.body;
      const gigId = req.params.id;

      const gig = await prisma.gig.findUnique({
        where: { id: gigId }
      });

      if (!gig) {
        const error = new Error('Gig not found') as CustomError;
        error.statusCode = 404;
        throw error;
      }

      if (gig.status !== 'ACTIVE') {
        const error = new Error('Gig is not available for ordering') as CustomError;
        error.statusCode = 400;
        throw error;
      }

      const order = await prisma.gigOrder.create({
        data: {
          gigId,
          clientId: req.user!.id,
          requirements,
          deliveryTime,
          revisions
        }
      });

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/gigs/orders
// @desc    Get all orders for a user
// @access  Private
router.get('/orders',
  protect,
  validate(orderQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { status, role } = req.query;
      const userId = req.user!.id;

      const where: any = {};
      if (role === 'client') {
        where.clientId = userId;
      } else if (role === 'freelancer') {
        where.gig = {
          freelancerId: userId
        };
      }

      if (status) {
        where.status = status;
      }

      const orders = await prisma.gigOrder.findMany({
        where,
        include: {
          gig: {
            select: {
              id: true,
              title: true,
              price: true
            }
          },
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json(orders);
    } catch (error) {
      next(error);
    }
  }
);

export default router; 