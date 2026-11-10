# A Grande Caçada aos Códigos — Especificação Técnica do MVP

> **Para o Claude Code:** este arquivo é a fonte da verdade do projeto. Leia inteiro antes de começar.
> Siga o **Plano de implementação** (seção 14) etapa por etapa, e só avance quando os critérios de aceite da etapa passarem.
> Itens marcados com **[PADRÃO]** são decisões assumidas que a dona do produto (May) pode mudar; implemente-os de forma fácil de ajustar (constantes em `src/config/gameRules.ts`).
> Quando algo não estiver claro, **pergunte antes de inventar**.

---

## 1. Visão do produto

Jogo web em **episódios semanais** para turmas do **4º ao 9º ano** (Núcleo WIT, escolas municipais de Barueri/SP). Em cada aula de **50 minutos**, duplas de alunos escolhem um lado e se enfrentam em um **cabo de guerra** resolvendo desafios sobre a história da computação e da IA.

- **Premissa:** o Museu Nacional da Tecnologia vai abrir uma exposição com as maiores invenções da história e contrata dois times para testar a segurança (lógica de Red Team × Blue Team).
- **🔴 Bando (ataque):** estética de assalto inspirada em La Casa de Papel (máscaras, macacão vermelho, plano detalhado). Líder no jogo: **o Professor**.
- **🔵 Piratas (defesa):** estética pirata inspirada em Chapéus de Palha (chapéu de palha, navio, mapas). Líder no jogo: **a Capitã**.
- **Narradora:** a instrutora, ao vivo na sala, controla tudo por um painel.
- **Princípio:** diversão em primeiro plano. O conteúdo é a ferramenta para vencer, não o foco declarado.
- **Visual:** estilo **HQ / quadrinhos**. Precisa ter **muita cara de jogo**.

### 1.1 Direitos de imagem (obrigatório)
Usar apenas a **estética** dos dois universos. **Proibido** usar nomes, logos, personagens, músicas ou imagens oficiais de *La Casa de Papel* ou *One Piece* (nada de Luffy, Jolly Roger oficial, máscara de Dalí da série, "Bella Ciao" etc.). Toda arte, personagem e símbolo deve ser **original**.

---

## 2. Escopo

### 2.1 MVP — estreia na semana de 17/11 (prazo: 1 semana)
1. Login de instrutores (Google) com allowlist controlada pela admin.
2. Cadastro de turmas pelo próprio instrutor.
3. Sessões de aula com código de entrada.
4. Cadastro e login de duplas (avatar + nomes + PIN).
5. Motor de episódios dirigido por conteúdo JSON.
6. **Episódio 1 completo** (Máquina Analítica), dois lados, três níveis.
7. Confronto **contra pessoas (PvP em tempo real)** e **contra a máquina**.
8. Cabo de guerra, cadeados, evento do museu, Cofre, dicas, prisão, habilidades.
9. Painel da Narradora (liberação, eventos, transmissões, congelar telas, pontos, chamados).
10. Tela de projetor (código, ranking, fases).
11. Ranking da turma (temporada).
12. Música, efeitos sonoros e narração por voz do navegador.

### 2.2 Pós-MVP (semanas seguintes, um episódio por semana)
- Episódios 2 (Enigma), 3 (ENIAC), 4 (Apollo 11) e 5 (Deep Blue — final cooperativo).
- Selo do episódio (dupla mais rápida) com galeria de selos.
- Medalha/certificado digital da temporada.
- Validação de respostas no servidor (anti-trapaça).
- Editor de conteúdo (opcional).

### 2.3 Fora de escopo
Celular (o foco é computador), chat entre alunos, contas individuais de alunos, coleta de qualquer dado pessoal de aluno.

---

## 3. Glossário

| Termo | Significado |
|---|---|
| **Admin** | A dona do produto (May). Autoriza quais e-mails podem ser instrutores. Também é instrutora. |
| **Instrutor / Narradora** | Usuário com login Google. Cria turmas, abre sessões e controla o jogo. Na UI dos alunos, aparece como "a Narradora". |
| **Escola** | Uma das escolas atendidas (seed na seção 6.3). |
| **Turma** | Grupo de alunos de uma série. Tem um nível de dificuldade. Pertence a um instrutor. |
| **Nível** | `A` (4º–5º ano), `B` (6º–7º), `C` (8º–9º). Define a variante dos desafios. |
| **Dupla (team)** | Unidade do jogo: 1 ou 2 alunos num computador. Pertence a uma turma e dura a temporada toda. |
| **Temporada** | Conjunto de episódios de uma turma (nov–dez). Os pontos acumulam no ranking. |
| **Sessão** | Uma aula. Liga turma + episódio + código de entrada + estado ao vivo. |
| **Episódio** | Conteúdo de uma aula (ex.: Ep. 1 – Máquina Analítica), descrito em JSON. |
| **Lado** | `red` (Bando, ataque) ou `blue` (Piratas, defesa). Escolhido pela dupla a cada episódio. |
| **Confronto (match)** | Disputa de uma dupla `red` contra uma dupla `blue`, ou de uma dupla contra a máquina. |
| **Barra** | Valor do cabo de guerra do confronto, de −100 (vitória do Bando) a +100 (vitória dos Piratas). |
| **Fase** | Etapa da sessão: `lobby`, `planning`, `locks`, `vault`, `end`. |
| **Cadeado (lock)** | Desafio da fase `locks`. São 3 por lado, em sequência. |
| **Cofre (vault)** | Desafio final que decide o confronto. |
| **Evento do museu** | Interrupção que atinge todos os confrontos da sessão (ex.: Alarme Falso). |
| **Prisão** | Castigo de 60 s ao errar o evento; mostra uma curiosidade. |
| **Habilidade** | Poder especial conquistado no jogo (seção 7.9). |
| **Transmissão** | Momento em que a Narradora fala uma informação em voz alta que não está na tela. |
| **Desafios espelhados** | Regra de design: os dois lados trabalham o **mesmo conceito, com a mesma dificuldade**, mas com **ações opostas** (o Bando quebra/lê/cria; os Piratas protegem/escrevem/depuram). |

---

## 4. Perfis e permissões

| Ação | Admin | Instrutor | Dupla |
|---|:-:|:-:|:-:|
| Autorizar e-mails de instrutores | ✅ | ❌ | ❌ |
| Criar, editar e arquivar as **próprias** turmas | ✅ | ✅ | ❌ |
| Ver turmas de outros instrutores | ✅ (leitura) | ❌ | ❌ |
| Abrir sessão, liberar fases, disparar eventos e transmissões | ✅ | ✅ (só nas próprias turmas) | ❌ |
| Ajustar pontos, resetar PIN, trocar pares/lados | ✅ | ✅ (só nas próprias turmas) | ❌ |
| Criar dupla e jogar | ❌ | ❌ | ✅ (só com sessão ativa) |
| Ver ranking | ✅ | ✅ | ✅ (só nas fases `planning` e `end`) |

---

## 5. Stack e arquitetura

### 5.1 Stack
- **Front:** React 18 + Vite + **TypeScript**, React Router, Zustand (estado local), Framer Motion (animações), Howler.js (áudio), Tailwind CSS.
- **Back:** Firebase **Auth** (Google para instrutores; **custom token** para duplas), **Firestore** (dados e tempo real).
- **Funções:** **Vercel Serverless Functions** (`/api/*`) com `firebase-admin`, para operações que exigem segredo (validar PIN, emitir token, entrar em sessão).
- **Hospedagem:** Vercel (front + funções). Projeto Firebase no plano gratuito (Spark) é suficiente; **não** usar Cloud Functions.
- **Navegador-alvo:** Chrome desktop recente. Resolução mínima **1366×768**.

### 5.2 Visão geral

```
[Navegador do aluno] ──(custom token)──► Firestore (onSnapshot em tempo real)
        │                                     ▲
        └── /api/join-session, /api/team-*  ──┘ (Vercel + firebase-admin)

[Navegador da instrutora] ──(Google)──► Firestore  (painel + projetor)
```

- Todo estado compartilhado vive no Firestore. As telas reagem com `onSnapshot`.
- A **barra** de cada confronto é um campo num documento de `match`, alterado **sempre por transação** (`runTransaction`) para evitar conflito quando as duas duplas puxam ao mesmo tempo.
- **Tempo:** toda contagem regressiva é calculada a partir de timestamps do servidor (`serverTimestamp()`) gravados no documento da sessão/confronto. Ao carregar, o cliente estima o offset do relógio (gravar um doc de teste com `serverTimestamp` e comparar) para não depender do relógio do computador da escola.
- **A máquina** (oponente robô) roda no **navegador da dupla** que joga contra ela, com um agendador local, e grava os puxões dela no mesmo documento de `match` (campo `machineSide`). Não precisa de servidor.
- **Reconexão:** se a aba recarregar, o jogo volta exatamente ao ponto em que a dupla estava (estado persistido no Firestore).

### 5.3 Autenticação
- **Instrutores:** Google Sign-In. Após o login, o app verifica se existe `allowedInstructors/{emailNormalizado}`. Se não existir, mostra "Peça acesso à administradora" e faz logout. No primeiro login autorizado, cria `instructors/{uid}`.
- **Admin:** e-mail definido na variável de ambiente `ADMIN_EMAIL` e no doc `allowedInstructors/{email}` com `role: "admin"`.
- **Duplas:** não têm conta Google. Fluxo:
  1. Aluno digita o **código da sessão** → `POST /api/join-session` devolve `sessionId`, `classId`, nível e a lista pública de duplas da turma (avatar + nomes, sem PIN).
  2. **Primeiro acesso:** cria a dupla (avatar, cidade, nome pirata, PIN de 4 dígitos) → `POST /api/team-create`.
  3. **Acessos seguintes:** escolhe sua dupla na lista e digita o PIN → `POST /api/team-login`.
  4. As duas rotas devolvem um **Firebase custom token** com claims `{ role: "team", teamId, classId, sessionId }`. O cliente faz `signInWithCustomToken`.
  5. O PIN é guardado só como **hash** (bcrypt ou scrypt) no documento privado da dupla. **5 erros seguidos** bloqueiam a dupla por 60 s. A instrutora pode resetar o PIN pelo painel.
