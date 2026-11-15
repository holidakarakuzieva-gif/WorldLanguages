import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Globe,
  Headphones,
  MessageSquare,
  Mic,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUiCopy, INTERFACE_LANGUAGES } from '../i18n/translations';
import { LanguageEnvironment } from '../types';
import { Navbar } from './Navbar';
import heroWorldImg from '../assets/images/hero_world_languages_1794753002182.jpg';
import labReadingImg from '../assets/images/lab_reading_study_1794752062602.jpg';
import tutorSpeakingImg from '../assets/images/tutor_speaking_studio_1794752064426.jpg';
import cultureArtifactsImg from '../assets/images/culture_global_artifacts_1794752062926.jpg';

interface LandingPageProps {
  onOpenAuth: (tab: 'login' | 'signup' | 'founder', targetLang?: string) => void;
  onEnterWorkspace: () => void;
}

const FAQS = [
  {
    q: 'Is World Languages genuinely 100% free without locked tiers?',
    a: 'Yes. Founded by Begzad Kurbanbayev, World Languages provides full access to all 21 languages, CEFR curricula, spaced repetition flashcards, reading and listening laboratories, AI conversation tutoring, and examinations free of charge.',
  },
  {
    q: 'Does each language share the same translated lessons?',
    a: 'No. Every language has its own script system, phonetics training, grammatical architecture, dialect choices, and cultural encyclopedia—for example Hiragana/Kanji and pitch accent in Japanese, Hangul batchim changes in Korean, four cases in German, or full right-to-left Cairene Egyptian Arabic.',
  },
  {
    q: 'How does the placement assessment work?',
    a: 'Instead of assigning a CEFR level from a quick multiple-choice quiz, World Languages evaluates vocabulary, grammar, reading, listening, writing, and speaking evidence together—or lets true beginners start cleanly at Pre-A1.',
  },
  {
    q: 'Can I study using an interface language other than English?',
    a: 'Yes. Students can choose their interface and explanation language (including English, Uzbek, Russian, Spanish, French, and Arabic) independently from the language they are studying.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onEnterWorkspace,
}) => {
  const { languages, user, interfaceLanguage, setInterfaceLanguage } = useAuth();
  const copy = getUiCopy(interfaceLanguage);

  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageEnvironment | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [communityData, setCommunityData] = useState<{
    announcements: Array<{ id: number; title: string; body: string }>;
    reviews: Array<{ id: number; authorName: string; languageCode: string; rating: number; comment: string }>;
  }>({ announcements: [], reviews: [] });

  useEffect(() => {
    fetch('/api/community')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setCommunityData({ announcements: d.announcements ?? [], reviews: d.reviews ?? [] });
      })
      .catch(() => {});
  }, []);

  const regions = ['All', 'East Asia', 'Europe', 'Central & South Asia', 'Middle East & Africa', 'Americas'];

  const filteredLanguages = languages.filter((lang) => {
    const matchesSearch =
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.script.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (regionFilter === 'All') return true;
    if (regionFilter === 'Europe') return lang.region.includes('Europe');
    if (regionFilter === 'Central & South Asia') return lang.region.includes('Central Asia') || lang.region.includes('South Asia') || lang.region.includes('Anatolia');
    if (regionFilter === 'Middle East & Africa') return lang.region.includes('Africa') || lang.region.includes('Middle East');
    if (regionFilter === 'Americas') return lang.region.includes('Americas') || lang.region.includes('Lusophone') || lang.region.includes('Francophonie');
    return lang.region.includes(regionFilter);
  });

  const scrollTo = (id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      id="top"
      dir={interfaceLanguage === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F8FAFC] text-slate-900"
    >
      <Navbar
        onOpenAuth={(t) => onOpenAuth(t)}
        onEnterWorkspace={onEnterWorkspace}
        onNavigateSection={scrollTo}
      />

      {/* Editorial Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 mb-4">
              <span>Founded by Begzad Kurbanbayev</span>
              <span aria-hidden="true">·</span>
              <span>21 Language Environments</span>
              <span aria-hidden="true">·</span>
              <span>100% Free Education</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.1] text-balance">
              {copy.heroHeadline}
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              {copy.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={onEnterWorkspace}
                  className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  Continue Learning in Workspace
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  {copy.heroStartBtn}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => scrollTo('languages')}
                className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                {copy.heroExploreBtn}
              </button>

              {!user && (
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-3 text-sm font-medium text-slate-700 hover:text-blue-700 whitespace-nowrap cursor-pointer"
                >
                  {copy.ctaSignIn}
                </button>
              )}
            </div>

            {/* Interface Language Selector below CTA */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
              <label htmlFor="hero-iface-lang" className="text-xs font-medium text-slate-500">
                Interface language:
              </label>
              <select
                id="hero-iface-lang"
                value={interfaceLanguage}
                onChange={(e) => setInterfaceLanguage(e.target.value)}
                className="text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md px-2.5 py-1.5"
              >
                {INTERFACE_LANGUAGES.map((il) => (
                  <option key={il.code} value={il.code}>
                    {il.label}
                  </option>
                ))}
              </select>
              {!user && (
                <>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('founder')}
                    className="text-xs font-medium text-slate-600 hover:text-blue-700 cursor-pointer"
                  >
                    Founder Administration
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
              <img
                src={heroWorldImg}
                alt="Sunlit international language library and study space"
                className="w-full h-full lg:h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-6">
                <div className="text-white">
                  <p className="text-xs font-medium text-slate-200">
                    All-in-One Academic Language Ecosystem
                  </p>
                  <p className="font-display text-lg font-bold mt-1">
                    Phonetics · CEFR Curricula · SM-2 Vocabulary · Reading & Listening · AI Tutor
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-column Architectural KPI Strip */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-xl p-5">
          <div className="border-r border-slate-100 pr-4">
            <div className="font-mono-num text-2xl font-bold text-slate-950">21</div>
            <div className="text-xs text-slate-600 mt-1">Independent linguistic environments</div>
          </div>
          <div className="lg:border-r border-slate-100 pr-4">
            <div className="font-mono-num text-2xl font-bold text-slate-950">Pre-A1 → C2</div>
            <div className="text-xs text-slate-600 mt-1">CEFR-aligned & national frameworks</div>
          </div>
          <div className="border-r border-slate-100 pr-4">
            <div className="font-mono-num text-2xl font-bold text-slate-950">6 Labs</div>
            <div className="text-xs text-slate-600 mt-1">Phonetics, SRS, Grammar, Read, Listen, AI</div>
          </div>
          <div>
            <div className="font-mono-num text-2xl font-bold text-emerald-700">$0</div>
            <div className="text-xs text-slate-600 mt-1">Zero paywalls or locked courses</div>
          </div>
        </div>
      </section>

      {/* Announcements Banner from PostgreSQL */}
      {communityData.announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-700">Platform Announcement</p>
              <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                {communityData.announcements[0].title}
              </h3>
              <p className="text-sm text-slate-600 mt-1">{communityData.announcements[0].body}</p>
            </div>
            <button
              type="button"
              onClick={() => (user ? onEnterWorkspace() : onOpenAuth('signup'))}
              className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Join Community
            </button>
          </div>
        </section>
      )}

      {/* 21 Languages Explorer */}
      <section id="languages" className="max-w-7xl mx-auto px-6 py-14 border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-700">Linguistic Diversity</p>
            <h2 className="font-display text-3xl font-bold text-slate-950 mt-1">
              21 Purpose-Built Language Environments
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl">
              Every language features its own script training, phonological curriculum, grammatical structure, dialect selector, and cultural library.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              aria-label="Search 21 languages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language or script..."
              className="px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
        </div>

        {/* Interactive Filter Segmented Control */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit mb-8">
          {regions.map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setRegionFilter(reg)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                regionFilter === reg
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLanguages.map((lang) => (
            <div
              key={lang.code}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-blue-400 transition-colors"
            >
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-slate-950">{lang.name}</h3>
                  <span
                    dir={lang.direction}
                    className="text-base font-semibold text-blue-800"
                  >
                    {lang.nativeName}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span>{lang.script}</span>
                  <span aria-hidden="true">·</span>
                  <span>{lang.family}</span>
                  {lang.direction === 'rtl' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-amber-700">RTL Layout</span>
                    </>
                  )}
                </div>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-2">
                  {lang.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  className="text-xs font-semibold text-slate-700 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                >
                  Inspect Syllabus
                </button>
                <button
                  type="button"
                  onClick={() => (user ? onEnterWorkspace() : onOpenAuth('signup', lang.code))}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-blue-700 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  Study {lang.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How Learning Works */}
      <section id="how-it-works" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold text-blue-700">Pedagogical Architecture</p>
            <h2 className="font-display text-3xl font-bold text-slate-950 mt-1">
              One Integrated System From Sound to Literary Fluency
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="font-mono-num text-xs font-semibold text-blue-700">01. Diagnostic & Phonetics</div>
              <h3 className="font-display text-base font-bold text-slate-900 mt-2">
                Multi-Skill Placement & Sound Foundation
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Start from absolute zero in the Phonetics & Script Academy or complete a multi-skill placement evaluation across Pre-A1 to C2.
              </p>
            </div>
            <div>
              <div className="font-mono-num text-xs font-semibold text-blue-700">02. Structured Courses</div>
              <h3 className="font-display text-base font-bold text-slate-900 mt-2">
                Thematic CEFR Sequences
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Every topic links vocabulary, grammar rules, listening, reading, AI speaking, writing, and cultural context without filler.
              </p>
            </div>
            <div>
              <div className="font-mono-num text-xs font-semibold text-blue-700">03. Memory & Immersion</div>
              <h3 className="font-display text-base font-bold text-slate-900 mt-2">
                Spaced Repetition & Living Media
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Click any word inside reading passages or interactive subtitles to translate it and route it directly into your personal SM-2 flashcard queue.
              </p>
            </div>
            <div>
              <div className="font-mono-num text-xs font-semibold text-blue-700">04. Adaptive Mastery</div>
              <h3 className="font-display text-base font-bold text-slate-900 mt-2">
                Verified Examinations & Progression
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Level advancement requires mandatory mastery and cumulative exams rather than passive XP farming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Laboratories & AI Tutor Showcase (Asymmetric Bento) */}
      <section id="laboratories" className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold text-blue-700">Six Dedicated Learning Laboratories</p>
          <h2 className="font-display text-3xl font-bold text-slate-950 mt-1">
            Built to Replace Disconnected Study Apps
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="h-64 overflow-hidden bg-slate-100">
              <img
                src={labReadingImg}
                alt="Multilingual literature and fountain pen study desk"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <BookOpen className="w-4 h-4" />
                  <span>Reading Library & AI Story Generator</span>
                </div>
                <h3 className="font-display text-xl font-bold text-slate-950 mt-2">
                  Clickable Interactive Texts & Chapter-by-Chapter Stories
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Read level-calibrated fiction, news, and historical accounts. Tap any unfamiliar word for instant grammatical context, listen with natural TTS narration, or generate custom multi-chapter stories calibrated to your CEFR target.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>Instant Word Inspector</span>
                <span aria-hidden="true">·</span>
                <span>One-Click Flashcard Saving</span>
                <span aria-hidden="true">·</span>
                <span>Comprehension Quizzes</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="h-64 overflow-hidden bg-slate-100">
              <img
                src={tutorSpeakingImg}
                alt="Acoustic language recording studio desk"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <Mic className="w-4 h-4" />
                  <span>AI Speaking & Writing Laboratories</span>
                </div>
                <h3 className="font-display text-xl font-bold text-slate-950 mt-2">
                  Real Speech Transcription & Line-by-Line Writing Critique
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Practice structured lesson dialogues or free conversations with customizable tutor personality, register, and correction timing—plus mistake-by-mistake writing evaluations that preserve your original draft.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>Microphone Speech Recognition</span>
                <span aria-hidden="true">·</span>
                <span>Rubric Explanations</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
            <Headphones className="w-5 h-5 text-blue-700" />
            <h3 className="font-display text-lg font-bold text-slate-950 mt-3">Listening Laboratory</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Curated legal educational media (including Easy Languages channels) paired with synchronized interactive subtitles, word saving, and regional accent filtering.
            </p>
          </div>

          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
            <Sparkles className="w-5 h-5 text-blue-700" />
            <h3 className="font-display text-lg font-bold text-slate-950 mt-3">Adaptive Learning Engine</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Continuously analyzes grammar mistakes, forgotten SRS cards, and comprehension scores to generate transparent recommendations explaining why each review matters.
            </p>
          </div>

          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
            <MessageSquare className="w-5 h-5 text-blue-700" />
            <h3 className="font-display text-lg font-bold text-slate-950 mt-3">Independent Grammar Academy</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Study structural patterns, common learner pitfalls, and cross-language comparisons—or prove mastery via diagnostic checks without skipping overall course rigor.
            </p>
          </div>
        </div>
      </section>

      {/* World Cultures Encyclopedia Preview */}
      <section id="cultures" className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <div className="rounded-xl overflow-hidden border border-slate-700">
              <img
                src={cultureArtifactsImg}
                alt="Curated global cultural artifacts on museum pedestals"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Globe className="w-4 h-4" />
              <span>World Cultures Encyclopedia</span>
            </div>
            <h2 className="font-display text-3xl font-bold mt-2 text-balance">
              Language Lives Inside History, Literature, and Modern Society
            </h2>
            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
              Explore nuanced cultural essays organized by language and region—covering architecture, cinema, cuisine, social etiquette, and contemporary developments while clearly distinguishing historical traditions from modern everyday life.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => (user ? onEnterWorkspace() : onOpenAuth('signup'))}
                className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Explore World Cultures
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Real Learner Reviews (if moderated/approved) + FAQ */}
      <section id="about" className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-blue-700">Mission & Questions</p>
          <h2 className="font-display text-3xl font-bold text-slate-950 mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                aria-expanded={openFaq === idx}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-display text-sm font-bold text-slate-900 cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {communityData.reviews.length > 0 && (
          <div className="mt-14 pt-10 border-t border-slate-200">
            <h3 className="font-display text-xl font-bold text-slate-950 mb-4">
              Verified Student Reflections
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {communityData.reviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">{rev.authorName}</span>
                    <span>{rev.rating} / 5 · {rev.languageCode.toUpperCase()}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-display font-bold text-slate-900">World Languages</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Founded by Begzad Kurbanbayev · 100% Free Global Education</span>
          </div>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => scrollTo('languages')} className="hover:text-slate-900 cursor-pointer">
              21 Languages
            </button>
            <button type="button" onClick={() => onOpenAuth('login')} className="hover:text-slate-900 cursor-pointer">
              Student Login
            </button>
            <button type="button" onClick={() => onOpenAuth('founder')} className="hover:text-slate-900 cursor-pointer">
              Founder Console
            </button>
          </div>
        </div>
      </footer>

      {/* Language Syllabus Inspector Modal */}
      {selectedLanguage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lang-inspect-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-700">
                  {selectedLanguage.family} · {selectedLanguage.region}
                </p>
                <h3 id="lang-inspect-title" className="font-display text-2xl font-bold text-slate-950 mt-1">
                  {selectedLanguage.name} ({selectedLanguage.nativeName})
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close language syllabus preview"
                onClick={() => setSelectedLanguage(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mt-3">{selectedLanguage.description}</p>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Writing System & Progression</h4>
                <p className="text-slate-600 mt-1">
                  {selectedLanguage.script} · {selectedLanguage.progressionFramework}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Configurable Regional Variants</h4>
                <p className="text-slate-600 mt-1">{selectedLanguage.variantsJson.join(' · ')}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Phonetics Academy Focus</h4>
                <ul className="list-disc pl-5 text-slate-600 mt-1 space-y-0.5">
                  {selectedLanguage.phoneticsFocusJson.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Core Grammar Pillars</h4>
                <ul className="list-disc pl-5 text-slate-600 mt-1 space-y-0.5">
                  {selectedLanguage.grammarPillarsJson.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedLanguage(null)}
                className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const code = selectedLanguage.code;
                  setSelectedLanguage(null);
                  if (user) onEnterWorkspace();
                  else onOpenAuth('signup', code);
                }}
                className="px-5 py-2 text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg cursor-pointer"
              >
                Start Studying {selectedLanguage.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
