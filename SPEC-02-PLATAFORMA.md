# SPEC 02 — Melhorias da plataforma (pós-MVP)

> **Para o Claude Code:** complementa o `SPEC.md` e o `VISUAL.md`. Leia também o `docs/STATUS.md`.
> Implemente na ordem das partes (A → F). Ao fim de cada parte, rode os critérios de aceite e **pare** para a May testar.
> Itens **[PADRÃO]** são decisões assumidas: deixe em `src/config/gameRules.ts`.

---

## Parte A — Correções rápidas e LGPD (fazer primeiro)

### A1. Ajustes técnicos
- **Remover o Howler.js** do projeto (o som é todo gerado pelo jogo).
- **Alarme automático sem depender do painel:** hoje o evento automático só dispara com a aba do painel aberta. Trocar por **eleição por transação**: todo cliente conectado à sessão (duplas, painel, projetor) verifica a cada 5 s se `now >= session.autoEventAt` e `museumEvent.status == "idle"`; o primeiro que conseguir a transação muda para `running`. Os outros desistem. Mesmo padrão será usado no modo cooperativo (Parte F do SPEC-EP5).
- **Revisar a lista de nomes "personagens da série e do anime"** (aba na criação de dupla): o SPEC 1.1 proíbe usar nomes e personagens de *La Casa de Papel* e *One Piece*. Cidades reais (Tóquio, Berlim, Rio...) podem ficar como **cidades**; nomes de personagens do anime (ex.: Luffy, Zoro) e qualquer imagem desses personagens **devem sair**. Substituir por nomes originais.

### A2. Arquivar turma
- Botão **"Arquivar turma"** na página da turma (dono ou admin).
- Turma arquivada: some das listas (filtro "Mostrar arquivadas"), fica **somente leitura**, não pode abrir sessão. Dá para **desarquivar**.

### A3. Limpar sessões antigas
- Rota `POST /api/admin-cleanup` (Vercel + `firebase-admin`, usar `recursiveDelete`):
  - `{ scope: "sessions", olderThanDays: 30 }` [PADRÃO 30 dias]: apaga sessões encerradas mais antigas que isso, com todas as subcoleções (`players`, `matches`, `helpRequests`, `feed`, `attempts`).
  - Instrutor limpa só as próprias turmas; admin limpa tudo.
- **O ranking não é afetado:** os pontos ficam no `ledger` das duplas (ver A4).

### A4. Encerrar temporada (fim do ano)
- Botão **"Encerrar temporada"** na turma (dono ou admin), em 3 passos:
  1. **Exportar** ranking final (CSV) e certificados (Parte E) para guardar.
  2. **Confirmar digitando o nome da turma**.
  3. Apagar **duplas, ledger, PINs e sessões** da turma e marcar a turma como arquivada.
- Registrar a ação em `auditLog/{id}`: `{ by, action, classId, at }` (sem dados de aluno).

✅ **Aceite A:** Howler fora do `package.json`; alarme dispara com o painel fechado (testar com 2 duplas); turma arquivada não abre sessão; limpeza apaga sessões antigas e subcoleções sem mexer no ranking; encerrar temporada exige digitar o nome e gera o CSV antes de apagar.

---

## Parte B — Conteúdo dinâmico da temporada

Mudanças no formato dos episódios (aplicar também no `ep1.json`):

```ts
type Episode = {
  // ...campos atuais...
  teaser: { line: string; art: string };   // mostrado no FIM do episódio ANTERIOR
  recapOfThis: string[];                    // usado no "Anteriormente" do episódio SEGUINTE
  card: { title: string; year: string; people: string[]; facts: string[]; art: string }; // carta do Álbum
  mode?: "versus" | "coop";                 // padrão "versus"; "coop" só no Ep. 5
};
```

