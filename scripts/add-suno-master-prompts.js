const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🎵 Creating SUNO Master user and prompts...')

  // Создаем пользователя SUNO Master
  const sunoUser = await prisma.user.upsert({
    where: { email: 'suno.master@prompthub.site' },
    update: {},
    create: {
      id: 'suno-master-001',
      email: 'suno.master@prompthub.site',
      name: 'SUNO Master',
      image: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      bio: 'Эксперт по созданию музыки с помощью ИИ. Специализируюсь на SUNO AI и других музыкальных генераторах. Помогаю создавать хиты!',
      website: 'https://suno-master.com',
      telegram: '@sunomaster',
      github: 'suno-master',
      twitter: 'suno_master',
      linkedin: 'suno-master',
      reputationScore: 0,
      reputationPromptCount: 0,
      reputationRatingsSum: 0,
      reputationRatingsCnt: 0,
      reputationLikesCnt: 0,
      reputationSavesCnt: 0,
      reputationCommentsCnt: 0,
    },
  })

  console.log(`✅ SUNO Master user created: ${sunoUser.name}`)

  // Создаем 10 качественных промптов от SUNO Master
  const sunoPrompts = [
    {
      title: 'Хип-хоп бит с глубоким басом',
      description: 'Создай мощный хип-хоп трек с глубоким басом и агрессивным ритмом',
      prompt: 'Create a hard-hitting hip-hop beat with deep 808 bass, crisp hi-hats, and aggressive rhythm. The track should have a dark, urban vibe with heavy bass drops and punchy drums. Include some atmospheric elements and make it sound professional and radio-ready.',
      model: 'SUNO AI',
      lang: 'English',
      category: 'Music',
      tags: 'hip-hop,rap,beat,bass,urban',
      license: 'CC-BY',
    },
    {
      title: 'Романтическая баллада на русском',
      description: 'Нежная романтическая песня о любви с красивой мелодией',
      prompt: 'Создай романтическую балладу на русском языке о вечной любви. Мелодия должна быть нежной и проникновенной, с акустической гитарой и мягкими струнными. Текст о том, как двое людей нашли друг друга и их любовь преодолевает все препятствия.',
      model: 'SUNO AI',
      lang: 'Русский',
      category: 'Music',
      tags: 'романтика,баллада,любовь,русский',
      license: 'CC-BY',
    },
    {
      title: 'Электронная танцевальная музыка (EDM)',
      description: 'Энергичный EDM трек для клубов и фестивалей',
      prompt: 'Create an energetic EDM track perfect for clubs and festivals. Include a massive drop with heavy bass, euphoric melodies, and build-ups that make people want to dance. The track should be around 128 BPM with modern electronic elements and a catchy hook.',
      model: 'SUNO AI',
      lang: 'English',
      category: 'Music',
      tags: 'EDM,electronic,dance,club,festival',
      license: 'CC-BY',
    },
    {
      title: 'Джазовая композиция с саксофоном',
      description: 'Стильная джазовая пьеса в стиле бибоп с соло саксофона',
      prompt: 'Compose a sophisticated jazz piece in bebop style featuring a prominent saxophone solo. Include complex chord progressions, syncopated rhythms, and improvisational elements. The track should have a smoky, late-night jazz club atmosphere with piano, double bass, and drums.',
      model: 'SUNO AI',
      lang: 'English',
      category: 'Music',
      tags: 'jazz,bebop,saxophone,improvisation',
      license: 'CC-BY',
    },
    {
      title: 'Рок-песня с мощными гитарами',
      description: 'Агрессивная рок-композиция с тяжелыми гитарами и энергичным вокалом',
      prompt: 'Create a powerful rock song with heavy distorted guitars, driving bass, and energetic vocals. The track should have a rebellious spirit with catchy riffs, a strong chorus, and a guitar solo. Think classic rock meets modern alternative with attitude and power.',
      model: 'SUNO AI',
      lang: 'English',
      category: 'Music',
      tags: 'rock,alternative,guitar,energy',
      license: 'CC-BY',
    },
    {
      title: 'Акустическая фолк-песня',
      description: 'Теплая фолк-композиция с акустическими инструментами',
      prompt: 'Создай теплую акустическую фолк-песню с гитарой, скрипкой и мандолиной. Песня должна рассказывать историю о путешествии, природе или воспоминаниях. Мелодия должна быть простой, но запоминающейся, с красивыми гармониями.',
      model: 'SUNO AI',
      lang: 'Русский',
      category: 'Music',
      tags: 'фолк,акустика,природа,путешествие',
      license: 'CC-BY',
    },
    {
      title: 'Синтвейв ретро-трек',
      description: 'Ностальгический синтвейв в стиле 80-х с неоновыми звуками',
      prompt: 'Create a nostalgic synthwave track that captures the essence of the 1980s. Include analog synthesizers, retro drum machines, and neon-soaked melodies. The track should have a dreamy, cyberpunk atmosphere with arpeggiated synths and a driving bassline.',
      model: 'SUNO AI',
      lang: 'English',
      category: 'Music',
      tags: 'synthwave,retro,80s,cyberpunk,neon',
      license: 'CC-BY',
    },
    {
      title: 'Классическая симфония',
      description: 'Эпическая симфоническая композиция в стиле классической музыки',
      prompt: 'Compose an epic symphonic piece in classical style with full orchestra. Include dramatic crescendos, beautiful string sections, powerful brass, and woodwind melodies. The composition should have multiple movements with varying tempos and emotions, building to a grand finale.',
      model: 'SUNO AI',
      lang: 'English',
      category: 'Music',
      tags: 'classical,symphony,orchestra,epic',
      license: 'CC-BY',
    },
    {
      title: 'Регги с позитивным посланием',
      description: 'Жизнерадостная регги-песня о мире и гармонии',
      prompt: 'Create an uplifting reggae song with a positive message about peace, love, and unity. Include the characteristic reggae rhythm, warm bassline, and melodic vocals. The song should spread good vibes and make people feel happy and connected.',
      model: 'SUNO AI',
      lang: 'English',
      category: 'Music',
      tags: 'reggae,positive,peace,love,unity',
      license: 'CC-BY',
    },
    {
      title: 'Амбиентная медитативная музыка',
      description: 'Спокойная амбиентная композиция для релаксации и медитации',
      prompt: 'Create a peaceful ambient track perfect for meditation and relaxation. Use soft pads, gentle textures, and minimal percussion. The music should be calming and ethereal, helping listeners find inner peace and tranquility. Include subtle nature sounds if possible.',
      model: 'SUNO AI',
      lang: 'English',
      category: 'Music',
      tags: 'ambient,meditation,relaxation,peaceful',
      license: 'CC-BY',
    },
  ]

  // Создаем промпты и добавляем рейтинги
  for (let i = 0; i < sunoPrompts.length; i++) {
    const promptData = sunoPrompts[i]
    
    // Создаем промпт
    const prompt = await prisma.prompt.create({
      data: {
        ...promptData,
        authorId: sunoUser.id,
      },
    })

    // Создаем случайные рейтинги (от 3 до 5 звезд)
    const ratingCount = Math.floor(Math.random() * 15) + 5 // 5-19 рейтингов
    const baseRating = 4 + Math.random() // 4-5 звезд в среднем

    for (let j = 0; j < ratingCount; j++) {
      // Создаем случайного пользователя-оценщика
      const raterId = `suno-rater-${i}-${j}`
      const rater = await prisma.user.upsert({
        where: { id: raterId },
        update: {},
        create: {
          id: raterId,
          name: `Music Lover ${i}-${j}`,
          email: `rater${i}-${j}@music.com`,
        },
      })

      // Создаем рейтинг
      const rating = Math.max(3, Math.min(5, Math.round(baseRating + (Math.random() - 0.5))))
      
      await prisma.rating.upsert({
        where: {
          userId_promptId: {
            userId: rater.id,
            promptId: prompt.id,
          },
        },
        update: { value: rating },
        create: {
          value: rating,
          userId: rater.id,
          promptId: prompt.id,
        },
      })
    }

    console.log(`✅ Created prompt: ${promptData.title} (${ratingCount} ratings)`)
  }

  // Обновляем статистику пользователя SUNO Master
  const userStats = await prisma.user.findUnique({
    where: { id: sunoUser.id },
    include: {
      prompts: {
        include: {
          ratings: true,
        },
      },
    },
  })

  const totalRatings = userStats.prompts.reduce((sum, prompt) => sum + prompt.ratings.length, 0)
  const ratingsSum = userStats.prompts.reduce((sum, prompt) => 
    sum + prompt.ratings.reduce((promptSum, rating) => promptSum + rating.value, 0), 0
  )

  await prisma.user.update({
    where: { id: sunoUser.id },
    data: {
      reputationPromptCount: userStats.prompts.length,
      reputationRatingsSum: ratingsSum,
      reputationRatingsCnt: totalRatings,
      reputationScore: totalRatings > 0 ? Math.round((ratingsSum / totalRatings) * 20) : 0, // 0-100 scale
    },
  })

  console.log('🎉 SUNO Master and prompts created successfully!')
  console.log(`📊 SUNO Master stats:`)
  console.log(`- Prompts: ${userStats.prompts.length}`)
  console.log(`- Total ratings: ${totalRatings}`)
  console.log(`- Average rating: ${(ratingsSum / totalRatings).toFixed(2)}`)
  console.log(`- Reputation score: ${Math.round((ratingsSum / totalRatings) * 20)}/100`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
