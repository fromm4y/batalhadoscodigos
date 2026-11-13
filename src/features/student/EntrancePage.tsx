import { signOut } from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ComicButton, GameLogo, HalftoneBackground, SpeechBubble, cn } from '@/components/comic';
import { Dust, Lasers, MuseumFacade, Spotlights } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import { getFirebase } from '@/lib/firebase';
import { joinSession } from './api';
import { useStudentStore } from './studentStore';
import { useTeamAuth } from './useTeamAuth';

const LEN = GAME_RULES.session.codeLength;
const ALPHABET = GAME_RULES.session.codeAlphabet;

/** `/` — entrada com o código da sessão (SPEC 9.2, item 1). */
export function EntrancePage() {
  const navigate = useNavigate();
  const setJoin = useStudentStore((s) => s.setJoin);
  const team = useTeamAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function onType(raw: string) {
    setError(null);
    const clean = raw
      .toUpperCase()
      .split('')
      .filter((c) => ALPHABET.includes(c))
      .join('')
      .slice(0, LEN);
    setCode(clean);
  }

  async function enter() {
    if (code.length !== LEN || busy) return;
    setBusy(true);
    const r = await joinSession(code);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      setShake((n) => n + 1);
      return;
    }
    const { ok: _ok, ...data } = r;
    setJoin(data);
    navigate('/dupla');
  }

  return (
    <HalftoneBackground>
      <MuseumFacade className="absolute inset-x-0 bottom-0 h-[50vh] w-full opacity-60" />
      <Spotlights />
      <Lasers lasers={[{ top: '82%', angle: 2 }]} />
      <Dust />
      <main className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-8 p-8">
        <GameLogo />

        {team.status === 'team' ? (
          <div className="flex flex-col items-center gap-4">
            <SpeechBubble who="narradora" tail="center">
              Vocês já estão numa missão! Querem voltar para o jogo?
            </SpeechBubble>
            <div className="flex gap-4">
              <ComicButton variant="red" size="lg" icon="▶" onClick={() => navigate('/jogo')}>
                Voltar para o jogo
              </ComicButton>
              <ComicButton
                variant="graphite"
                onClick={() => void signOut(getFirebase('student').auth)}
              >
                Trocar de dupla
              </ComicButton>
            </div>
          </div>
        ) : (
          <form
            className="flex flex-col items-center gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              void enter();
            }}
          >
            <label htmlFor="codigo" className="font-type text-2xl text-paper text-glow-spot">
              Digite o código que está no projetor:
            </label>
            <motion.div
              key={shake}
              animate={shake ? { x: [0, -16, 14, -9, 6, 0] } : {}}
              transition={{ duration: 0.45 }}
              className="relative flex gap-3"
              onClick={() => inputRef.current?.focus()}
            >
              {Array.from({ length: LEN }, (_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={cn(
                    'grid h-24 w-20 place-items-center rounded-hand border-4 border-ink font-heist text-6xl shadow-comic transition-colors',
                    code[i] ? 'bg-aged text-ink' : 'bg-graphite-light text-mist',
                    i === code.length && 'outline-4 outline-brass',
                  )}
                >
                  {code[i] ?? ''}
                </span>
              ))}
              <input
                ref={inputRef}
                id="codigo"
                value={code}
                onChange={(e) => onType(e.target.value)}
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={LEN + 2}
                aria-describedby={error ? 'codigo-erro' : undefined}
                className="absolute inset-0 cursor-text opacity-0"
              />
            </motion.div>
            <ComicButton
              type="submit"
              variant="brass"
              size="xl"
              icon="⚡"
              disabled={code.length !== LEN || busy}
            >
              {busy ? 'Abrindo...' : 'ENTRAR!'}
            </ComicButton>
            <AnimatePresence>
              {error && (
                <motion.div
                  id="codigo-erro"
                  role="alert"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SpeechBubble who="narradora" tail="center" className="max-w-lg">
                    {error}
                  </SpeechBubble>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        )}

        <Link
          to="/instrutor"
          className="absolute right-6 bottom-4 font-type text-sm text-mist underline underline-offset-4"
        >
          Sou Narradora
        </Link>
      </main>
    </HalftoneBackground>
  );
}