- **Gancho dinâmico:** a tela final mostra o `teaser` do **próximo episódio da temporada** (ordem em `season.ts`). Se não houver próximo, mostrar o encerramento da temporada. Assim, se a temporada for cortada para 4 episódios, o gancho continua certo.
- **`season.ts`** passa a ter duas ordens prontas e um seletor no painel admin:
  - Temporada longa (até 18/12): `ep1, ep2, ep3, ep4, ep5`
  - Temporada curta (até 11/12): `ep1, ep2, ep4, ep5`
- Preencher no `ep1.json`:
  - `recapOfThis`: `["Na semana passada, a Máquina Analítica estava na vitrine.", "O Bando leu os cartões, os Piratas trancaram a vitrine."]`
  - `card`: `{ "title": "Máquina Analítica", "year": "1843", "people": ["Ada Lovelace", "Charles Babbage"], "facts": ["Recebia instruções por cartões perfurados", "Ada escreveu o primeiro algoritmo para ela", "Nunca foi construída por completo na época"], "art": "card-ep1" }`
  - `teaser`: `{ "line": "Uma máquina de guardar segredos... a mais famosa da Segunda Guerra.", "art": "teaser-ep1" }`

✅ **Aceite B:** trocar a temporada para "curta" no admin muda o gancho do Ep. 2 para o Ep. 4; todos os episódios validam contra o tipo atualizado.

---

## Parte C — "Anteriormente na Caçada..." e Álbum do Museu

### C1. Anteriormente na Caçada (abertura de cada aula, a partir do Ep. 2)
- Primeira tela da fase `planning`, antes da HQ de abertura, em estilo de série: tela escura, título em Bebas Neue e texto de máquina de escrever.
- Conteúdo:
  1. `recapOfThis` do episódio anterior (2 quadros).
  2. **Dados reais da turma na aula anterior** (calculados da sessão anterior da turma): quantos confrontos cada lado venceu, a ⭐ dupla destaque (mais pontos) e quantas duplas abriram o Cofre.
- Dura no máximo 30 s, com botão "Pular". Também aparece no projetor.
- Se a sessão anterior foi apagada (A3), mostrar só o `recapOfThis`.

### C2. Álbum do Museu
- Nova rota do aluno **`/album`**, acessível no lobby, no fim do episódio e por um botão no topo da tela de espera.
- Uma página de "álbum de colecionador" (estilo noir, moldura de latão) com **uma carta por episódio da temporada**:
  - **Ganha:** carta colorida com arte, ano, pessoas e 3 fatos (`card` do episódio).
  - **Futura:** silhueta trancada com cadeado e "PRÓXIMA SEMANA".
  - **Perdida** (dupla faltou): silhueta cinza com "Você não estava lá..." (pode ganhar depois? **Não** [PADRÃO]: cria o desejo de não faltar).
- **Variante dourada:** se a dupla **venceu o confronto** no episódio, a carta vem com borda dourada e brilho.
- Dados: `teams/{teamId}.cards: { episodeId: string; variant: "normal" | "dourada"; earnedAt: Timestamp }[]`.
- A carta é concedida na fase `end` para toda dupla que jogou o episódio.
- Ao ganhar: animação de carta virando + som.

✅ **Aceite C:** no Ep. 2, o "Anteriormente" mostra os números reais do Ep. 1 da turma; o álbum mostra a carta do Ep. 1 (dourada para quem venceu) e silhuetas das próximas.

---

## Parte D — Ficha que evolui e selos

### D1. Níveis da dupla (por episódios jogados)
| Episódios | Bando | Piratas |
|---|---|---|
| 1 | Recruta | Grumete |
| 2 | Agente | Marujo |
| 3 | Especialista | Imediato |
| 4 | Mestre do Plano | Capitão de Fragata |
| 5 | Lenda | Lenda dos Mares |

- A ficha (Bando) e o cartaz (Piratas) mostram o nível, e a recompensa do cartaz cresce com os pontos.
- **Carimbos:** a cada episódio jogado, a ficha ganha um carimbo com o ícone do episódio, o lado jogado e o resultado (venceu/perdeu/empate).

