import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { ComicButton, GameLogo, HalftoneBackground, SpeechBubble } from '@/components/comic';
import { Dossier, Dust, Lasers, Spotlights } from '@/components/scene';
import { useAuthStore } from './authStore';
import { LoadingScreen } from './LoadingScreen';

/** /instrutor — entrada da Narradora (login Google + allowlist). */
export function InstructorLoginPage() {
  const state = useAuthStore((s) => s.state);
  const init = useAuthStore((s) => s.init);
  const signIn = useAuthStore((s) => s.signIn);
  useEffect(() => init(), [init]);

  if (state.status === 'ready') return <Navigate to="/instrutor/turmas" replace />;
  if (state.status === 'loading') return <LoadingScreen />;

  return (
    <HalftoneBackground>
      <Spotlights />
      <Lasers lasers={[{ top: '88%', angle: -2 }]} />
      <Dust />
      <main className="relative mx-auto grid min-h-screen max-w-5xl grid-cols-[1fr_1.1fr] items-center gap-12 p-10">
        <div className="flex flex-col items-center gap-6">
          <GameLogo size="md" />
          <p className="font-type text-xl text-mist">Sala de controle da Narradora</p>
        </div>

        {state.status === 'denied' ? (
          <Dossier title="Acesso restrito" stamp="ACESSO NEGADO" rotate={1}>
            <p>
              O e-mail <strong className="break-all">{state.email}</strong> não está na lista de
              Narradoras.
            </p>
            <p className="mt-3 text-lg font-extrabold">Peça acesso à administradora. 🗝️</p>
            <ComicButton
              variant="brass"
              icon="↻"
              className="mt-5 mb-10"
              onClick={() => void signIn()}
            >
              Tentar com outra conta
            </ComicButton>
          </Dossier>
        ) : (
          <Dossier title="Identificação obrigatória" stamp="CONFIDENCIAL" rotate={-1}>
            <p>Só Narradoras autorizadas entram aqui: turmas, sessões e o painel ao vivo.</p>
            {state.status === 'error' && (
              <p
                role="alert"
                className="mt-3 border-l-4 border-bando bg-bando/10 p-2 font-bold text-bando-dark"
              >
                {state.message}
              </p>
            )}
            <ComicButton
              variant="red"
              size="lg"
              icon="🔑"
              className="mt-5 mb-10"
              onClick={() => void signIn()}
            >
              Entrar com Google
            </ComicButton>
          </Dossier>
        )}

        <div className="col-span-2 flex justify-center">
          <SpeechBubble who="narradora" tail="center" delay={0.5}>
            Psiu... alunos entram pela página inicial, com o código da sessão!
          </SpeechBubble>
        </div>
      </main>
    </HalftoneBackground>
  );
}
