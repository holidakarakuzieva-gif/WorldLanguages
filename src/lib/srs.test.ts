import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextReview,
  estimatePlacementProficiency,
  evaluateLevelProgression,
} from './srs';

test('SRS schedules first good review at 1 day and transitions to Reviewing', () => {
  const now = new Date('2026-11-15T12:00:00Z');
  const res = calculateNextReview(
    {
      srsStatus: 'New',
      easeFactor: 250,
      intervalDays: 0,
      repetitions: 0,
      lapses: 0,
    },
    'good',
    now
  );

  assert.equal(res.intervalDays, 1);
  assert.equal(res.repetitions, 1);
  assert.equal(res.srsStatus, 'Reviewing');
  assert.equal(res.nextReviewAt.toISOString(), '2026-11-16T12:00:00.000Z');
});

test('SRS resets repetitions and increments lapses on again', () => {
  const res = calculateNextReview(
    {
      srsStatus: 'Familiar',
      easeFactor: 250,
      intervalDays: 14,
      repetitions: 4,
      lapses: 0,
    },
    'again'
  );

  assert.equal(res.repetitions, 0);
  assert.equal(res.lapses, 1);
  assert.equal(res.intervalDays, 1);
  assert.equal(res.srsStatus, 'Learning');
  assert.equal(res.easeFactor, 230);
});

test('SRS promotes card to Mastered after 5+ repetitions and >= 21 day interval', () => {
  const res = calculateNextReview(
    {
      srsStatus: 'Familiar',
      easeFactor: 260,
      intervalDays: 15,
      repetitions: 4,
      lapses: 0,
    },
    'easy'
  );

  assert.equal(res.repetitions, 5);
  assert.ok(res.intervalDays >= 21);
  assert.equal(res.srsStatus, 'Mastered');
});

test('Placement combines multi-skill evidence and avoids single-quiz grading', () => {
  const beginner = estimatePlacementProficiency({
    vocabularyScore: 20,
    grammarScore: 10,
    readingScore: 20,
    listeningScore: 10,
    writingLength: 0,
    writingRelevanceScore: 0,
    speakingAnswered: false,
  });
  assert.equal(beginner.estimatedLevel, 'Pre-A1');

  const intermediate = estimatePlacementProficiency({
    vocabularyScore: 70,
    grammarScore: 62,
    readingScore: 65,
    listeningScore: 55,
    writingLength: 85,
    writingRelevanceScore: 75,
    speakingAnswered: true,
  });
  assert.equal(intermediate.estimatedLevel, 'B1');
  assert.equal(intermediate.strengths.length, 2);
  assert.equal(intermediate.weaknesses.length, 2);
});

test('Level progression prevents advancement until mandatory topics, exam, and mastery pass', () => {
  const blocked = evaluateLevelProgression({
    mandatoryTopicsTotal: 5,
    mandatoryTopicsMastered: 4,
    finalExamPassed: false,
    finalExamScore: 62,
    grammarMastery: 78,
    readingMastery: 65,
  });
  assert.equal(blocked.eligibleForNextLevel, false);
  assert.equal(blocked.unmetRequirements.length, 3);

  const cleared = evaluateLevelProgression({
    mandatoryTopicsTotal: 5,
    mandatoryTopicsMastered: 5,
    finalExamPassed: true,
    finalExamScore: 84,
    grammarMastery: 75,
    readingMastery: 72,
  });
  assert.equal(cleared.eligibleForNextLevel, true);
  assert.equal(cleared.unmetRequirements.length, 0);
});
