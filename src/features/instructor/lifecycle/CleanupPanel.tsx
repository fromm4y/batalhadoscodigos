import { useState } from 'react';
import { ComicButton, ComicPanel } from '@/components/comic';
import { GAME_RULES } from '@/config/gameRules';
import { postAsInstructor } from '@/lib/api';

/**
 * Limpar sessões antigas (SPEC-02 A3, LGPD). A Narradora limpa as próprias turmas; a admin, todas.
 * O ranking não muda: os pontos ficam no extrato de cada dupla.
 */
export function CleanupPanel({ isAdmin }: { isAdmin: boolean }) {
  const days = GAME_RULES.cleanup.olderThanDays;
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const r = await postAsInstructor<{ deleted: number }>('/api/admin-cleanup', {
      scope: 'sessions',
    });
    setBusy(false);
    setConfirm(false);
    setMsg(
      r.ok
        ? {
            ok: true,
            text:
              r.deleted === 0
                ? 'Nenhuma sessão antiga para apagar.'
                : `${r.deleted} sessão(ões) antiga(s) apagada(s). O ranking continua igual.`,
          }
        : { ok: false, text: r.error },
    );
  }

  return (
    <ComicPanel caption="Limpar sessões antigas (LGPD)" tone="graphite" className="pt-8">
      <p className="mb-3 font-type text-mist">
        Apaga as sessões {isAdmin ? 'de todas as turmas' : 'das suas turmas'} que acabaram há mais
        de {days} dias (presença, confrontos, chamados e linha do tempo). Os pontos e o ranking não
        mudam.
      </p>
      {confirm ? (
        <div className="flex flex-wrap gap-2">
          <ComicButton variant="red" icon="🧹" disabled={busy} onClick={() => void run()}>
            {busy ? 'Limpando...' : 'Sim, apagar'}
          </ComicButton>
          <ComicButton variant="graphite" onClick={() => setConfirm(false)}>
            Cancelar
          </ComicButton>
        </div>
      ) : (
        <ComicButton variant="paper" icon="🧹" onClick={() => setConfirm(true)}>
          Limpar sessões com mais de {days} dias
        </ComicButton>
      )}
      {msg && (
        <p
          role={msg.ok ? 'status' : 'alert'}
          className={`mt-3 font-bold ${msg.ok ? 'text-success' : 'text-alert'}`}
        >
          {msg.text}
        </p>
      )}
    </ComicPanel>
  );
}
