# Status do projeto — A Grande Caçada aos Códigos

_Atualizado em 17/11/2026._

**Resumo:** os **Episódios 1, 2 e 3 são jogáveis** (o Ep. 2, Máquina Enigma, entrou em 16/11 com o disco de cifra). Os **Ep. 4 e 5 já estão no projeto como conteúdo** (validados por teste), mas ainda **não são jogáveis**: cada um precisa do seu tipo de desafio novo. A **Parte A (LGPD) e a Parte B (temporada dinâmica) do SPEC-02** estão prontas.

## 🗺️ Plano em andamento (15/11)

| #   | Item                                                                                       | Situação                   |
| --- | ------------------------------------------------------------------------------------------ | -------------------------- |
| 1   | SPEC-02 **A** (correções + LGPD) e **B** (temporada dinâmica) + pedidos da May             | ✅ pronto (PR #16)         |
| 1b  | **Diversão e desafio** (combo, dica mais cara, Relâmpago, missão bônus, corrida)           | ✅ pronto (PR #17)         |
| 2   | SPEC-03 **Ep. 2** — Enigma, tipo `cipher` (disco de cifra)                                 | ✅ pronto, **para testar** |
| 3   | SPEC-02 **C** — "Anteriormente na Caçada" + Álbum do Museu                                 | ⏳ próximo                 |
| 4   | SPEC-03 **Ep. 3** — ENIAC, tipo `wiring`                                                   | ✅ pronto (PR #21/#22)     |
| 5   | SPEC-03 **Ep. 4** — Apollo 11, tipo `priority` (fora da temporada curta)                   | ⏳                         |
| 6   | SPEC-02 **D** — ficha que evolui e selos (a parte E, certificado da temporada, vem depois) | ✅ pronto, **para testar** |
| 7   | SPEC-03 **Ep. 5** — Deep Blue, modo `coop`                                                 | ⏳                         |
| 8   | SPEC-02 **F** — relatório da turma                                                         | ⏳                         |

---

## ✅ O que está pronto

### Para a dupla (aluno)

- Abertura com o museu no escuro e a lanterna; código da sala; criar dupla (**personagem-imagem** ou desenho, codinome, nome pirata e PIN) ou entrar com o PIN.
- Nomes em abas: personagens da série e do anime **ou** cidades do Brasil / nomes piratas.
- Planejamento: HQ de abertura, dossiê, ranking, escolha de lado e de modo, tela VERSUS.
- **7 tipos de desafio** espelhados (quiz, enigma, anagrama, cartão perfurado ler/furar, blocos montar/consertar), em 3 níveis.
- **Lados sem respostas compartilhadas (15/11):** os Piratas têm palavras e números próprios nos Ep. 1–4; as alternativas aparecem em ordem diferente para cada dupla. Um teste garante isso em todo conteúdo novo.
- Cabo de guerra ao vivo (**a cor de quem ganha cresce sobre a do outro**), 6 habilidades, dicas, pista falada.
- Robô adversário com falas; alarme do museu e prisão; fim em 4 capítulos com ranking, ⭐ destaque da aula, carta do episódio e gancho.
- Som gerado pelo jogo, com mudo e volumes salvos; botão 🔊 "Ouvir".

### Para a Narradora (instrutora)

- Turmas, duplas, resetar PIN, ranking da temporada; painel ao vivo completo; projetor por fase.
- **Alarme automático sem depender do painel aberto** (qualquer tela conectada dispara).
- **Fim de ano (LGPD):** arquivar turma (somente leitura, dá para desarquivar; a admin também arquiva); **limpar sessões antigas** (mais de 30 dias; não mexe no ranking); **encerrar temporada** (baixa o ranking em CSV, pede o nome da turma, apaga duplas/pontos/PINs/sessões e arquiva). Tudo registrado no `auditLog`.
- **Admin:** professoras liberadas, escolas, **temporada longa ou curta** (muda o gancho do fim de cada episódio), limpeza geral.
- Roteiro prático da aula: `docs/ROTEIRO-DA-AULA.md`.

### Novidades da tarde de 15/11

- **Passo a passo do Firebase/Vercel numa conta nova:** `docs/CONFIGURACAO-FIREBASE.md`.
- **17 escolas** (Mayara, Guilherme, Francisco, Dante e Julio) no `/api/setup`.
- **24 personagens completos** (12 meninas + 12 meninos).
- **Roteiro da Narradora em nova aba**, um por episódio (`/instrutor/roteiro/ep1`...), com linha do tempo, pistas por nível, respostas do alarme, curiosidades e **gabarito** escondido. Dá para imprimir.
- **Painéis da turma e do admin** com números-resumo no topo; escolas em grade.
- **Site responsivo:** celular e tablet sem nada cortado; no computador o jogo continua cabendo em 1366×768.

### Novidades de 18/11 — ficha que evolui, selos e tudo mais fácil 🏅

- **Ficha que evolui:** no lobby, a ficha do Bando e o cartaz dos Piratas mostram o **nível** (Novato → Recruta → Agente → Especialista → Mestre do Plano → Lenda; nos Piratas, Aprendiz → Grumete → Marujo → Imediato → Capitão de Fragata → Lenda dos Mares) e um **carimbo por episódio** jogado, com o lado e o resultado (🏆 venceu, 🤝 empatou, 💪 lutou).
- **7 selos** (não dão pontos): ⚡ Cofre Relâmpago (o Cofre mais rápido da turma), 🧠 Sem Dicas, 🔄 Virada (venceu começando o Cofre atrás), 🎭 Duas Caras (jogou nos dois lados), 🎧 Ouvido Atento (pista falada de primeira), 🗂️ Colecionador (todas as cartas da temporada) e 🌟 Missão Bônus. Aparecem estourando no fim do episódio, na ficha, no Álbum e no painel da turma.
- **Todos os episódios mais fáceis no A e no B:** prévia ao vivo do tecido no tear (Ep. 1), disco já girado e pista no Cofre no B (Ep. 2), conta ao vivo no painel (Ep. 3).
- Correção: "episódios jogados" agora conta de verdade (antes ficava sempre 0).
- ⚠️ **Publicar o `firestore.rules` novo** (a Narradora grava carimbos e selos).

### Novidades de 17/11 (mais tarde) — continuar a aula, ENIAC mais fácil, temporada curta com o ENIAC

- **▶️ Continuar de onde pararam:** ao abrir a sessão do MESMO episódio na página da turma, marque a opção. Cada dupla volta ao cadeado e à etapa (e ao Cofre) onde parou, com lado, dicas, habilidades, carta e pontos do dia. Os confrontos são formados de novo e a Narradora transmite a pista de novo se precisar.
- **Painel do ENIAC mais fácil:** nos níveis A e B, a conta parcial aparece embaixo de cada módulo enquanto a dupla monta; no C, as sabotagens da etapa 2 têm só uma troca. O disco de cifra do Ep. 2 não mudou.
- **Temporada curta agora é Ep. 1 → 2 → 3 (ENIAC) → 5** (sem o Apollo 11).

### Novidades de 17/11 (noite) — Ep. 3: ENIAC 🔌

- **Painel do ENIAC:** ENTRADA → módulos ("+3", "×2", "−1") ligados por cabos → SAÍDA. "Ligar a máquina" mostra a conta passo a passo (2 → +3 → 5 → ×2 → 10).
- **Bando monta** o circuito (no Cofre do B e do C sobra um módulo pegadinha); **Piratas consertam** a sabotagem trocando módulos de lugar.
- **Entrada pelo rádio** no cadeado 3: a tomada mostra 🎧 até a transmissão; depois a dupla digita o número ouvido. A etapa 2 usa a MESMA entrada.
- Duas etapas em tudo, missão bônus de cabos, quizzes e enigmas novos; níveis na régua nova (A curto, B mediano, C desafio).
- Cada painel tem **uma única ordem certa** (conferido por teste).

### Novidades de 17/11 (tarde) — mais fácil no A, mediano no B 🎚️

- **Nível A:** a etapa 2 ficou curta e guiada: quiz de 3 perguntas fáceis, enigma com alternativas, anagrama de uma palavra, conserto do tear com 1 erro. No Ep. 2: disco já girado na chave, pista (crib) no Cofre do Bando e só 3 mensagens no Cofre dos Piratas.
- **Nível B (mediano):** quiz de 4, enigma com 4 alternativas, anagrama com a primeira letra no lugar, cartão de 6 colunas (era 8), tear com uma repetição só, conserto com 1 erro, frases de cifra mais curtas e 4 mensagens no Cofre dos Piratas.
- **Dica no nível B voltou ao preço normal** (−2 / −4). Só o C paga mais.
- **O nível C não mudou.**
- **30 imagens novas dos Ep. 2 a 5** (quadros de HQ, cartas e ganchos). Faltam só `card-ep5` e `teaser-ep5`.

### Novidades de 17/11 — mais desafio: duas etapas 🔐🔐

- **Todo cadeado e o Cofre têm 2 etapas.** A etapa 1 é o desafio de antes; a etapa 2 é **mais difícil e mais longa** (quizzes de 5 perguntas, enigma sem alternativas, anagrama maior, cartões com mais colunas, tear com duas repetições, conserto com 2–3 erros, cifras com a mensagem inteira, Cofre do Ep. 2 sem pista e com mais mensagens falsas).
- Terminar a etapa 1 já dá **meio puxão** na corda (10) e aparece **ETAPA 2/2**; o cadeado só abre (e dá ponto) na etapa 2. O combo vale se as **duas** etapas saírem de primeira e sem dica.
- **Sem transmissão extra:** a etapa 2 do cartão é um cartão inteiro (sem coluna rasgada), e a etapa 2 da cifra usa a **mesma chave** falada.
- **O robô ficou mais lento** junto (as duas etapas), e o **Cofre Relâmpago** agora é 10/9/8 min (A/B/C).
- Pronto no **Ep. 1 e no Ep. 2**; os Ep. 3–5 já vão nascer com as duas etapas.
- **Personagens das duplas recortados de novo**, sem falhas no cabelo, nos contornos e nas roupas.

### Novidades de 16/11 (madrugada) — Álbum, cartas com poder e certificado 🃏🎓

- **Figurinha rara por episódio:** quem jogou ganha a carta no fim (a Narradora entrega ao liberar o Fim). **Dourada holográfica (★ RARA)** para quem venceu o confronto. A carta vira na tela com som.
- **Poder da carta:** no planejamento, a dupla escolhe **uma carta de outro episódio** para levar ("Carta da missão") e usa o poder no jogo pelo botão **Usar**. Normal = 1 uso por episódio; dourada = 2 usos.
  - Ep. 1 **Cartão Perfurado Extra**: Dica 1 grátis · Ep. 2 **Bombe Turbinada**: próximo cadeado puxa +10 · Ep. 3 **Válvula Reserva**: o próximo erro não tira ponto · Ep. 4 **Contagem Regressiva**: +2 min no Cofre Relâmpago · Ep. 5 **Jogada de Mestre**: Dica 1 e 2 grátis.
- **Álbum do Museu** (`/album`): ganha, dourada, "em jogo hoje", futura (trancada) e perdida (faltou: não volta). Atalhos no lobby, na espera e no fim.
- **Certificado de conhecimento** de cada episódio, em A4 deitado, **sem nome de aluno** (duas linhas "Nome:" para escrever à mão): a dupla imprime pelo fim/álbum; a Narradora imprime **a turma toda** pelo botão "🎓 Certificados deste episódio" na página da turma.
- **"Anteriormente na Caçada"** (a partir do Ep. 2): abre o planejamento com o resumo do episódio anterior e os **números reais da aula passada** (vitórias de cada lado, dupla destaque, quantas abriram o Cofre). Até 30 s, com "Pular". No projetor, a Narradora alterna 📼 Anteriormente / 🏆 Ranking.
- ⚠️ **Publicar o `firestore.rules` novo** (a Narradora grava as cartas; a dupla grava a carta equipada).

### Novidades de 16/11 (noite) — Ep. 2: Máquina Enigma 🔐

- **Disco de cifra:** dois anéis de letras (fora: original · dentro: cifrado). Gira arrastando, pelas setas ◀ ▶ ou pelo teclado.
- **Bando:** decifrar uma palavra → decifrar com a **chave falada** pela Narradora → **quebrar o código** no Cofre (gira o disco até o "Teste rápido" fazer sentido; no nível C tem uma pista: a mensagem começa com TURING).
- **Piratas:** cifrar uma palavra → cifrar com a **chave falada** → **verificar** no Cofre: entre 3 ou 4 mensagens de rádio, só uma foi cifrada com a chave do dia (ordem própria de cada dupla; erro = −2).
- **Chave pelo rádio:** no cadeado 3 o disco fica travado com 🎧 até a Narradora fazer a transmissão (igual aos cartões do Ep. 1; o painel mostra quem está esperando).
- **Missão bônus do Ep. 2:** a chave vem disfarçada numa continha (ex.: "letras de ENIGMA × 3 − 1").
- A mensagem se escreve **letra por letra**, numa caixinha embaixo de cada letra da fita.
- Testado nos níveis A, B e C, nos dois lados, no computador (1366×768) e no celular.

### Novidades de 16/11 — mais diversão e mais desafio

- **🔥 Combo:** abrir o cadeado de primeira, sem erro e sem dica, puxa a corda **+5** a mais (25 em vez de 20). A tela avisa "COMBO valendo" e o painel mostra quem fez.
- **💌 Dica mais cara no B e no C:** Dica 1 = −3 e Dica 2 = −5 (no A continua −2 e −4).
- **⚡ Cofre Relâmpago:** cronômetro no Cofre (A 7 min · B 6 min · C 5 min). Quem resolve antes de zerar ganha **+2**, vencendo ou não.
- **🌟 Missão bônus:** quem abre o Cofre ganha um enigma extra difícil (sem dicas, errar não tira ponto) que vale **+2**. Hoje existe no Ep. 1; cada episódio novo ganha a sua. O selo entra com a Parte D (selos).
- **🏁 Corrida até o Cofre no projetor:** quem está mais perto do Cofre, sem mostrar pontos.
- Correção: no projetor, o lado Piratas agora mostra o **nome pirata** (antes aparecia a cidade).
- ⚠️ **Precisa publicar o `firestore.rules` de novo** (ou só publicar o novo, já que a conta é nova).

### Por baixo

- Regras do Firestore fechadas por padrão, com testes; pontos sempre com extrato; sem dados pessoais de aluno.
- **Conteúdo validado por teste:** formato de todos os episódios e as conferências do SPEC-03 §7 (cifras, uma única ordem dos cabos, combinação ótima, jogo da velha, minimax).
- **Testes:** 144 unitários + 73 de regras/API no emulador + testes ponta a ponta de cada etapa + ensaio geral de 43 min.

---

## ⏳ O que falta

### Com você

| O quê                                                                                            | Por quê                                                                                                              |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Configurar a conta nova** (`docs/CONFIGURACAO-FIREBASE.md`) e **publicar o `firestore.rules`** | Sem isso: alarme pelas duplas, `config/season`, arquivar e `auditLog` não funcionam                                  |
| **Testar num computador da escola**                                                              | Som, voz do "Ouvir" e desempenho em máquina mais fraca                                                               |
| **Imagens** (`docs/IMAGENS.md`)                                                                  | 31 dos personagens (faltam os pares de `menina-05`, `menino-04`, `menino-05` e mais 14 personagens) e 32 dos Ep. 2–5 |

### No código

- Itens 2 a 8 do plano acima.
- Certificados no "Encerrar temporada": entram com a Parte E (hoje só o CSV do ranking).
