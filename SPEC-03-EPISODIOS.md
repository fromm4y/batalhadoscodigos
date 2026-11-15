# SPEC 03 — Episódios 2 a 5

> **Para o Claude Code:** complementa o `SPEC.md`, o `VISUAL.md` e o `SPEC-02-PLATAFORMA.md`.
> O conteúdo de cada episódio já está pronto em `ep2.json`, `ep3.json`, `ep4.json` e `ep5.json` (copiar para `src/content/episodes/`).
> Todas as respostas foram **verificadas por script** (cifras, contas dos cabos, combinação ótima e árvore de jogadas). Crie testes que repitam essas verificações (seção 7).
> **Ordem:** um episódio por vez (Ep. 2 → 3 → 4 → 5). Ao fim de cada um, pare para a May testar.
> Regra dos **desafios espelhados** continua valendo: mesmo conceito e dificuldade, ações opostas.

Campos novos que todos os JSON já trazem (definidos no SPEC-02, Parte B): `teaser`, `recapOfThis`, `card` e, no Ep. 5, `mode: "coop"`.

---

## 1. Ep. 2 — Máquina Enigma · novo tipo `cipher`

| | 🔴 Bando | 🔵 Piratas |
|---|---|---|
| Cadeado 1 | Quiz "Dossiê do alvo" | Quiz "Diário de bordo" |
| Cadeado 2 | **Decifrar** uma palavra | **Cifrar** uma palavra |
| Cadeado 3 | Decifrar com a **chave falada** pela Narradora | Cifrar com a **chave falada** |
| Cofre | **Quebrar** o código sem chave (testar até fazer sentido; nível C com *crib*) | **Verificar**: entre 3–4 mensagens, só uma foi cifrada com a chave do dia |

### Tipo `cipher` (cifra de deslocamento, A–Z, sem acentos)
```ts
type CipherVariant = {
  prompt: string; hint1: string; hint2: string;
  mode: "decode" | "encode" | "crack" | "verify";
  shift: number;                // chave (1–25)
  wheel: "preset" | "free";    // preset: disco já vem girado na chave; free: a dupla gira
  text?: string;               // decode/crack: texto cifrado · encode: texto original
  answer?: string;             // resposta esperada (não existe em verify)
  options?: string[];          // verify: mensagens cifradas; a correta é options[correct]
  correct?: number;
  crib?: string;               // crack nível C: palavra que sabemos estar no começo
  spokenKey?: boolean;         // chave só chega pela transmissão (RN-45)
};
```
**UI — Disco de cifra (componente central do episódio):**
- Dois anéis concêntricos com o alfabeto: o de fora fixo (texto original), o de dentro gira (texto cifrado). Girar por arrastar, setas ou teclado. Mostrar o número da chave atual.
- `preset`: disco já girado e travado. `free`: começa em 0.
- `spokenKey`: o número da chave fica oculto ("🎧 chave pela transmissão") até a Narradora encerrar a transmissão; depois a dupla gira sozinha (a chave **não** aparece na tela, só no painel).
- Abaixo do disco: o texto em "fita de telégrafo" e caixinhas para digitar letra por letra (espaços já marcados).
- `crack`: um painel **"Teste rápido"** mostra o texto decifrado com a chave atual do disco, ao vivo. Quando forma palavras, a dupla digita a mensagem (normalizar como RN-28).
- `verify`: as opções aparecem como cartões de rádio; a dupla decifra cada uma com o disco e escolhe a verdadeira. Erro = −2 (RN-31).
- Validação: comparar resposta normalizada com `answer` (ou índice `correct`).

---

## 2. Ep. 3 — ENIAC · novo tipo `wiring`

| | 🔴 Bando | 🔵 Piratas |
|---|---|---|
| Cadeado 1 | Quiz | Quiz |
| Cadeado 2 | Charada (`riddle`) | Anagrama |
| Cadeado 3 | **Ligar** os módulos na ordem certa (entrada falada) | **Achar a sabotagem**: módulos trocados (entrada falada) |
| Cofre | Ligar módulos; nos níveis B e C **sobra um módulo pegadinha** | Consertar o cálculo trocando módulos de lugar |

### Tipo `wiring`
```ts
type WiringVariant = {
  prompt: string; hint1: string; hint2: string;
  mode: "build" | "debug";
  start: number;                // número de entrada
  modules: string[];            // "+3" | "x2" | "-1" ... (x = multiplicação)
  slots: number;                // quantos módulos entram no circuito (pode ser < modules.length)
  target: number;               // número que precisa chegar no fim
  chain?: string[];             // debug: ordem sabotada inicial
  startSpoken?: boolean;        // entrada só pela transmissão
};
```
**UI — Painel do ENIAC:** fundo de armário de metal com válvulas acesas. Esquerda: tomada **ENTRADA** com o número. Centro: `slots` encaixes ligados por cabos. Direita: visor **SAÍDA**.
- `build`: arrastar módulos (placas com o operador grande) para os encaixes; cabos animados ligam tudo.
- `debug`: os módulos já estão nos encaixes (`chain`); a dupla **troca dois de lugar** clicando um e depois o outro. Não pode adicionar nem remover.
- Botão **"Ligar a máquina"**: a corrente percorre os cabos e cada módulo mostra o valor intermediário (ex.: `2 → +3 → 5 → ×2 → 10`). Isso é o aprendizado: depurar passo a passo.
- Certo se `run(start, encaixes) === target`. Erro = −2 e a válvula "queima" (animação).
- `startSpoken`: a tomada de entrada mostra "🎧 ?" até a transmissão; depois a dupla digita o número ouvido numa caixinha da tomada.

