import { SUPPORTED_LANGUAGES } from './languagesSeed.ts';

export interface SeedTopic {
  languageCode: string;
  cefrLevel: string;
  orderIndex: number;
  title: string;
  subtitle: string;
  objectivesJson: string[];
  lessonContentJson: {
    introduction: string;
    grammarSummary: string;
    grammarRule: string;
    readingPassage: string;
    readingQuestion: { prompt: string; options: string[]; answerIndex: number };
    listeningScript: string;
    listeningQuestion: { prompt: string; options: string[]; answerIndex: number };
    speakingPrompt: string;
    writingPrompt: string;
    culturalNote: string;
    finalQuiz: Array<{ prompt: string; options: string[]; answerIndex: number; explanation: string }>;
  };
  isMandatory: boolean;
}

export interface SeedVocabulary {
  languageCode: string;
  cefrLevel: string;
  topicSlug: string;
  word: string;
  romanization: string;
  ipa: string;
  translationEn: string;
  translationsJson: Record<string, string>;
  definition: string;
  partOfSpeech: string;
  grammaticalInfoJson: Record<string, unknown>;
  exampleSentence: string;
  exampleTranslation: string;
  synonymsJson: string[];
  antonymsJson: string[];
}

export interface SeedGrammar {
  languageCode: string;
  cefrLevel: string;
  title: string;
  difficulty: string;
  explanation: string;
  patternsJson: string[];
  examplesJson: Array<{ target: string; gloss: string; translation: string }>;
  commonMistakesJson: Array<{ wrong: string; right: string; note: string }>;
  comparisonsJson: string[];
  exercisesJson: Array<{
    id: string;
    prompt: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }>;
}

export interface SeedReading {
  languageCode: string;
  cefrLevel: string;
  genre: string;
  title: string;
  wordCount: number;
  content: string;
  glossaryJson: Record<string, { translation: string; pos: string; note: string }>;
  questionsJson: Array<{
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }>;
}

export interface SeedListening {
  languageCode: string;
  cefrLevel: string;
  accent: string;
  topic: string;
  mediaType: string;
  title: string;
  sourceName: string;
  licenseStatus: string;
  externalUrl: string;
  embedUrl: string | null;
  subtitlesJson: Array<{ startSec: number; endSec: number; text: string; translation: string }>;
  questionsJson: Array<{ question: string; options: string[]; answerIndex: number }>;
  lastVerifiedAt: string;
}

export interface SeedCulture {
  languageCode: string;
  region: string;
  category: string;
  title: string;
  historicalContext: string;
  modernPractice: string;
  summary: string;
  referencesJson: string[];
}