### D2. Selos (conquistas)
| Selo | Regra |
|---|---|
| ⚡ **Cofre Relâmpago** | dupla que resolveu o Cofre mais rápido na turma, no episódio |
| 🧠 **Sem Dicas** | terminou o episódio sem usar nenhuma dica |
| 🔄 **Virada** | venceu depois de começar o Cofre atrás na barra |
| 🎭 **Duas Caras** | já jogou nos dois lados na temporada |
| 🎧 **Ouvido Atento** | acertou de primeira todos os desafios com pista falada no episódio |
| 🗂️ **Colecionador** | tem todas as cartas da temporada |

- Selos aparecem na ficha, no fim do episódio (animação) e no painel da instrutora.
- Dados: `teams/{teamId}.badges: { id: string; episodeId?: string; at: Timestamp }[]`.
- Selos **não dão pontos** [PADRÃO].

✅ **Aceite D:** os selos são concedidos pelas regras (teste unitário para cada um); a ficha mostra nível e carimbos corretos.

---

## Parte E — Certificado da temporada
- Na fase `end` do **último episódio da temporada**, e no painel da turma (botão "Certificados"), gerar:
  - **Medalhas:** ouro, prata e bronze para as 3 primeiras duplas do ranking.
  - **Certificado de participação** para todas as duplas.
- Conteúdo do certificado: título "A Grande Caçada aos Códigos", escola, turma, temporada, avatar da dupla, codinome e nome pirata, nível, total de pontos, cartas conquistadas e selos.
- **LGPD:** o certificado **não tem nome de aluno**. Ele traz **duas linhas em branco "Nome:"** para escrever à mão depois de impresso.
- Exportar como **PNG individual** (download na tela do aluno) e **PDF da turma inteira** (uma página por dupla, A4 paisagem) no painel. Usar `html-to-image` + `jsPDF` (ou similar).

✅ **Aceite E:** PDF da turma gera uma página por dupla, sem nenhum dado pessoal; PNG baixa no computador da dupla.

---

## Parte F — Relatório da turma

### F1. Registro de tentativas
- Nova subcoleção `sessions/{sessionId}/attempts/{id}`:
```ts
{ teamId: string; episodeId: string; challengeKey: string; level: "A"|"B"|"C"; side: "red"|"blue"|"coop";
  correct: boolean; hintLevel: 0|1|2; msSinceChallengeStart: number; at: Timestamp }
```
- Gravar a **cada envio de resposta** (certa ou errada). A dupla só cria as próprias tentativas (regras).

### F2. Tela "Relatório" no painel
- **Por sessão:** taxa de acerto de primeira por desafio; tentativas médias; uso de Dica 1 e Dica 2 por desafio; tempo médio por desafio; desafios onde mais duplas pediram ajuda; resultado do evento do museu; escolha de lados e modos; vitórias por lado.
- **Por temporada (turma):** evolução dos acertos de primeira por episódio; presença por episódio (quantas duplas jogaram); comparação entre níveis A, B e C quando houver mais de uma turma.
- **Gráficos simples** (barras e linhas) + tabela.
- **Exportar CSV**, com opção **"Anonimizar"** marcada por padrão (troca o nome da dupla por `Dupla 01`, `Dupla 02`...).
- O relatório **sobrevive à limpeza** (A3): ao limpar uma sessão, antes guardar um **resumo agregado** em `classes/{classId}/reports/{episodeId}` (só números, sem tentativas individuais).

### F3. Nota sobre pesquisa
- Os dados são agregados e sem identificação de alunos, ótimos para acompanhar a turma.
- **Para usar em pesquisa acadêmica** (mestrado), é preciso seguir as regras da instituição: em geral, aprovação de comitê de ética e termo de consentimento/assentimento dos responsáveis e alunos. O sistema não substitui isso.

✅ **Aceite F:** após uma sessão de teste, o relatório mostra as métricas corretas (conferir com contagem manual de 2 duplas); CSV anonimizado não contém nomes de dupla; o resumo continua disponível depois de limpar a sessão.
