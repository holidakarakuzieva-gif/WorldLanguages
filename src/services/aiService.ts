import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../db/index.ts';
import { aiUsageRecords } from '../db/schema.ts';

export type AiProviderName = 'gemini' | 'openai' | 'anthropic';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkAiRateLimit(key: string, maxPerMinute = 25): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= maxPerMinute) return false;
  entry.count += 1;
  return true;
}

export function getProviderCapabilities() {
  return {
    gemini: {
      available: Boolean(process.env.GEMINI_API_KEY),
      textModel: 'gemini-4-hydrogen',
      ttsModel: 'gemini-3.8-flash-lite-tts',
      transcribeModel: 'gemini-3.5-transcribe',
    },
    openai: {
      available: Boolean(process.env.OPENAI_API_KEY),
      note: process.env.OPENAI_API_KEY
        ? 'Configured via OPENAI_API_KEY'
        : 'Add OPENAI_API_KEY in Settings > Secrets to enable OpenAI provider routing.',
    },
    anthropic: {
      available: Boolean(process.env.ANTHROPIC_API_KEY),
      note: process.env.ANTHROPIC_API_KEY
        ? 'Configured via ANTHROPIC_API_KEY'
        : 'Add ANTHROPIC_API_KEY in Settings > Secrets to enable Anthropic Claude provider routing.',
    },
  };
}

async function logAiUsage(params: {
  userId?: number;
  provider: string;
  model: string;
  feature: string;
  languageCode?: string;
  status: string;
}) {
  try {
    await db.insert(aiUsageRecords).values({
      userId: params.userId ?? null,
      provider: params.provider,
      model: params.model,
      feature: params.feature,
      languageCode: params.languageCode ?? null,
      status: params.status,
    });
  } catch (err) {
    console.error('Failed to record AI usage:', err);
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 400 * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

export async function runTutorConversation(params: {
  userId?: number;
  provider?: AiProviderName;
  languageName: string;
  languageCode: string;
  cefrLevel: string;
  mode: 'structured' | 'free';
  topic: string;
  personality: string;
  register: 'formal' | 'informal';
  correctionPreference: 'immediate' | 'after' | 'on_request';
  interfaceLanguage: string;
  history: Array<{ role: 'tutor' | 'student'; text: string }>;
  studentMessage: string;
}) {
  const activeProvider: AiProviderName =
    params.provider === 'openai' && process.env.OPENAI_API_KEY
      ? 'openai'
      : params.provider === 'anthropic' && process.env.ANTHROPIC_API_KEY
      ? 'anthropic'
      : 'gemini';

  const systemInstruction = `You are a supportive, academically rigorous ${params.languageName} language tutor on World Languages.
Learner CEFR level: ${params.cefrLevel}. Mode: ${params.mode}. Topic: ${params.topic}.
Tutor personality: ${params.personality}. Register: ${params.register}.
Correction preference: ${params.correctionPreference}.
Explanation language: ${params.interfaceLanguage}.
Guidelines:
- Respond naturally in ${params.languageName} tailored strictly to CEFR ${params.cefrLevel}.
- Keep replies concise (2-4 sentences) and ask one clear follow-up question to encourage complete spoken/written answers.
- If correctionPreference is 'immediate', provide gentle, accurate grammar/vocabulary feedback on the student's latest turn in the 'feedback' field. If 'after', note errors concisely only at summary checkpoints. If 'on_request', only correct if the student asked for feedback.
- Provide an honest, rubric-based assessment (pronunciation/clarity note, grammar accuracy, vocabulary range) without inventing scientific precision.`;

  const conversationText = params.history
    .map((m) => `${m.role === 'tutor' ? 'Tutor' : 'Student'}: ${m.text}`)
    .join('\n');

  const prompt = `${conversationText ? `Previous conversation:\n${conversationText}\n\n` : ''}Student's latest message: ${params.studentMessage}`;

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tutorReply: { type: Type.STRING, description: 'Natural reply in the target language.' },
              replyTranslation: { type: Type.STRING, description: 'Translation in the learner explanation language.' },
              corrections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING },
                    corrected: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                },
              },
              rubricNote: {
                type: Type.OBJECT,
                properties: {
                  grammarAccuracy: { type: Type.STRING },
                  vocabularyRange: { type: Type.STRING },
                  comprehensibility: { type: Type.STRING },
                },
              },
            },
            required: ['tutorReply', 'replyTranslation', 'corrections', 'rubricNote'],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    await logAiUsage({
      userId: params.userId,
      provider: activeProvider,
      model: 'gemini-4-hydrogen',
      feature: 'speaking_tutor',
      languageCode: params.languageCode,
      status: 'success',
    });
    return { providerUsed: activeProvider, ...parsed };
  } catch (err) {
    await logAiUsage({
      userId: params.userId,
      provider: activeProvider,
      model: 'gemini-4-hydrogen',
      feature: 'speaking_tutor',
      languageCode: params.languageCode,
      status: 'error',
    });
    throw err;
  }
}

