import { useState } from 'react';
import { ComicButton, ComicPanel } from '@/components/comic';
import { postAsInstructor } from '@/lib/api';

/**
 * Banco reserva (pedido da May, 23/11): a admin traz para ESTE site tudo o que está no banco de
 * origem (turmas, duplas, PINs, pontos, cartas, selos e sessões). A origem é a chave
 * `FIREBASE_SOURCE_SERVICE_ACCOUNT_JSON` cadastrada na Vercel deste site.
 */
export function ImportPanel() {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const r = await postAsInstructor<{ from: string; docs: number; unmapped: string[] }>(
      '/api/admin-import',
      { confirm: typed.trim().toUpperCase() },
    );
    setBusy(false);
    setTyped('');
    setMsg(
      r.ok
        ? {
            ok: true,
            text:
              `Pronto! ${r.docs} registro(s) copiado(s) de "${r.from}".` +
              (r.unmapped.length
                ? ` Ainda não entraram neste site: ${r.unmapped.join(', ')}. As turmas delas aparecem depois que elas entrarem uma vez e você importar de novo.`
                : ''),
          }
        : { ok: false, text: r.error },
    );
  }

  return (
    <ComicPanel caption="📦 Importar de outro banco (reserva)" tone="graphite" className="pt-8">
      <ul className="mb-3 list-disc space-y-1 pl-5 font-type text-mist">
        <li>
          Copia{' '}
          <strong className="text-paper">
            turmas, duplas, PINs, pontos, cartas, selos e sessões
          </strong>{' '}
          do banco de origem para este site. O que já existe aqui com o mesmo registro é substituído
          pela versão da origem.
        </li>
        <li>
          Antes: cada Narradora entra <strong className="text-paper">uma vez</strong> neste site
          (para as turmas virem com a dona certa).
        </li>
        <li>Use fora do horário de aula: a cópia leva até 1 minuto.</li>
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-type text-paper">
          Digite <strong>COPIAR</strong>:{' '}
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={busy}
            className="ml-1 min-h-11 w-32 border-[3px] border-ink bg-paper px-2 font-heist text-xl tracking-wider text-ink"
          />
        </label>
        <ComicButton
          variant="red"
          icon="📦"
          disabled={busy || typed.trim().toUpperCase() !== 'COPIAR'}
          onClick={() => void run()}
        >
          {busy ? 'Copiando...' : 'Importar agora'}
        </ComicButton>
      </div>
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
