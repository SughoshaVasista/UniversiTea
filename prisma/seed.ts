import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cec = await prisma.community.upsert({
    where: { slug: 'cec' },
    update: {
      name: 'City Engineering College',
      collegeName: 'City Engineering College',
      emailDomain: 'cec.edu',
      status: 'VERIFIED',
      description: 'The unofficial student tea room.',
    },
    create: {
      name: 'City Engineering College',
      slug: 'cec',
      collegeName: 'City Engineering College',
      emailDomain: 'cec.edu',
      status: 'VERIFIED',
      description: 'The unofficial student tea room.',
    },
  })

  const rvce = await prisma.community.upsert({
    where: { slug: 'rvce' },
    update: {
      name: 'RV College of Engineering',
      collegeName: 'RV College of Engineering',
      emailDomain: 'rvce.edu',
      status: 'VERIFIED',
      description: 'RVCE student discussion and campus wire.',
    },
    create: {
      name: 'RV College of Engineering',
      slug: 'rvce',
      collegeName: 'RV College of Engineering',
      emailDomain: 'rvce.edu',
      status: 'VERIFIED',
      description: 'RVCE student discussion and campus wire.',
    },
  })

  const bmsce = await prisma.community.upsert({
    where: { slug: 'bmsce' },
    update: {
      name: 'BMS College of Engineering',
      collegeName: 'BMS College of Engineering',
      emailDomain: 'bmsce.ac.in',
      status: 'VERIFIED',
      description: 'BMSCE student tea room.',
    },
    create: {
      name: 'BMS College of Engineering',
      slug: 'bmsce',
      collegeName: 'BMS College of Engineering',
      emailDomain: 'bmsce.ac.in',
      status: 'VERIFIED',
      description: 'BMSCE student tea room.',
    },
  })

  console.log('🌱 Seed completed successfully:', [cec.slug, rvce.slug, bmsce.slug].join(', '))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
