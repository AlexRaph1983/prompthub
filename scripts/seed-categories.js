const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Маппинг категорий с SEO-оптимизированными русскими названиями
const categories = [
  {
    slug: 'legal',
    nameRu: 'Промпты для юристов',
    nameEn: 'Legal',
    descriptionRu: 'Подборка промптов для юридических задач: консультации по праву, подготовка договоров, анализ судебной практики и законов. Готовые шаблоны ускорят рутину и помогут получать структурированные ответы от ИИ.',
    descriptionEn: 'Legal prompts for consultations, contract preparation, case law analysis, and legal research. Ready-to-use templates to streamline legal workflows.',
    sortOrder: 1
  },
  {
    slug: 'health',
    nameRu: 'Промпты для врачей',
    nameEn: 'Health',
    descriptionRu: 'Шаблоны промптов для медицинских сценариев: подготовка анамнеза, структурирование симптомов, черновики рекомендаций и анализ заключений. Важно: материалы обучающие, не заменяют консультацию врача.',
    descriptionEn: 'Medical prompts for case preparation, symptom analysis, treatment recommendations, and medical documentation. Educational materials only.',
    sortOrder: 2
  },
  {
    slug: 'education',
    nameRu: 'Промпты для обучения',
    nameEn: 'Education',
    descriptionRu: 'Готовые промпты для учебных задач: конспекты, объяснения сложных тем простыми словами, генерация тестов и проверочных вопросов. Подходят для школьников, студентов и самообучения.',
    descriptionEn: 'Educational prompts for note-taking, explaining complex topics, generating tests and quizzes. Suitable for students and self-learning.',
    sortOrder: 3
  },
  {
    slug: 'marketing-writing',
    nameRu: 'Промпты для написания текстов',
    nameEn: 'Marketing & Writing',
    descriptionRu: 'Промпты для создания контента: статьи, посты в соцсетях, email-рассылки, рекламные тексты. От копирайтинга до SEO-оптимизации — всё для эффективного маркетинга.',
    descriptionEn: 'Content creation prompts: articles, social media posts, email campaigns, ad copy. From copywriting to SEO optimization.',
    sortOrder: 4
  },
  {
    slug: 'image',
    nameRu: 'Промпты для фото',
    nameEn: 'Image',
    descriptionRu: 'Идеи промптов для генерации и планирования фотосессий: стили, позы, свет, сет-дизайн. От портрета до fashion — быстро подберите референсы и технические ТЗ для ИИ-моделей.',
    descriptionEn: 'Image generation prompts for photography, portraits, fashion, and creative visuals. From portraits to fashion shoots.',
    sortOrder: 5
  },
  {
    slug: 'video',
    nameRu: 'Промпты для видео',
    nameEn: 'Video',
    descriptionRu: 'Промпты для создания видеоконтента: сценарии, раскадровки, описания сцен, технические задания для видеопродакшена. От YouTube до кинопроизводства.',
    descriptionEn: 'Video content prompts: scripts, storyboards, scene descriptions, technical specifications for video production.',
    sortOrder: 6
  },
  {
    slug: 'chat',
    nameRu: 'Промпты для чата',
    nameEn: 'Chat',
    descriptionRu: 'Промпты для общения с ИИ-ассистентами: настройка тона, роли, стиля общения. Персонализация диалогов для разных задач и аудиторий.',
    descriptionEn: 'AI assistant prompts: tone setting, role-playing, communication style customization for different tasks and audiences.',
    sortOrder: 7
  },
  {
    slug: 'code',
    nameRu: 'Промпты для программирования',
    nameEn: 'Code',
    descriptionRu: 'Промпты для разработки: генерация кода, отладка, рефакторинг, документация. Поддержка всех популярных языков программирования и фреймворков.',
    descriptionEn: 'Programming prompts: code generation, debugging, refactoring, documentation. Support for all popular languages and frameworks.',
    sortOrder: 8
  },
  {
    slug: 'seo',
    nameRu: 'Промпты для SEO',
    nameEn: 'SEO',
    descriptionRu: 'Промпты для поисковой оптимизации: анализ ключевых слов, создание мета-тегов, оптимизация контента. Повышение видимости сайтов в поисковых системах.',
    descriptionEn: 'SEO prompts: keyword analysis, meta tag creation, content optimization. Improving website visibility in search engines.',
    sortOrder: 9
  },
  {
    slug: 'design',
    nameRu: 'Промпты для дизайна',
    nameEn: 'Design',
    descriptionRu: 'Промпты для дизайнеров: создание логотипов, веб-дизайн, UI/UX, брендинг. От концепции до финального макета — ускорьте творческий процесс.',
    descriptionEn: 'Design prompts: logo creation, web design, UI/UX, branding. From concept to final layout, accelerate your creative process.',
    sortOrder: 10
  },
  {
    slug: 'music',
    nameRu: 'Промпты для музыки',
    nameEn: 'Music',
    descriptionRu: 'Промпты для музыкального творчества: композиция, аранжировка, описание стилей и жанров. От классики до электроники — создавайте уникальные треки.',
    descriptionEn: 'Music creation prompts: composition, arrangement, style and genre descriptions. From classical to electronic music.',
    sortOrder: 11
  },
  {
    slug: 'audio',
    nameRu: 'Промпты для аудио',
    nameEn: 'Audio',
    descriptionRu: 'Промпты для работы с аудио: подкасты, озвучка, звуковое оформление, обработка записей. Профессиональное качество звука для любых проектов.',
    descriptionEn: 'Audio production prompts: podcasts, voiceovers, sound design, audio processing. Professional quality for any project.',
    sortOrder: 12
  },
  {
    slug: '3d',
    nameRu: 'Промпты для 3D',
    nameEn: '3D',
    descriptionRu: 'Промпты для 3D-моделирования: создание объектов, текстур, анимации, рендеринга. От архитектуры до игрового дизайна — реализуйте любые идеи.',
    descriptionEn: '3D modeling prompts: object creation, textures, animation, rendering. From architecture to game design.',
    sortOrder: 13
  },
  {
    slug: 'animation',
    nameRu: 'Промпты для анимации',
    nameEn: 'Animation',
    descriptionRu: 'Промпты для анимации: персонажи, движения, сцены, стили анимации. От 2D до 3D — создавайте динамичный контент для любых платформ.',
    descriptionEn: 'Animation prompts: characters, movements, scenes, animation styles. From 2D to 3D, create dynamic content.',
    sortOrder: 14
  },
  {
    slug: 'business',
    nameRu: 'Промпты для бизнеса',
    nameEn: 'Business',
    descriptionRu: 'Промпты для бизнес-задач: анализ рынка, бизнес-планы, презентации, переговоры. Ускорьте принятие решений и повысьте эффективность.',
    descriptionEn: 'Business prompts: market analysis, business plans, presentations, negotiations. Accelerate decision-making and efficiency.',
    sortOrder: 15
  },
  {
    slug: 'research',
    nameRu: 'Промпты для исследований',
    nameEn: 'Research',
    descriptionRu: 'Промпты для научных исследований: анализ данных, гипотезы, методология, отчеты. Структурируйте информацию и ускорите открытия.',
    descriptionEn: 'Research prompts: data analysis, hypotheses, methodology, reports. Structure information and accelerate discoveries.',
    sortOrder: 16
  },
  {
    slug: 'analysis',
    nameRu: 'Промпты для анализа',
    nameEn: 'Analysis',
    descriptionRu: 'Промпты для аналитики: обработка данных, визуализация, выводы, отчеты. Превращайте сырые данные в ценные инсайты.',
    descriptionEn: 'Analytics prompts: data processing, visualization, insights, reports. Transform raw data into valuable insights.',
    sortOrder: 17
  },
  {
    slug: 'creative',
    nameRu: 'Промпты для творчества',
    nameEn: 'Creative',
    descriptionRu: 'Промпты для творческих задач: идеи, концепции, вдохновение, арт-проекты. Развивайте креативность и реализуйте нестандартные решения.',
    descriptionEn: 'Creative prompts: ideas, concepts, inspiration, art projects. Develop creativity and implement innovative solutions.',
    sortOrder: 18
  },
  {
    slug: 'productivity',
    nameRu: 'Промпты для продуктивности',
    nameEn: 'Productivity',
    descriptionRu: 'Промпты для повышения эффективности: планирование, тайм-менеджмент, цели, привычки. Оптимизируйте рабочий процесс и достижения.',
    descriptionEn: 'Productivity prompts: planning, time management, goals, habits. Optimize workflow and achievements.',
    sortOrder: 19
  },
  {
    slug: 'gaming',
    nameRu: 'Промпты для игр',
    nameEn: 'Gaming',
    descriptionRu: 'Промпты для геймдева: сюжеты, персонажи, диалоги, игровые механики. От инди до AAA — создавайте захватывающие игровые миры.',
    descriptionEn: 'Game development prompts: stories, characters, dialogues, game mechanics. From indie to AAA, create engaging game worlds.',
    sortOrder: 20
  },
  {
    slug: 'finance',
    nameRu: 'Промпты для финансов',
    nameEn: 'Finance',
    descriptionRu: 'Промпты для финансового анализа: инвестиции, бюджетирование, отчетность, прогнозирование. Принимайте обоснованные финансовые решения.',
    descriptionEn: 'Financial analysis prompts: investments, budgeting, reporting, forecasting. Make informed financial decisions.',
    sortOrder: 21
  },
  {
    slug: 'cooking',
    nameRu: 'Промпты для кулинарии',
    nameEn: 'Cooking',
    descriptionRu: 'Промпты для кулинарного творчества: рецепты, техники приготовления, меню, пищевые сочетания. От домашней кухни до ресторанного уровня.',
    descriptionEn: 'Culinary prompts: recipes, cooking techniques, menus, food pairings. From home cooking to restaurant level.',
    sortOrder: 22
  }
];

