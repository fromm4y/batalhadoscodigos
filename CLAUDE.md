# CLAUDE.md — A Grande Caçada aos Códigos

> **Fontes da verdade: `SPEC.md` + `VISUAL.md`** (o VISUAL.md **substitui a seção 9.6** do SPEC e detalha o fluxo do aluno da 9.2).
> Este arquivo é só o resumo das regras que valem SEMPRE. Em caso de conflito, valem o VISUAL.md (arte/fluxo) e o SPEC.md (o resto). Em caso de dúvida, **perguntar à May antes de inventar**.

## Como trabalhar

- Seguir o **plano da seção 14** do SPEC, **uma etapa por vez**. Ao fim de cada etapa: rodar os critérios de aceite, relatar e **PARAR** até a May confirmar.
- Etapas pequenas, **commits em português**, mensagens claras (ex.: `feat: cria componente SpeechBubble`).
- Branch de trabalho: `claude/epic-galileo-ghdqav`. Não criar PR sem pedido explícito.
- Se uma decisão **[PADRÃO]** parecer ruim na prática, avisar e sugerir alternativa (não mudar sozinho).

## Stack (não trocar sem pedir)

- **Front:** React 18 + Vite + TypeScript, React Router, Zustand, Framer Motion, Howler.js, Tailwind CSS.
- **Back:** Firebase Auth (Google p/ instrutores, **custom token** p/ duplas) + Firestore (tempo real via `onSnapshot`).
- **Funções:** Vercel Serverless Functions em `api/*` com `firebase-admin`. **Não usar Cloud Functions** (plano Spark).
- **Qualidade:** TypeScript **estrito**, sem `any` desnecessário; ESLint + Prettier; Vitest para o motor.
- **Alvo:** Chrome desktop, mínimo **1366×768**, sem rolagem horizontal na tela de jogo.

## Regras inegociáveis

1. **Todos os números de regra** (pontos, forças de puxão, tempos, chances, limites, volumes) ficam em **`src/config/gameRules.ts`**. Nunca hardcodar número de regra em componente/motor.
2. **"Nada abre sem a Narradora" (RN-05):** fases só avançam por clique da instrutora. Tempos de fase são só **guia**; nada avança sozinho. Fora de sessão aberta, aluno vê _"A Narradora ainda não deu o sinal..."_.
3. **Desafios espelhados:** os dois lados trabalham o **mesmo conceito com a mesma dificuldade**, com **ações opostas** (Bando quebra/lê/cria; Piratas protegem/escrevem/depuram). Vale para conteúdo e para habilidades.
4. **Direitos de imagem:** usar só a **estética**. **PROIBIDO** usar nomes, logos, personagens, músicas ou imagens oficiais de _La Casa de Papel_ ou _One Piece_ (nada de Luffy, Jolly Roger oficial, máscara de Dalí, "Bella Ciao", etc.). Nenhum desses nomes aparece na UI, em assets ou em nomes de arquivo. Toda arte é **original**. Imagens de referência (séries, filmes, museus reais) servem só para inspirar: **nunca** entram no repositório.
5. **Conteúdo dirigido por JSON:** o motor não conhece episódio nenhum. Episódio = `src/content/episodes/epN.json` + registro em `src/content/season.ts`.
6. **LGPD:** nenhum dado pessoal de aluno (sem nome real, foto, e-mail, idade). Nomes de dupla só de listas fechadas (`src/content/names.ts`).
7. **Barra do cabo de guerra:** alterada **sempre** por `runTransaction`. Timers sempre a partir de `serverTimestamp()` + offset de relógio estimado.
8. **Pontos:** todo ponto gera entrada no `ledger`; `totalPoints` atualizado na mesma transação; total **nunca < 0**.
9. **Anti-trapaça MVP:** nunca logar respostas no console nem deixá-las em texto puro no HTML; build minificado.
10. **Toda a interface em português do Brasil.** Microcopy curta, divertida, **sem humilhar** quem erra.

## Direção de arte v2 — "HQ Noir de assalto" (VISUAL.md)

**Meta:** parecer um **assalto à meia-noite num museu** (escuro, misterioso, tenso, com humor pontual). O aluno tem que sair pensando **"quero jogar mais"**. Nada de gibi infantil claro e amarelo.

- **Fundo sempre escuro.** Luz é a protagonista: holofotes, lanternas, brilho de vitrine, alarmes.
- **Quadros de HQ continuam:** borda preta grossa, cantos irregulares, rotação leve (−1° a 1°), mas agora em **grafite** ou **papel envelhecido** sobre a noite.
- **Paleta v2 (tokens em `src/index.css`):** noite `#0B0D14` · grafite `#171B26` · grafite claro `#252B3A` · papel envelhecido `#EDE3CC` · tinta `#0A0A0A` · Bando `#E63946`/`#7A0F18` · Piratas `#2F6BFF`/`#0B2A7A` · latão `#D4A537` · holofote `#FFF4C2` · sucesso `#2BB673`.
- Vermelho e azul **com brilho neon suave** (`box-shadow`/`drop-shadow`). Texto longo **só sobre papel envelhecido ou grafite**, contraste AA.
- **Tipografia:** **Bebas Neue** (títulos de assalto, timer) · **Special Elite** (dossiês, lore, transmissões, com efeito de digitação) · **Bangers** (onomatopeias/impacto) · **Nunito** (enunciados e respostas; corpo mín. **18 px** no nível A, **16 px** nos demais).
- **Texturas e cenário em CSS/SVG (sem imagem externa):** retícula escura, vinheta, holofotes varrendo, poeira na luz, lasers piscando, planta do museu (Bando), carta náutica (Piratas), documentos confidenciais (pasta, clipe, fita, carimbo CONFIDENCIAL, polaroide), moldura de vitrine em latão.
- **Balões de fala** (papel envelhecido, com rabicho) para Professor, Capitã, robô e Narradora. Professor com **glitch** nas transmissões.
- **Onomatopeias** (CLICK!, BOOM!, UÓ-UÓ!, ZZZT!, TCHÁ!, ERROU!) estouram **com brilho** sobre o escuro.
- **Trilha de progresso = planta (Bando) / mapa (Piratas)**: 3 pontos (cadeados) + Cofre/X; cada cadeado aberto acende o ponto.
- **Fim de episódio:** cliffhanger obrigatório ("TRANSMISSÃO INTERCEPTADA").
- **`prefers-reduced-motion`:** sem tremidas, sem lanterna seguindo o mouse, sem holofote varrendo; transições simples.
- **Acessibilidade:** foco visível, teclado, botões ≥ 44 px, nunca só cor (ícone + texto).

