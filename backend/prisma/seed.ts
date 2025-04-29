import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean the database
  await prisma.bid.deleteMany();
  await prisma.projectSkill.deleteMany();
  await prisma.project.deleteMany();
  await prisma.freelancerSkill.deleteMany();
  await prisma.freelancerProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skill.deleteMany();

  // Create skills
  const skills = await Promise.all([
    // Software Development
    prisma.skill.create({
      data: {
        name: 'Web Development',
        category: 'Software Development'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Mobile Development',
        category: 'Software Development'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Backend Development',
        category: 'Software Development'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Frontend Development',
        category: 'Software Development'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Full Stack Development',
        category: 'Software Development'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'DevOps',
        category: 'Software Development'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Database Management',
        category: 'Software Development'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Cloud Computing',
        category: 'Software Development'
      }
    }),

    // Design
    prisma.skill.create({
      data: {
        name: 'UI/UX Design',
        category: 'Design'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Graphic Design',
        category: 'Design'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Logo Design',
        category: 'Design'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Brand Identity Design',
        category: 'Design'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Motion Graphics',
        category: 'Design'
      }
    }),

    // Marketing
    prisma.skill.create({
      data: {
        name: 'Digital Marketing',
        category: 'Marketing'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Social Media Marketing',
        category: 'Marketing'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'SEO',
        category: 'Marketing'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Content Marketing',
        category: 'Marketing'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Email Marketing',
        category: 'Marketing'
      }
    }),

    // Writing
    prisma.skill.create({
      data: {
        name: 'Content Writing',
        category: 'Writing'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Technical Writing',
        category: 'Writing'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Copywriting',
        category: 'Writing'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Blog Writing',
        category: 'Writing'
      }
    }),

    // Business
    prisma.skill.create({
      data: {
        name: 'Business Analysis',
        category: 'Business'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Project Management',
        category: 'Business'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Data Analysis',
        category: 'Business'
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Financial Analysis',
        category: 'Business'
      }
    })
  ]);

  // Create users (clients and freelancers)
  const password = await bcrypt.hash('password123', 10);

  const clients = await Promise.all([
    prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        password,
        role: 'CLIENT',
        clientProfile: {
          create: {
            companyName: 'Tech Solutions Inc',
            website: 'https://techsolutions.example.com',
            description: 'Leading software development company',
            industry: 'Technology',
            location: 'New York, USA'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password,
        role: 'CLIENT',
        clientProfile: {
          create: {
            companyName: 'Digital Marketing Pro',
            website: 'https://digitalmarketing.example.com',
            description: 'Digital marketing agency',
            industry: 'Marketing',
            location: 'London, UK'
          }
        }
      }
    })
  ]);

  const freelancers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        password,
        role: 'FREELANCER',
        freelancerProfile: {
          create: {
            title: 'Full Stack Developer',
            description: 'Experienced in building scalable web applications',
            experience: 5,
            education: 'B.S. in Computer Science',
            location: 'San Francisco, USA',
            languages: ['English', 'Spanish'],
            portfolio: 'https://alexportfolio.example.com'
          }
        }
      },
      include: {
        freelancerProfile: true
      }
    }),
    prisma.user.create({
      data: {
        name: 'Sarah Williams',
        email: 'sarah@example.com',
        password,
        role: 'FREELANCER',
        freelancerProfile: {
          create: {
            title: 'UI/UX Designer',
            description: 'Passionate about creating beautiful user experiences',
            experience: 3,
            education: 'B.A. in Design',
            location: 'Berlin, Germany',
            languages: ['English', 'German'],
            portfolio: 'https://sarahportfolio.example.com'
          }
        }
      },
      include: {
        freelancerProfile: true
      }
    })
  ]);

  // Add skills to freelancers
  await Promise.all([
    prisma.freelancerSkill.create({
      data: {
        freelancerId: freelancers[0].freelancerProfile!.id,
        skillId: skills[4].id, // Full Stack Development
        yearsExperience: 5
      }
    }),
    prisma.freelancerSkill.create({
      data: {
        freelancerId: freelancers[0].freelancerProfile!.id,
        skillId: skills[0].id, // Web Development
        yearsExperience: 5
      }
    }),
    prisma.freelancerSkill.create({
      data: {
        freelancerId: freelancers[1].freelancerProfile!.id,
        skillId: skills[8].id, // UI/UX Design
        yearsExperience: 3
      }
    })
  ]);

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        title: 'E-commerce Website Development',
        description: 'Need an experienced developer to build a modern e-commerce platform',
        budget: 5000,
        deadline: new Date('2024-12-31'),
        status: 'OPEN',
        clientId: clients[0].id,
        skills: {
          create: [
            { skill: { connect: { id: skills[4].id } } }, // Full Stack Development
            { skill: { connect: { id: skills[0].id } } }, // Web Development
            { skill: { connect: { id: skills[3].id } } }, // Frontend Development
            { skill: { connect: { id: skills[2].id } } }, // Backend Development
            { skill: { connect: { id: skills[8].id } } }  // UI/UX Design
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        title: 'Mobile App Development',
        description: 'Looking for a mobile developer to create a fitness tracking app',
        budget: 3000,
        deadline: new Date('2024-10-31'),
        status: 'OPEN',
        clientId: clients[1].id,
        skills: {
          create: [
            { skill: { connect: { id: skills[1].id } } }, // Mobile Development
            { skill: { connect: { id: skills[8].id } } }, // UI/UX Design
            { skill: { connect: { id: skills[6].id } } }  // Database Management
          ]
        }
      }
    })
  ]);

  // Create bids
  await Promise.all([
    prisma.bid.create({
      data: {
        projectId: projects[0].id,
        freelancerId: freelancers[0].id,
        amount: 4500,
        duration: 30,
        coverLetter: 'I have extensive experience in building e-commerce platforms...',
        status: 'PENDING'
      }
    }),
    prisma.bid.create({
      data: {
        projectId: projects[1].id,
        freelancerId: freelancers[1].id,
        amount: 2800,
        duration: 25,
        coverLetter: 'I specialize in mobile app development...',
        status: 'PENDING'
      }
    })
  ]);

  console.log('Database has been seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 