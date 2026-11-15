export interface UiCopy {
  navHome: string;
  navLanguages: string;
  navLabs: string;
  navCultures: string;
  navAbout: string;
  ctaStart: string;
  ctaSignIn: string;
  heroHeadline: string;
  heroDescription: string;
  heroExploreBtn: string;
  heroStartBtn: string;
  dashboardOverview: string;
  courses: string;
  phonetics: string;
  vocabulary: string;
  grammar: string;
  reading: string;
  listening: string;
  speakingWriting: string;
  examinations: string;
  cultures: string;
  profile: string;
  founderConsole: string;
}

export const INTERFACE_LANGUAGES: Array<{ code: string; label: string; dir: 'ltr' | 'rtl' }> = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'uz', label: "O'zbekcha", dir: 'ltr' },
  { code: 'ru', label: 'Русский', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];

export const UI_TRANSLATIONS: Record<string, UiCopy> = {
  en: {
    navHome: 'Home',
    navLanguages: 'Languages',
    navLabs: 'Laboratories',
    navCultures: 'Cultures',
    navAbout: 'About',
    ctaStart: 'Start Free',
    ctaSignIn: 'Log In',
    heroHeadline: 'Discover Languages. Understand Cultures. Connect the World.',
    heroDescription:
      'Your journey to mastering 21 world languages begins here. Learn, practice, explore, and grow with structured linguistics and personalized AI education. Completely free.',
    heroExploreBtn: 'Explore Languages',
    heroStartBtn: 'Start Learning Free',
    dashboardOverview: 'Overview',
    courses: 'Courses',
    phonetics: 'Phonetics',
    vocabulary: 'Vocabulary & SRS',
    grammar: 'Grammar Lab',
    reading: 'Reading Library',
    listening: 'Listening Lab',
    speakingWriting: 'Speaking & Writing',
    examinations: 'Examinations',
    cultures: 'World Cultures',
    profile: 'Profile & Settings',
    founderConsole: 'Founder Console',
  },
  uz: {
    navHome: 'Bosh sahifa',
    navLanguages: 'Tillar',
    navLabs: 'Laboratoriyalar',
    navCultures: 'Madaniyatlar',
    navAbout: 'Biz haqimizda',
    ctaStart: 'Bepul boshlash',
    ctaSignIn: 'Kirish',
    heroHeadline: "Tillarni kashf eting. Madaniyatlarni anglang. Dunyoni bog'lang.",
    heroDescription:
      "Dunyo tillarini o'rganish sayohatingiz shu yerdan boshlanadi. Shaxsiylashtirilgan sun'iy intellekt ta'limi bilan mutlaqo bepul o'rganing.",
    heroExploreBtn: "Tillarni ko'rish",
    heroStartBtn: 'Bepul boshlash',
    dashboardOverview: 'Boshqaruv paneli',
    courses: 'Kurslar',
    phonetics: 'Fonetika',
    vocabulary: "Lug'at va Takrorlash",
    grammar: 'Grammatika',
    reading: "O'qish kutubxonasi",
    listening: 'Tinglash laboratoriyasi',
    speakingWriting: 'Gapirish va Yozish',
    examinations: 'Imtihonlar',
    cultures: 'Jahon madaniyatlari',
    profile: 'Profil va Sozlamalar',
    founderConsole: 'Asoschi boshqaruvi',
  },
  ru: {
    navHome: 'Главная',
    navLanguages: 'Языки',
    navLabs: 'Лаборатории',
    navCultures: 'Культуры',
    navAbout: 'О нас',
    ctaStart: 'Начать бесплатно',
    ctaSignIn: 'Войти',
    heroHeadline: 'Открывайте языки. Понимайте культуры. Объединяйте мир.',
    heroDescription:
      'Ваш путь к освоению 21 языка мира начинается здесь. Системное обучение с ИИ-наставником — полностью бесплатно для каждого.',
    heroExploreBtn: 'Выбрать язык',
    heroStartBtn: 'Начать бесплатно',
    dashboardOverview: 'Обзор',
    courses: 'Курсы',
    phonetics: 'Фонетика',
    vocabulary: 'Словарь и SRS',
    grammar: 'Грамматика',
    reading: 'Библиотека',
    listening: 'Аудирование',
    speakingWriting: 'Речь и Письмо',
    examinations: 'Экзамены',
    cultures: 'Мировые культуры',
    profile: 'Профиль',
    founderConsole: 'Панель основателя',
  },
  es: {
    navHome: 'Inicio',
    navLanguages: 'Idiomas',
    navLabs: 'Laboratorios',
    navCultures: 'Culturas',
    navAbout: 'Acerca de',
    ctaStart: 'Empezar gratis',
    ctaSignIn: 'Iniciar sesión',
    heroHeadline: 'Descubre idiomas. Comprende culturas. Conecta el mundo.',
    heroDescription:
      'Tu camino para dominar 21 idiomas comienza aquí. Aprende y practica con educación personalizada impulsada por IA. Totalmente gratis.',
    heroExploreBtn: 'Explorar idiomas',
    heroStartBtn: 'Empezar gratis',
    dashboardOverview: 'Resumen',
    courses: 'Cursos',
    phonetics: 'Fonética',
    vocabulary: 'Vocabulario y SRS',
    grammar: 'Gramática',
    reading: 'Biblioteca',
    listening: 'Escucha',
    speakingWriting: 'Habla y Escritura',
    examinations: 'Exámenes',
    cultures: 'Culturas del Mundo',
    profile: 'Perfil',
    founderConsole: 'Consola del Fundador',
  },
  fr: {
    navHome: 'Accueil',
    navLanguages: 'Langues',
    navLabs: 'Laboratoires',
    navCultures: 'Cultures',
    navAbout: 'À propos',
    ctaStart: 'Commencer',
    ctaSignIn: 'Connexion',
    heroHeadline: 'Découvrez les langues. Comprenez les cultures. Reliez le monde.',
    heroDescription:
      'Maîtrisez 21 langues grâce à une pédagogie structurée et un tuteur IA personnalisé. Entièrement gratuit.',
    heroExploreBtn: 'Explorer les langues',
    heroStartBtn: 'Apprendre gratuitement',
    dashboardOverview: 'Tableau de bord',
    courses: 'Cours',
    phonetics: 'Phonétique',
    vocabulary: 'Vocabulaire & SRS',
    grammar: 'Grammaire',
    reading: 'Bibliothèque',
    listening: 'Compréhension orale',
    speakingWriting: 'Expression',
    examinations: 'Examens',
    cultures: 'Cultures du monde',
    profile: 'Profil',
    founderConsole: 'Console Fondateur',
  },
  ar: {
    navHome: 'الرئيسية',
    navLanguages: 'اللغات',
    navLabs: 'المختبرات',
    navCultures: 'الثقافات',
    navAbout: 'من نحن',
    ctaStart: 'ابدأ مجاناً',
    ctaSignIn: 'تسجيل الدخول',
    heroHeadline: 'اكتشف اللغات. افهم الثقافات. اربط العالم.',
    heroDescription:
      'تبدأ رحلتك لإتقان 21 لغة عالمية هنا. تعلّم وتدرّب بتعليم مخصص مدعوم بالذكاء الاصطناعي مجاناً بالكامل.',
    heroExploreBtn: 'استكشف اللغات',
    heroStartBtn: 'ابدأ التعلم مجاناً',
    dashboardOverview: 'نظرة عامة',
    courses: 'الدورات',
    phonetics: 'الصوتيات',
    vocabulary: 'المفردات والتكرار',
    grammar: 'القواعد',
    reading: 'مكتبة القراءة',
    listening: 'مختبر الاستماع',
    speakingWriting: 'التحدث والكتابة',
    examinations: 'الاختبارات',
    cultures: 'ثقافات العالم',
    profile: 'الملف الشخصي',
    founderConsole: 'لوحة المؤسس',
  },
};

export function getUiCopy(langCode: string): UiCopy {
  return UI_TRANSLATIONS[langCode] ?? UI_TRANSLATIONS.en;
}