## Estrutura de pastas

```
api/                        # Vercel functions (firebase-admin)
public/audio/               # áudio + CREDITS.md (fonte/licença de cada arquivo)
src/
  app/                      # rotas e layouts
  components/comic/         # ComicPanel, SpeechBubble, Onomatopoeia, ComicButton, Halftone...
  components/game/          # TugBar, LockTrail, AbilityCards, Overlays...
  components/challenges/    # Quiz, Riddle, Anagram, PunchCardRead/Write, BlockBuild/Debug
  components/avatar/        # Avatar SVG em camadas + AvatarBuilder
  features/instructor/      # turmas, painel, projetor, admin
  engine/                   # fases, pontuação, barra, habilidades, máquina, executor de blocos
  content/                  # episodes/*.json, names.ts, season.ts
  config/gameRules.ts       # TODOS os números de regra
  lib/firebase.ts
  audio/
firestore.rules
```

## Convenções de código

- Componentes React em `PascalCase.tsx`, um componente principal por arquivo; hooks `useAlgo.ts`; funções puras do motor em `src/engine/` (testáveis, sem React/Firebase).
- Tipos do domínio espelham o SPEC (seções 6 e 11) — mesmos nomes de campos.
- Identificadores de código em inglês (como no SPEC: `lockIndex`, `vaultLeader`); textos de UI em pt-BR.
- Imports com alias `@/` → `src/`.
- Antes de commitar: `npm run lint`, `npm run typecheck`, `npm test` e, se mexeu em regras ou API, `npm run test:emu`.

## Testes e ambiente local

- `npm test`: unitários (Vitest) em `src/` e `api/`.
- `npm run test:emu`: regras do Firestore + rotas da API contra os emuladores (Auth + Firestore). Precisa de Java.
- `npm run dev:emu`: app completo local com emuladores e dados falsos (admin@teste.br / ana@teste.br). As rotas `/api/*` rodam dentro do Vite (`scripts/vite-api-plugin.ts`, só em dev). Login de teste: `window.__emuGoogleLogin(email)` (existe só no modo emulador; não vai para o build).
- Código de `api/` pode importar de `src/` só arquivos sem dependência de browser (`config/gameRules`, `content/names`, `content/season`, `types/domain`), com extensão `.js` no import.

## Decisões da May (sobrepõem o SPEC onde indicado)

- **(10/11) Puxão de cadeado = 20** (era 15), para a trava de ±60 antes do Cofre ter efeito (3 × 20 + 10 = 70).
- **(10/11) Rate limit do `/api/join-session`:** conta só **códigos inválidos**, por IP (30/min). Escolas saem todas pelo mesmo IP, então limitar entradas válidas travaria a turma.
- **(10/11) Temporada** gerada automaticamente pela data (`2026-T4`), em `seasonFromDate`.
- **(10/11 e 12/11) Áudio 100% sintetizado** via Web Audio: efeitos **e música de fundo** (sem arquivos, sem problema de licença).
- **(12/11) Clima "HQ Noir" aprovado** pela May (protótipo `/prototipo`).
- **(10/11) Ilustrações:** a May gera as imagens (lista em `docs/IMAGENS.md`). Código usa placeholder até a imagem existir. Avatares das duplas continuam em SVG próprio.
- **(10/11) Seed:** `GET /api/setup` (um clique, idempotente) ou `npm run seed` criam escolas + admin. Lógica única em `api/_lib/seed.ts`.
- **Versões:** React 18 (SPEC) → por isso **React Router 7** (o 8 exige React 19). **firebase-admin 13** (o 14 puxa `jose` 6 em ESM e quebra no carregador da Vercel com `ERR_REQUIRE_ESM`; não atualizar sem testar com `node --no-experimental-require-module`). Funções em **Node 22.x**. TypeScript 6 (o typescript-eslint ainda não suporta o 7). Tailwind v4 (tokens em `src/index.css`, bloco `@theme`).
- **Regras do Firestore:** começam "nega tudo"; cada coleção abre na etapa em que é usada.
- **(12/11) Rota extra `POST /api/session-open`** (além das 4 da SPEC 8.1): o código precisa ser único entre todas as sessões abertas, e a Narradora só enxerga as próprias. Só a dona da turma abre sessão.
- **(12/11) PIN resetado:** no próximo login, o PIN digitado (com confirmação) vira o novo PIN.
- **(12/11) Presença:** a dupla marca `connected/lastSeenAt` a cada `GAME_RULES.presence.heartbeatSeconds`; o painel considera desconectada após 2,5× esse tempo.