// Подкатегории для Image
const imageSubcategories = [
  {
    slug: 'photography',
    nameRu: 'Фотосессии',
    nameEn: 'Photography',
    descriptionRu: 'Промпты для планирования и проведения фотосессий: портреты, fashion, свадьбы, корпоративы. Технические задания и креативные идеи.',
    descriptionEn: 'Photography session prompts: portraits, fashion, weddings, corporate events. Technical briefs and creative ideas.',
    parentSlug: 'image',
    sortOrder: 1
  },
  {
    slug: 'photo-editing',
    nameRu: 'Обработка фото',
    nameEn: 'Photo Editing',
    descriptionRu: 'Промпты для редактирования изображений: ретушь, цветокоррекция, композиция, стилизация. Профессиональная обработка фотографий.',
    descriptionEn: 'Photo editing prompts: retouching, color correction, composition, styling. Professional photo processing.',
    parentSlug: 'image',
    sortOrder: 2
  },
  {
    slug: 'nsfw',
    nameRu: 'NSFW 18+',
    nameEn: 'NSFW 18+',
    descriptionRu: 'Промпты для взрослого контента: эротика, фетиш, BDSM. Только для совершеннолетних пользователей.',
    descriptionEn: 'Adult content prompts: erotic, fetish, BDSM. Adults only content.',
    parentSlug: 'image',
    sortOrder: 3
  }
];

