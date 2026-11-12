import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Avatar } from '@/components/avatar/Avatar';
import { ComicButton, HalftoneBackground, SpeechBubble } from '@/components/comic';
import { Spotlights } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import { joinSession, loginTeam, type PublicTeam } from './api';
import { NoSignalScreen } from './NoSignalScreen';
import { PinPad } from './PinPad';
import { useStudentStore } from './studentStore';

/** `/dupla` — escolher a dupla e digitar o PIN, ou criar uma nova (SPEC 9.2, item 2). */
export function TeamSelectPage() {
  const navigate = useNavigate();
  const join = useStudentStore((s) => s.join);
  const setJoin = useStudentStore((s) => s.setJoin);
  const enter = useStudentStore((s) => s.enter);
  const [selected, setSelected] = useState<PublicTeam | null>(null);
  const [noSignal, setNoSignal] = useState(false);

  // Atualiza a lista (outra dupla pode ter acabado de se cadastrar).
  useEffect(() => {
    if (!join) return;
    void joinSession(join.code).then((r) => {
      if (r.ok) {
        const { ok: _ok, ...data } = r;
        setJoin(data);
      } else if (r.code === 'not_found') setNoSignal(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!join || noSignal) return <NoSignalScreen />;

  return (
    <HalftoneBackground>
      <Spotlights intensity={0.08} />
      <main className="relative mx-auto max-w-6xl p-8">
        <header className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="font-type text-mist">Sessão {join.code}</p>
            <h1 className="font-heist text-6xl tracking-[0.1em] text-paper text-glow-spot">
              QUEM SÃO VOCÊS?
            </h1>
          </div>
          <ComicButton
            variant="red"
            size="lg"
            icon="✨"
            disabled={join.classFull}
            title={join.classFull ? 'A turma já tem o máximo de duplas' : undefined}
            onClick={() => navigate('/dupla/nova')}
          >
            Somos novos!
          </ComicButton>
        </header>

        {join.teams.length === 0 ? (
          <div className="flex justify-center py-16">
            <SpeechBubble who="narradora" tail="center">
              Ainda não tem nenhuma dupla nesta turma. Cliquem em <strong>Somos novos!</strong> para
              criar a primeira!
            </SpeechBubble>
          </div>
        ) : (
          <ul className="grid grid-cols-5 gap-5">
            {join.teams.map((t, i) => (
              <motion.li
                key={t.teamId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  type="button"
                  onClick={() => setSelected(t)}
                  className="group flex w-full cursor-pointer flex-col items-center gap-1 rounded-hand border-4 border-ink bg-graphite-dots p-3 shadow-comic transition-transform hover:-translate-y-1 hover:glow-brass"
                >
                  <Avatar
                    avatar={t.avatar}
                    className="h-32 w-28"
                    title={`Avatar de ${t.cityName}`}
                  />
                  <span className="font-heist text-2xl leading-none tracking-wider text-bando text-glow-red">
                    {t.cityName}
                  </span>
                  <span className="font-heist text-lg leading-none tracking-wide text-piratas text-glow-blue">
                    {t.pirateName}
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
        {join.classFull && (
          <p className="mt-6 text-center font-type text-mist">
            A turma já tem {GAME_RULES.maxTeamsPerClass} duplas. Se vocês são novos, chamem a
            Narradora.
          </p>
        )}
      </main>

      <AnimatePresence>
        {selected && (
          <PinDialog
            team={selected}
            code={join.code}
            onClose={() => setSelected(null)}
            onSuccess={async (token) => {
              await enter(token);
              navigate('/jogo');
            }}
          />
        )}
      </AnimatePresence>
    </HalftoneBackground>
  );
}

function PinDialog({
  team,
  code,
  onClose,
  onSuccess,
}: {
  team: PublicTeam;
  code: string;
  onClose: () => void;
  onSuccess: (token: string) => Promise<void>;
}) {
  const creating = team.needsNewPin;
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState<string | null>(null); // novo PIN: primeira digitação
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [lockedFor, setLockedFor] = useState(0);

  useEffect(() => {
    if (lockedFor <= 0) return;
    const t = setTimeout(() => setLockedFor((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [lockedFor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit() {
    if (pin.length !== GAME_RULES.team.pinLength || busy || lockedFor > 0) return;
    if (creating && first === null) {
      setFirst(pin);
      setPin('');
      setMsg(null);
      return;
    }
    if (creating && first !== pin) {
      setMsg('Os PINs não bateram. Vamos de novo!');
      setFirst(null);
      setPin('');
      setShake((n) => n + 1);
      return;
    }
    setBusy(true);
    const r = await loginTeam({ code, teamId: team.teamId, pin });
    if (r.ok) {
      await onSuccess(r.customToken);
      return;
    }
    setBusy(false);
    setPin('');
    setMsg(r.error);
    setShake((n) => n + 1);
    if (r.code === 'locked' && r.secondsLeft) setLockedFor(r.secondsLeft);
  }

  const title = creating
    ? first === null
      ? 'Criem um PIN novo'
      : 'Repitam o PIN novo'
    : 'Digitem o PIN';

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} da dupla ${team.cityName}`}
        initial={{ scale: 0.8, rotate: -3 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="grid grid-cols-[auto_1fr] items-center gap-8 rounded-hand border-4 border-ink bg-graphite-dots p-8 shadow-comic glow-brass"
      >
        <div className="flex flex-col items-center gap-2">
          <Avatar avatar={team.avatar} className="h-48 w-40" title={`Avatar de ${team.cityName}`} />
          <p className="font-heist text-3xl tracking-wider text-bando text-glow-red">
            {team.cityName}
          </p>
          <p className="font-heist text-xl tracking-wide text-piratas text-glow-blue">
            {team.pirateName}
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <h2 className="font-heist text-4xl tracking-wider text-paper">{title}</h2>
          {creating && first === null && (
            <p className="max-w-xs text-center font-type text-sm text-mist">
              A Narradora apagou o PIN antigo. Combinem 4 números novos e não contem para ninguém!
            </p>
          )}
          <PinPad
            value={pin}
            onChange={(v) => {
              setPin(v);
              setMsg(null);
            }}
            onSubmit={() => void submit()}
            disabled={busy || lockedFor > 0}
            shakeKey={shake}
            label={title}
          />
          {lockedFor > 0 ? (
            <p role="alert" className="font-heist text-2xl tracking-wider text-bando text-glow-red">
              🔒 Bloqueado por {lockedFor} s
            </p>
          ) : (
            msg && (
              <p role="alert" className="max-w-xs text-center font-bold text-alert">
                {msg}
              </p>
            )
          )}
          <div className="flex gap-3">
            <ComicButton variant="graphite" onClick={onClose}>
              Voltar
            </ComicButton>
            <ComicButton
              variant="red"
              icon="▶"
              disabled={pin.length !== GAME_RULES.team.pinLength || busy || lockedFor > 0}
              onClick={() => void submit()}
            >
              {busy ? 'Entrando...' : creating && first === null ? 'Próximo' : 'Entrar'}
            </ComicButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
