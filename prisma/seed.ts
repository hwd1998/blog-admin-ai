import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.AUTHOR_EMAIL?.trim().toLowerCase()
  const password = process.env.AUTHOR_PASSWORD
  if (!email || !password) {
    console.log('Seed skipped: set AUTHOR_EMAIL and AUTHOR_PASSWORD in environment.')
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Author user already exists:', email)
    console.log('AUTHOR_UID=' + existing.id)
    return
  }

  const passwordHash = await hash(password, 12)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Author',
    },
  })

  console.log('Created author user:', email)
  console.log('Add to .env.local: AUTHOR_UID=' + user.id)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