- O token da dupla só vale para a sessão ativa. Fora de uma sessão ativa, a dupla não consegue entrar.

### 5.4 Variáveis de ambiente
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_JSON=   # só nas funções da Vercel (base64)
ADMIN_EMAIL=
```

---

## 6. Modelo de dados (Firestore)

> Convenções: ids gerados pelo Firestore, salvo indicação. Datas como `Timestamp`. Campos marcados `server` são escritos só pelas funções da Vercel.

### 6.1 Coleções

#### `allowedInstructors/{email}`
```ts
{ email: string; role: "admin" | "instructor"; addedBy: string; addedAt: Timestamp; active: boolean }
```

#### `instructors/{uid}`
```ts
{ uid: string; email: string; displayName: string; role: "admin" | "instructor"; createdAt: Timestamp }
```

#### `schools/{schoolId}`  (seed fixo, seção 6.3)
```ts
{ name: string; active: boolean }
```

#### `classes/{classId}`
```ts
{
  schoolId: string;
  instructorId: string;          // uid do dono
  name: string;                  // ex.: "6º A"
  grade: 4 | 5 | 6 | 7 | 8 | 9;
  level: "A" | "B" | "C";        // derivado de grade: 4–5 → A, 6–7 → B, 8–9 → C
  shift: "manha" | "tarde";
  season: string;                // ex.: "2026-T4"
  archived: boolean;
  createdAt: Timestamp;
}
```

#### `classes/{classId}/teams/{teamId}`  (dados públicos da dupla)
```ts
{
  cityName: string;              // codinome do Bando (lista fechada)
  pirateName: string;            // nome pirata (lista fechada)
  avatar: AvatarConfig;          // seção 9.5
  totalPoints: number;           // >= 0, soma do ledger (cache)
  episodesPlayed: number;
  badges: string[];              // ex.: ["ep1-mais-rapida"]
  createdAt: Timestamp;
}
```

#### `classes/{classId}/teams/{teamId}/private/auth`  (só servidor)
```ts
{ pinHash: string; failedAttempts: number; lockedUntil: Timestamp | null }
```

#### `classes/{classId}/teams/{teamId}/ledger/{entryId}`  (histórico de pontos)
```ts
{ sessionId: string; episodeId: string; delta: number; reason: LedgerReason; at: Timestamp; by: "game" | instructorUid }
// LedgerReason: "lock_open" | "lock_first" | "event_ok" | "vault_win" | "draw" | "side_bonus"
//             | "wrong_answer" | "hint_1" | "hint_2" | "manual"
```

#### `sessions/{sessionId}`
```ts
{
  classId: string;
  instructorId: string;
  episodeId: string;             // ex.: "ep1"
  code: string;                  // 4 caracteres, sem 0/O/1/I (ex.: "K7Q2"); único entre sessões ativas
  status: "open" | "finished";
  phase: "lobby" | "planning" | "locks" | "vault" | "end";
  phaseStartedAt: Timestamp;
  matchesFormed: boolean;
  freeze: { active: boolean; message: string } ;          // "Todos os olhos na Narradora"
  transmission: { active: boolean; id: string; startedAt: Timestamp | null }; // "TIRE O FONE"
  museumEvent: { status: "idle" | "running" | "done"; startedAt: Timestamp | null; triggeredBy: "auto" | "instructor" | null };
  autoEventAt: Timestamp | null; // momento sorteado para o evento automático
  createdAt: Timestamp;
  expiresAt: Timestamp;          // createdAt + 3 h
}
```

#### `sessions/{sessionId}/players/{teamId}`  (estado da dupla nesta sessão)
```ts
{
  teamId: string;
  uid: string;                   // uid do custom token (checado nas regras)
  side: "red" | "blue" | null;
  matchId: string | null;
  connected: boolean; lastSeenAt: Timestamp;
  progress: {
    lockIndex: 0 | 1 | 2 | 3;    // 3 = todos abertos
    locksOpenedAt: (Timestamp | null)[];
    vaultSolvedAt: Timestamp | null;
    eventResult: "pending" | "ok" | "failed";
    jailUntil: Timestamp | null;
    heardTransmission: boolean;  // já recebeu a pista falada desta sessão
  };
  hints: { [challengeKey: string]: 0 | 1 | 2 };   // dicas usadas por desafio
  helpUsed: boolean;             // "Chamar o Professor" (1x por episódio)
  abilities: { owned: AbilityId[]; used: AbilityId[] };
  solvedCount: number;           // desafios resolvidos (cadeados + evento) — para ganhar habilidades
  episodePoints: number;         // pontos desta sessão (cache)
  finishedAt: Timestamp | null;
}
```

#### `sessions/{sessionId}/matches/{matchId}`
```ts
{
  redTeamId: string | null;      // null quando o Bando é a máquina
  blueTeamId: string | null;     // null quando os Piratas são a máquina
  machineSide: "red" | "blue" | null;
  bar: number;                   // −100..+100. Negativo favorece o Bando.
  effects: ActiveEffect[];       // habilidades ativas (seção 7.9)
  vaultLeader: "red" | "blue" | null; // quem estava à frente ao abrir o Cofre
  winner: "red" | "blue" | "draw" | null;
  resolvedAt: Timestamp | null;
  log: MatchLogEntry[];          // últimos 30 eventos (para animações e painel)
}
```

#### `sessions/{sessionId}/helpRequests/{id}`
```ts
{ teamId: string; challengeKey: string; createdAt: Timestamp; status: "open" | "done" }
```

#### `sessions/{sessionId}/feed/{id}`  (linha do tempo para o painel)
```ts
{ teamId: string; type: string; payload: object; at: Timestamp }
```

### 6.2 Índices
- `sessions` por `code` + `status` (para `join-session`).
- `classes` por `instructorId` + `archived`.

### 6.3 Seed
- **Escolas:** Meduneckas, Cavazza, Camisão, Adherbal, Emídio.
- **Admin:** `allowedInstructors/{ADMIN_EMAIL}` com `role: "admin"`.
- **Listas de nomes:** em `src/content/names.ts` (seção 9.5).

---

## 7. Regras de negócio

### 7.1 Turmas
- **RN-01** Cada instrutor cria, edita e arquiva **as próprias** turmas (escola, série, nome, turno). O nível é derivado da série e pode ser sobrescrito manualmente.
- **RN-02** Uma turma tem no máximo **10 duplas** [PADRÃO] (turmas reais têm até 16 alunos).

### 7.2 Sessões
- **RN-03** A instrutora abre uma sessão escolhendo **turma + episódio**. O sistema gera um código de 4 caracteres e mostra na tela do projetor.
- **RN-04** Uma turma só pode ter **uma sessão aberta** por vez. A sessão expira 3 h após criada ou quando a instrutora encerra.
- **RN-05** **Nada abre sem a Narradora:** as fases avançam **só** quando a instrutora clica em "Liberar próxima fase". O painel mostra o tempo recomendado de cada fase como guia, mas não avança sozinho.
- **RN-06** Fora de uma sessão aberta, qualquer acesso de aluno mostra: *"A Narradora ainda não deu o sinal..."* (tela estilizada de HQ).
- **RN-07** A instrutora pode liberar uma fase **para a turma toda** (padrão) ou adiantar/atrasar **uma dupla específica** (ex.: dupla que chegou atrasada).

### 7.3 Fases e tempos recomendados (50 min)

| Fase | Tempo guia | O que acontece |
|---|---|---|
| `lobby` | antes da aula | Duplas entram com o código, criam ou fazem login. Tela de espera animada. |
| `planning` | 5 min | Ranking da turma, abertura em HQ do episódio, **escolha de lado e de modo**, dossiê da invenção. Ao fim, a instrutora clica em **"Formar confrontos"**. |
| `locks` | 20 min | 3 cadeados em sequência. O **evento do museu** interrompe no meio desta fase. |
| `vault` | 12 min | O Cofre. Decide o confronto. |
| `end` | 10 min | Resultado, pontos, ranking, revelação histórica e gancho do próximo episódio. |

- **RN-08 [PADRÃO]** O antigo "bloco de 10 min do evento" virou uma **interrupção** dentro de `locks`, porque o Alarme Falso dura cerca de 1 min. O tempo que sobra vai para `locks` e `vault`.
- **RN-09** Quando a instrutora libera `vault`, **todas** as duplas vão para o Cofre, mesmo quem não abriu os 3 cadeados (os cadeados não abertos só deixam de render pontos). Isso mantém a turma sincronizada.
- **RN-10** Dupla que terminar uma fase antes da hora vê a tela **"Aguardando a Narradora"** com curiosidades rotativas do episódio.

### 7.4 Escolha de lado e formação dos confrontos
- **RN-11** Na fase `planning`, cada dupla escolhe o **lado** (`red` ou `blue`) e o **modo** (`pessoas` ou `máquina`). A escolha é livre a cada episódio.
- **RN-12** Ao clicar em "Formar confrontos":
  1. Duplas que escolheram `máquina` recebem um confronto contra a máquina no lado escolhido.
  2. Entre as que escolheram `pessoas`, o sistema embaralha cada lado e forma pares `red × blue`.
  3. Quem sobrar joga **contra a máquina** no lado que escolheu (ninguém é obrigado a trocar de lado).
  4. **Bônus de lado vazio [PADRÃO]:** se, entre as duplas do modo `pessoas`, um lado tiver **2 ou mais duplas a menos** que o outro, cada dupla do lado menor ganha **+2 pontos** (`side_bonus`).
- **RN-13** Turma com **uma única dupla** conectada: confronto contra a máquina automaticamente.
- **RN-14** A instrutora pode **trocar pares e lados** pelo painel antes de liberar `locks`.

### 7.5 Cabo de guerra
- **RN-15** Cada confronto tem uma barra de **−100 a +100** que começa em **0**. Puxar para o próprio lado = Bando diminui o valor, Piratas aumentam.
- **RN-16 Forças de puxão [PADRÃO]:**
  - Abrir um cadeado: **15**
  - Acertar o evento do museu (3 alertas certos): **10**
- **RN-17** Antes do Cofre, a barra fica **travada entre −60 e +60** (não decide o jogo).
- **RN-18** Ao liberar `vault`, o lado à frente na barra vira `vaultLeader` e ganha **uma Dica 1 grátis** no Cofre [PADRÃO]. Empate na barra: ninguém ganha a vantagem.
- **RN-19** **O primeiro lado a resolver o Cofre vence:** a barra vai para −100 ou +100 com animação e `winner` é definido.
- **RN-20** Se a instrutora liberar `end` sem ninguém ter resolvido o Cofre, vence o lado para onde a barra estiver inclinada. Barra em 0 = **empate**.
- **RN-21** Todo puxão é feito por `runTransaction`, aplicando os efeitos ativos (Âncora, Escudo) antes de gravar.

### 7.6 Pontuação (vale para o ranking da temporada)

| Ação | Pontos | Observação |
|---|---|---|
| Abrir um cadeado | **+1** [PADRÃO] | toda dupla que abrir |
| Ser a **primeira dupla da turma** a abrir o cadeado N | **+3** | um bônus por número de cadeado, independentemente do lado |
| Acertar os 3 alertas do evento | **+1** [PADRÃO] | |
| Vencer o confronto | **+5** | contra pessoas ou contra a máquina |
| Empate | **+2** para cada dupla | |
| Bônus de lado vazio | **+2** | RN-12 |
| Resposta errada | **−2** | em cadeado ou Cofre; vale para múltipla escolha também |
| Dica 1 / Dica 2 | **−2 / −4** | |
| Ajuste manual | ± livre | pela instrutora, com motivo |

- **RN-22** O total da dupla **nunca fica abaixo de 0** (aplicar `max(0, total)` ao gravar).
- **RN-23** A máquina não pontua.
- **RN-24** Todo ponto gera uma entrada no `ledger`, e `totalPoints` é atualizado na mesma transação.
- **RN-25** Durante o jogo, a dupla vê **só os próprios pontos**. O ranking da turma aparece **apenas** nas fases `planning` e `end` (e sempre no projetor/painel).
- **RN-26** **Visual dos pontos:** o mesmo número aparece como **barras de ouro** quando a dupla está no Bando e como **recompensa** no cartaz de Procurado quando está nos Piratas.

### 7.7 Cadeados, respostas e dicas
- **RN-27** Os 3 cadeados de cada lado são **sequenciais**: o cadeado N+1 só abre depois do N. Abrir um cadeado pode revelar uma **pista** usada no próximo.
- **RN-28** Normalização de respostas digitadas: minúsculas, sem acentos, sem espaços duplicados, sem pontuação. Aceitar todas as variantes listadas em `accept` no JSON.
- **RN-29** **Dicas:** Dica 1 (−2) dá um empurrão; Dica 2 (−4) quase entrega a resposta e só fica disponível depois da Dica 1. Pontos insuficientes não impedem a compra (o total só não fica negativo, RN-22).
- **RN-30** **Chamar o Professor:** 1 vez por episódio. Cria um `helpRequest` que pisca no painel. Não custa pontos.
- **RN-31** Após um erro, o botão de enviar fica bloqueado por **3 s** [PADRÃO], para evitar chute em sequência.

### 7.8 Evento do museu
- **RN-32** Dispara **automaticamente** num momento sorteado entre **8 e 12 min** após o início de `locks` [PADRÃO], ou antes, se a instrutora clicar em "Disparar evento". Só acontece **uma vez** por sessão.
- **RN-33** O evento atinge **todas as duplas ao mesmo tempo**, com overlay de tela cheia e sirene (onomatopeia *UÓ-UÓ!*). O cadeado em andamento fica pausado.
- **RN-34** No Episódio 1, o evento é o **Alarme Falso**: 3 alertas seguidos, **15 s cada**, resposta **Real** ou **Falso**. Tempo esgotado conta como erro.
- **RN-35** Acertar os 3: +1 ponto e puxão de 10. **Errar qualquer um:** a dupla fica **presa por 60 s** (tela de cela com uma curiosidade do episódio) e depois volta ao cadeado onde estava.
- **RN-36** No modo contra a máquina, a máquina acerta o evento em **80%** das vezes [PADRÃO].

### 7.9 Habilidades especiais
Espelhadas: cada poder de um lado tem um equivalente do outro.

| Função | 🔴 Bando | 🔵 Piratas | Efeito técnico |
|---|---|---|---|
| Atrapalhar | **Interferência** | **Âncora** | Interferência: congela a tela do rival por **10 s**. Âncora: os puxões do rival valem **metade** por **30 s**. |
| Proteger | **Disfarce** | **Escudo** | Disfarce: o rival **não vê a barra** por **30 s**. Escudo: **anula o próximo puxão** do rival. |
| Ajudar | **Plano B** | **Bússola** | Uma **Dica 1 grátis** no desafio atual. |

- **RN-37** **Como ganhar:** a cada **2 desafios resolvidos** (cadeados + evento), a dupla ganha uma habilidade aleatória do seu lado que ainda não tenha.
- **RN-38** **Recuperação:** se a barra estiver **a favor do rival**, a dupla ganha uma habilidade a **cada** desafio resolvido.
- **RN-39** Cada habilidade é usada **uma vez por episódio**. As habilidades não passam para o episódio seguinte.
- **RN-40** Habilidades de atrapalhar não funcionam contra a máquina de forma visual, mas a máquina **atrasa** o próximo desafio pelo mesmo tempo (10 s ou metade da força por 30 s).
- **RN-41** A máquina usa uma habilidade com **30% de chance** após cada desafio que resolve [PADRÃO].

### 7.10 A máquina (oponente robô)
- **RN-42** Roda no navegador da dupla que joga contra ela. Resolve cada desafio após um tempo sorteado dentro do intervalo do nível [PADRÃO]:

| Nível | Cada cadeado | Cofre |
|---|---|---|
| A (4º–5º) | 150–210 s | 300–420 s |
| B (6º–7º) | 120–180 s | 240–360 s |
| C (8º–9º) | 90–150 s | 200–300 s |

- **RN-43** A máquina nunca erra cadeados, só o evento (RN-36). Os tempos ficam em `gameRules.ts` para calibrar depois dos primeiros testes.
- **RN-44** Na UI, a máquina aparece como um personagem robô de HQ do lado oposto, com balões de provocação engraçados (ex.: *"Bip bop... calculando sua derrota."*).

### 7.11 Interação ao vivo da Narradora
- **RN-45 Transmissão ("Escute a Narradora"):** alguns desafios têm um passo marcado com `spokenClue`. Quando a dupla chega nele, vê *"🎧 Aguardando transmissão da Narradora..."*. O painel mostra quantas duplas estão esperando. Ao clicar em **"Iniciar transmissão"**:
  - a música de **todos** os computadores da sessão pausa;
  - aparece um balão gigante de HQ: **"TIRE O FONE! 🎧"**;
  - a instrutora fala a informação em voz alta (o texto exato está no roteiro do episódio, só no painel);
  - ao clicar em **"Encerrar transmissão"**, o overlay some, a música volta e o campo do desafio é liberado para quem estava esperando.
  - Pode ser repetida quantas vezes for preciso (duplas chegam em momentos diferentes).
- **RN-46 Congelar telas:** botão que cobre todas as telas com **"TODOS OS OLHOS NA NARRADORA!"** e pausa timers e música até ser desligado. O tempo congelado não conta (somar à `phaseStartedAt`).
- **RN-47 Entrega manual:** a instrutora pode dar a uma dupla: pontos (±), uma Dica 1 grátis ou uma habilidade.
- **RN-48 Pista sussurrada:** acontece fora da plataforma (a instrutora fala com a dupla). A plataforma não precisa registrar.

### 7.12 Duplas, nomes e avatar
- **RN-49** No primeiro acesso, a dupla escolhe **um codinome de cidade** e **um nome pirata** de listas fechadas (sem texto livre). Um nome usado fica indisponível na turma.
- **RN-50** A dupla monta **um avatar** por peças. O mesmo avatar troca de **figurino** conforme o lado (máscara + macacão vermelho no Bando; chapéu de palha + roupa pirata nos Piratas).
- **RN-51** **Nenhum dado pessoal** de aluno é pedido ou armazenado. Nada de nome real, foto, e-mail ou idade.
- **RN-52** PIN de 4 dígitos, criado pela dupla. 5 erros = bloqueio de 60 s. Reset só pela instrutora.

### 7.13 Fim do episódio e temporada
- **RN-53** Na fase `end`: resultado do confronto, pontos ganhos no episódio (lista animada), ranking da turma, **revelação histórica** em quadros de HQ e o **gancho** do próximo episódio.
- **RN-54** **Selo do episódio [pós-MVP]:** a dupla que resolveu o Cofre mais rápido na turma recebe o selo do episódio.
- **RN-55** **Episódio 5 (final) [pós-MVP]:** cooperativo, a turma inteira contra a máquina (Deep Blue). Especificar quando o conteúdo estiver pronto.
- **RN-56** Se as aulas terminarem em 11/12, a temporada tem 4 episódios: o ENIAC sai, a Apollo vira o episódio 3 e o Deep Blue vira o final (episódio 4). A ordem dos episódios fica em `src/content/season.ts`.

---

## 8. API (Vercel) e segurança

### 8.1 Rotas `/api/*` (Node, `firebase-admin`)

| Rota | Entrada | Saída | Regras |
|---|---|---|---|
| `POST /api/join-session` | `{ code }` | `{ sessionId, classId, level, episodeId, teams: [{teamId, cityName, pirateName, avatar}] , takenNames }` | Código existe, `status = "open"`, não expirado. Limitar a 20 req/min por IP. |
| `POST /api/team-create` | `{ code, cityName, pirateName, avatar, pin }` | `{ customToken, teamId }` | Nomes da lista e livres na turma; PIN = 4 dígitos; turma com menos de 10 duplas; cria `teams`, `private/auth` e `players`. |
| `POST /api/team-login` | `{ code, teamId, pin }` | `{ customToken }` | Confere hash; trata bloqueio (RN-52); cria/atualiza `players/{teamId}` com o novo `uid`. |
| `POST /api/team-reset-pin` | `{ classId, teamId }` + ID token do instrutor | `{ ok }` | Só o dono da turma ou admin. Limpa o PIN; a dupla define um novo no próximo login. |

Custom token: `uid = "team_" + teamId + "_" + sessionId`, claims `{ role: "team", teamId, classId, sessionId }`.

### 8.2 Regras do Firestore (resumo obrigatório)
- `allowedInstructors`: leitura do próprio e-mail por usuário logado com Google; escrita **só admin**.
- `instructors/{uid}`: o próprio usuário lê/cria; admin lê todos.
- `classes`: instrutor lê/escreve **onde `instructorId == auth.uid`**; admin lê todas. Duplas leem **só a própria turma** (`auth.token.classId`).
- `classes/*/teams`: leitura pela turma (dupla) e pelo instrutor dono. **Escrita** de `totalPoints/episodesPlayed/badges` só pelo instrutor dono ou por transação do próprio time (campos limitados). `private/*`: **nenhum** acesso de cliente.
- `ledger`: dupla cria entradas **só para si** e só durante uma sessão aberta; instrutor dono cria qualquer entrada.
- `sessions/{id}`: instrutor dono lê/escreve; dupla com `auth.token.sessionId == id` **só lê**.
- `players/{teamId}`: dupla escreve **só o próprio** (`auth.token.teamId == teamId`); instrutor dono lê/escreve todos.
- `matches/{id}`: dupla escreve **só se participa** (`redTeamId` ou `blueTeamId` == `auth.token.teamId`), inclusive os campos da máquina quando `machineSide != null`; instrutor dono lê/escreve.
- `helpRequests`, `feed`: dupla cria só com o próprio `teamId`; instrutor dono lê/atualiza.

### 8.3 Anti-trapaça (nível MVP)
- As respostas ficam no JSON do episódio, dentro do bundle. **Risco aceito no MVP** (alunos de 9 a 14 anos, uso em sala supervisionado).
- Mesmo assim: não exibir respostas em `console.log`, não deixar respostas em texto puro no HTML e minificar o build.
- **Pós-MVP:** mover a validação para `POST /api/check-answer`, com o conteúdo do episódio só no servidor.

### 8.4 LGPD
- Nenhum dado pessoal de aluno (RN-51).
- Dados de instrutor: nome e e-mail do Google, usados só para login.
- No fim da temporada, a admin pode **arquivar** turmas e apagar sessões antigas (botão no painel admin).

---

## 9. Telas, UX e direção de arte

### 9.1 Rotas

| Rota | Quem | Tela |
|---|---|---|
| `/` | aluno | Entrada com código da sessão (tela "capa de gibi"). |
| `/dupla` | aluno | Escolher dupla existente + PIN, ou criar nova. |
| `/dupla/nova` | aluno | Criador de avatar → escolha de cidade → escolha de nome pirata → PIN. |
| `/jogo` | aluno | Tela única do jogo, que muda conforme a fase (lobby, planning, locks, vault, end) e mostra os overlays. |
| `/instrutor` | instrutor | Login Google. |
| `/instrutor/turmas` | instrutor | Lista e CRUD de turmas. |
| `/instrutor/turmas/:classId` | instrutor | Duplas da turma (avatares, pontos, reset de PIN) + ranking + "Abrir sessão". |
| `/instrutor/sessao/:sessionId` | instrutor | **Painel da Narradora** (ao vivo). |
| `/projetor/:sessionId` | instrutor | **Tela do projetor** (abrir em outra janela). |
| `/admin` | admin | Allowlist de instrutores, escolas, limpeza de temporada. |

### 9.2 Telas do aluno (detalhe)
1. **Entrada:** fundo de página de HQ, logo "A Grande Caçada aos Códigos", campo grande de 4 caracteres e botão *ENTRAR!*. Erro de código em balão de fala.
2. **Escolher dupla:** grade de cartões com os avatares das duplas da turma. Clicou → teclado numérico grande para o PIN. Botão "Somos novos!" leva ao cadastro.
3. **Nova dupla:** criador de avatar com prévia ao vivo (alternar entre figurino Bando/Piratas), depois listas de nomes como "cartas" para escolher (nomes já usados aparecem riscados), depois PIN com confirmação.
4. **Lobby:** a ficha/cartaz da dupla girando, mensagem *"Aguardando a Narradora..."* e curiosidades.
5. **Planning:**
   - Página de abertura em HQ (3 a 4 quadros) apresentando a invenção, com narração opcional.
   - **Ranking da turma** (pódio animado).
   - **Escolha de lado:** dois cards grandes, Bando (vermelho, máscara) e Piratas (azul, chapéu de palha), cada um com a frase de missão.
   - **Escolha de modo:** "Contra pessoas" / "Contra a máquina".
   - Depois de formar os confrontos: tela **"VERSUS"** de luta, com os dois avatares e os nomes (ou o robô).
6. **Jogo (locks e vault):** layout fixo:
   - **Topo:** barra do cabo de guerra (vermelho × azul), timer da fase, nome das duas duplas, nó da corda animado.
   - **Esquerda:** trilha de cadeados (aberto / agora / trancado) e o Cofre; habilidades (cartas clicáveis).
   - **Centro:** o desafio atual, dentro de um quadro de HQ.
   - **Rodapé:** pontos da dupla (ouro ou recompensa), botões Dica 1, Dica 2 e Chamar o Professor, controle de volume.
   - **Balões do líder** (Professor ou Capitã) entram com a pista ao abrir um cadeado.
7. **Overlays (prioridade de cima para baixo):** Congelar telas › Transmissão "TIRE O FONE!" › Evento do museu › Prisão › Interferência (tela "chiando") › Aguardando a Narradora.
8. **End:** quadro gigante *VITÓRIA!* / *QUASE!* / *EMPATE!*, extrato de pontos do episódio, ranking, página de HQ com a revelação histórica e o gancho do próximo episódio.

### 9.3 Painel da Narradora
- **Cabeçalho:** turma, episódio, fase atual, timer da fase (com o tempo guia), **código da sessão** grande.
- **Controles:** `Liberar próxima fase`, `Formar confrontos`, `Disparar evento`, `Iniciar/Encerrar transmissão` (com o contador "N duplas aguardando"), `Congelar/Descongelar telas`, `Encerrar sessão`.
- **Roteiro da Narradora:** caixa recolhível com as falas do episódio, **incluindo as informações faladas** (ex.: o número da coluna rasgada por nível).
- **Duplas/confrontos:** para cada confronto: as duas duplas (ou robô), mini-barra, cadeado atual de cada lado, status (presa, congelada, aguardando transmissão, desconectada). Ações por dupla: liberar fase só para ela, trocar lado/par, dar pontos/dica/habilidade, ver extrato.
- **Chamados de ajuda:** lista que pisca, com botão "Atendido".
- **Feed:** linha do tempo ("Recife abriu o Cadeado 2", "Âncora Dourada usou Escudo").

### 9.4 Tela do projetor
Letras grandes, legível do fundo da sala:
- `lobby`: código da sessão gigante + avatares das duplas que já entraram.
- `planning`: ranking (pódio) + contagem de lados escolhidos.
- `locks`/`vault`: todos os confrontos com suas barras ao vivo e o timer da fase (**sem** pontuação individual).
- Overlays de transmissão e congelamento também aparecem aqui.
- `end`: ranking final animado e o gancho.

### 9.5 Avatar e nomes
```ts
type AvatarConfig = {
  skin: 1 | 2 | 3 | 4 | 5 | 6;        // tons de pele variados
  hair: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // inclui cabelos crespos, cacheados, lisos, curtos e longos
  hairColor: 1 | 2 | 3 | 4 | 5;
  eyes: 1 | 2 | 3 | 4;
  mouth: 1 | 2 | 3 | 4;
  accessory: 0 | 1 | 2 | 3;           // nenhum, óculos, fone, bandana
};
```
- Avatares desenhados em **SVG próprio**, montados por camadas (pele → olhos → boca → cabelo → acessório → figurino do lado). Nenhuma imagem externa.
- Figurino `red`: máscara vermelha nos olhos + gola de macacão vermelho. Figurino `blue`: chapéu de palha + lenço/colete azul.
- Garantir **diversidade** de tons de pele e cabelos.

**Listas (src/content/names.ts):**
- **Cidades (Bando):** Manaus, Recife, Floripa, Barueri, Salvador, Belém, Natal, Cuiabá, Curitiba, Fortaleza, Goiânia, Maceió, Vitória, Palmas, Macapá, Aracaju, Teresina, Porto Alegre, São Luís, Boa Vista.
- **Nomes piratas:** Tubarão Risonho, Âncora Dourada, Olho de Coral, Barba de Algas, Gaivota Veloz, Polvo Sabido, Canhão Gentil, Maré Alta, Bússola Torta, Concha Brilhante, Tempestade Mansa, Baleia Dançarina, Arpão Prateado, Caranguejo Valente, Vela Rasgada, Siri Sorrateiro, Estrela-do-Mar, Coral Vermelho, Mapa Perdido, Pérola Azul.

### 9.6 Direção de arte: estilo HQ
**O jogo tem que parecer um gibi vivo.** Diretrizes:
- **Quadros:** todo bloco de conteúdo é um "painel de HQ": borda preta grossa (3–4 px), cantos levemente irregulares (pode usar `clip-path` ou SVG), leve rotação (−1° a 1°) em alguns elementos.
- **Retícula:** fundos com padrão de pontinhos (halftone) via `radial-gradient` em CSS.
- **Balões de fala** (com rabicho) para todo texto de personagem: Professor, Capitã, robô, Narradora.
- **Onomatopeias** animadas (estourando em estrela/explosão) para eventos: *CLICK!* (cadeado aberto), *BOOM!* (Cofre), *UÓ-UÓ!* (alarme), *ZZZT!* (interferência), *TCHÁ!* (escudo), *ERROU!* (resposta errada, sem humilhar).
- **Tipografia (Google Fonts):** títulos e onomatopeias em **Bangers**; textos em **Nunito** (boa leitura para 4º ano). Corpo mínimo **18 px** no nível A e **16 px** nos demais.
- **Paleta:**
  - Papel: `#FFF8E7` · Tinta: `#111111`
  - Bando: `#E63946` (vermelho) · sombra `#9D0208`
  - Piratas: `#1D4ED8` (azul) · sombra `#0B2A7A`
  - Palha/ouro: `#F4C430` · Sucesso: `#2BB673` · Alerta: `#FF8C00`
- **Animações (Framer Motion):** entrada de quadros com "pop"; barra do cabo de guerra com mola; tremida de tela em erro; confete de estrelas em vitória. Respeitar `prefers-reduced-motion`.
- **Microcopy:** frases curtas, divertidas, sem humilhar quem erra. Tom de **suspense com humor**.
- **Acessibilidade:** contraste AA, foco visível, tudo operável por teclado, botões com no mínimo 44 px de altura, nunca depender só de cor (ícones + texto).

---

## 10. Áudio
- **Biblioteca:** Howler.js.
- **Música:** loop de fundo por contexto: lobby, Bando (tensão de assalto), Piratas (aventura marítima), Cofre (suspense acelerado), vitória e derrota. Volume padrão **30%**.
- **Efeitos:** clique, cadeado abrindo, erro, dica, puxão da barra, alarme, prisão, habilidade (uma por tipo), Cofre abrindo, vitória.
- **Origem:** só arquivos com licença livre para uso educacional (ex.: **Kenney.nl** — CC0, **Pixabay** — licença Pixabay). Registrar a fonte de cada arquivo em `public/audio/CREDITS.md`.
- **Controles:** slider de música e de efeitos + botão mudo no rodapé; preferência salva em `localStorage`.
- **Regras:** música pausa automaticamente durante **transmissão** e **congelamento** (RN-45, RN-46). Áudio só começa após o primeiro clique (política de autoplay).
- **Narração:** Web Speech API (`speechSynthesis`, voz `pt-BR`). No nível A, botão 🔊 "Ouvir" em todo enunciado e na abertura do episódio; nos níveis B e C, o botão existe mas é opcional. Se não houver voz pt-BR disponível, esconder o botão.
- Os alunos **usam fone de ouvido**: os efeitos tocam no computador de cada dupla.

---

## 11. Formato de conteúdo dos episódios

Cada episódio é um arquivo `src/content/episodes/epN.json`. O motor não conhece nenhum episódio: tudo vem do JSON. **Criar um episódio novo = adicionar um arquivo** (e registrar em `season.ts`).

### 11.1 Estrutura geral
```ts
type Episode = {
  id: string;                     // "ep1"
  number: number;
  title: string;                  // "Máquina Analítica"
  invention: { name: string; year: string; people: string[] };
  intro: { comic: ComicPanel[]; red: string; blue: string };  // abertura em HQ + frase de missão por lado
  dossier: string[];              // 3 a 5 frases curtas sobre a invenção (fase planning)
  curiosities: string[];          // usadas na prisão e na espera
  sides: {
    red:  { name: string; locks: [Challenge, Challenge, Challenge]; vault: Challenge };
    blue: { name: string; locks: [Challenge, Challenge, Challenge]; vault: Challenge };
  };
  event: MuseumEvent;
  narratorScript: NarratorScript;  // só aparece no painel
  reveal: ComicPanel[];             // revelação histórica (fase end)
  nextHook: string;                 // gancho do próximo episódio
};

type ComicPanel = { caption?: string; speech?: { who: "professor" | "capita" | "narradora" | "robo"; text: string }; art: string /* id de ilustração SVG */ };

