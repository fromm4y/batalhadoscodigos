# CLAUDE.md — A Grande Caçada aos Códigos

> **Fonte da verdade: `SPEC.md`.** Este arquivo é só o resumo das regras que valem SEMPRE.
> Em caso de conflito, vale o SPEC.md. Em caso de dúvida, **perguntar à May antes de inventar**.

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
4. **Direitos de imagem:** usar só a **estética**. **PROIBIDO** usar nomes, logos, personagens, músicas ou imagens oficiais de _La Casa de Papel_ ou _One Piece_ (nada de Luffy, Jolly Roger oficial, máscara de Dalí, "Bella Ciao", etc.). Nenhum desses nomes aparece na UI, em assets ou em nomes de arquivo. Toda arte é **original** (SVG próprio).
5. **Conteúdo dirigido por JSON:** o motor não conhece episódio nenhum. Episódio = `src/content/episodes/epN.json` + registro em `src/content/season.ts`.
6. **LGPD:** nenhum dado pessoal de aluno (sem nome real, foto, e-mail, idade). Nomes de dupla só de listas fechadas (`src/content/names.ts`).
7. **Barra do cabo de guerra:** alterada **sempre** por `runTransaction`. Timers sempre a partir de `serverTimestamp()` + offset de relógio estimado.
8. **Pontos:** todo ponto gera entrada no `ledger`; `totalPoints` atualizado na mesma transação; total **nunca < 0**.
9. **Anti-trapaça MVP:** nunca logar respostas no console nem deixá-las em texto puro no HTML; build minificado.
10. **Toda a interface em português do Brasil.** Microcopy curta, divertida, **sem humilhar** quem erra.

## Direção de arte (HQ) — "tem que parecer um gibi vivo"

- Todo bloco é um **painel de HQ**: borda preta 3–4 px, cantos levemente irregulares, rotação leve (−1° a 1°).
- Fundos com **retícula halftone** (`radial-gradient`).
- **Balões de fala** com rabicho para personagens (Professor, Capitã, robô, Narradora).
- **Onomatopeias** animadas: CLICK!, BOOM!, UÓ-UÓ!, ZZZT!, TCHÁ!, ERROU!.
- Fontes: **Bangers** (títulos/onomatopeias) e **Nunito** (texto). Corpo mín. **18 px** no nível A, **16 px** nos demais.
- Paleta (tokens Tailwind): papel `#FFF8E7`, tinta `#111111`, Bando `#E63946`/`#9D0208`, Piratas `#1D4ED8`/`#0B2A7A`, ouro `#F4C430`, sucesso `#2BB673`, alerta `#FF8C00`.
- Framer Motion: "pop", molas, tremida em erro, confete em vitória. **Respeitar `prefers-reduced-motion`.**
- Acessibilidade: contraste AA, foco visível, teclado, botões ≥ 44 px, nunca só cor (ícone + texto).

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
- Antes de commitar: `npm run lint`, `npm run typecheck`, `npm test`.

## Decisões da May (sobrepõem o SPEC onde indicado)

- **(10/11) Puxão de cadeado = 20** (era 15), para a trava de ±60 antes do Cofre ter efeito (3 × 20 + 10 = 70).
- **(10/11) Rate limit do `/api/join-session`:** conta só **códigos inválidos**, por IP (30/min). Escolas saem todas pelo mesmo IP, então limitar entradas válidas travaria a turma.
- **(10/11) Temporada** gerada automaticamente pela data (`2026-T4`), em `seasonFromDate`.
- **(10/11) Efeitos sonoros sintetizados** via Web Audio (sem arquivos, sem problema de licença).
- **(10/11) Ilustrações:** a May gera as imagens (lista em `docs/IMAGENS.md`). Código usa placeholder até a imagem existir. Avatares das duplas continuam em SVG próprio.
- **(10/11) Seed:** `npm run seed` cria escolas + admin.
- **Versões:** React 18 (SPEC) → por isso **React Router 7** (o 8 exige React 19). TypeScript 6 (o typescript-eslint ainda não suporta o 7). Tailwind v4 (tokens em `src/index.css`, bloco `@theme`).
- **Regras do Firestore:** começam "nega tudo"; cada coleção abre na etapa em que é usada.
