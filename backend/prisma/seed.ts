import { PrismaClient, Role, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean the database
  const tablenames = Prisma.dmmf.datamodel.models.map(model => model.dbName || model.name);
  
  for (const tablename of tablenames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
    } catch (error) {
      console.log(`Error truncating ${tablename}: ${error}`);
    }
  }

  // Create a skill
  const webDevSkill = await prisma.skill.create({
    data: {
      name: 'Web Development',
      category: 'Software Development'
    }
  });

  // Create a freelancer with profile
  const freelancer = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'John Doe',
      role: 'FREELANCER',
      freelancerProfile: {
        create: {
          title: 'Senior Full Stack Developer',
          description: 'Experienced developer with 5 years of experience',
          experience: 5,
          education: 'Bachelor in Computer Science',
          location: 'Mumbai, India',
          languages: ['English', 'Hindi']
        }
      }
    },
    include: {
      freelancerProfile: true
    }
  });

  // Add skill to freelancer
  if (freelancer.freelancerProfile) {
    await prisma.freelancerSkill.create({
      data: {
        freelancerId: freelancer.freelancerProfile.id,
        skillId: webDevSkill.id,
        yearsExperience: 5
      }
    });
  }

  // Create a client with profile
  const client = await prisma.user.create({
    data: {
      email: 'sarah@techsolutions.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Sarah Smith',
      role: 'CLIENT',
      clientProfile: {
        create: {
          companyName: 'Tech Solutions Inc',
          website: 'https://techsolutions.example.com',
          description: 'Leading software development company',
          industry: 'Technology',
          location: 'Bangalore, India'
        }
      }
    }
  });

  // Create a project
  const project = await prisma.project.create({
    data: {
      clientId: client.id,
      title: 'E-commerce Website Development',
      description: 'Need an experienced developer to build a modern e-commerce platform',
      budget: 20000,
      deadline: new Date('2024-12-31'),
      skills: {
        create: {
          skillId: webDevSkill.id
        }
      }
    }
  });

  // Create a bid
  await prisma.bid.create({
    data: {
      projectId: project.id,
      freelancerId: freelancer.id,
      amount: 18000,
      duration: 60,
      coverLetter: 'I am very interested in this project and have extensive experience in e-commerce development.'
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 