export const SEED_VOCABULARY: SeedVocabulary[] = [
  // Spanish
  {
    languageCode: 'es',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: 'madrugada',
    romanization: 'ma-dru-ga-da',
    ipa: '/maðɾuˈɣaða/',
    translationEn: 'early hours before dawn',
    translationsJson: { uz: 'tong sahar', ru: 'раннее утро до рассвета', fr: 'petit matin' },
    definition: 'The hours between midnight and sunrise.',
    partOfSpeech: 'noun (feminine)',
    grammaticalInfoJson: { gender: 'feminine', plural: 'madrugadas', article: 'la' },
    exampleSentence: 'Estudio español por la madrugada cuando la casa está en silencio.',
    exampleTranslation: 'I study Spanish in the early morning when the house is quiet.',
    synonymsJson: ['alba', 'amanecer'],
    antonymsJson: ['atardecer'],
  },
  {
    languageCode: 'es',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: 'compartir',
    romanization: 'com-par-tir',
    ipa: '/kompaɾˈtiɾ/',
    translationEn: 'to share',
    translationsJson: { uz: "bo'lishmoq", ru: 'делиться', fr: 'partager' },
    definition: 'To divide or enjoy something jointly with others.',
    partOfSpeech: 'verb (-ir regular)',
    grammaticalInfoJson: { conjugation: 'comparto, compartes, comparte, compartimos, comparten' },
    exampleSentence: 'Nos gusta compartir un café después de clase.',
    exampleTranslation: 'We like to share a coffee after class.',
    synonymsJson: ['repartir', 'dividir'],
    antonymsJson: ['acaparar'],
  },
  {
    languageCode: 'es',
    cefrLevel: 'A2',
    topicSlug: 'daily-life',
    word: 'aprovechar',
    romanization: 'a-pro-ve-char',
    ipa: '/apɾobeˈtʃaɾ/',
    translationEn: 'to make the most of / take advantage of',
    translationsJson: { uz: 'unumli foydalanmoq', ru: 'воспользоваться', fr: 'profiter de' },
    definition: 'To use an opportunity or resource productively.',
    partOfSpeech: 'verb (-ar regular)',
    grammaticalInfoJson: { conjugation: 'aprovecho, aprovechas, aprovecha' },
    exampleSentence: 'Quiero aprovechar la tarde para leer una novela.',
    exampleTranslation: 'I want to make the most of the afternoon to read a novel.',
    synonymsJson: ['utilizar', 'exprimir'],
    antonymsJson: ['desperdiciar'],
  },
  // Japanese
  {
    languageCode: 'ja',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: '図書館',
    romanization: 'toshokan',
    ipa: '/toɕokaɴ/',
    translationEn: 'library',
    translationsJson: { uz: 'kutubxona', ru: 'библиотека', es: 'biblioteca' },
    definition: 'A building or institution housing books and study resources.',
    partOfSpeech: 'noun',
    grammaticalInfoJson: { kana: 'としょかん', pitchAccent: 'Nakadaka (2)', kanjiCount: 3 },
    exampleSentence: '毎日、静かな図書館で日本語を勉強します。',
    exampleTranslation: 'Every day, I study Japanese in a quiet library.',
    synonymsJson: ['図書室'],
    antonymsJson: [],
  },
  {
    languageCode: 'ja',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: '覚える',
    romanization: 'oboeru',
    ipa: '/oboeɾɯ/',
    translationEn: 'to memorize / learn',
    translationsJson: { uz: 'eslab qolmoq', ru: 'запоминать', es: 'memorizar' },
    definition: 'To commit words, skills, or facts into memory.',
    partOfSpeech: 'ichidan verb (Group II)',
    grammaticalInfoJson: { polite: '覚えます', teForm: '覚えて', negative: '覚えない' },
    exampleSentence: '新しい漢字を少しずつ覚えています。',
    exampleTranslation: 'I am memorizing new Kanji little by little.',
    synonymsJson: ['暗記する'],
    antonymsJson: ['忘れる'],
  },
  // Korean
  {
    languageCode: 'ko',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: '약속',
    romanization: 'yaksok',
    ipa: '/jaks͈ok̚/',
    translationEn: 'promise / appointment',
    translationsJson: { uz: "va'da / uchrashuv", ru: 'обещание / встреча', es: 'promesa / cita' },
    definition: 'A mutual agreement to meet or fulfill a commitment.',
    partOfSpeech: 'noun',
    grammaticalInfoJson: { hanja: '約束', soundChange: 'Post-obstruent tensification [약쏙]' },
    exampleSentence: '주말에 친구와 도서관에서 만날 약속이 있어요.',
    exampleTranslation: 'I have plans to meet a friend at the library on the weekend.',
    synonymsJson: ['다짐'],
    antonymsJson: [],
  },
  // Mandarin Chinese
  {
    languageCode: 'zh',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: '积累',
    romanization: 'jīlěi',
    ipa: '/tɕi˥ leɪ˨˩˦/',
    translationEn: 'to accumulate (knowledge/vocabulary)',
    translationsJson: { uz: "to'plamoq", ru: 'накапливать', es: 'acumular' },
    definition: 'To gradually build up experience, vocabulary, or resources over time.',
    partOfSpeech: 'verb / noun',
    grammaticalInfoJson: { traditional: '積累', measureWord: 'N/A', hsk: 'HSK 4 bridge' },
    exampleSentence: '学语言需要每天积累新的词汇。',
    exampleTranslation: 'Learning a language requires accumulating new vocabulary every day.',
    synonymsJson: ['积攒'],
    antonymsJson: ['消耗'],
  },
  // French
  {
    languageCode: 'fr',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: 'épanouir',
    romanization: 'é-pa-nouir',
    ipa: '/epanuˈiʁ/',
    translationEn: 'to flourish / blossom',
    translationsJson: { uz: 'rivojlanmoq', ru: 'расцветать', es: 'florecer' },
    definition: 'To develop harmoniously in intellect, skill, or spirit.',
    partOfSpeech: 'pronominal verb (-ir)',
    grammaticalInfoJson: { reflexive: "s'épanouir", participle: 'épanoui(e)' },
    exampleSentence: 'Les étudiants s’épanouissent lorsqu’ils explorent d’autres cultures.',
    exampleTranslation: 'Students flourish when they explore other cultures.',
    synonymsJson: ['progresser', 'fleurir'],
    antonymsJson: ['stagner'],
  },
  // German
  {
    languageCode: 'de',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: 'die Erfahrung',
    romanization: 'Er-fah-rung',
    ipa: '/ɛɐ̯ˈfaːʁʊŋ/',
    translationEn: 'experience',
    translationsJson: { uz: 'tajriba', ru: 'опыт', es: 'experiencia' },
    definition: 'Knowledge or practical wisdom gained through living and practice.',
    partOfSpeech: 'noun (feminine)',
    grammaticalInfoJson: { article: 'die', plural: 'die Erfahrungen', caseExample: 'aus Erfahrung' },
    exampleSentence: 'Durch tägliches Sprechen sammelt man wertvolle Erfahrung.',
    exampleTranslation: 'Through daily speaking one gathers valuable experience.',
    synonymsJson: ['Kenntnis'],
    antonymsJson: ['Unerfahrenheit'],
  },
  // Russian
  {
    languageCode: 'ru',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: 'путешествие',
    romanization: 'puteshestviye',
    ipa: '/pʊtʲɪˈʂɛstvʲɪjə/',
    translationEn: 'journey / travel',
    translationsJson: { uz: 'sayohat', ru: 'путешествие', es: 'viaje' },
    definition: 'A meaningful trip across regions or cultures.',
    partOfSpeech: 'noun (neuter)',
    grammaticalInfoJson: { gender: 'neuter', plural: 'путешествия', prepositional: 'в путешествии' },
    exampleSentence: 'Изучение языка — это увлекательное путешествие по миру.',
    exampleTranslation: 'Learning a language is a fascinating journey around the world.',
    synonymsJson: ['поездка'],
    antonymsJson: [],
  },
  // Egyptian Arabic
  {
    languageCode: 'arz',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: 'إزيك',
    romanization: 'izzayyak / izzayyik',
    ipa: '/ʔɪzˈzæjjæk/',
    translationEn: 'How are you? (m./f.)',
    translationsJson: { uz: 'Qalaysiz?', ru: 'Как дела?', es: '¿Cómo estás?' },
    definition: 'Warm everyday Egyptian Arabic greeting asking how someone is doing.',
    partOfSpeech: 'interrogative expression',
    grammaticalInfoJson: { masculine: 'إزيك (izzayyak)', feminine: 'إزيكِ (izzayyik)', plural: 'إزيكم (izzayyukum)', msaCompare: 'كيف حالك (kayfa ḥāluka)' },
    exampleSentence: 'أهلاً يا صديقي، إزيك النهارده؟',
    exampleTranslation: 'Hello my friend, how are you today?',
    synonymsJson: ['عامل إيه'],
    antonymsJson: [],
  },
  // Uzbek
  {
    languageCode: 'uz',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: 'mehmondoʻstlik',
    romanization: 'meh-mon-doʻst-lik',
    ipa: '/mɛhmɒndostˈlik/',
    translationEn: 'hospitality',
    translationsJson: { uz: 'mehmondoʻstlik', ru: 'гостеприимство', es: 'hospitalidad' },
    definition: 'Generous and warm welcome extended to guests, central to Uzbek social life.',
    partOfSpeech: 'noun',
    grammaticalInfoJson: { root: 'mehmon (guest) + doʻst (friend) + -lik', locative: 'mehmondoʻstlikda' },
    exampleSentence: 'Oʻzbek xalqi oʻzining samimiy mehmondoʻstligi bilan mashhur.',
    exampleTranslation: 'The Uzbek people are renowned for their sincere hospitality.',
    synonymsJson: ['izzat-ikrom'],
    antonymsJson: [],
  },
  // Turkish
  {
    languageCode: 'tr',
    cefrLevel: 'A1',
    topicSlug: 'greetings-introductions',
    word: 'kolay gelsin',
    romanization: 'ko-lay gel-sin',
    ipa: '/koˈlaj ɟelˈsin/',
    translationEn: 'may your work be easy',
    translationsJson: { uz: 'ishlaringiz oson boʻlsin', ru: 'лёгкой работы', es: 'que te sea leve el trabajo' },
    definition: 'Everyday Turkish expression said to anyone working, studying, or performing a task.',
    partOfSpeech: 'social formula',
    grammaticalInfoJson: { literal: 'may it come easy', register: 'universal polite' },
    exampleSentence: 'Günaydın, kolay gelsin! Bir çay alabilir miyim?',
    exampleTranslation: 'Good morning, may your work go smoothly! May I have a tea?',
    synonymsJson: ['iyi çalışmalar'],
    antonymsJson: [],
  },
];

