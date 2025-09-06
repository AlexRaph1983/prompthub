const sunoPrompts = [
  {
    title: "Modern Pop Anthem",
    description: "Создай энергичный современный поп-трек с мощным киком и яркими синтезаторами",
    prompt: "Create a high-energy modern pop track with a punchy kick and bright layered synths. Lead vocals should be upfront, clean, and slightly compressed with lush reverb and delay for radio-ready polish. Surround the chorus with stacked harmonies, wide in the stereo field. Use a warm sub-bass glued to the kick, crisp hi-hats panned subtly, and occasional claps to drive momentum. Build tension with filtered risers and drop into a powerful hook. The mix must be balanced, loud, and mastered for clarity across streaming platforms.",
    model: "Suno",
    lang: "English",
    category: "Music",
    tags: "pop, modern, anthem, radio, streaming",
    license: "CC-BY"
  },
  {
    title: "Atmospheric Hip-Hop",
    description: "Создай мрачный хип-хоп трек с глубокими 808 басами и атмосферными текстурами",
    prompt: "Generate a moody hip-hop track with deep 808 bass hits locked tightly to a snappy snare. Incorporate spacious pads, filtered synth textures, and dark piano chords to create a cinematic vibe. Lead rap vocals should cut through the mix, enhanced with subtle autotune and stereo ad-libs. Hi-hats should roll with syncopation, adding rhythmic complexity. Apply stereo imaging so bass stays centered while atmospheric elements stretch wide. Final mix should sound powerful, immersive, and polished for club and headphone listening.",
    model: "Suno",
    lang: "English",
    category: "Music",
    tags: "hip-hop, atmospheric, 808, cinematic, club",
    license: "CC-BY"
  },
  {
    title: "Festival EDM Banger",
    description: "Создай фестивальный EDM трек с мощными дропами и эйфорическими синтезаторами",
    prompt: "Design a festival-ready EDM track with a pounding four-on-the-floor kick, bright supersaw synth leads, and sidechain pumping effects. Add tension-building risers, snare rolls, and crowd-hyping impacts leading into explosive drops. The bassline should be fat, sub-driven, and centered, while melodic layers spread wide for a euphoric stereo image. Vocals should be minimal, chopped and pitched, processed with reverb and delay to blend into the texture. Mix for maximum loudness and clarity, ensuring energy translates to large sound systems.",
    model: "Suno",
    lang: "English",
    category: "Music",
    tags: "EDM, festival, drop, supersaw, sidechain",
    license: "CC-BY"
  },
  {
    title: "Emotional Pop Ballad",
    description: "Создай эмоциональную поп-балладу с фортепиано и оркестровыми струнными",
    prompt: "Compose a heartfelt ballad featuring expressive piano chords, lush orchestral strings, and soft acoustic guitar textures. Lead vocals must be raw, emotional, and placed front and center, enhanced with warm reverb. Percussion should be subtle, with soft kicks and brushes creating space. Expand the stereo image with layered harmonies and wide ambient pads. The overall tone should be melancholic yet uplifting, delivering cinematic depth. Master the track to preserve dynamic range while keeping clarity and warmth suitable for streaming.",
    model: "Suno",
    lang: "English",
    category: "Music",
    tags: "ballad, emotional, piano, orchestral, cinematic",
    license: "CC-BY"
  },
  {
    title: "Latin Pop Groove",
    description: "Создай танцевальный латин-поп трек с ритмичной гитарой и перкуссией",
    prompt: "Craft a danceable Latin pop track driven by rhythmic acoustic guitar, vibrant percussion, and groovy bass. Layer live congas, bongos, and timbales to enrich the rhythm section. Vocals should be bright, passionate, and slightly processed with reverb and delay to match the energetic feel. Add tropical synth plucks and brass stabs for color. The mix must feel vibrant, warm, and panoramic, with clear separation between instruments. Deliver a polished, radio-friendly master with irresistible summer-party energy.",
    model: "Suno",
    lang: "English",
    category: "Music",
    tags: "latin, pop, groove, percussion, tropical",
    license: "CC-BY"
  },
  {
    title: "K-Pop Fusion",
    description: "Создай энергичный K-Pop трек, сочетающий EDM дропы и поп-хуки",
    prompt: "Produce an energetic K-Pop-inspired track blending EDM drops, hip-hop verses, and catchy pop hooks. Use bright synth arpeggios, thumping kicks, and sharp claps layered with electronic textures. Vocals should be polished, with stacked harmonies and vocal chops spread wide for impact. Incorporate dynamic shifts: minimalist verses, explosive choruses, and a dramatic bridge. Apply heavy processing—autotune, reverb, and delay—for glossy sheen. Ensure the final mix is loud, crisp, and polished, perfect for chart-ready K-Pop production.",
    model: "Suno",
    lang: "English",
    category: "Music",
    tags: "k-pop, fusion, EDM, arpeggios, chart-ready",
    license: "CC-BY"
  },
  {
    title: "Arena Rock Anthem",
    description: "Создай стадионный рок-гимн с мощными гитарами и барабанами",
    prompt: "Build a stadium rock track with distorted electric guitar riffs, powerful drum fills, and driving basslines. Vocals should be gritty and commanding, placed up front with reverb to create scale. Guitars should be double-tracked, panned hard left and right, delivering a wall of sound. Cymbals and toms should fill the stereo space, creating an expansive live feel. The production must sound big, bold, and mastered with punch, tailored for arenas and festival stages.",
    model: "Suno",
    lang: "English",
    category: "Music",
    tags: "rock, arena, stadium, guitar, drums",
    license: "CC-BY"
  },
  {
    title: "Dream-Pop Texture",
    description: "Создай мечтательный поп-трек с мерцающими синтезаторами и реверберацией",
    prompt: "Design a dreamy pop track with shimmering synths, reverb-drenched guitars, and soft ambient pads. Vocals should be ethereal, slightly distant, and blended into the mix with lush effects. Bass should be subtle and warm, supporting the floating textures. Spread elements wide for a spacious stereo image, using reverb tails to create depth. Minimal percussion with airy hi-hats and soft snares keeps rhythm understated. The overall sound must be atmospheric, cinematic, and immersive.",
    model: "Suno",
    lang: "English",
    category: "Music",
    tags: "dream-pop, ethereal, ambient, reverb, atmospheric",
    license: "CC-BY"
  },
  {
    title: "Trap Club Heater",
    description: "Создай мощный трэп-трек для клуба с 808 басами и агрессивной энергией",
    prompt: "Produce a trap banger with booming 808 bass, crisp hi-hat rolls, and snappy snares. Add dark pluck melodies and atmospheric synths to set a menacing mood. Vocals should be upfront with autotune and layered ad-libs, enhancing the aggressive energy. The kick and bass must hit hard in the center, while percussion pans dynamically across stereo. Ensure clarity in the low end and sharpness in highs, delivering a loud, modern, club-ready master.",
    model: "Suno",
    lang: "English",
    category: "Music",
    tags: "trap, club, 808, aggressive, modern",
    license: "CC-BY"
  },
  {
    title: "Funk-Pop Revival",
    description: "Создай фанк-поп трек с слэп-басом и ретро-синтезаторами",
    prompt: "Create a funky pop track with slap bass, syncopated rhythm guitar, and vibrant horn stabs. Add groovy claps, disco-inspired hi-hats, and retro synth chords for color. Vocals should be playful, energetic, and slightly saturated to capture vintage character while staying modern. Place instruments wide for stereo richness, with bass tight in the center. Mix should be dynamic, punchy, and polished for dancefloor appeal, blending retro funk with contemporary pop production.",
    model: "Suno",
    lang: "English",
    category: "Music",
    tags: "funk, pop, revival, slap-bass, retro",
    license: "CC-BY"
  }
]

async function addSunoPrompts() {
  try {
    const response = await fetch('http://localhost:3000/api/prompts/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompts: sunoPrompts })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ SUNO промпты успешно добавлены!')
      console.log(`Добавлено промптов: ${result.count}`)
    } else {
      console.error('❌ Ошибка при добавлении промптов:', result.error)
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
  }
}

addSunoPrompts()
