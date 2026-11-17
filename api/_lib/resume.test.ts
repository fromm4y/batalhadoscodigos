import { describe, expect, it } from 'vitest';
import { resumeFields } from './resume.js';

describe('continuar a aula anterior (17/11)', () => {
  it('a dupla volta para o cadeado e a etapa onde parou, com lado, dicas e cartas', () => {
    const r = resumeFields({
      side: 'blue',
      mode: 'pessoas',
      matchId: 'pvp_x_y',
      progress: {
        lockIndex: 3,
        step: 0,
        vaultStep: 1,
        locksOpenedAt: [1, 2, 3],
        vaultSolvedAt: null,
        eventResult: 'ok',
        jailUntil: 99,
        heardTransmission: true,
      },
      hints: { 'blue-lock1': 1 },
      misses: { 'blue-lock2': 2 },
      abilities: { owned: ['escudo'], used: [] },
      solvedCount: 3,
      episodePoints: 7,
      equippedCard: 'ep1',
      cardUses: 1,
      helpUsed: true,
    });
    expect(r).toMatchObject({
      side: 'blue',
      mode: 'pessoas',
      progress: {
        lockIndex: 3,
        vaultStep: 1,
        eventResult: 'ok',
        jailUntil: null,
        heardTransmission: false,
      },
      hints: { 'blue-lock1': 1 },
      misses: { 'blue-lock2': 2 },
      solvedCount: 3,
      episodePoints: 7,
      equippedCard: 'ep1',
      cardUses: 1,
      resumed: true,
    });
    // confronto e pedido de ajuda recomeçam
    expect(r).not.toHaveProperty('matchId');
    expect(r).not.toHaveProperty('helpUsed');
  });
  it('dupla sem dados antigos começa do começo', () => {
    expect(resumeFields({})).toMatchObject({ side: null, progress: { lockIndex: 0, step: 0 } });
  });
});
