export interface PhonemeDrill {
  symbol: string;
  ipa: string;
  title: string;
  articulation: string;
  exampleWord: string;
  exampleGloss: string;
  minimalPair?: { a: string; b: string; contrast: string };
}

export interface LanguagePhoneticsAcademy {
  overview: string;
  writingSystemNotes: string;
  stressAndRhythm: string;
  drills: PhonemeDrill[];
}

export const PHONETICS_ACADEMY_BY_LANG: Record<string, LanguagePhoneticsAcademy> = {
  ja: {
    overview: 'Japanese uses moraic timing: every mora (CV, V, nasal ん, or geminate っ) occupies equal rhythmic duration, combined with high/low pitch accent.',
    writingSystemNotes: 'Three scripts work together: Hiragana for native grammar/words, Katakana for loanwords & emphasis, and Kanji for lexical roots.',
    stressAndRhythm: 'Avoid English stress-lengthening. Keep vowels pure and crisp; distinguish short vs long vowels (おばさん aunt vs おばあさん grandmother).',
    drills: [
      {
        symbol: 'ら / り / る / れ / ろ',
        ipa: '/ɾ/',
        title: 'Japanese Alveolar Tap R',
        articulation: 'Tap the alveolar ridge once lightly with the tongue tip—midway between English d and l, never curled back like English r.',
        exampleWord: 'さくら (sakura)',
        exampleGloss: 'cherry blossom',
        minimalPair: { a: 'から (kara — from)', b: 'かた (kata — shoulder)', contrast: 'Tap /ɾ/ vs stop /t/' },
      },
      {
        symbol: 'っ (Sokuon)',
        ipa: '/Cː/',
        title: 'Geminate Pause Timing',
        articulation: 'Hold the articulatory closure for one full silent mora before releasing the following voiceless consonant.',
        exampleWord: 'きって (kitte)',
        exampleGloss: 'postage stamp',
        minimalPair: { a: 'きて (kite — come)', b: 'きって (kitte — stamp)', contrast: '1 mora vs 2 morae hold' },
      },
      {
        symbol: 'はし (Pitch Accent)',
        ipa: '[haꜜɕi] vs [haɕiꜜ]',
        title: 'High-Low Pitch Contour',
        articulation: 'Japanese distinguishes homophones by pitch drop rather than loudness.',
        exampleWord: '箸 (HA-shi) / 橋 (ha-SHI)',
        exampleGloss: 'chopsticks vs bridge',
      },
    ],
  },
  ko: {
    overview: 'Hangul is a featural alphabet where consonant shapes mirror the vocal organs (tongue, lips, throat) and combine into syllabic blocks.',
    writingSystemNotes: 'Every block has Initial Consonant + Vowel + optional Final Consonant (Batchim). Sound changes happen automatically across boundaries.',
    stressAndRhythm: 'Three-way stop contrast (plain ㄱ, aspirated ㅋ, tense ㄲ) relies on burst aspiration and vocal fold tension rather than voicing alone.',
    drills: [
      {
        symbol: 'ㄱ / ㅋ / ㄲ',
        ipa: '/k ~ g/ · /kʰ/ · /k͈/',
        title: 'Three-Way Velar Stop Contrast',
        articulation: 'Plain ㄱ is soft and breathy initially; ㅋ has a strong puff of air; ㄲ holds glottal tension with zero breath.',
        exampleWord: '가다 / 카드 / 까다',
        exampleGloss: 'to go / card / to peel',
        minimalPair: { a: '달 (dal — moon)', b: '딸 (ttal — daughter)', contrast: 'Lax vs tense stop' },
      },
      {
        symbol: 'ㅓ vs ㅗ',
        ipa: '/ʌ/ vs /o/',
        title: 'Unrounded ㅓ vs Rounded ㅗ',
        articulation: 'Keep lips relaxed and unrounded for ㅓ; round lips firmly forward for ㅗ.',
        exampleWord: '어머니 (eomeoni)',
        exampleGloss: 'mother',
        minimalPair: { a: '서다 (seoda — stand)', b: '소 (so — cow)', contrast: 'Unrounded /ʌ/ vs rounded /o/' },
      },
    ],
  },
  zh: {
    overview: 'Mandarin is a tonal language where pitch contour differentiates lexical meaning. Every syllable combines an Initial, a Final, and one of four tones (plus neutral tone).',
    writingSystemNotes: 'Pinyin maps Mandarin sounds to Latin letters as a phonetic bridge into Hanzi characters (Simplified and Traditional).',
    stressAndRhythm: '1st tone is high-level (55), 2nd rising (35), 3rd low dipping (214), and 4th sharp falling (51). Two adjacent 3rd tones turn the first into a 2nd tone.',
    drills: [
      {
        symbol: 'mā / má / mǎ / mà',
        ipa: '/ma˥/ · /ma˧˥/ · /ma˨˩˦/ · /ma˥˩/',
        title: 'Four Primary Pitch Contours',
        articulation: 'Hold Tone 1 high and steady; lift Tone 2 cleanly; dip low on Tone 3; drop crisply from high to low on Tone 4.',
        exampleWord: '妈 / 麻 / 马 / 骂',
        exampleGloss: 'mother / hemp / horse / scold',
        minimalPair: { a: '买 (mǎi — buy)', b: '卖 (mài — sell)', contrast: '3rd dipping vs 4th falling tone' },
      },
      {
        symbol: 'j / q / x vs zh / ch / sh',
        ipa: '/tɕ, tɕʰ, ɕ/ vs /ʈʂ, ʈʂʰ, ʂ/',
        title: 'Palatal vs Retroflex Initials',
        articulation: 'For j/q/x keep the tongue tip down behind lower teeth and raise the blade; for zh/ch/sh curl the tongue tip slightly back.',
        exampleWord: '谢谢 (xièxie) / 中国 (Zhōngguó)',
        exampleGloss: 'thank you / China',
      },
    ],
  },
  fr: {
    overview: 'French prosody flows in rhythmic groups with gentle rising pitch and stress on the final full syllable of each phrase.',
    writingSystemNotes: 'Silent final consonants reappear before vowel-initial words via liaison (les amis → /le.za.mi/).',
    stressAndRhythm: 'Do not turn French vowels into English diphthongs. Keep lip rounding steady for u (/y/) and nasal air flow steady for an/in/on.',
    drills: [
      {
        symbol: 'r (Uvular R)',
        ipa: '/ʁ/',
        title: 'French Uvular Fricative R',
        articulation: 'Raise the back of the tongue softly toward the uvula, letting air pass smoothly without harsh gargling.',
        exampleWord: 'Paris /merci',
        exampleGloss: 'Paris / thank you',
      },
      {
        symbol: 'an / in / on',
        ipa: '/ɑ̃/ · /ɛ̃/ · /ɔ̃/',
        title: 'Nasal Vowels (No Trailing N)',
        articulation: 'Lower the soft palate so air exits both mouth and nose simultaneously; never touch the tongue tip to the roof to pronounce an n.',
        exampleWord: 'bon / vin / dans',
        exampleGloss: 'good / wine / in',
        minimalPair: { a: 'beau (/bo/ — handsome)', b: 'bon (/bɔ̃/ — good)', contrast: 'Oral vs nasal vowel' },
      },
      {
        symbol: 'u vs ou',
        ipa: '/y/ vs /u/',
        title: 'Front Rounded /y/ vs Back /u/',
        articulation: 'Say "ee" while rounding your lips tightly into a small circle to produce /y/.',
        exampleWord: 'tu vs tout',
        exampleGloss: 'you vs everything',
        minimalPair: { a: 'dessus (above)', b: 'dessous (below)', contrast: '/y/ vs /u/' },
      },
    ],
  },
  es: {
    overview: 'Spanish features five pure, unreduced vowels (/a, e, i, o, u/) and clear syllable boundaries.',
    writingSystemNotes: 'Orthographic accent marks (á, é, í, ó, ú) indicate either irregular stress or homonym distinction (sí vs si).',
    stressAndRhythm: 'Words ending in a vowel, n, or s stress the second-to-last syllable; words ending in other consonants stress the final syllable unless marked.',
    drills: [
      {
        symbol: 'r vs rr',
        ipa: '/ɾ/ vs /r/',
        title: 'Alveolar Tap vs Rolled Trill',
        articulation: 'Single medial r is one quick tap; rr or word-initial r vibrates the relaxed tongue tip against the alveolar ridge with steady airflow.',
        exampleWord: 'pero vs perro',
        exampleGloss: 'but vs dog',
        minimalPair: { a: 'caro (expensive)', b: 'carro (car)', contrast: 'Tap /ɾ/ vs trill /r/' },
      },
      {
        symbol: 'ñ',
        ipa: '/ɲ/',
        title: 'Palatal Nasal',
        articulation: 'Press the middle blade of the tongue flat against the hard palate rather than saying n + y separately.',
        exampleWord: 'español / mañana',
        exampleGloss: 'Spanish / tomorrow',
      },
    ],
  },
  de: {
    overview: 'German contrasts long tense vowels with short lax vowels and sharpens word boundaries with glottal stops before initial vowels.',
    writingSystemNotes: 'Nouns are always capitalized. ß follows long vowels/diphthongs (Straße); ss follows short vowels (Wasser).',
    stressAndRhythm: 'Final voiced stops (b, d, g) devoice to /p, t, k/ at the end of syllables (Tag → /taːk/).',
    drills: [
      {
        symbol: 'ch (Ich-Laut vs Ach-Laut)',
        ipa: '/ç/ vs /x/',
        title: 'Palatal vs Velar Fricative',
        articulation: 'After front vowels (i, e, ä, ö, ü) breathe through a narrow palatal gap (/ç/); after back vowels (a, o, u, au) produce a soft velar friction (/x/).',
        exampleWord: 'ich vs Buch',
        exampleGloss: 'I vs book',
      },
      {
        symbol: 'ü / ö',
        ipa: '/yː, ʏ/ · /øː, œ/',
        title: 'Front Rounded Umlauts',
        articulation: 'Keep the tongue high and forward (like i/e) while rounding the lips forward.',
        exampleWord: 'schön / Tür',
        exampleGloss: 'beautiful / door',
        minimalPair: { a: 'kennen (to know)', b: 'können (can)', contrast: 'Unrounded /ɛ/ vs rounded /œ/' },
      },
    ],
  },
  ru: {
    overview: 'Russian centers on the contrast between hard (non-palatalized) and soft (palatalized) consonants, plus strong vowel reduction in unstressed syllables.',
    writingSystemNotes: 'Cyrillic vowel letters encode consonant softness: а/о/у/э/ы indicate a hard preceding consonant, while я/ё/ю/е/и indicate a soft one.',
    stressAndRhythm: 'Lexical stress is unpredictable and shifts across declensions; unstressed o sounds like a relaxed /ɐ/ or /ə/ (akanie).',
    drills: [
      {
        symbol: 'ы vs и',
        ipa: '/ɨ/ vs /i/',
        title: 'Centralized /ɨ/ vs Front /i/',
        articulation: 'For ы pull the tongue body slightly back from /i/ without rounding your lips.',
        exampleWord: 'мы vs мир',
        exampleGloss: 'we vs peace/world',
        minimalPair: { a: 'быть (to be)', b: 'бить (to hit)', contrast: 'Hard b + /ɨ/ vs soft bʲ + /i/' },
      },
      {
        symbol: 'мат vs мать',
        ipa: '/t/ vs /tʲ/',
        title: 'Hard vs Palatalized Final Consonant',
        articulation: 'Raise the middle of the tongue toward the hard palate simultaneously with the consonant release when followed by ь.',
        exampleWord: 'брат vs брать',
        exampleGloss: 'brother vs to take',
        minimalPair: { a: 'брат (brother)', b: 'брать (to take)', contrast: 'Hard /t/ vs soft /tʲ/' },
      },
    ],
  },
  arz: {
    overview: 'Egyptian Arabic (Masri) preserves Semitic pharyngeal and emphatic consonants while shifting classical ج (/dʒ/) to hard /g/ and ق (/q/) to a glottal stop /ʔ/ in Cairene speech.',
    writingSystemNotes: 'Arabic is written right-to-left (RTL) in a cursive script where letters connect in initial, medial, final, and isolated forms.',
    stressAndRhythm: 'Doubled consonants (shadda) and long vowels (ا, و, ي) change word meaning and attract primary word stress.',
    drills: [
      {
        symbol: 'ح / ع',
        ipa: '/ħ/ · /ʕ/',
        title: 'Pharyngeal Fricatives',
        articulation: 'Constrict the lower pharynx lightly: ح is voiceless breathy friction; ع is its voiced resonant counterpart.',
        exampleWord: 'صباح الخير / عربي',
        exampleGloss: 'Good morning / Arabic',
      },
      {
        symbol: 'ق (Cairene Shift)',
        ipa: '/ʔ/ (MSA /q/)',
        title: 'Colloquial Glottal Stop vs MSA Uvular',
        articulation: 'In everyday Cairo speech, ق is pronounced as a clean glottal stop /ʔ/ (albi "my heart"), while formal/loan words retain /q/ (al-Qāhira).',
        exampleWord: 'قهوة (ʾahwa)',
        exampleGloss: 'coffee',
      },
    ],
  },
  uz: {
    overview: 'Standard Uzbek blends clear Turkic consonant articulation with Persian-influenced vowel timbre, notably the rounded back /ɒ/ written as o.',
    writingSystemNotes: 'Modern Uzbek uses a 29-letter Latin alphabet with special digraphs oʻ, gʻ, sh, ch, ng; Cyrillic literacy remains widespread in publications.',
    stressAndRhythm: 'Primary word stress usually falls on the final syllable of the stem and moves onto added agglutinative suffixes.',
    drills: [
      {
        symbol: 'o vs oʻ',
        ipa: '/ɒ/ vs /o/',
        title: 'Open Back O vs Mid Rounded Oʻ',
        articulation: 'Letter o is pronounced open and back (/ɒ/ as in "ota" father); oʻ is higher and closer (/o/ as in "oʻzbek").',
        exampleWord: 'ota / oʻzbek',
        exampleGloss: 'father / Uzbek',
      },
      {
        symbol: 'q / gʻ / x',
        ipa: '/q/ · /ʁ/ · /χ/',
        title: 'Uvular Series',
        articulation: 'Articulate q, gʻ, and x further back at the uvula than velar k, g, h.',
        exampleWord: 'qishloq / togʻ / xat',
        exampleGloss: 'village / mountain / letter',
      },
    ],
  },
};

export function getPhoneticsAcademy(langCode: string, langName: string, focusList: string[]): LanguagePhoneticsAcademy {
  if (PHONETICS_ACADEMY_BY_LANG[langCode]) {
    return PHONETICS_ACADEMY_BY_LANG[langCode];
  }
  return {
    overview: `${langName} pronunciation training focuses on authentic articulation, rhythmic cadence, and phonemic contrasts essential for natural comprehension.`,
    writingSystemNotes: `Core orthographic rules and sound-to-symbol correspondence for ${langName}.`,
    stressAndRhythm: `Consistent word stress, vowel clarity, and natural sentence intonation patterns in ${langName}.`,
    drills: focusList.map((focus, idx) => ({
      symbol: `0${idx + 1}`,
      ipa: 'IPA',
      title: focus,
      articulation: `Focus carefully on tongue posture, airflow, and rhythm when practicing ${focus.toLowerCase()} in ${langName}.`,
      exampleWord: `${langName} Practice Item ${idx + 1}`,
      exampleGloss: `Listen and shadow native pacing`,
    })),
  };
}