type Level = "A" | "B" | "C";

type Challenge = {
  key: string;                    // único no episódio, ex.: "red-lock1"
  title: string;                  // ex.: "Dossiê do alvo"
  leaderLine: string;             // fala do Professor/Capitã ao começar
  type: ChallengeType;
  variants: Record<Level, ChallengeVariant>;
  reward?: { clue: string };      // pista mostrada ao abrir (usada no próximo desafio)
};

type ChallengeType =
  | "quiz"            // perguntas de múltipla escolha em sequência
  | "riddle"          // charada: escolha (choice) ou texto (text)
  | "anagram"         // montar a palavra com letras embaralhadas
  | "punchCardRead"   // ler os furos de um cartão e digitar a senha
  | "punchCardWrite"  // perfurar o cartão para formar a senha
  | "blockBuild"      // montar um programa com blocos para gerar um padrão
  | "blockDebug";     // achar e corrigir o erro de um programa de blocos

// Cada variante tem prompt, hint1, hint2 e os campos específicos do tipo (11.2).
// spokenClue (opcional): o desafio tem um passo que depende da transmissão da Narradora (RN-45).
```

### 11.2 Campos por tipo
- **quiz:** `questions: { q: string; options: string[]; correct: number }[]`. A dupla responde uma por vez; erro = −2 e a pergunta continua; acertar todas abre o cadeado.
- **riddle:** `mode: "choice" | "text"`, `text`, `options?` (choice), `accept: string[]` (text, já normalizado).
- **anagram:** `answer: string`, `mode: "perWordFirstFixed" | "perWord" | "whole"`. Letras como peças arrastáveis (também clicáveis). Espaços entre palavras já vêm marcados.
- **punchCardRead:** `rows: number` (10, linhas 0–9), `columns: number[]` (linha do furo de cada coluna), `decode: "digits" | "letters"` (letters: 1=A, 2=B…), `answer: string`, `spokenColumn: number` (índice da coluna "rasgada", cujo valor só a Narradora fala).
- **punchCardWrite:** `rows`, `target: number[]` (linhas que precisam ser furadas, coluna por coluna), `decode`, `shownTarget: string` (o que a mensagem mostra, ex.: "1 8 4 _"), `spokenColumn`. A dupla clica para furar **um furo por coluna**; validar comparando com `target`.
- **blockBuild:** `palette: Block[]`, `target: Symbol[]`, `maxBlocks: number`. Validar **executando** o programa (11.3) e comparando a saída com `target`. Contar todos os nós (inclusive `repeat`) para o limite.
- **blockDebug:** `program: Program` (com erro), `target: Symbol[]`, `editable: "symbols" | "counts" | "both"`. A dupla altera blocos/contagens (sem adicionar ou remover) e executa. Validar pela saída.

### 11.3 Mini-linguagem de blocos (tear)
```ts
type Symbol = "star" | "dot" | "line";   // ★ ● ▬
type Program = Node[];
type Node = { type: "weave"; symbol: Symbol } | { type: "repeat"; times: number; body: Node[] };
// run(program) → Symbol[]  (expande as repetições em ordem)
```
- Mostrar a execução **animada**: o tear "tece" símbolo por símbolo num tecido, e o padrão-alvo fica acima para comparação.
- Arrastar e soltar (com alternativa por clique), `repeat` aceita blocos dentro (aninhado só no nível C).

### 11.4 Evento do museu
```ts
type MuseumEvent = {
  type: "alarmTrueFalse";
  title: string;                 // "ALARME FALSO?"
  secondsPerItem: number;        // 15
  items: { text: string; isReal: boolean; explanation: string }[];
};
```

### 11.5 Roteiro da Narradora
```ts
type NarratorScript = {
  opening: string;
  spokenClues: Record<Level, { challengeKey: string; say: string }[]>;
  revealLines: string[];
  closing: string;
};
```

---

## 12. Conteúdo do Episódio 1 — Máquina Analítica

> Conteúdo **em revisão pela May**: textos, perguntas e níveis podem mudar sem mexer no motor. **Regra dos desafios espelhados:** mesmo conceito e mesma dificuldade para os dois lados, com ações opostas. Implementar exatamente este JSON em `src/content/episodes/ep1.json`.

```json
{
  "id": "ep1",
  "number": 1,
  "title": "Máquina Analítica",
  "invention": { "name": "Máquina Analítica", "year": "1843", "people": ["Ada Lovelace", "Charles Babbage"] },
  "intro": {
    "comic": [
      { "caption": "Museu Nacional da Tecnologia. Meia-noite.", "art": "museu-noite" },
      { "caption": "Na vitrine principal, uma máquina de engrenagens que nunca foi terminada...", "art": "vitrine-maquina" },
      { "speech": { "who": "professor", "text": "O segredo dessa máquina está nos cartões. Peguem os cartões e a vitrine é nossa." }, "art": "professor-sombra" },
      { "speech": { "who": "capita", "text": "Esse é o tesouro que ensinou o mundo a programar. Ninguém encosta nele!" }, "art": "capita-navio" }
    ],
    "red": "Abra a vitrine e capture a Máquina Analítica antes que os Piratas tranquem tudo.",
    "blue": "Proteja a Máquina Analítica e mantenha a vitrine trancada até o fim."
  },
  "dossier": [
    "A Máquina Analítica foi projetada por Charles Babbage no século 19.",
    "Ela recebia instruções por cartões perfurados, a mesma ideia do tear de Jacquard.",
    "Em 1843, Ada Lovelace publicou notas com um algoritmo para essa máquina.",
    "Por isso, Ada é lembrada como a primeira programadora da história."
  ],
  "curiosities": [
    "Ada Lovelace era filha do poeta Lord Byron.",
    "A Máquina Analítica nunca foi construída por completo na época.",
    "O tear de Jacquard, de 1804, usava cartões perfurados para tecer desenhos.",
    "A segunda terça-feira de outubro é o Dia de Ada Lovelace.",
    "Ada chamava seu jeito de pensar de \"ciência poética\".",
    "A máquina de Babbage foi projetada para funcionar a vapor."
  ],
  "sides": {
    "red": {
      "name": "Bando",
      "locks": [
        {
          "key": "red-lock1",
          "title": "Dossiê do alvo",
          "leaderLine": "Antes de qualquer assalto, a gente estuda o alvo. Respondam o dossiê.",
          "type": "quiz",
          "reward": { "clue": "Pista do Professor: o próximo segredo tem furos, mas não é peneira." },
          "variants": {
            "A": {
              "prompt": "Responda as 3 perguntas do dossiê.",
              "hint1": "Releia o dossiê da invenção: as respostas estão lá.",
              "hint2": "A primeira programadora tinha um nome de 3 letras.",
              "questions": [
                { "q": "Quem escreveu o primeiro algoritmo para uma máquina?", "options": ["Ada Lovelace", "Alan Turing", "Steve Jobs"], "correct": 0 },
                { "q": "Como a máquina recebia instruções?", "options": ["Cartões perfurados", "Teclado", "Tela de toque"], "correct": 0 },
                { "q": "Quem projetou a Máquina Analítica?", "options": ["Charles Babbage", "Bill Gates", "Santos Dumont"], "correct": 0 }
              ]
            },
            "B": {
              "prompt": "Responda as 3 perguntas do dossiê.",
              "hint1": "Releia o dossiê: tem um ano e uma máquina de tecer.",
              "hint2": "As notas de Ada são do século 19, e os cartões vieram de um tear.",
              "questions": [
                { "q": "Em que ano Ada publicou suas notas com o algoritmo?", "options": ["1843", "1943", "1993"], "correct": 0 },
                { "q": "De onde veio a ideia dos cartões perfurados?", "options": ["Do tear de Jacquard", "De um relógio", "Da imprensa"], "correct": 0 },
                { "q": "A Máquina Analítica foi construída por completo naquela época?", "options": ["Não", "Sim", "Só a parte do teclado"], "correct": 0 }
              ]
            },
            "C": {
              "prompt": "Responda as 3 perguntas do dossiê.",
              "hint1": "Pense no que Ada percebeu que ia além das contas.",
              "hint2": "O algoritmo de Ada calculava uma sequência de números com nome de matemático.",
              "questions": [
                { "q": "O que o algoritmo de Ada calculava?", "options": ["Números de Bernoulli", "Previsão do tempo", "Órbitas de planetas"], "correct": 0 },
                { "q": "O que Ada percebeu de diferente sobre a máquina?", "options": ["Que ela podia trabalhar com símbolos, não só números", "Que ela era muito rápida", "Que ela era barata"], "correct": 0 },
                { "q": "Uma linguagem de programação recebeu o nome de Ada em...", "options": ["1980", "1880", "2020"], "correct": 0 }
              ]
            }
          }
        },
        {
          "key": "red-lock2",
          "title": "A charada do cofre",
          "leaderLine": "O guarda deixou uma charada no painel de segurança. Decifrem!",
          "type": "riddle",
          "reward": { "clue": "Pista do Professor: agora leiam o cartão. Cada furo é um número." },
          "variants": {
            "A": {
              "prompt": "Quem sou eu?",
              "mode": "choice",
              "text": "Tenho furos, mas não sou peneira. Dou ordens, mas não falo. Ensinei um tear a desenhar flores. Quem sou eu?",
              "options": ["Cartão perfurado", "Teclado", "Peneira"],
              "accept": ["cartao perfurado"],
              "hint1": "Lembre como a máquina recebia instruções.",
              "hint2": "É um cartão... com furos!"
            },
            "B": {
              "prompt": "Digite a resposta da charada.",
              "mode": "text",
              "text": "Tenho furos, mas não sou peneira. Dou ordens, mas não falo. Ensinei um tear a desenhar flores. Quem sou eu?",
              "accept": ["cartao perfurado", "cartoes perfurados", "o cartao perfurado"],
              "hint1": "Lembre como a máquina recebia instruções.",
              "hint2": "São duas palavras: CARTÃO + P..."
            },
            "C": {
              "prompt": "Digite a resposta da charada.",
              "mode": "text",
              "text": "Sou filha de um poeta, mas troquei os versos pelos números. Escrevi um programa para uma máquina que ainda não existia. Quem sou eu?",
              "accept": ["ada lovelace", "ada", "augusta ada", "augusta ada king", "ada byron"],
              "hint1": "Ela é considerada a primeira programadora da história.",
              "hint2": "O nome dela tem 3 letras e o sobrenome começa com L."
            }
          }
        },
        {
          "key": "red-lock3",
          "title": "A senha do cartão",
          "leaderLine": "O cartão abre a vitrine. Leiam os furos... mas cuidado, ele está rasgado.",
          "type": "punchCardRead",
          "variants": {
            "A": { "prompt": "Cada coluna tem um furo. A linha do furo é o número. Digite a senha.", "rows": 10, "columns": [8, 4, 3], "decode": "digits", "answer": "843", "spokenColumn": 2, "hint1": "Comece pela coluna da esquerda e veja em que linha está o furo.", "hint2": "As duas primeiras colunas formam 8 e 4." },
            "B": { "prompt": "Cada coluna tem um furo. A linha do furo é o número. Digite a senha.", "rows": 10, "columns": [1, 8, 4, 3], "decode": "digits", "answer": "1843", "spokenColumn": 3, "hint1": "A senha é um ano importante para Ada.", "hint2": "Começa com 1 8 4..." },
            "C": { "prompt": "Os furos viram números, e os números viram letras (1=A, 2=B, 3=C...). Digite a senha.", "rows": 10, "columns": [1, 4, 1], "decode": "letters", "answer": "ADA", "spokenColumn": 2, "hint1": "Transforme cada número na letra do alfabeto.", "hint2": "1 = A e 4 = D." }
          }
        }
      ],
      "vault": {
        "key": "red-vault",
        "title": "O Cofre: o programa da Ada",
        "leaderLine": "O cofre só abre se o tear tecer o padrão certo. Programem o tear!",
        "type": "blockBuild",
        "variants": {
          "A": { "prompt": "Monte um programa que teça o padrão. Use no máximo 3 blocos.", "palette": ["star", "dot", "repeat"], "target": ["star","dot","star","dot","star","dot"], "maxBlocks": 3, "hint1": "O padrão ★● se repete. Que bloco repete coisas?", "hint2": "Repita 3 vezes [★ ●]." },
          "B": { "prompt": "Monte um programa que teça o padrão. Use no máximo 4 blocos.", "palette": ["star", "dot", "repeat"], "target": ["star","star","dot","star","star","dot","star","star","dot","star","star","dot"], "maxBlocks": 4, "hint1": "Ache o pedaço que se repete e conte quantas vezes.", "hint2": "Repita 4 vezes [★ ★ ●]." },
          "C": { "prompt": "Monte um programa que teça as 3 fileiras. Use no máximo 5 blocos.", "palette": ["star", "dot", "line", "repeat"], "target": ["star","dot","star","dot","line","star","dot","star","dot","line","star","dot","star","dot","line"], "maxBlocks": 5, "hint1": "Dá para colocar uma repetição dentro de outra.", "hint2": "Repita 3 vezes [ Repita 2 vezes [★ ●], ▬ ]." }
        }
      }
    },
    "blue": {
      "name": "Piratas",
      "locks": [
        {
          "key": "blue-lock1",
          "title": "Diário de bordo",
          "leaderLine": "Todo pirata conhece o tesouro que protege. Completem o diário de bordo!",
          "type": "quiz",
          "reward": { "clue": "Pista da Capitã: chegou uma mensagem numa garrafa, mas as letras estão bagunçadas." },
          "variants": {
            "A": {
              "prompt": "Responda as 3 perguntas do diário de bordo.",
              "hint1": "Releia o dossiê da invenção: as respostas estão lá.",
              "hint2": "A primeira programadora tinha um nome de 3 letras.",
              "questions": [
                { "q": "Quem escreveu o primeiro algoritmo para uma máquina?", "options": ["Ada Lovelace", "Alan Turing", "Steve Jobs"], "correct": 0 },
                { "q": "Como a máquina recebia instruções?", "options": ["Cartões perfurados", "Teclado", "Tela de toque"], "correct": 0 },
                { "q": "Quem projetou a Máquina Analítica?", "options": ["Charles Babbage", "Bill Gates", "Santos Dumont"], "correct": 0 }
              ]
            },
            "B": {
              "prompt": "Responda as 3 perguntas do diário de bordo.",
              "hint1": "Releia o dossiê: tem um ano e uma máquina de tecer.",
              "hint2": "As notas de Ada são do século 19, e os cartões vieram de um tear.",
              "questions": [
                { "q": "Em que ano Ada publicou suas notas com o algoritmo?", "options": ["1843", "1943", "1993"], "correct": 0 },
                { "q": "De onde veio a ideia dos cartões perfurados?", "options": ["Do tear de Jacquard", "De um relógio", "Da imprensa"], "correct": 0 },
                { "q": "A Máquina Analítica foi construída por completo naquela época?", "options": ["Não", "Sim", "Só a parte do teclado"], "correct": 0 }
              ]
            },
            "C": {
              "prompt": "Responda as 3 perguntas do diário de bordo.",
              "hint1": "Pense no que Ada percebeu que ia além das contas.",
              "hint2": "O algoritmo de Ada calculava uma sequência de números com nome de matemático.",
              "questions": [
                { "q": "O que o algoritmo de Ada calculava?", "options": ["Números de Bernoulli", "Previsão do tempo", "Órbitas de planetas"], "correct": 0 },
                { "q": "O que Ada percebeu de diferente sobre a máquina?", "options": ["Que ela podia trabalhar com símbolos, não só números", "Que ela era muito rápida", "Que ela era barata"], "correct": 0 },
                { "q": "Uma linguagem de programação recebeu o nome de Ada em...", "options": ["1980", "1880", "2020"], "correct": 0 }
              ]
            }
          }
        },
        {
          "key": "blue-lock2",
          "title": "Mensagem na garrafa",
          "leaderLine": "A tempestade bagunçou a mensagem da garrafa. Arrumem as letras!",
          "type": "anagram",
          "reward": { "clue": "Pista da Capitã: agora furem o cartão com a senha para trancar a vitrine." },
          "variants": {
            "A": { "prompt": "Arrume as letras para descobrir a palavra secreta.", "answer": "CARTÃO PERFURADO", "mode": "perWordFirstFixed", "hint1": "É o que a máquina usava para receber instruções.", "hint2": "A primeira palavra é CARTÃO." },
            "B": { "prompt": "Arrume as letras para descobrir a palavra secreta.", "answer": "CARTÃO PERFURADO", "mode": "perWord", "hint1": "É o que a máquina usava para receber instruções.", "hint2": "A primeira palavra é CARTÃO." },
            "C": { "prompt": "Arrume as letras para descobrir o nome secreto.", "answer": "ADA LOVELACE", "mode": "whole", "hint1": "É a primeira programadora da história.", "hint2": "O primeiro nome tem 3 letras: A _ A." }
          }
        },
        {
          "key": "blue-lock3",
          "title": "Tranque o cartão",
          "leaderLine": "Furem o cartão com a senha para trancar a vitrine... mas a garrafa molhou o último número!",
          "type": "punchCardWrite",
          "variants": {
            "A": { "prompt": "Fure um buraco por coluna para formar a senha.", "rows": 10, "target": [8, 4, 3], "decode": "digits", "shownTarget": "8 4 _", "spokenColumn": 2, "hint1": "Em cada coluna, fure a linha do número.", "hint2": "Na 1ª coluna, fure a linha 8." },
            "B": { "prompt": "Fure um buraco por coluna para formar a senha.", "rows": 10, "target": [1, 8, 4, 3], "decode": "digits", "shownTarget": "1 8 4 _", "spokenColumn": 3, "hint1": "Em cada coluna, fure a linha do número.", "hint2": "A senha é um ano importante para Ada." },
            "C": { "prompt": "Transforme as letras em números (A=1, B=2...) e fure o cartão.", "rows": 10, "target": [1, 4, 1], "decode": "letters", "shownTarget": "A D _", "spokenColumn": 2, "hint1": "A=1, B=2, C=3, D=4...", "hint2": "A senha forma o nome da primeira programadora." }
          }
        }
      ],
      "vault": {
        "key": "blue-vault",
        "title": "O Cofre: conserte o tear",
        "leaderLine": "O Bando sabotou o programa do tear! Achem o erro e consertem antes que o cofre abra.",
        "type": "blockDebug",
        "variants": {
          "A": { "prompt": "O tear deveria tecer o padrão, mas tem um bloco errado. Ache e conserte.", "program": [ { "type": "repeat", "times": 3, "body": [ { "type": "weave", "symbol": "star" }, { "type": "weave", "symbol": "star" } ] } ], "target": ["star","dot","star","dot","star","dot"], "editable": "symbols", "hint1": "Compare o que o tear tece com o padrão: onde fica diferente?", "hint2": "O segundo bloco dentro da repetição deveria ser ●." },
          "B": { "prompt": "O tear deveria tecer o padrão, mas tem um erro. Ache e conserte.", "program": [ { "type": "repeat", "times": 3, "body": [ { "type": "weave", "symbol": "star" }, { "type": "weave", "symbol": "star" }, { "type": "weave", "symbol": "dot" } ] } ], "target": ["star","star","dot","star","star","dot","star","star","dot","star","star","dot"], "editable": "counts", "hint1": "Os blocos estão certos. Conte quantas vezes o padrão aparece.", "hint2": "A repetição deveria ser 4 vezes." },
          "C": { "prompt": "O tear deveria tecer as 3 fileiras, mas tem um erro escondido. Ache e conserte.", "program": [ { "type": "repeat", "times": 3, "body": [ { "type": "repeat", "times": 3, "body": [ { "type": "weave", "symbol": "star" }, { "type": "weave", "symbol": "dot" } ] }, { "type": "weave", "symbol": "line" } ] } ], "target": ["star","dot","star","dot","line","star","dot","star","dot","line","star","dot","star","dot","line"], "editable": "both", "hint1": "Conte quantos ★● existem em cada fileira do padrão.", "hint2": "A repetição de dentro deveria ser 2 vezes." }
        }
      }
    }
  },
  "event": {
    "type": "alarmTrueFalse",
    "title": "ALARME FALSO?",
    "secondsPerItem": 15,
    "items": [
      { "text": "Alguém está usando um celular para hackear a Máquina Analítica!", "isReal": false, "explanation": "Falso! Em 1843 não existia celular, e a máquina não tem conexão nenhuma." },
      { "text": "Um tear na sala ao lado começou a tecer sozinho, seguindo cartões!", "isReal": true, "explanation": "Real! É assim que o tear de Jacquard funciona: ele segue os cartões perfurados." },
      { "text": "A máquina foi ligada na tomada e está superaquecendo!", "isReal": false, "explanation": "Falso! A máquina de Babbage foi projetada para funcionar a vapor, não com eletricidade." }
    ]
  },
  "narratorScript": {
    "opening": "Boa noite, equipes. O museu fecha à meia-noite... e hoje o alvo é a Máquina Analítica. Bando: vocês querem os cartões. Piratas: vocês protegem o tesouro. Escolham seus lados!",
    "spokenClues": {
      "A": [ { "challengeKey": "red-lock3", "say": "O último furo do cartão está na linha 3." }, { "challengeKey": "blue-lock3", "say": "O número que molhou é o 3." } ],
      "B": [ { "challengeKey": "red-lock3", "say": "O último furo do cartão está na linha 3." }, { "challengeKey": "blue-lock3", "say": "O número que molhou é o 3." } ],
      "C": [ { "challengeKey": "red-lock3", "say": "O último furo do cartão está na linha 1." }, { "challengeKey": "blue-lock3", "say": "A letra que molhou é a mesma da primeira: A." } ]
    },
    "revealLines": [
      "Sabiam que a repetição que vocês usaram no tear já aparecia nas notas da Ada, em 1843?",
      "Ela descrevia ciclos de operações: a máquina repetindo passos. É a mesma ideia de um loop na programação de hoje."
    ],
    "closing": "Uma mensagem cifrada foi interceptada no museu... e ninguém consegue ler. Semana que vem: a Máquina Enigma."
  },
  "reveal": [
    { "caption": "Em 1843, Ada Lovelace escreveu um algoritmo para uma máquina que nem existia ainda.", "art": "ada-escrevendo" },
    { "caption": "Nas notas, ela já falava em repetir ciclos de operações: o avô do loop!", "art": "tear-ciclos" },
    { "speech": { "who": "narradora", "text": "Hoje vocês programaram como a primeira programadora da história." }, "art": "narradora" }
  ],
  "nextHook": "Uma mensagem cifrada foi interceptada... Semana que vem: a Máquina Enigma. 🔐"
}
```

### 12.1 Notas de implementação do Ep. 1
- No `punchCardRead`, a coluna `spokenColumn` aparece **rasgada** (borda irregular, sem furo visível) com o selo "🎧 escute a Narradora".
- No `punchCardWrite`, a posição `spokenColumn` aparece como `_` e o cartão só aceita envio depois da transmissão.
- Os ids de `art` são ilustrações SVG originais em `src/assets/comic/`. No MVP, podem ser composições simples (silhuetas, formas, cenários em estilo HQ); melhorar depois.

---

## 13. Requisitos não funcionais
- **RNF-01 Desempenho:** primeira carga em menos de 3 s numa rede escolar comum; puxão da barra visível no rival em menos de 1 s.
- **RNF-02 Escala:** até 10 duplas por sessão e várias sessões ao mesmo tempo (5 escolas). Manter as leituras do Firestore baixas: escutar só os documentos da própria sessão/confronto.
- **RNF-03 Resiliência:** queda de internet mostra o aviso "Reconectando..." e o jogo continua do mesmo ponto ao voltar. Nunca perder pontos já gravados.
- **RNF-04 Navegador:** Chrome desktop; 1366×768 sem rolagem horizontal na tela de jogo.
- **RNF-05 Acessibilidade:** seção 9.6.
- **RNF-06 Idioma:** toda a interface em português do Brasil.
- **RNF-07 Configuração:** todos os números de regra (pontos, forças, tempos, chances) em `src/config/gameRules.ts`.
- **RNF-08 Qualidade:** TypeScript estrito; ESLint + Prettier; testes unitários (Vitest) para o motor (seção 15.1).

---

## 14. Plano de implementação (ordem para o Claude Code)

> Prazo: estreia na semana de **17/11**. Trabalhar em etapas pequenas e testáveis. Ao fim de cada etapa, rodar os critérios de aceite.

### Etapa 0 — Setup
- Vite + React + TS + Tailwind + Router + Zustand + Framer Motion + Howler.
- Projeto Firebase (Auth Google + Firestore), regras iniciais, `firebase.ts`.
- Pasta `api/` da Vercel com `firebase-admin`.
- Fontes Bangers e Nunito, paleta e componentes base de HQ (`ComicPanel`, `SpeechBubble`, `Onomatopoeia`, `ComicButton`, fundo halftone).
- ✅ *Aceite:* app sobe na Vercel; página de teste mostra um quadro de HQ com balão e onomatopeia animada.

### Etapa 1 — Instrutores, admin e turmas
- Login Google + allowlist (`/admin` para adicionar e-mails).
- CRUD de turmas (`/instrutor/turmas`), seed das escolas.
- ✅ *Aceite:* e-mail fora da allowlist não entra; instrutor A não vê turma do instrutor B; admin adiciona instrutor e ele consegue entrar.

### Etapa 2 — Sessão e duplas
- Abrir sessão (código), tela do projetor com o código.
- `/api/join-session`, `/api/team-create`, `/api/team-login`, `/api/team-reset-pin`.
- Criador de avatar, escolha de nomes, PIN, lobby.
- ✅ *Aceite:* em 2 abas anônimas, duas duplas entram com o código; nomes usados ficam bloqueados; PIN errado 5 vezes bloqueia por 60 s; reset de PIN funciona; sem sessão aberta aparece "A Narradora ainda não deu o sinal".

### Etapa 3 — Motor de episódio e desafios
- Loader do JSON + tipos; motor de fases controlado pela sessão.
- Componentes dos 7 tipos de desafio; executor de blocos; normalização de respostas; dicas; pontos + ledger.
- Implementar o **Ep. 1** inteiro (dois lados, três níveis).
- ✅ *Aceite:* jogando sozinho (modo máquina desligado), dá para concluir os 3 cadeados e o Cofre dos dois lados nos níveis A, B e C; respostas erradas descontam 2; dicas descontam 2/4; testes unitários do executor e da normalização passando.

### Etapa 4 — Confrontos: PvP e máquina
- Escolha de lado e modo; "Formar confrontos" (RN-12); tela VERSUS.
- Documento de `match`, barra por transação, travas (RN-17), vantagem do Cofre (RN-18), vitória/empate (RN-19, RN-20).
- Máquina (RN-42 a RN-44); habilidades (7.9).
- ✅ *Aceite:* em 2 navegadores, Bando × Piratas veem a mesma barra mexendo em tempo real; puxões simultâneos não se perdem; a barra não passa de ±60 antes do Cofre; quem resolve o Cofre primeiro vence; com número ímpar de duplas, a que sobra joga contra a máquina; cada habilidade tem o efeito descrito.

### Etapa 5 — Painel da Narradora e interação ao vivo
- Painel completo (9.3): fases, evento, transmissão, congelar, ajustes, chamados, feed, roteiro.
- Evento do museu automático + manual; prisão.
- ✅ *Aceite:* nada avança sem clique da instrutora; evento dispara uma vez só; quem erra fica preso 60 s vendo uma curiosidade; transmissão pausa a música e mostra "TIRE O FONE!" em todas as telas; congelar pausa timers; chamado de ajuda aparece no painel.

### Etapa 6 — Projetor, ranking e fim do episódio
- Tela do projetor por fase (9.4); ranking por turma; tela de fim com extrato, revelação e gancho.
- ✅ *Aceite:* durante `locks`/`vault`, o aluno não vê o ranking; na fase `end`, o ranking bate com a soma do ledger; total nunca fica negativo.

### Etapa 7 — Polimento de jogo
- Áudio completo (seção 10) + narração pt-BR.
- Animações, onomatopeias, robô com falas, telas de vitória/derrota caprichadas.
- ✅ *Aceite:* teste em um computador da escola (Chrome, 1366×768) sem travar; volume e mudo funcionam e ficam salvos.

### Etapa 8 — Ensaio geral
- Simular uma aula completa com 4 abas (2 PvP + 1 contra máquina + 1 instrutora) + projetor.
- ✅ *Aceite:* a aula inteira cabe em 50 min seguindo os tempos guia, sem nenhum erro no console.

---

## 15. Testes

### 15.1 Unitários (Vitest), obrigatórios
- `run(program)`: repetições simples e aninhadas; padrões dos 3 níveis do Ep. 1; o programa com erro do `blockDebug` **não** gera o alvo, e o corrigido gera.
- Contagem de blocos para `maxBlocks`.
- `normalizeAnswer`: acentos, maiúsculas, espaços e pontuação.
- Formação de confrontos (RN-12): pares, sobras contra a máquina, bônus de lado vazio.
- Aplicação de puxão com efeitos (Âncora, Escudo) e travas da barra.
- Pontuação: ledger + total nunca negativo.

### 15.2 Checklist manual antes da estreia
- [ ] Login de instrutor e criação de turma.
- [ ] Sessão aberta, código no projetor, duplas entrando.
- [ ] Nova dupla: avatar, nomes, PIN. Dupla antiga: PIN.
- [ ] PvP com barra em tempo real em dois computadores.
- [ ] Contra a máquina em cada nível.
- [ ] Evento, prisão, transmissão, congelar telas.
- [ ] Dicas, chamado de ajuda, habilidades.
- [ ] Fim do episódio e ranking.
- [ ] Recarregar a página no meio do jogo e voltar ao mesmo ponto.
- [ ] Internet cai e volta.

---

## 16. Decisões [PADRÃO] para a May validar
Todas ficam em `gameRules.ts` ou no JSON e são fáceis de mudar:
1. Máximo de **10 duplas** por turma.
2. Tempos guia: `planning` 5 · `locks` 20 · `vault` 12 · `end` 10 (o evento virou interrupção dentro de `locks`).
3. Forças de puxão: cadeado **15**, evento **10**; barra travada em **±60** até o Cofre.
4. Vantagem do Cofre: **Dica 1 grátis** para quem está à frente.
5. Pontos extras: **+1** por cadeado aberto e **+1** por acertar o evento (além do +3 da primeira dupla).
6. Bônus de lado vazio quando a diferença é de **2 ou mais** duplas.
7. Bloqueio de **3 s** após resposta errada.
8. Evento automático entre **8 e 12 min** de `locks`; máquina acerta o evento em **80%**.
9. Tempos da máquina por nível (RN-42) e **30%** de chance de usar habilidade.
10. Música padrão em **30%** de volume.

---

## 17. Backlog pós-MVP (um episódio por semana)
- **Ep. 2 — Máquina Enigma:** Bando decifra mensagens; Piratas cifram as transmissões (cifra de substituição/César). Novo tipo de desafio: `cipher`.
- **Ep. 3 — ENIAC:** Bando liga os cabos na ordem certa; Piratas acham as ligações sabotadas. Novo tipo: `wiring`. (Lembrar: o ENIAC calculava em decimal, não em binário.)
- **Ep. 4 — Apollo 11:** alarmes no pouso; Bando prioriza tarefas para chegar ao cofre; Piratas mantêm o sistema estável. Novo tipo: `priority`.
- **Ep. 5 — Deep Blue (final):** a turma toda contra a máquina, cooperando numa barra única. Novo modo: `coop`.
- Selo do episódio, galeria de selos e medalha/certificado digital da temporada (com avatar e nomes da dupla).
- Validação de respostas no servidor.
- Relatório da turma para a instrutora (acertos por desafio, uso de dicas).

---

## 18. Estrutura de pastas sugerida
```
/
├─ api/                      # Vercel functions (firebase-admin)
│  ├─ join-session.ts
│  ├─ team-create.ts
│  ├─ team-login.ts
│  └─ team-reset-pin.ts
├─ public/audio/             # músicas e efeitos + CREDITS.md
├─ src/
│  ├─ app/                   # rotas e layouts
│  ├─ components/comic/      # ComicPanel, SpeechBubble, Onomatopoeia, Halftone...
│  ├─ components/game/       # TugBar, LockTrail, AbilityCards, Overlays...
│  ├─ components/challenges/ # Quiz, Riddle, Anagram, PunchCardRead, PunchCardWrite, BlockBuild, BlockDebug
│  ├─ components/avatar/     # Avatar (SVG em camadas) + AvatarBuilder
│  ├─ features/instructor/   # turmas, painel, projetor, admin
│  ├─ engine/                # fases, pontuação, barra, habilidades, máquina, executor de blocos
│  ├─ content/
│  │  ├─ episodes/ep1.json
│  │  ├─ names.ts
│  │  └─ season.ts
│  ├─ config/gameRules.ts
│  ├─ lib/firebase.ts
│  └─ audio/
├─ firestore.rules
└─ SPEC.md                   # este arquivo
```
