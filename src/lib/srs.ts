export type RecallGrade = 'again' | 'hard' | 'good' | 'easy';
export type SrsStatus = 'New' | 'Learning' | 'Reviewing' | 'Familiar' | 'Mastered';

export interface SrsState {
  srsStatus: SrsStatus;
  easeFactor: number; // stored x100, e.g. 250 = 2.50
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface SrsScheduleResult extends SrsState {
  nextReviewAt: Date;
}

/**
 * SM-2 inspired spaced repetition scheduler with lapse tracking and mastery tiers.
 */
export function calculateNextReview(
  current: SrsState,
  grade: RecallGrade,
  now: Date = new Date()
): SrsScheduleResult {
  let ease = current.easeFactor || 250;
  let reps = current.repetitions || 0;
  let interval = current.intervalDays || 0;
  let lapses = current.lapses || 0;

  if (grade === 'again') {
    reps = 0;
    interval = 1;
    lapses += 1;
    ease = Math.max(130, ease - 20);
  } else {
    const quality = grade === 'hard' ? 3 : grade === 'good' ? 4 : 5;
    if (reps === 0) {
      interval = grade === 'easy' ? 4 : 1;
    } else if (reps === 1) {
      interval = grade === 'hard' ? 3 : grade === 'good' ? 6 : 9;
    } else {
      const factor = ease / 100;
      const mult = grade === 'hard' ? 0.85 : grade === 'easy' ? 1.3 : 1.0;
      interval = Math.max(1, Math.round(interval * factor * mult));
    }
    reps += 1;
    const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    ease = Math.max(130, Math.round(ease + delta * 100));
  }

  let srsStatus: SrsStatus = 'Learning';
  if (reps === 0) {
    srsStatus = 'Learning';
  } else if (reps >= 5 && interval >= 21) {
    srsStatus = 'Mastered';
  } else if (reps >= 3 && interval >= 7) {
    srsStatus = 'Familiar';
  } else if (reps >= 1) {
    srsStatus = 'Reviewing';
  }

  const nextReviewAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    srsStatus,
    easeFactor: ease,
    intervalDays: interval,
    repetitions: reps,
    lapses,
    nextReviewAt,
  };
}

export interface PlacementSkillEvidence {
  vocabularyScore: number; // 0-100
  grammarScore: number; // 0-100
  readingScore: number; // 0-100
  listeningScore: number; // 0-100
  writingLength: number; // chars
  writingRelevanceScore: number; // 0-100
  speakingAnswered: boolean;
}

export interface PlacementResult {
  estimatedLevel: 'Pre-A1' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  compositeScore: number;
  skillBreakdown: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  explanation: string;
  recommendedFirstLesson: string;
}

export function estimatePlacementProficiency(
  evidence: PlacementSkillEvidence
): PlacementResult {
  const writingScore =
    evidence.writingLength >= 40
      ? Math.min(100, Math.round(evidence.writingRelevanceScore * 0.8 + 20))
      : evidence.writingLength > 0
      ? Math.round(evidence.writingRelevanceScore * 0.5)
      : 0;
  const speakingScore = evidence.speakingAnswered ? 65 : 20;

  const skillBreakdown = {
    Vocabulary: Math.round(evidence.vocabularyScore),
    Grammar: Math.round(evidence.grammarScore),
    Reading: Math.round(evidence.readingScore),
    Listening: Math.round(evidence.listeningScore),
    Writing: Math.round(writingScore),
    Speaking: Math.round(speakingScore),
  };

  const compositeScore = Math.round(
    skillBreakdown.Vocabulary * 0.22 +
      skillBreakdown.Grammar * 0.22 +
      skillBreakdown.Reading * 0.2 +
      skillBreakdown.Listening * 0.16 +
      skillBreakdown.Writing * 0.12 +
      skillBreakdown.Speaking * 0.08
  );

  let estimatedLevel: PlacementResult['estimatedLevel'] = 'Pre-A1';
  if (compositeScore >= 92) estimatedLevel = 'C2';
  else if (compositeScore >= 82) estimatedLevel = 'C1';
  else if (compositeScore >= 70) estimatedLevel = 'B2';
  else if (compositeScore >= 56) estimatedLevel = 'B1';
  else if (compositeScore >= 40) estimatedLevel = 'A2';
  else if (compositeScore >= 22) estimatedLevel = 'A1';

  const sorted = Object.entries(skillBreakdown).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 2).map(([k, v]) => `${k} (${v}%)`);
  const weaknesses = sorted.slice(-2).map(([k, v]) => `${k} (${v}%)`);

  const explanation = `Evaluated across six skills (composite ${compositeScore}%). Multi-skill evidence places you at ${estimatedLevel}.`;
  const recommendedFirstLesson =
    estimatedLevel === 'Pre-A1'
      ? 'Phonetics & Script Academy + Core Greetings'
      : `${estimatedLevel} Core Curriculum & Targeted ${sorted[sorted.length - 1][0]} Lab`;

  return {
    estimatedLevel,
    compositeScore,
    skillBreakdown,
    strengths,
    weaknesses,
    explanation,
    recommendedFirstLesson,
  };
}

export interface ProgressionCheckInput {
  mandatoryTopicsTotal: number;
  mandatoryTopicsMastered: number;
  finalExamPassed: boolean;
  finalExamScore: number;
  grammarMastery: number;
  readingMastery: number;
  requiredThreshold?: number;
}

export interface ProgressionCheckOutput {
  eligibleForNextLevel: boolean;
  unmetRequirements: string[];
}

export function evaluateLevelProgression(
  input: ProgressionCheckInput
): ProgressionCheckOutput {
  const threshold = input.requiredThreshold ?? 70;
  const unmetRequirements: string[] = [];

  if (input.mandatoryTopicsTotal > 0 && input.mandatoryTopicsMastered < input.mandatoryTopicsTotal) {
    unmetRequirements.push(
      `Complete all mandatory topics (${input.mandatoryTopicsMastered}/${input.mandatoryTopicsTotal} mastered)`
    );
  }
  if (!input.finalExamPassed || input.finalExamScore < threshold) {
    unmetRequirements.push(
      `Pass the cumulative Level Final Examination (${threshold}% required, current: ${input.finalExamScore}%)`
    );
  }
  if (input.grammarMastery < threshold) {
    unmetRequirements.push(
      `Reach ${threshold}% Grammar mastery threshold (current: ${input.grammarMastery}%)`
    );
  }
  if (input.readingMastery < threshold) {
    unmetRequirements.push(
      `Reach ${threshold}% Reading comprehension threshold (current: ${input.readingMastery}%)`
    );
  }

  return {
    eligibleForNextLevel: unmetRequirements.length === 0,
    unmetRequirements,
  };
}