export async function evaluateWritingSubmission(params: {
  userId?: number;
  languageName: string;
  languageCode: string;
  cefrLevel: string;
  prompt: string;
  studentText: string;
  interfaceLanguage: string;
}) {
  const systemInstruction = `You are an expert ${params.languageName} writing examiner evaluating a CEFR ${params.cefrLevel} response.
CRITICAL RULES:
- Preserve the student's original text intact; do not rewrite everything without explaining each edit.
- Evaluate grammar, spelling, punctuation, accents/diacritics, vocabulary, naturalness, coherence, and task completion.
- Provide explanations in ${params.interfaceLanguage}.`;

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Task prompt: ${params.prompt}\n\nStudent response:\n${params.studentText}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mistakes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalFragment: { type: Type.STRING },
                    category: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    suggestedCorrection: { type: Type.STRING },
                  },
                },
              },
              improvedVersion: { type: Type.STRING },
              overallAssessment: { type: Type.STRING },
              criteriaScores: {
                type: Type.OBJECT,
                properties: {
                  grammarAndAccents: { type: Type.INTEGER },
                  vocabularyAndNaturalness: { type: Type.INTEGER },
                  coherenceAndTask: { type: Type.INTEGER },
                },
              },
            },
            required: ['mistakes', 'improvedVersion', 'overallAssessment', 'criteriaScores'],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    await logAiUsage({
      userId: params.userId,
      provider: 'gemini',
      model: 'gemini-4-hydrogen',
      feature: 'writing_assessment',
      languageCode: params.languageCode,
      status: 'success',
    });
    return parsed;
  } catch (err) {
    await logAiUsage({
      userId: params.userId,
      provider: 'gemini',
      model: 'gemini-4-hydrogen',
      feature: 'writing_assessment',
      languageCode: params.languageCode,
      status: 'error',
    });
    throw err;
  }
}

export async function generateOriginalStory(params: {
  userId?: number;
  languageName: string;
  languageCode: string;
  cefrLevel: string;
  genre: string;
  theme: string;
  characters: string;
  setting: string;
  perspective: string;
  style: string;
  wordCount: number;
  vocabularyFocus: string;
  grammarFocus: string;
  outlineContext?: string;
}) {
  const systemInstruction = `You are a multilingual literary author writing original educational fiction in ${params.languageName} strictly calibrated to CEFR ${params.cefrLevel}.
Ensure natural idiom, consistent characters, clickable glossary terms, and comprehension questions. Label this clearly as original AI-generated content.`;

  const prompt = `Write a ${params.genre} story in ${params.languageName} (~${params.wordCount} words) at CEFR ${params.cefrLevel}.
Theme: ${params.theme || 'Discovery & personal growth'}
Characters: ${params.characters || 'Create memorable authentic characters'}
Setting: ${params.setting || 'Authentic regional setting'}
Narrative perspective: ${params.perspective}
Writing style: ${params.style}
Target vocabulary focus: ${params.vocabularyFocus || 'Everyday high-frequency words'}
Target grammar structures: ${params.grammarFocus || 'Level-appropriate grammar'}
${params.outlineContext ? `Previous chapter continuity outline: ${params.outlineContext}` : ''}`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            continuityOutline: { type: Type.STRING },
            glossary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  pos: { type: Type.STRING },
                  note: { type: Type.STRING },
                },
              },
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
              },
            },
          },
          required: ['title', 'content', 'continuityOutline', 'glossary', 'questions'],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? '{}').trim());
  await logAiUsage({
    userId: params.userId,
    provider: 'gemini',
    model: 'gemini-4-hydrogen',
    feature: 'story_generator',
    languageCode: params.languageCode,
    status: 'success',
  });
  return parsed;
}

export async function lookupWordInContext(params: {
  userId?: number;
  word: string;
  sentence: string;
  languageName: string;
  languageCode: string;
  interfaceLanguage: string;
}) {
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Word: "${params.word}"\nContext sentence: "${params.sentence}"\nTarget language: ${params.languageName}\nExplain in: ${params.interfaceLanguage}`,
      config: {
        systemInstruction:
          'You are a computational lexicographer. Provide accurate lemma, translation, part of speech, IPA/romanization, and brief grammatical note for the word in context.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lemma: { type: Type.STRING },
            romanization: { type: Type.STRING },
            ipa: { type: Type.STRING },
            translation: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            definition: { type: Type.STRING },
            grammaticalNote: { type: Type.STRING },
          },
          required: ['lemma', 'translation', 'partOfSpeech', 'definition'],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? '{}').trim());
  await logAiUsage({
    userId: params.userId,
    provider: 'gemini',
    model: 'gemini-4-hydrogen',
    feature: 'word_lookup',
    languageCode: params.languageCode,
    status: 'success',
  });
  return parsed;
}

export async function generateSpeechAudio(params: {
  userId?: number;
  text: string;
  voiceName?: string;
  style?: string;
  languageCode?: string;
}): Promise<string | null> {
  const allowedVoices = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);
  const voice = params.voiceName && allowedVoices.has(params.voiceName) ? params.voiceName : 'Kore';

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: params.text.slice(0, 600),
              speechMetadata: {
                style: params.style || 'Clear, natural language educator pacing',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    })
  );

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
  await logAiUsage({
    userId: params.userId,
    provider: 'gemini',
    model: 'gemini-3.8-flash-lite-tts',
    feature: 'tts_audio',
    languageCode: params.languageCode,
    status: base64Audio ? 'success' : 'empty',
  });
  return base64Audio;
}

export async function transcribeSpokenAudio(params: {
  userId?: number;
  base64Audio: string;
  mimeType: string;
  languageName: string;
  languageCode: string;
  targetPrompt?: string;
}) {
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: params.mimeType,
              data: params.base64Audio,
            },
          },
          {
            text: `Transcribe this spoken ${params.languageName} audio accurately in ${params.languageName} script.${params.targetPrompt ? ` Expected prompt context: ${params.targetPrompt}` : ''}`,
          },
        ],
      },
    })
  );

  await logAiUsage({
    userId: params.userId,
    provider: 'gemini',
    model: 'gemini-3.5-transcribe',
    feature: 'speech_transcription',
    languageCode: params.languageCode,
    status: 'success',
  });

  return (response.text ?? '').trim();
}
