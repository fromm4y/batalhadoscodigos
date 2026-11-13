import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Avatar } from '@/components/avatar/Avatar';
import { availableCharacters } from '@/components/avatar/availableCharacters';
import { CharacterPicker } from '@/components/avatar/CharacterPicker';
import { AvatarBuilder } from '@/components/avatar/AvatarBuilder';
import { randomAvatar } from '@/components/avatar/avatarOptions';
import { ComicButton, HalftoneBackground, SpeechBubble, cn } from '@/components/comic';
import { Stamp } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import { NAME_GROUPS } from '@/content/names';
import type { AvatarConfig } from '@/types/domain';
import { createTeam, joinSession } from './api';
import { NoSignalScreen } from './NoSignalScreen';
import { PinPad } from './PinPad';
import { useStudentStore } from './studentStore';

const STEPS = ['Visual', 'Codinome', 'Nome pirata', 'PIN'] as const;
const PIN_LEN = GAME_RULES.team.pinLength;

/** `/dupla/nova` — avatar → cidade → nome pirata → PIN (SPEC 9.2, item 3; RN-49 a RN-52). */
export function NewTeamPage() {
  const navigate = useNavigate();
  const join = useStudentStore((s) => s.join);
  const setJoin = useStudentStore((s) => s.setJoin);
  const enter = useStudentStore((s) => s.enter);

  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState<AvatarConfig>(() => randomAvatar());
  // Personagens-imagem quando a arte existe; senão (ou se a dupla preferir), o criador em SVG.
  const hasCharacters = availableCharacters().length > 0;
  const [custom, setCustom] = useState(!hasCharacters);
  const [city, setCity] = useState<string | null>(null);
  const [pirate, setPirate] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinFirst, setPinFirst] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [noSignal, setNoSignal] = useState(false);

  async function refresh() {
    if (!join) return;
    const r = await joinSession(join.code);
    if (r.ok) {
      const { ok: _ok, ...data } = r;
      setJoin(data);
    } else if (r.code === 'not_found') setNoSignal(true);
  }

  // Atualiza os nomes já usados ao abrir (outra dupla pode ter acabado de escolher).
  useEffect(() => {
    if (!join) return;
    let alive = true;
    void joinSession(join.code).then((r) => {
      if (!alive) return;
      if (r.ok) {
        const { ok: _ok, ...data } = r;
        setJoin(data);
      } else if (r.code === 'not_found') setNoSignal(true);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!join || noSignal) return <NoSignalScreen />;
  const takenCities = new Set(join.takenNames.cities);
  const takenPirates = new Set(join.takenNames.pirates);

  async function finish(confirmed: string) {
    if (!join || !city || !pirate) return;
    setBusy(true);
    setMsg(null);
    const r = await createTeam({
      code: join.code,
      cityName: city,
      pirateName: pirate,
      avatar,
      pin: confirmed,
    });
    if (r.ok) {
      await enter(r.customToken);
      navigate('/jogo');
      return;
    }
    setBusy(false);
    setMsg(r.error);
    setPin('');
    setPinFirst(null);
    if (r.code === 'city_taken') {
      setCity(null);
      setStep(1);
      await refresh();
    } else if (r.code === 'pirate_taken') {
      setPirate(null);
      setStep(2);
      await refresh();
    } else if (r.code === 'not_found') setNoSignal(true);
  }

  function onPinNext() {
    if (pin.length !== PIN_LEN) return;
    if (pinFirst === null) {
      setPinFirst(pin);
      setPin('');
      setMsg(null);
      return;
    }
    if (pinFirst !== pin) {
      setMsg('Os PINs não bateram. Vamos de novo!');
      setPinFirst(null);
      setPin('');
      setShake((n) => n + 1);
      return;
    }
    void finish(pin);
  }

  const canNext =
    (step === 0 && (custom || !!avatar.character)) ||
    (step === 1 && !!city) ||
    (step === 2 && !!pirate);

  return (
    <HalftoneBackground>
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-8">
        <header className="flex items-center justify-between gap-6">
          <h1 className="font-heist text-5xl tracking-[0.1em] text-paper text-glow-spot">
            NOVA DUPLA
          </h1>
          <ol className="flex gap-2" aria-label="Passos do cadastro">
            {STEPS.map((s, i) => (
              <li
                key={s}
                aria-current={i === step ? 'step' : undefined}
                className={cn(
                  'border-[3px] border-ink px-3 pt-1 font-heist text-xl tracking-wider',
                  i === step
                    ? 'bg-brass text-ink glow-brass'
                    : i < step
                      ? 'bg-success text-ink'
                      : 'bg-graphite-light text-mist',
                )}
              >
                {i < step ? '✔' : i + 1}. {s}
              </li>
            ))}
          </ol>
        </header>

        {msg && (
          <p role="alert" className="border-l-4 border-alert bg-alert/15 p-3 font-bold text-paper">
            {msg}
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            {step === 0 && (
              <>
                {custom ? (
                  <>
                    <p className="mb-4 font-type text-xl text-paper">
                      Montem o visual da equipe (pode ser 1 ou 2 pessoas no computador). Testem os
                      dois figurinos!
                    </p>
                    <AvatarBuilder value={avatar} onChange={setAvatar} />
                  </>
                ) : (
                  <>
                    <p className="mb-4 font-type text-xl text-paper">
                      Quem vocês querem ser? O mesmo personagem troca de roupa quando jogarem no
                      Bando ou nos Piratas.
                    </p>
                    <CharacterPicker value={avatar} onChange={setAvatar} />
                  </>
                )}
                {hasCharacters && (
                  <button
                    type="button"
                    onClick={() => {
                      // Ao montar do próprio jeito, o personagem-imagem sai do avatar.
                      if (!custom) {
                        const { character: _c, ...svg } = avatar;
                        setAvatar(svg);
                      }
                      setCustom((c) => !c);
                    }}
                    className="mt-4 min-h-11 cursor-pointer font-type text-lg text-brass underline underline-offset-4"
                  >
                    {custom ? '🖼️ Escolher um personagem pronto' : '✏️ Prefiro montar do meu jeito'}
                  </button>
                )}
              </>
            )}
            {step === 1 && (
              <NameCards
                title="Escolham um codinome (Bando)"
                hint="A cada aula vocês escolhem um lado. Quando jogarem no Bando, este é o nome que aparece."
                groups={NAME_GROUPS.red}
                taken={takenCities}
                value={city}
                onPick={setCity}
                tone="red"
              />
            )}
            {step === 2 && (
              <NameCards
                title="Escolham um nome pirata (Piratas)"
                hint="E quando jogarem nos Piratas, aparece este. Os pontos somam na mesma ficha!"
                groups={NAME_GROUPS.blue}
                taken={takenPirates}
                value={pirate}
                onPick={setPirate}
                tone="blue"
              />
            )}
            {step === 3 && (
              <div className="grid grid-cols-[1fr_auto] items-center gap-10">
                <div className="flex flex-col items-center gap-3">
                  <Avatar avatar={avatar} side="red" className="h-48 w-40" />
                  <p className="font-heist text-4xl tracking-wider text-bando text-glow-red">
                    {city}
                  </p>
                  <p className="font-heist text-2xl tracking-wide text-piratas text-glow-blue">
                    {pirate}
                  </p>
                  <SpeechBubble who="narradora" tail="center" className="mt-4">
                    O PIN é a senha secreta da dupla. Combinem 4 números e não contem para ninguém!
                    🤫
                  </SpeechBubble>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <h2 className="font-heist text-4xl tracking-wider text-paper">
                    {pinFirst === null ? 'Criem o PIN' : 'Repitam o PIN'}
                  </h2>
                  <PinPad
                    value={pin}
                    onChange={(v) => {
                      setPin(v);
                      setMsg(null);
                    }}
                    onSubmit={onPinNext}
                    disabled={busy}
                    shakeKey={shake}
                    label={pinFirst === null ? 'Criem o PIN' : 'Repitam o PIN'}
                  />
                  <ComicButton
                    variant="red"
                    size="lg"
                    icon="✔"
                    disabled={pin.length !== PIN_LEN || busy}
                    onClick={onPinNext}
                  >
                    {busy ? 'Criando...' : pinFirst === null ? 'Próximo' : 'Criar dupla!'}
                  </ComicButton>
                </div>
              </div>
            )}
          </motion.section>
        </AnimatePresence>

        <footer className="flex justify-between">
          <ComicButton
            variant="graphite"
            onClick={() => (step === 0 ? navigate('/dupla') : setStep((s) => s - 1))}
            disabled={busy}
          >
            ← Voltar
          </ComicButton>
          {step < 3 && (
            <ComicButton
              variant="brass"
              size="lg"
              icon="▶"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
            >
              Próximo
            </ComicButton>
          )}
        </footer>
      </main>
    </HalftoneBackground>
  );
}

function NameCards({
  title,
  hint,
  groups,
  taken,
  value,
  onPick,
  tone,
}: {
  title: string;
  hint: string;
  groups: readonly { label: string; names: readonly string[] }[];
  taken: Set<string>;
  value: string | null;
  onPick: (n: string) => void;
  tone: 'red' | 'blue';
}) {
  // Abre na aba do nome já escolhido (ao voltar um passo).
  const [tab, setTab] = useState(() =>
    Math.max(
      0,
      groups.findIndex((g) => !!value && g.names.includes(value)),
    ),
  );
  const names = groups[tab]?.names ?? [];
  return (
    <div>
      <h2
        className={cn(
          'mb-1 font-heist text-4xl tracking-wider',
          tone === 'red' ? 'text-bando text-glow-red' : 'text-piratas text-glow-blue',
        )}
      >
        {title}
      </h2>
      <p className="mb-3 font-type text-lg text-mist">{hint}</p>
      <div role="tablist" aria-label="Tipo de nome" className="mb-4 flex gap-2">
        {groups.map((g, i) => (
          <button
            key={g.label}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={cn(
              'min-h-11 cursor-pointer border-[3px] border-ink px-4 pt-1 font-heist text-xl tracking-wider',
              tab === i ? 'bg-brass text-ink' : 'bg-graphite-light text-paper',
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
      <ul key={tab} className="grid grid-cols-5 gap-3">
        {names.map((n, i) => {
          const isTaken = taken.has(n);
          const selected = value === n;
          return (
            <li key={n}>
              <motion.button
                type="button"
                disabled={isTaken}
                onClick={() => onPick(n)}
                aria-pressed={selected}
                aria-label={isTaken ? `${n} (já escolhido)` : n}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{
                  opacity: 1,
                  rotateY: 0,
                  rotate: selected ? -2 : 0,
                  scale: selected ? 1.06 : 1,
                }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  'relative flex min-h-20 w-full cursor-pointer items-center justify-center rounded-hand border-4 border-ink px-2 pt-1 text-center font-heist text-2xl leading-tight tracking-wide shadow-comic-sm',
                  isTaken
                    ? 'cursor-not-allowed bg-graphite text-mist/60 line-through'
                    : selected
                      ? tone === 'red'
                        ? 'bg-bando text-paper glow-red'
                        : 'bg-piratas text-paper glow-blue'
                      : 'bg-aged text-ink hover:-translate-y-0.5',
                )}
              >
                {n}
                {isTaken && (
                  <Stamp
                    text="JÁ TEM DONO"
                    className="absolute text-xs tracking-wider"
                    rotate={-10}
                    delay={0}
                  />
                )}
                {selected && (
                  <span className="absolute -top-3 -right-2 text-2xl" aria-hidden>
                    ⭐
                  </span>
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