// Guarantee baseline vocabulary for all 21 languages so every student workspace starts populated
for (const lang of SUPPORTED_LANGUAGES) {
  const existing = SEED_VOCABULARY.filter((v) => v.languageCode === lang.code);
  if (existing.length === 0) {
    SEED_VOCABULARY.push(
      {
        languageCode: lang.code,
        cefrLevel: 'A1',
        topicSlug: 'greetings-introductions',
        word: `${lang.nativeName.split(' ')[0]} · Greeting`,
        romanization: lang.name,
        ipa: '/ˈwel.kəm/',
        translationEn: `Foundational expression in ${lang.name}`,
        translationsJson: { uz: `${lang.name} salomlashuvi`, ru: `Приветствие (${lang.name})` },
        definition: `Core introductory phrase used in everyday ${lang.name} conversation.`,
        partOfSpeech: 'phrase',
        grammaticalInfoJson: { script: lang.script, variant: lang.variantsJson[0] },
        exampleSentence: `Practice ${lang.name} (${lang.nativeName}) with natural cadence.`,
        exampleTranslation: `Practice ${lang.name} with natural cadence.`,
        synonymsJson: [],
        antonymsJson: [],
      },
      {
        languageCode: lang.code,
        cefrLevel: 'A1',
        topicSlug: 'daily-life',
        word: `${lang.name} Study Lexicon`,
        romanization: 'A1 Core',
        ipa: '/ˈstʌd.i/',
        translationEn: 'to learn / study attentively',
        translationsJson: { uz: "o'rganmoq", ru: 'изучать' },
        definition: `Essential study verb for ${lang.name} learners building daily fluency.`,
        partOfSpeech: 'verb',
        grammaticalInfoJson: { framework: lang.progressionFramework },
        exampleSentence: `Daily spaced repetition strengthens ${lang.name} recall.`,
        exampleTranslation: `Daily spaced repetition strengthens ${lang.name} recall.`,
        synonymsJson: [],
        antonymsJson: [],
      }
    );
  }
}

