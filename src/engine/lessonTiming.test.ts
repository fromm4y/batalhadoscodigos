import { describe, expect, it } from 'vitest';
import { GAME_RULES } from '@/config/gameRules';
import { loadEpisode } from '@/content/episodes';
import { SEASON } from '@/content/season';
import { eventDurationMs } from './museumEvent';
import { lessonGuideMinutes, machineWorstCaseSeconds } from './lessonTiming';

describe('a aula cabe em 50 min (Etapa 8)', () => {
  it('tempos guia + entrada das duplas ≤ 50 min', () => {
    expect(lessonGuideMinutes()).toBeLessThanOrEqual(GAME_RULES.lesson.totalMinutes);
  });

  it('o robô termina dentro dos tempos guia em todos os níveis e episódios', async () => {
    for (const ep of SEASON) {
      const episode = await loadEpisode(ep.id);
      if (!episode) continue;
      const eventS = eventDurationMs(episode.event) / 1000;
      for (const level of ['A', 'B', 'C'] as const) {
        const w = machineWorstCaseSeconds(level, eventS);
        expect(w.locks, `${ep.id} nível ${level}: cadeados`).toBeLessThanOrEqual(
          GAME_RULES.phaseGuideMinutes.locks * 60,
        );
        expect(w.vault, `${ep.id} nível ${level}: Cofre`).toBeLessThanOrEqual(
          GAME_RULES.phaseGuideMinutes.vault * 60,
        );
      }
    }
  });
});
