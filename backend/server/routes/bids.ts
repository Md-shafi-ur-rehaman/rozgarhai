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
        include: {
          client: {
            select: {
              id: true,
              name: true,
              clientProfile: true
            }
          },
          skills: {
            include: {
              skill: true
            }
          }
        }
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
              freelancerProfile: {
                select: {
                  title: true,
                  experience: true,
                  location: true
                }
              }
            }
          },
          project: {
            select: {
              id: true,
              title: true,
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
      });

      // Format the response
      const formattedResponse = {
        success: true,
        data: {
          bid: {
            id: bid.id,
            amount: bid.amount,
            duration: bid.duration,
            coverLetter: bid.coverLetter,
            status: bid.status,
            createdAt: bid.createdAt,
            updatedAt: bid.updatedAt
          },
          project: {
            id: bid.project.id,
            title: bid.project.title,
            budget: bid.project.budget,
            deadline: bid.project.deadline,
            status: bid.project.status,
            client: {
              id: bid.project.client.id,
              name: bid.project.client.name,
              profile: bid.project.client.clientProfile
            }
          },
          freelancer: {
            id: bid.freelancer.id,
            name: bid.freelancer.name,
            profile: {
              title: bid.freelancer.freelancerProfile?.title,
              experience: bid.freelancer.freelancerProfile?.experience,
              location: bid.freelancer.freelancerProfile?.location
            }
          }
        }
      };

      res.status(201).json(formattedResponse);
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
          project: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  clientProfile: true
                }
              }
            }
          },
          freelancer: {
            select: {
              id: true,
              name: true,
              freelancerProfile: {
                select: {
                  title: true,
                  experience: true,
                  location: true
                }
              }
            }
          }
        }
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
              freelancerProfile: {
                select: {
                  title: true,
                  experience: true,
                  location: true
                }
              }
            }
          },
          project: {
            select: {
              id: true,
              title: true,
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
      });

      let contract = null;
      // If bid is accepted, create a contract
      if (status === 'ACCEPTED') {
        contract = await prisma.contract.create({
          data: {
            projectId: bid.projectId,
            bidId: bid.id,
            clientId: bid.project.clientId,
            freelancerId: bid.freelancerId,
            terms: `Contract for project: ${bid.project.title}`,
            amount: bid.amount,
            startDate: new Date(),
          },
          include: {
            project: {
              select: {
                id: true,
                title: true,
                budget: true,
                deadline: true,
                status: true
              }
            },
            client: {
              select: {
                id: true,
                name: true,
                clientProfile: true
              }
            },
            freelancer: {
              select: {
                id: true,
                name: true,
                freelancerProfile: {
                  select: {
                    title: true,
                    experience: true,
                    location: true
                  }
                }
              }
            }
          }
        });

        // Update project status
        await prisma.project.update({
          where: { id: bid.projectId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      // Format the response
      const formattedResponse = {
        success: true,
        data: {
          bid: {
            id: updatedBid.id,
            amount: updatedBid.amount,
            duration: updatedBid.duration,
            coverLetter: updatedBid.coverLetter,
            status: updatedBid.status,
            createdAt: updatedBid.createdAt,
            updatedAt: updatedBid.updatedAt
          },
          project: {
            id: updatedBid.project.id,
            title: updatedBid.project.title,
            budget: updatedBid.project.budget,
            deadline: updatedBid.project.deadline,
            status: updatedBid.project.status,
            client: {
              id: updatedBid.project.client.id,
              name: updatedBid.project.client.name,
              profile: updatedBid.project.client.clientProfile
            }
          },
          freelancer: {
            id: updatedBid.freelancer.id,
            name: updatedBid.freelancer.name,
            profile: {
              title: updatedBid.freelancer.freelancerProfile?.title,
              experience: updatedBid.freelancer.freelancerProfile?.experience,
              location: updatedBid.freelancer.freelancerProfile?.location
            }
          },
          contract: contract ? {
            id: contract.id,
            terms: contract.terms,
            amount: contract.amount,
            startDate: contract.startDate,
            status: contract.status,
            project: {
              id: contract.project.id,
              title: contract.project.title,
              budget: contract.project.budget,
              deadline: contract.project.deadline,
              status: contract.project.status
            },
            client: {
              id: contract.client.id,
              name: contract.client.name,
              profile: contract.client.clientProfile
            },
            freelancer: {
              id: contract.freelancer.id,
              name: contract.freelancer.name,
              profile: {
                title: contract.freelancer.freelancerProfile?.title,
                experience: contract.freelancer.freelancerProfile?.experience,
                location: contract.freelancer.freelancerProfile?.location
              }
            }
          } : null
        }
      };

      res.json(formattedResponse);
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