export const SEED_TOPICS: SeedTopic[] = SUPPORTED_LANGUAGES.flatMap((lang) => {
  const isEs = lang.code === 'es';
  const isJa = lang.code === 'ja';
  const isArz = lang.code === 'arz';

  const topic1Title = isEs
    ? 'Saludos, identidad y cortesía'
    : isJa
    ? 'あいさつと自己紹介 (Greetings & Self-Introduction)'
    : isArz
    ? 'التحيات والتعارف (Cairene Greetings & Script)'
    : `Greetings, Script & Identity in ${lang.name}`;

  const topic1Intro = isEs
    ? 'Master formal (usted) and informal (tú) Spanish greetings, regional variations across Spain and Latin America, and vowel purity.'
    : isJa
    ? 'Learn polite Tokyo-standard introductions using は (wa) topic marking, です (desu) copula, and moraic rhythm.'
    : isArz
    ? 'Explore right-to-left Arabic script connections alongside warm everyday Cairene greetings and MSA register differences.'
    : `Begin your ${lang.name} journey with core sound foundations (${lang.phoneticsFocusJson[0]}), natural introductions, and cultural etiquette.`;

  const topic1Passage = isEs
    ? 'Hola, me llamo Mateo. Soy de Valencia, pero ahora vivo en Bogotá para estudiar arquitectura. Por la mañana saludo a mis vecinos con una sonrisa y comparto un café antes de ir a la universidad.'
    : isJa
    ? 'はじめまして。わたしはさくらです。東京の大学で建築を勉強しています。毎日、静かな図書館で新しい漢字を少しずつ覚えます。'
    : isArz
    ? 'أهلاً وسهلاً! أنا كريم من القاهرة. الصبح بشرب قهوة سادة وبروح الجامعة عشان أدرس هندسة.'
    : `Welcome to ${lang.name} (${lang.nativeName}). In this first narrative, learners practice introducing their city, daily study routine, and polite social expressions in ${lang.variantsJson[0]}.`;

  return [
    {
      languageCode: lang.code,
      cefrLevel: 'A1',
      orderIndex: 1,
      title: topic1Title,
      subtitle: `${lang.script} · ${lang.variantsJson[0]}`,
      objectivesJson: [
        `Articulate core ${lang.name} sounds accurately (${lang.phoneticsFocusJson[0]})`,
        'Introduce yourself, origin, and study goals with appropriate register',
        `Understand the foundational structure: ${lang.grammarPillarsJson[0]}`,
      ],
      lessonContentJson: {
        introduction: topic1Intro,
        grammarSummary: lang.grammarPillarsJson[0],
        grammarRule: `Core Pillar: ${lang.grammarPillarsJson.join(' · ')}. Pay close attention to authentic word order and social register.`,
        readingPassage: topic1Passage,
        readingQuestion: {
          prompt: isEs
            ? '¿Qué estudia Mateo en Bogotá?'
            : isJa
            ? 'さくらさんはどこで漢字を覚えますか。'
            : `What is the central focus of this introductory ${lang.name} passage?`,
          options: isEs
            ? ['Arquitectura', 'Medicina', 'Música']
            : isJa
            ? ['図書館 (Library)', '駅 (Station)', '病院 (Hospital)']
            : ['Daily introductions and study context', 'Advanced legal contracts', 'Historical astronomy'],
          answerIndex: 0,
        },
        listeningScript: topic1Passage,
        listeningQuestion: {
          prompt: 'Which register and context does the speaker use?',
          options: ['Friendly everyday introduction', 'Formal courtroom address', 'Emergency broadcast'],
          answerIndex: 0,
        },
        speakingPrompt: `Introduce yourself in ${lang.name}: share your name, where you live, and why you are learning ${lang.name}.`,
        writingPrompt: `Write 2–3 short sentences in ${lang.name} introducing yourself and your morning routine.`,
        culturalNote: `Regional note (${lang.region}): ${lang.description}`,
        finalQuiz: [
          {
            prompt: `Which linguistic pillar is central to ${lang.name}?`,
            options: [lang.grammarPillarsJson[0], 'Unrelated artificial syntax', 'None of the above'],
            answerIndex: 0,
            explanation: `${lang.name} relies directly on ${lang.grammarPillarsJson[0]}.`,
          },
          {
            prompt: `Which script system does ${lang.name} primarily use?`,
            options: [lang.script, 'Linear B', 'Runic Futhark'],
            answerIndex: 0,
            explanation: `${lang.name} uses ${lang.script}.`,
          },
        ],
      },
      isMandatory: true,
    },
    {
      languageCode: lang.code,
      cefrLevel: 'A1',
      orderIndex: 2,
      title: `Daily Routine, Time & Everyday Life`,
      subtitle: `${lang.name} · Thematic Module 02`,
      objectivesJson: [
        'Describe daily schedules, meals, and study habits',
        `Apply ${lang.grammarPillarsJson[1] ?? lang.grammarPillarsJson[0]} in present-time statements`,
        'Respond naturally to everyday questions about time and preferences',
      ],
      lessonContentJson: {
        introduction: `Connect time expressions with everyday actions in ${lang.name}.`,
        grammarSummary: lang.grammarPillarsJson[1] ?? lang.grammarPillarsJson[0],
        grammarRule: `Combine time markers with ${lang.grammarPillarsJson[1] ?? lang.grammarPillarsJson[0]} while keeping rhythmic accuracy (${lang.phoneticsFocusJson[0]}).`,
        readingPassage: topic1Passage,
        readingQuestion: {
          prompt: 'When does the main character typically begin studying or drinking coffee?',
          options: ['In the morning', 'At midnight', 'Only on Sundays'],
          answerIndex: 0,
        },
        listeningScript: `Morning routine practice in ${lang.name}: waking up early, drinking tea or coffee, and reviewing ten vocabulary words.`,
        listeningQuestion: {
          prompt: 'How many vocabulary words are reviewed in the routine?',
          options: ['Ten words', 'One hundred words', 'Zero words'],
          answerIndex: 0,
        },
        speakingPrompt: `Describe your typical weekday morning and evening in ${lang.name}.`,
        writingPrompt: `Write a brief schedule of three activities you do every day in ${lang.name}.`,
        culturalNote: `Across ${lang.region}, daily mealtimes and hospitality shape conversational openings.`,
        finalQuiz: [
          {
            prompt: `Which phonological feature should you monitor when speaking ${lang.name}?`,
            options: [lang.phoneticsFocusJson[0], 'Silent syllables only', 'Monotone robotic stress'],
            answerIndex: 0,
            explanation: `${lang.phoneticsFocusJson[0]} is essential for natural ${lang.name} rhythm.`,
          },
        ],
      },
      isMandatory: true,
    },
    {
      languageCode: lang.code,
      cefrLevel: 'A2',
      orderIndex: 3,
      title: `Storytelling, Past Experiences & Travel`,
      subtitle: `${lang.name} · Thematic Module 03`,
      objectivesJson: [
        'Narrate past journeys and memorable cultural experiences',
        'Express reasons, comparisons, and polite requests',
        'Bridge from isolated sentences into connected paragraphs',
      ],
      lessonContentJson: {
        introduction: `Move beyond present-tense habits into connected narrative in ${lang.name}.`,
        grammarSummary: lang.grammarPillarsJson[2] ?? lang.grammarPillarsJson[0],
        grammarRule: `Use ${lang.grammarPillarsJson[2] ?? lang.grammarPillarsJson[0]} to sequence past events clearly.`,
        readingPassage: `Last autumn, travelers visited historic neighborhoods, tasted regional dishes, and conversed with local artisans in ${lang.name}.`,
        readingQuestion: {
          prompt: 'Who did the travelers converse with?',
          options: ['Local artisans', 'Air traffic controllers', 'Deep-sea divers'],
          answerIndex: 0,
        },
        listeningScript: `Travel reflection in ${lang.name}: sharing impressions of architecture, local markets, and regional accents.`,
        listeningQuestion: {
          prompt: 'What places did the speaker enjoy visiting?',
          options: ['Local markets and historic streets', 'Subterranean mines', 'Factories'],
          answerIndex: 0,
        },
        speakingPrompt: `Tell a short story in ${lang.name} about a trip or memorable day.`,
        writingPrompt: `Write a one-paragraph informal message in ${lang.name} describing a place you visited.`,
        culturalNote: `Travel across ${lang.region} exposes learners to regional expressions (${lang.variantsJson.join(', ')}).`,
        finalQuiz: [
          {
            prompt: 'Which CEFR level introduces connected paragraphs and personal correspondence?',
            options: ['A2', 'Pre-A1', 'None'],
            answerIndex: 0,
            explanation: 'Structured writing tasks begin systematically at CEFR A2.',
          },
        ],
      },
      isMandatory: true,
    },
  ];
});

