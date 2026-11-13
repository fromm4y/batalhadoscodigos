import type { LedgerReason } from '@/types/domain';

/** Como cada motivo de ponto aparece no extrato (aluno e Narradora). */
export const LEDGER_LABEL: Record<LedgerReason, string> = {
  lock_open: 'Cadeado aberto',
  lock_first: 'Primeira dupla no cadeado',
  event_ok: 'Alarme desvendado',
  vault_win: 'Vitória',
  draw: 'Empate',
  side_bonus: 'Bônus de lado vazio',
  wrong_answer: 'Resposta errada',
  hint_1: 'Dica 1',
  hint_2: 'Dica 2',
  manual: 'Ajuste da Narradora',
};