> Lembrete histórico: o ENIAC calculava em **decimal**. Os módulos usam números decimais de propósito.

---

## 3. Ep. 4 — Apollo 11 · novo tipo `priority`

| | 🔴 Bando | 🔵 Piratas |
|---|---|---|
| Cadeado 1 | Quiz | Quiz |
| Cadeado 2 | Charada | Anagrama |
| Cadeado 3 | Escolher **só as tarefas essenciais** do assalto (quantidade falada) | Manter **só os sistemas essenciais** do pouso (quantidade falada) |
| Cofre | Plano com **limite de minutos** e máximo de estrelas | Sistemas com **limite de energia** e máximo de estrelas |

### Tipo `priority`
```ts
type Task = { id: string; label: string; cost?: number; value?: number };
type PriorityVariant = {
  prompt: string; hint1: string; hint2: string;
  mode: "select" | "budget";
  tasks: Task[];
  // select
  pick?: number; pickSpoken?: boolean; correct?: string[];
  // budget
  capacity?: number; capacityLabel?: string; valueLabel?: string; optimalValue?: number;
};
```
**UI — Console de missão:** visual de painel da NASA dos anos 60 (botões, luzes, letreiro verde), com o alarme **1202** piscando no topo.
- `select`: tarefas como chaves de liga/desliga. Um contador "x de N" (N oculto até a transmissão quando `pickSpoken`). Certo se o conjunto escolhido == `correct`.
- `budget`: cada tarefa mostra custo (⏱️ ou ⚡) e valor (⭐). Uma barra de capacidade enche conforme liga; não deixa passar do limite. Placar de estrelas ao vivo. Botão **"Confirmar plano"**: certo se a soma de estrelas == `optimalValue` (aceitar **qualquer** combinação que alcance o ótimo e caiba no limite).
- Erro mostra a frase "Ainda dá para fazer melhor!" com quantas estrelas faltam (sem dizer quais tarefas).

---

## 4. Ep. 5 — Deep Blue · modo cooperativo `coop` + tipos `boardChoice` e `gameTree`

### 4.1 Regras do modo `coop`
- **RN-C1** Não tem escolha de lado nem formação de confrontos: na fase `planning`, a turma inteira vira **"A Aliança"** (Bando + Piratas). O avatar usa um figurino misto (máscara + chapéu).
- **RN-C2** Um único documento `sessions/{id}/matches/coop` com `{ classBar: number, machineBar: number, solvedBy: {teamId: string[]} }`.
- **RN-C3** A barra vira **"Turma × Máquina"**: cada desafio resolvido por **qualquer** dupla puxa a barra pela turma. A força de cada puxão = `15 / número de duplas conectadas` [PADRÃO], para turmas grandes e pequenas terem o mesmo ritmo.
- **RN-C4** A máquina puxa sozinha no ritmo do nível (RN-42), rodando no cliente eleito por transação (mesmo padrão do alarme no SPEC-02 A1).
- **RN-C5** A turma vence se, ao abrir o Cofre, **pelo menos metade das duplas** resolver o Cofre antes da máquina [PADRÃO]. O projetor mostra o contador "x de y duplas".
- **RN-C6** Pontos: cada dupla ganha os pontos normais de cadeado (+1, primeira +3) e, se a turma vencer, **+5 para todas**. Se a máquina vencer, **+2 para todas** (participação).
- **RN-C7** **Ajuda entre duplas**: quem terminou o Cofre vira **"Reforço"** e pode mandar **uma** dica (a Dica 1 do desafio, sem custo) para uma dupla que ainda não terminou. Isso estimula cooperação real.
- **RN-C8** Evento do museu ("XEQUE?"): igual aos outros episódios; acertar puxa pela turma.
- **RN-C9** Fim da temporada: depois da revelação, mostrar **ranking final da temporada**, medalhas e certificados (SPEC-02 Parte E), e a mensagem final em vez de gancho.