export const SEED_GRAMMAR: SeedGrammar[] = [
  {
    languageCode: 'es',
    cefrLevel: 'A1',
    title: 'Ser vs. Estar — Essence, Identity & State',
    difficulty: 'Core',
    explanation:
      'Spanish divides English "to be" into two verbs: SER expresses inherent identity, origin, time, and material; ESTAR expresses location, temporary condition, emotional state, and progressive actions.',
    patternsJson: [
      'SER + profession / nationality / origin (de) / time',
      'ESTAR + physical location (en) / emotional or physical state / gerund (-ando, -iendo)',
    ],
    examplesJson: [
      { target: 'Soy profesora de historia.', gloss: 'Identity / profession', translation: 'I am a history teacher.' },
      { target: 'El museo está en el centro.', gloss: 'Location', translation: 'The museum is in the city center.' },
      { target: 'La manzana está verde (unripe) vs es verde (color).', gloss: 'Contrastive adjective shift', translation: 'The apple is unripe vs. is green in variety.' },
    ],
    commonMistakesJson: [
      {
        wrong: 'Madrid es en España.',
        right: 'Madrid está en España.',
        note: 'Physical/geographical location always uses ESTAR, even when permanent!',
      },
    ],
    comparisonsJson: ['Compare with Portuguese ser/estar and Italian essere/stare (Italian uses essere for location).'],
    exercisesJson: [
      {
        id: 'es-g1-1',
        prompt: 'Choose the correct form: "La biblioteca ___ cerca de la plaza."',
        options: ['está', 'es', 'son'],
        answerIndex: 0,
        explanation: 'Physical location uses ESTAR regardless of permanence.',
      },
      {
        id: 'es-g1-2',
        prompt: 'Choose the correct form: "Mi hermana ___ ingeniera civil."',
        options: ['es', 'está', 'están'],
        answerIndex: 0,
        explanation: 'Professions and core identity use SER.',
      },
    ],
  },
  {
    languageCode: 'ja',
    cefrLevel: 'A1',
    title: 'Topic Particle は (wa) vs Subject Particle が (ga)',
    difficulty: 'Core',
    explanation:
      'Japanese marks discourse roles with postpositional particles. は (pronounced wa) frames the known topic ("as for X"), while が introduces new information, answers wh-questions, or marks grammatical subjects of existence/ability.',
    patternsJson: [
      '[Topic] は [Comment] です',
      '[Question Word] が [Verb/Adjective] か',
      '[Known Subject] は [New Focus] が [Adjective]',
    ],
    examplesJson: [
      { target: 'わたしは学生です。', gloss: 'watashi wa gakusei desu', translation: 'As for me, I am a student.' },
      { target: 'だれが来ますか。', gloss: 'dare ga kimasu ka', translation: 'Who is coming? (New focus takes が)' },
    ],
    commonMistakesJson: [
      {
        wrong: 'だれは来ますか。',
        right: 'だれが来ますか。',
        note: 'Interrogative words (だれ who, なに what, どれ which) cannot take topic は as subject—use が.',
      },
    ],
    comparisonsJson: ['Analogous to Korean topic markers 은/는 vs subject markers 이/가.'],
    exercisesJson: [
      {
        id: 'ja-g1-1',
        prompt: 'Select the natural particle: "なに ___ 好きですか。(What do you like?)"',
        options: ['が', 'は', 'を'],
        answerIndex: 0,
        explanation: '好き (to like) is an adjectival predicate whose object takes が, and question words take が.',
      },
    ],
  },
  {
    languageCode: 'de',
    cefrLevel: 'A1',
    title: 'Four Grammatical Cases & V2 Word Order',
    difficulty: 'Core',
    explanation:
      'German marks syntactic function on articles and adjectives across Nominative (subject), Accusative (direct object), Dative (indirect object), and Genitive (possession), while keeping the finite verb strictly in Position 2 in declarative main clauses.',
    patternsJson: [
      '[Position 1: Subject or Time/Place] + [Position 2: Conjugated Verb] + [Other Elements]',
      'Masculine Accusative shift: der → den, ein → einen',
    ],
    examplesJson: [
      { target: 'Heute lese ich ein interessantes Buch.', gloss: 'Time first -> verb 2nd -> subject 3rd', translation: 'Today I am reading an interesting book.' },
      { target: 'Ich sehe den Lehrer.', gloss: 'Masculine direct object', translation: 'I see the teacher.' },
    ],
    commonMistakesJson: [
      {
        wrong: 'Heute ich lese ein Buch.',
        right: 'Heute lese ich ein Buch.',
        note: 'If an adverb starts the sentence, the subject moves after the conjugated verb so the verb stays in Position 2.',
      },
    ],
    comparisonsJson: ['Shared V2 Germanic syntax with Dutch, Norwegian, and Swedish.'],
    exercisesJson: [
      {
        id: 'de-g1-1',
        prompt: 'Complete with correct V2 order: "Morgen ___ nach Berlin."',
        options: ['fahre ich', 'ich fahre', 'ich fahren'],
        answerIndex: 0,
        explanation: 'Position 1 is "Morgen", so Position 2 must be the conjugated verb "fahre", followed by subject "ich".',
      },
    ],
  },
  {
    languageCode: 'arz',
    cefrLevel: 'A1',
    title: 'Bipartite Negation (ma-...-sh) & Habitual bi- Prefix',
    difficulty: 'Core',
    explanation:
      'Egyptian Arabic marks ongoing/habitual verbs with the prefix بـ (bi-) and negates verbs and pseudo-verbs by wrapping them in the circumfix ما ... ـش (ma-...-sh).',
    patternsJson: [
      'بـ + Imperfect verb = Present continuous / habitual (بشتغل — I work / am working)',
      'ما + Verb + ـش = Negation (ما بشتغلش — I do not work)',
    ],
    examplesJson: [
      { target: 'أنا بتكلم مصري.', gloss: 'ana batkallim maṣri', translation: 'I speak Egyptian Arabic.' },
      { target: 'ما فهمتش السؤال.', gloss: 'ma fihimtish is-suʾāl', translation: 'I did not understand the question.' },
    ],
    commonMistakesJson: [
      {
        wrong: 'لا أفهم in casual Cairo street speech',
        right: 'مش فاهم / ما بفهمش',
        note: 'لا أفهم is Modern Standard Arabic; in Cairene Masri use مش + active participle (فاهم) or ما-...-ش.',
      },
    ],
    comparisonsJson: ['Similar bipartite negation appears in French ne...pas!'],
    exercisesJson: [
      {
        id: 'arz-g1-1',
        prompt: 'How do you negate "بشرب قهوة" (I drink coffee) in Egyptian Arabic?',
        options: ['ما بشربش قهوة', 'ليس أشرب قهوة', 'لا بشرب'],
        answerIndex: 0,
        explanation: 'Wrap the verb with ما-...-ش: ما بشربش.',
      },
    ],
  },
];

