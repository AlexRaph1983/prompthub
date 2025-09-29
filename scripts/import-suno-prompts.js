const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sunoPrompts = {
  "version": "1.0",
  "submitted_by": { "username": "SUNO Master", "user_id": "", "profile_url": "" },
  "taxonomy": {
    "languages": ["ru", "en", "multi"],
    "licenses": ["CC-BY", "CC-BY-SA", "CC0", "Proprietary"],
    "categories": ["audio"],
    "models": ["any", "gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "claude-3.5-sonnet", "claude-3.5-haiku", "claude-3-opus", "gemini-1.5-pro", "gemini-1.5-flash", "llama-3.1-8b-instruct", "llama-3.1-70b-instruct", "mistral-large-latest", "mistral-small-latest", "command-r-plus", "command-r"],
    "categories": ["audio"]
  },
  "items": [
    {
      "title": "Создание K-Pop трека с ярким хором и EDM дропом",
      "summary": "Сгенерируй энергичный K-Pop трек с элементами EDM: куплеты-рэп, припев с вокальными гармониями и мощный дроп.",
      "language": "en",
      "model": "any",
      "category": "audio",
      "license": "CC-BY",
      "tags": ["k-pop", "edm", "chorus", "dance"],
      "prompt_text": "Produce a K-Pop inspired track with rap-driven verses, a soaring vocal chorus layered with harmonies, and an explosive EDM drop. Use bright synth arpeggios, punchy kicks, and sharp claps. Add emotional tension in pre-chorus and release it with a euphoric drop.",
      "usage_instructions": "Keep vocals polished and wide in the stereo field. Use stacked harmonies in the chorus.",
      "examples": ["Reference: BLACKPINK x David Guetta style crossover"],
      "attribution": { "author_name": "SUNO Master" },
      "visibility": "public",
      "status": "published"
    },
    {
      "title": "Китайский рэп с этническими инструментами",
      "summary": "Создай трек в стиле Chinese Rap с энергичным речитативом и элементами традиционных инструментов.",
      "language": "multi",
      "model": "any",
      "category": "audio",
      "license": "CC-BY-SA",
      "tags": ["rap", "china", "ethnic", "hip-hop"],
      "prompt_text": "Generate a Chinese rap track blending trap-style beats with traditional Chinese instruments like guzheng and erhu. Verses should be rhythmic, aggressive, and modern, while the hook includes melodic chanting.",
      "usage_instructions": "Balance modern 808s with organic instrument samples to create cultural contrast.",
      "examples": ["Reference: Higher Brothers, traditional/modern fusion"],
      "attribution": { "author_name": "SUNO Master" },
      "visibility": "public",
      "status": "published"
    },
    {
      "title": "UK Garage с вокалом и тёплыми аккордами",
      "summary": "Сгенерируй UK Garage трек с качающим битом, вокальными сэмплами и глубокими аккордами.",
      "language": "en",
      "model": "any",
      "category": "audio",
      "license": "CC-BY",
      "tags": ["uk-garage", "house", "vocals", "groove"],
      "prompt_text": "Create a UK Garage track with shuffling drums, syncopated hi-hats, chopped vocal samples, and warm Rhodes chords. Keep the vibe soulful but danceable with a smooth bassline.",
      "usage_instructions": "Focus on swing in drum programming and vocal chops for authenticity.",
      "examples": ["Reference: MJ Cole, Artful Dodger"],
      "attribution": { "author_name": "SUNO Master" },
      "visibility": "public",
      "status": "published"
    },
    {
      "title": "Gabber с жёстким дисторшном и 180 BPM",
      "summary": "Сделай экстремальный трек в стиле Gabber: агрессивный ритм, дисторшн-бочка и высокие темпы.",
      "language": "en",
      "model": "any",
      "category": "audio",
      "license": "CC-BY",
      "tags": ["gabber", "hardcore", "rave", "techno"],
      "prompt_text": "Produce a Gabber track at 180 BPM with distorted kick drums, aggressive synth stabs, and industrial noise textures. Keep energy relentless and raw.",
      "usage_instructions": "Layer multiple kicks for heaviness. Use short, shouted vocal samples.",
      "examples": ["Reference: Angerfist, Rotterdam Terror Corps"],
      "attribution": { "author_name": "SUNO Master" },
      "visibility": "public",
      "status": "published"
    },
    {
      "title": "Lo-Fi Hip-Hop для учебы",
      "summary": "Сгенерируй расслабляющий Lo-Fi трек для фонового прослушивания во время работы и учёбы.",
      "language": "en",
      "model": "any",
      "category": "audio",
      "license": "CC0",
      "tags": ["lofi", "study", "hip-hop", "chill"],
      "prompt_text": "Create a Lo-Fi Hip-Hop track with dusty drum loops, mellow jazz chords, vinyl crackle, and smooth bass. The vibe should be relaxing and focus-friendly.",
      "usage_instructions": "Avoid sudden dynamic shifts. Keep instrumentation minimal and loop-friendly.",
      "examples": ["Reference: Chillhop Essentials, Lofi Girl style"],
      "attribution": { "author_name": "SUNO Master" },
      "visibility": "public",
      "status": "published"
    },
    {
      "title": "Synthwave с ретро-футуристическим настроением",
      "summary": "Создай Synthwave-композицию с ретро-синтами, мощным басом и неоновой атмосферой 80-х.",
      "language": "en",
      "model": "any",
      "category": "audio",
      "license": "CC-BY",
      "tags": ["synthwave", "retro", "80s", "electronic"],
      "prompt_text": "Generate a Synthwave track with analog synth leads, arpeggiated basslines, and dreamy pads. Tempo 100-110 BPM, cinematic and nostalgic vibe.",
      "usage_instructions": "Use lush reverb and tape saturation to achieve retro feel.",
      "examples": ["Reference: Kavinsky, The Midnight"],
      "attribution": { "author_name": "SUNO Master" },
      "visibility": "public",
      "status": "published"
    },
    {
      "title": "Afrobeat с живыми перкуссиями и гитарой",
      "summary": "Сгенерируй Afrobeat трек с африканскими ритмами, живой перкуссией и гитарными риффами.",
      "language": "multi",
      "model": "any",
      "category": "audio",
      "license": "CC-BY-SA",
      "tags": ["afrobeat", "percussion", "world", "dance"],
      "prompt_text": "Produce an Afrobeat track with polyrhythmic percussion, funky guitars, brass stabs, and call-and-response vocals. Keep groove upbeat and infectious.",
      "usage_instructions": "Highlight congas and shakers. Layer crowd-style chants in the hook.",
      "examples": ["Reference: Burna Boy, Fela Kuti"],
      "attribution": { "author_name": "SUNO Master" },
      "visibility": "public",
      "status": "published"
    },
    {
      "title": "Drum & Bass с вокалом и атмосферой",
      "summary": "Сделай Drum & Bass трек с быстрым ритмом, вокалом и атмосферными падовыми слоями.",
      "language": "en",
      "model": "any",
      "category": "audio",
      "license": "CC-BY",
      "tags": ["drum-and-bass", "vocals", "breakbeat", "atmosphere"],
      "prompt_text": "Create a Drum & Bass track at 172 BPM with rolling breakbeats, deep basslines, airy pads, and a soulful female vocal hook.",
      "usage_instructions": "Balance heavy bass with spacious atmospheres. Use vocal chops in breakdowns.",
      "examples": ["Reference: Netsky, Hybrid Minds"],
      "attribution": { "author_name": "SUNO Master" },
      "visibility": "public",
      "status": "published"
    },
    {
      "title": "Latin Reggaeton с танцевальным вайбом",
      "summary": "Сгенерируй Reggaeton трек с латинским ритмом, танцевальным настроением и современными сэмплами.",
      "language": "multi",
      "model": "any",
      "category": "audio",
      "license": "CC-BY",
      "tags": ["reggaeton", "latin", "dance", "party"],
      "prompt_text": "Produce a Latin Reggaeton track with dembow rhythm, catchy Spanish vocals, tropical synths, and club-ready energy.",
      "usage_instructions": "Keep chorus repetitive and hooky. Use percussive fills for energy.",
      "examples": ["Reference: J Balvin, Bad Bunny"],
      "attribution": { "author_name": "SUNO Master" },
      "visibility": "public",
      "status": "published"
    },
    {
      "title": "Indie Rock с гитарными риффами и живым драйвом",
      "summary": "Создай трек в стиле Indie Rock с энергичной гитарой, живым барабанным ритмом и вокалом.",
      "language": "en",
      "model": "any",
      "category": "audio",
      "license": "CC-BY",
      "tags": ["indie", "rock", "guitar", "band"],
      "prompt_text": "Generate an Indie Rock track with jangly guitars, steady drums, and anthemic vocals. Keep energy uplifting, ideal for festival vibes.",
      "usage_instructions": "Add layered backing vocals for choruses. Use crunchy guitar tones.",
      "examples": ["Reference: Arctic Monkeys, The Strokes"],
      "attribution": { "author_name": "SUNO Master" },
      "visibility": "public",
      "status": "published"
    }
  ]
};

async function importSunoPrompts() {
  console.log('🎵 Импортируем промпты SUNO Master...');
  
  try {
    // Создаем или находим пользователя SUNO Master
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: 'SUNO Master' },
          { email: 'suno-master@prompthub.com' }
        ]
      }
    });

    if (!user) {
      console.log('👤 Создаем пользователя SUNO Master...');
      user = await prisma.user.create({
        data: {
          name: 'SUNO Master',
          email: 'suno-master@prompthub.com',
          image: null,
          reputationScore: 100, // Высокий рейтинг для мастера
          reputationPromptCount: 0,
          reputationLikesCnt: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Пользователь SUNO Master создан');
    } else {
      console.log('✅ Пользователь SUNO Master найден');
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of sunoPrompts.items) {
      // Проверяем, существует ли уже такой промпт
      const existingPrompt = await prisma.prompt.findFirst({
        where: {
          title: item.title,
          authorId: user.id
        }
      });

      if (existingPrompt) {
        console.log(`⏭️ Промпт "${item.title}" уже существует, пропускаем`);
        skippedCount++;
        continue;
      }

      // Создаем промпт
      const prompt = await prisma.prompt.create({
        data: {
          title: item.title,
          description: item.summary,
          prompt: item.prompt_text, // Основное поле prompt
          tags: item.tags.join(', '), // Преобразуем массив в строку
          category: item.category,
          lang: item.language, // Добавляем обязательное поле lang
          model: item.model,
          license: item.license,
          authorId: user.id,
          views: 0,
          averageRating: 0,
          totalRatings: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Импортирован: "${item.title}"`);
      importedCount++;
    }

    console.log(`\n🎉 Импорт завершен!`);
    console.log(`📊 Статистика:`);
    console.log(`   - Импортировано: ${importedCount}`);
    console.log(`   - Пропущено: ${skippedCount}`);
    console.log(`   - Всего промптов SUNO Master: ${importedCount + skippedCount}`);

  } catch (error) {
    console.error('❌ Ошибка при импорте промптов SUNO Master:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importSunoPrompts();