### 4.2 Tipo `boardChoice` (jogo da velha, cadeado 3)
```ts
type BoardChoiceVariant = {
  prompt: string; hint1: string; hint2: string;
  board: string;          // 9 caracteres, índice 0–8 da esquerda para a direita, de cima para baixo: "X", "O" ou "."
  you: "X";
  spokenMove: { cell: number; symbol: "O" };  // jogada da máquina, revelada só na transmissão
  answer: number;         // índice 0–8 da casa correta
};
```
- Tabuleiro grande estilo neon. Antes da transmissão, a casa da jogada da máquina fica escondida com "?"; depois que a Narradora fala, a dupla **clica na casa onde a máquina jogou** (para conferir que escutou) e o O aparece. Só então escolhe a jogada dela.
- A Narradora fala a casa como **posição** e como **número de 1 a 9** (1 = canto de cima à esquerda). O JSON usa índice 0–8.
- Verificado: A e B = bloquear a única ameaça; C = única casa que cria **armadilha dupla**.

### 4.3 Tipo `gameTree` (Cofre — minimax)
```ts
type GameTreeVariant = {
  prompt: string; hint1: string; hint2: string;
  depth: 2 | 3;
  tree: Record<string, number[] | Record<string, number[]>>;
  answer: string;   // chave da primeira jogada correta
};
```
- Mostrar a árvore como galhos de neon descendo de "Sua jogada" → "Resposta da máquina (ela escolhe o MENOR)" → (nível C) "Sua resposta (você escolhe o MAIOR)". Folhas com os números.
- A dupla pode **marcar** em cada galho o valor que acha que sobe (rascunho, sem validar), e depois escolhe a jogada final.
- Ao acertar: animação dos valores subindo pela árvore (mostra o minimax funcionando).

---

## 5. Painel e projetor (ajustes por episódio)
- O **roteiro da Narradora** de cada JSON já traz as falas e `spokenClues` por nível. Nos Ep. 2 e 3 a fala é um número (chave / entrada); no Ep. 4, uma quantidade; no Ep. 5, uma casa do tabuleiro.
- Ep. 5 no projetor: barra gigante **"TURMA × MÁQUINA"**, contador de duplas que abriram o Cofre e a lista de "Reforços".

---

## 6. Imagens novas (acrescentar ao `docs/IMAGENS.md`)
Usar o prompt base noir do `VISUAL.md`, seção 10. Formatos iguais aos do Ep. 1.

| Episódio | Quadros (`src/assets/comic/`) | Cartas e gancho |
|---|---|---|
| Ep. 2 | `ep2-sala-guerra`, `ep2-enigma-vitrine`, `ep2-professor-radio`, `ep2-capita-radio`, `ep2-bletchley`, `ep2-bombe` | `card-ep2`, `teaser-ep1` (silhueta coberta da Enigma) |
| Ep. 3 | `ep3-salao-escuro`, `ep3-eniac-acendendo`, `ep3-professor-cabos`, `ep3-capita-painel`, `ep3-programadoras`, `ep3-reconhecimento` | `card-ep3`, `teaser-ep2` (silhueta de armários com válvulas) |
| Ep. 4 | `ep4-sala-espacial`, `ep4-computador-vitrine`, `ep4-professor-relogio`, `ep4-capita-alarme`, `ep4-alarme-pouso`, `ep4-pouso-lua` | `card-ep4`, `teaser-ep3` (Lua com alarme vermelho) |
| Ep. 5 | `ep5-ultima-vitrine`, `ep5-maquina-desperta`, `ep5-professor-capita`, `ep5-alianca`, `ep5-kasparov`, `ep5-arvore-jogadas` | `card-ep5`, `teaser-ep4` (peça de xadrez na sombra), `teaser-ep5` |
| Ep. 1 | — | `card-ep1` |

- **Pessoas reais** (Turing, as programadoras do ENIAC, Margaret Hamilton, Kasparov): ilustrar como **personagens de HQ genéricos e de costas/em silhueta**, sem tentar retratar o rosto real. Nada de fotos reais.
- Cartas (`card-*`): 600 × 840 (proporção de carta), `.webp`, com espaço livre embaixo para o texto que o jogo coloca.

---

## 7. Testes obrigatórios (Vitest)
- `cipher`: para toda variante, `shift(answer, shift) === text` (decode/crack), `shift(text, shift) === answer` (encode); em `verify`, só `options[correct]` decifra em palavras do dicionário do episódio.
- `wiring`: existe **exatamente uma** ordem de `slots` módulos que chega em `target`; em `debug`, `chain` **não** chega em `target`.
- `priority`: força bruta confirma `optimalValue`; `select` tem `correct.length === pick`.
- `boardChoice`: com a jogada falada aplicada, `answer` é a única casa que bloqueia (A, B) ou cria armadilha dupla (C).
- `gameTree`: minimax confirma `answer` como única melhor jogada.
- `coop`: força do puxão por número de duplas, vitória por metade das duplas, Reforço manda só uma dica.

---

## 8. Critérios de aceite por episódio
- Jogável de ponta a ponta nos níveis A, B e C, nos dois lados (ou em coop), contra pessoas e contra a máquina.
- Transmissão funciona no cadeado 3 (chave, entrada, quantidade ou casa).
- Gancho do episódio anterior aponta para este episódio; carta entra no Álbum.
- Cabe em 50 min no ensaio com 4 abas, sem erro no console.