// Add one grammar topic for every remaining language so Grammar Lab always has content
for (const lang of SUPPORTED_LANGUAGES) {
  if (!SEED_GRAMMAR.some((g) => g.languageCode === lang.code)) {
    SEED_GRAMMAR.push({
      languageCode: lang.code,
      cefrLevel: 'A1',
      title: `${lang.name}: ${lang.grammarPillarsJson[0]}`,
      difficulty: 'Core',
      explanation: `${lang.name} organizes sentence meaning primarily through ${lang.grammarPillarsJson.join(', ')}. Mastering this foundation prevents direct word-for-word translation errors.`,
      patternsJson: lang.grammarPillarsJson,
      examplesJson: [
        {
          target: `${lang.nativeName} structural model`,
          gloss: lang.grammarPillarsJson[0],
          translation: `Core sentence pattern in ${lang.name}`,
        },
      ],
      commonMistakesJson: [
        {
          wrong: `Word-for-word English order in ${lang.name}`,
          right: `Follow ${lang.grammarPillarsJson[0]}`,
          note: `Respect ${lang.name}'s native morphological and syntactic rules.`,
        },
      ],
      comparisonsJson: [`Language family: ${lang.family}`],
      exercisesJson: [
        {
          id: `${lang.code}-g1-1`,
          prompt: `Which grammatical principle governs ${lang.name} structure?`,
          options: [lang.grammarPillarsJson[0], 'Zero inflection or particle rules', 'English auxiliary do-support'],
          answerIndex: 0,
          explanation: `${lang.grammarPillarsJson[0]} is a defining grammatical pillar of ${lang.name}.`,
        },
      ],
    });
  }
}

export const SEED_READINGS: SeedReading[] = [
  {
    languageCode: 'es',
    cefrLevel: 'A1',
    genre: 'Everyday narrative',
    title: 'Un café en la madrugada',
    wordCount: 82,
    content:
      'Cada mañana de otoño, Lucía abre la ventana de su apartamento y escucha la ciudad despertar. Todavía es madrugada, pero la panadería de la esquina ya tiene luz cálida. Lucía baja las escaleras con su cuaderno de español, pide un café con leche y repasa diez palabras nuevas. Poco a poco, los vecinos llegan, comparten historias breves y el día comienza con calma.',
    glossaryJson: {
      otoño: { translation: 'autumn', pos: 'noun (m.)', note: 'Season following summer' },
      ventana: { translation: 'window', pos: 'noun (f.)', note: 'Plural: ventanas' },
      madrugada: { translation: 'early morning before dawn', pos: 'noun (f.)', note: 'Between midnight and sunrise' },
      panadería: { translation: 'bakery', pos: 'noun (f.)', note: 'Derived from pan (bread)' },
      cuaderno: { translation: 'notebook', pos: 'noun (m.)', note: 'Study notebook' },
      comparten: { translation: 'they share', pos: 'verb (compartir)', note: '3rd person plural present' },
    },
    questionsJson: [
      {
        question: '¿Qué lleva Lucía a la panadería?',
        options: ['Su cuaderno de español', 'Un paraguas rojo', 'Una bicicleta'],
        answerIndex: 0,
        explanation: 'El texto dice que baja las escaleras con su cuaderno de español.',
      },
    ],
  },
  {
    languageCode: 'ja',
    cefrLevel: 'A1',
    genre: 'Everyday narrative',
    title: '朝の図書館 (Morning at the Library)',
    wordCount: 64,
    content:
      'わたしは毎朝八時に図書館へ行きます。窓の近くの席に座って、日本語の本を読みます。新しい漢字を覚えるのは楽しいですが、ときどき難しいです。それでも、毎日少しずつ読むと、物語の意味がわかるようになります。',
    glossaryJson: {
      毎朝: { translation: 'every morning (maiasa)', pos: 'noun/adverb', note: '毎 (every) + 朝 (morning)' },
      図書館: { translation: 'library (toshokan)', pos: 'noun', note: 'Quiet public study hall' },
      漢字: { translation: 'Kanji characters', pos: 'noun', note: 'Chinese-origin logographs' },
      覚える: { translation: 'to memorize (oboeru)', pos: 'verb', note: 'Group II / Ichidan verb' },
      物語: { translation: 'story / tale (monogatari)', pos: 'noun', note: 'Literature narrative' },
    },
    questionsJson: [
      {
        question: '主人公は何時に図書館へ行きますか。',
        options: ['八時 (8 o’clock)', '十時 (10 o’clock)', '夜九時 (9 PM)'],
        answerIndex: 0,
        explanation: '「毎朝八時に図書館へ行きます」と書いてあります。',
      },
    ],
  },
  {
    languageCode: 'fr',
    cefrLevel: 'A2',
    genre: 'Cultural text',
    title: 'Les librairies indépendantes de Lyon',
    wordCount: 74,
    content:
      'Dans les ruelles pavées du Vieux Lyon, les petites librairies attirent les lecteurs curieux. Chaque libraire recommande des romans historiques, des essais scientifiques et des poèmes contemporains. Les étudiants étrangers s’y rendent pour découvrir la langue vivante au-delà des manuels scolaires.',
    glossaryJson: {
      ruelles: { translation: 'narrow lanes', pos: 'noun (f. pl.)', note: 'Diminutive of rue' },
      librairies: { translation: 'bookshops (not libraries!)', pos: 'noun (f. pl.)', note: 'False friend: library = bibliothèque' },
      lecteurs: { translation: 'readers', pos: 'noun (m. pl.)', note: 'Fem: lectrices' },
      manuels: { translation: 'textbooks', pos: 'noun (m. pl.)', note: 'Instructional books' },
    },
    questionsJson: [
      {
        question: 'Pourquoi les étudiants étrangers visitent-ils ces librairies ?',
        options: [
          'Pour découvrir la langue vivante au-delà des manuels',
          'Pour acheter des billets de train',
          'Pour louer des appartements',
        ],
        answerIndex: 0,
        explanation: 'Le texte explique qu’ils souhaitent découvrir la langue vivante.',
      },
    ],
  },
  {
    languageCode: 'arz',
    cefrLevel: 'A1',
    genre: 'Everyday narrative',
    title: 'قهوة في وسط البلد (Coffee in Downtown Cairo)',
    wordCount: 52,
    content:
      'في وسط البلد في القاهرة، القهاوي القديمة بتفتح من بدري. الناس بتقعد تقرا الجرايد وتشرب شاي بالنعناع أو قهوة مظبوط. الجو دافي والناس دايماً بتبتسم وتقول صباح الخير.',
    glossaryJson: {
      القهاوي: { translation: 'traditional cafés', pos: 'noun (pl.)', note: 'Plural of قهوة in Egyptian' },
      بدري: { translation: 'early', pos: 'adverb', note: 'Colloquial Egyptian' },
      مظبوط: { translation: 'medium-sweet (coffee)', pos: 'adjective', note: 'Traditional Egyptian coffee sweetness' },
      دافي: { translation: 'warm', pos: 'adjective', note: 'MSA: دافئ' },
    },
    questionsJson: [
      {
        question: 'إيه المشروبات المذكورة في النص؟',
        options: ['شاي بالنعناع وقهوة مظبوط', 'عصير برتقال بس', 'لبن بارد'],
        answerIndex: 0,
        explanation: 'النص بيذكر شاي بالنعناع أو قهوة مظبوط.',
      },
    ],
  },
];