// Теги
const tags = [
  { name: 'ChatGPT', slug: 'chatgpt', description: 'Промпты для ChatGPT' },
  { name: 'Claude', slug: 'claude', description: 'Промпты для Claude' },
  { name: 'Gemini', slug: 'gemini', description: 'Промпты для Gemini' },
  { name: 'Midjourney', slug: 'midjourney', description: 'Промпты для Midjourney' },
  { name: 'DALL-E', slug: 'dalle', description: 'Промпты для DALL-E' },
  { name: 'Stable Diffusion', slug: 'stable-diffusion', description: 'Промпты для Stable Diffusion' },
  { name: 'NSFW', slug: 'nsfw', description: 'Контент для взрослых', isNsfw: true, color: '#ff4444' },
  { name: 'Бесплатно', slug: 'free', description: 'Бесплатные промпты' },
  { name: 'Премиум', slug: 'premium', description: 'Премиум промпты' },
  { name: 'Популярное', slug: 'popular', description: 'Популярные промпты' },
  { name: 'Новое', slug: 'new', description: 'Новые промпты' }
];

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  try {
    // Создаем основные категории
    for (const categoryData of categories) {
      await prisma.category.upsert({
        where: { slug: categoryData.slug },
        update: categoryData,
        create: categoryData
      });
      console.log(`✅ Created category: ${categoryData.nameRu}`);
    }

    // Создаем подкатегории для Image
    const imageCategory = await prisma.category.findUnique({
      where: { slug: 'image' }
    });

    if (imageCategory) {
      for (const subcategoryData of imageSubcategories) {
        const { parentSlug, ...subcategoryDataClean } = subcategoryData;
        await prisma.category.upsert({
          where: { slug: subcategoryData.slug },
          update: {
            ...subcategoryDataClean,
            parentId: imageCategory.id
          },
          create: {
            ...subcategoryDataClean,
            parentId: imageCategory.id
          }
        });
        console.log(`✅ Created subcategory: ${subcategoryData.nameRu}`);
      }
    }

    // Создаем теги
    for (const tagData of tags) {
      await prisma.tag.upsert({
        where: { slug: tagData.slug },
        update: tagData,
        create: tagData
      });
      console.log(`✅ Created tag: ${tagData.name}`);
    }

    console.log('🎉 Categories and tags seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
}

async function main() {
  await seedCategories();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
