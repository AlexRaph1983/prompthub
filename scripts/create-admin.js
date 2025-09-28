const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Разрешения по умолчанию для разных ролей
const PERMISSIONS = {
  moderator: {
    prompts_view: true,
    prompts_moderate: true,
    prompts_delete: true,
    prompts_edit: false,
    users_view: true,
    users_manage: false,
    users_ban: false,
    analytics_view: true,
    analytics_export: false,
    system_settings: false,
    admin_manage: false,
  },
  admin: {
    prompts_view: true,
    prompts_moderate: true,
    prompts_delete: true,
    prompts_edit: true,
    users_view: true,
    users_manage: true,
    users_ban: true,
    analytics_view: true,
    analytics_export: true,
    system_settings: true,
    admin_manage: false,
  },
  super_admin: {
    prompts_view: true,
    prompts_moderate: true,
    prompts_delete: true,
    prompts_edit: true,
    users_view: true,
    users_manage: true,
    users_ban: true,
    analytics_view: true,
    analytics_export: true,
    system_settings: true,
    admin_manage: true,
  }
}

async function createAdmin() {
  const email = process.argv[2]
  const role = process.argv[3] || 'moderator'

  if (!email) {
    console.error('Использование: node scripts/create-admin.js <email> [role]')
    console.error('Роли: moderator, admin, super_admin')
    process.exit(1)
  }

  if (!PERMISSIONS[role]) {
    console.error('Неверная роль. Доступные роли: moderator, admin, super_admin')
    process.exit(1)
  }

  try {
    // Найти пользователя по email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      console.error(`Пользователь с email ${email} не найден`)
      console.error('Пользователь должен сначала войти на сайт через Google OAuth')
      process.exit(1)
    }

    // Проверить, не является ли уже админом
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { userId: user.id }
    })

    if (existingAdmin) {
      console.log(`Пользователь ${email} уже является админом с ролью ${existingAdmin.role}`)
      
      // Обновить роль и разрешения
      const updatedAdmin = await prisma.adminUser.update({
        where: { userId: user.id },
        data: {
          role,
          permissions: PERMISSIONS[role],
          updatedAt: new Date(),
        }
      })
      
      console.log(`Роль обновлена до ${role}`)
      return
    }

    // Создать админского пользователя
    const adminUser = await prisma.adminUser.create({
      data: {
        userId: user.id,
        role,
        permissions: PERMISSIONS[role],
      }
    })

    console.log(`✅ Админский пользователь создан:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Имя: ${user.name}`)
    console.log(`   Роль: ${role}`)
    console.log(`   ID: ${adminUser.id}`)
    console.log(`\nПользователь может теперь зайти на /admin`)

  } catch (error) {
    console.error('Ошибка при создании админа:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