export const SEED_LISTENING: SeedListening[] = [
  {
    languageCode: 'es',
    cefrLevel: 'A1',
    accent: 'Latin American & Peninsular',
    topic: 'Everyday Conversations',
    mediaType: 'Street Interviews (External Legal Resource)',
    title: 'Easy Spanish — Everyday Morning Routines & Introductions',
    sourceName: 'Easy Languages (Official YouTube Educational Channel)',
    licenseStatus: 'Official Public YouTube Educational Channel (External Link / Verified Curriculum)',
    externalUrl: 'https://www.youtube.com/@EasySpanish',
    embedUrl: null,
    subtitlesJson: [
      { startSec: 0, endSec: 4, text: '¡Hola a todos! ¿Cómo empieza tu mañana normalmente?', translation: 'Hello everyone! How does your morning normally start?' },
      { startSec: 4, endSec: 9, text: 'Normalmente me despierto a las siete y preparo café.', translation: 'Normally I wake up at seven and make coffee.' },
      { startSec: 9, endSec: 15, text: 'Luego camino al trabajo mientras escucho un pódcast.', translation: 'Then I walk to work while listening to a podcast.' },
    ],
    questionsJson: [
      {
        question: 'What time does the speaker normally wake up?',
        options: ['At seven o’clock', 'At ten o’clock', 'At noon'],
        answerIndex: 0,
      },
    ],
    lastVerifiedAt: '2026-11-15',
  },
  {
    languageCode: 'ja',
    cefrLevel: 'A1',
    accent: 'Standard Tokyo',
    topic: 'Daily Life in Japan',
    mediaType: 'Educational Documentary / Street Interviews',
    title: 'Easy Japanese — Asking Directions & Polite Requests',
    sourceName: 'Easy Languages (Official YouTube Educational Channel)',
    licenseStatus: 'Official Public YouTube Educational Channel (External Link)',
    externalUrl: 'https://www.youtube.com/@EasyJapanese',
    embedUrl: null,
    subtitlesJson: [
      { startSec: 0, endSec: 5, text: 'すみません、駅はどこですか。', translation: 'Excuse me, where is the station?' },
      { startSec: 5, endSec: 10, text: 'まっすぐ行って、次の角を右に曲がってください。', translation: 'Go straight and turn right at the next corner.' },
    ],
    questionsJson: [
      {
        question: 'Which direction should the listener turn at the next corner?',
        options: ['Right (右)', 'Left (左)', 'Backwards'],
        answerIndex: 0,
      },
    ],
    lastVerifiedAt: '2026-11-15',
  },
  {
    languageCode: 'fr',
    cefrLevel: 'A2',
    accent: 'Metropolitan Paris & Lyon',
    topic: 'Café & Culture',
    mediaType: 'Educational Interviews',
    title: 'Easy French — Everyday Life in Paris',
    sourceName: 'Easy Languages (Official YouTube Educational Channel)',
    licenseStatus: 'Official Public YouTube Educational Channel (External Link)',
    externalUrl: 'https://www.youtube.com/@EasyFrench',
    embedUrl: null,
    subtitlesJson: [
      { startSec: 0, endSec: 5, text: 'Qu’est-ce que vous aimez faire le week-end à Paris ?', translation: 'What do you like to do on weekends in Paris?' },
      { startSec: 5, endSec: 11, text: 'J’aime lire au jardin du Luxembourg et retrouver mes amis.', translation: 'I like reading in the Luxembourg Gardens and meeting my friends.' },
    ],
    questionsJson: [
      {
        question: 'Where does the speaker enjoy reading?',
        options: ['Luxembourg Gardens', 'Inside a train', 'At an airport'],
        answerIndex: 0,
      },
    ],
    lastVerifiedAt: '2026-11-15',
  },
  {
    languageCode: 'de',
    cefrLevel: 'A2',
    accent: 'Standard German (Berlin)',
    topic: 'City & Culture',
    mediaType: 'Educational Interviews',
    title: 'Easy German — Daily Habits & Language Learning',
    sourceName: 'Easy Languages (Official YouTube Educational Channel)',
    licenseStatus: 'Official Public YouTube Educational Channel (External Link)',
    externalUrl: 'https://www.youtube.com/@EasyGerman',
    embedUrl: null,
    subtitlesJson: [
      { startSec: 0, endSec: 5, text: 'Wie lernst du am besten neue Wörter?', translation: 'How do you learn new words best?' },
      { startSec: 5, endSec: 10, text: 'Ich lese kurze Geschichten und spreche laut mit.', translation: 'I read short stories and speak along aloud.' },
    ],
    questionsJson: [
      {
        question: 'What strategy does the speaker use to remember words?',
        options: ['Reading short stories and speaking aloud', 'Writing lists once without review', 'Skipping pronunciation'],
        answerIndex: 0,
      },
    ],
    lastVerifiedAt: '2026-11-15',
  },
];

export const SEED_CULTURES: SeedCulture[] = [
  {
    languageCode: 'ja',
    region: 'East Asia · Japan',
    category: 'Social Etiquette & Architecture',
    title: 'Omotenashi, Shared Space & Contemporary Urban Craft',
    historicalContext:
      'Rooted in Edo-period tea ceremony (chanoyu) hospitality and neighborhood guild interdependence, Japanese spatial etiquette evolved around anticipating guests’ unspoken comfort without expectation of reward.',
    modernPractice:
      'Today, contemporary Tokyo and Osaka combine rapid digital transit and minimalist design with quiet public consideration—lowering voices on trains, separating packaging cleanly, and preserving neighborhood kissaten coffee houses alongside modern specialty roasters.',
    summary: 'Distinguishes classical tea-room aesthetics from everyday contemporary urban life.',
    referencesJson: ['Kodansha Encyclopedia of Japan', 'Japan Foundation Cultural Studies Archive'],
  },
  {
    languageCode: 'uz',
    region: 'Central Asia · Uzbekistan',
    category: 'Hospitality, History & Literary Heritage',
    title: 'From Silk Road Scholarship to Modern Tashkent & Samarkand',
    historicalContext:
      'From the Timurid Renaissance in Samarkand and Herat—where Alisher Navoi elevated Chagatai Turkic into a premier literary language and Ulugbek charted the stars—Central Asian scholarship bridged Persian, Turkic, and Arabic intellectual worlds.',
    modernPractice:
      'Modern Uzbekistan blends lively mahalla neighborhood solidarity, shared dasturxon meals (osh, non, green tea), and a rapidly expanding multilingual university and tech generation.',
    summary: 'Connects Timurid literary and astronomical heritage with living Uzbek community life.',
    referencesJson: ['UNESCO Silk Roads Programme', 'Alisher Navoi State Museum of Literature'],
  },
  {
    languageCode: 'arz',
    region: 'North Africa · Egypt',
    category: 'Cinema, Music & Spoken Storytelling',
    title: 'Cairo’s Literary Cafés, Cinema & Living Masri Humor',
    historicalContext:
      'Across the 20th century, Cairo became the Arab world’s center of print journalism, classical music (Umm Kulthum, Sayed Darwish), and cinema, spreading Egyptian Arabic idioms across the Middle East and North Africa.',
    modernPractice:
      'Contemporary Egyptians code-switch naturally between warm, witty Masri in podcasts, street markets, and social media and Modern Standard Arabic in news, courts, and formal literature.',
    summary: 'Explores Egypt’s cultural influence and everyday diglossia without stereotypes.',
    referencesJson: ['Library of Alexandria Digital Archive', 'AUC Press Modern Arabic Studies'],
  },
  {
    languageCode: 'es',
    region: 'Iberia & The Americas',
    category: 'Literature, Music & Regional Plurality',
    title: 'A Pluricentric Language Across Four Continents',
    historicalContext:
      'Spanning Iberian Romance roots and deep Indigenous lexical exchanges (Nahuatl, Quechua, Taíno words like chocolate, cóndor, canoa), Spanish evolved as a genuinely multicentric global tongue.',
    modernPractice:
      'Modern Hispanic societies span vibrant urban book fairs in Bogotá, Madrid, Buenos Aires, and Mexico City, diverse musical traditions, and shared scientific and civic institutions.',
    summary: 'Highlights the historical diversity and modern pluralism of the Spanish-speaking world.',
    referencesJson: ['Instituto Cervantes Annual Report', 'Real Academia Española Historical Archive'],
  },
];

export const SEED_ACHIEVEMENTS = [
  { slug: 'first_step', title: 'First Horizon', description: 'Complete your first structured language topic.', xpReward: 50, category: 'Curriculum' },
  { slug: 'polyglot_explorer', title: 'Polyglot Explorer', description: 'Enroll in 2 or more languages simultaneously.', xpReward: 75, category: 'Exploration' },
  { slug: 'srs_steward', title: 'Memory Architect', description: 'Complete 10 spaced repetition vocabulary reviews.', xpReward: 60, category: 'Vocabulary' },
  { slug: 'literary_reader', title: 'Close Reader', description: 'Complete a reading passage and save vocabulary to flashcards.', xpReward: 60, category: 'Reading' },
  { slug: 'voice_scholar', title: 'Articulate Voice', description: 'Complete an AI speaking or writing evaluation session.', xpReward: 80, category: 'AI Lab' },
];
