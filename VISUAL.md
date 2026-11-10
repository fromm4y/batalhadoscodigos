# Direção de Arte v2 — "HQ Noir" + Fluxo de Telas

> **Para o Claude Code:** este arquivo **substitui a seção 9.6 do SPEC.md** (direção de arte) e **detalha o fluxo do aluno** da seção 9.2. Em caso de conflito, vale este arquivo.
> Os componentes da Etapa 0 (ComicPanel, SpeechBubble, Onomatopoeia, botões, halftone) **continuam**: só mudam cores, texturas, tipografia e animações.

---

## 1. O problema da v1
A página de teste da Etapa 0 ficou clara, amarela e alegre: parece gibi infantil. O jogo precisa parecer **um assalto à meia-noite num museu**: escuro, misterioso, tenso, com toques de humor. A meta é o aluno sair da aula pensando **"quero jogar mais"**.

## 2. Conceito: HQ Noir de assalto
**Imagine uma graphic novel de mistério:** fundo escuro, holofotes cortando a escuridão, lasers vermelhos de segurança, documentos confidenciais, plantas de museu, e explosões de quadrinhos coloridas estourando por cima de tudo.

- **Base escura** (noite, sombra, museu fechado).
- **Luz como protagonista:** holofotes, lanternas, brilho de vitrines, alarmes.
- **Contraste de quadrinho:** contornos pretos grossos e onomatopeias vibrantes continuam, mas agora "acendem" sobre o escuro.
- **Humor pontual:** balões, robô debochado e onomatopeias quebram a tensão sem perder o mistério.

## 3. Paleta v2

| Papel | Cor | Uso |
|---|---|---|
| Noite | `#0B0D14` | fundo principal |
| Grafite | `#171B26` | painéis/quadros |
| Grafite claro | `#252B3A` | bordas internas, cards |
| Papel envelhecido | `#EDE3CC` | dossiês, documentos, balões de fala |
| Tinta | `#0A0A0A` | contornos e textos sobre papel |
| Vermelho alarme (Bando) | `#E63946` | Bando, lasers, alarmes (com brilho) |
| Vermelho sombra | `#7A0F18` | sombras do Bando |
| Azul luar (Piratas) | `#2F6BFF` | Piratas, luz da lua |
| Azul abismo | `#0B2A7A` | sombras dos Piratas |
| Latão/ouro de museu | `#D4A537` | molduras de vitrine, ouro, recompensas, Cofre |
| Holofote | `#FFF4C2` | cones de luz (com transparência) |
| Sucesso | `#2BB673` | acertos |

**Regras:** fundo sempre escuro; textos longos sempre sobre papel envelhecido ou grafite com contraste AA; vermelho e azul usados com `box-shadow`/`filter: drop-shadow` de brilho (efeito neon suave).

## 4. Texturas e elementos de cena (CSS/SVG, sem imagem externa)
- **Retícula escura:** halftone em grafite sobre noite (pontinhos sutis), e retícula vermelha/azul nos painéis de cada lado.
- **Vinheta:** bordas da tela escurecidas (radial-gradient).
- **Holofotes:** cones de luz em SVG com gradiente, varrendo devagar a tela (animação lenta, em loop).
- **Partículas de poeira** flutuando na luz (poucas, leves).
- **Lasers de segurança:** linhas vermelhas finas que cruzam a tela e piscam.
- **Bando — Planta do museu (blueprint):** grade fina azul-acinzentada sobre grafite, com rotas tracejadas em vermelho.
- **Piratas — Carta náutica:** papel envelhecido com rosa dos ventos, linhas de navegação e "X" marcando o tesouro.
- **Documentos confidenciais:** pastas, clipes, fita adesiva, carimbo **CONFIDENCIAL** (vermelho, girado), polaroides presas com fita.
- **Moldura de vitrine:** cantos dourados (latão) com brilho, para mostrar as invenções.

## 5. Tipografia v2
- **Títulos de assalto:** **Bebas Neue** (alto, condensado, cinematográfico).
- **Dossiês, lore e transmissões:** **Special Elite** (máquina de escrever), com efeito de digitação.
- **Onomatopeias e momentos de impacto:** **Bangers** (continua).
- **Texto de leitura (enunciados, respostas):** **Nunito**. Corpo mínimo 18 px no nível A e 16 px nos demais.

## 6. Animações e efeitos (Framer Motion + CSS)
- **Lanterna na tela de lore:** a tela começa escura e um círculo de luz segue o mouse, revelando a cena.
- **Texto de máquina de escrever** nas narrações (com som de teclas, pode pular com clique).
- **Quadros entrando como páginas de HQ** (slide + leve rotação + sombra).
- **Glitch e chiado** nas transmissões do Professor e no efeito Interferência.
- **Alarme:** tela pisca em vermelho, sirene girando, leve tremida.
- **Cofre:** disco girando, engrenagens, porta abrindo com brilho dourado.
- **Cabo de guerra:** corda com nó brilhante, faíscas a cada puxão, câmera "treme" no impacto.
- **VERSUS:** dois holofotes acendendo sobre os avatares, com estrondo.
- **Onomatopeias** estourando sobre o escuro com brilho (CLICK!, BOOM!, UÓ-UÓ!, ZZZT!, TCHÁ!).
- Respeitar `prefers-reduced-motion` (sem tremidas, sem lanterna seguindo, transições simples).

## 7. Som de ambiente
- Fundo noturno: ruído baixo de museu vazio, **tique-taque de relógio** no planejamento, batida tensa nos desafios, trilha acelerada no Cofre.
- Efeitos: passos, porta pesada, alarme, teclas de máquina de escrever, chiado de rádio.

---

## 8. Fluxo de telas do aluno (v2)

### 8.1 Lore — "Abertura do episódio"
- Tela preta → texto de máquina de escrever: *"Museu Nacional da Tecnologia. 23h58."*
- **Lanterna** revela a fachada do museu (cena `capa-entrada`).
- Sequência de **3 a 5 quadros de HQ** contando a lore (quem contratou os times, o que tem no museu, a invenção da noite).
- Botão **"Pular"** aparece após 5 s. Em episódios seguintes, abre com **"Anteriormente na Caçada..."** (recap de 2 quadros).
- O tom: cada episódio começa como o primeiro capítulo de uma série.

### 8.2 Escolha do lado — "De que lado você está?"
- Tela dividida ao meio, com uma linha de laser no centro:
  - **Esquerda — BANDO:** planta do museu com rota vermelha, lanterna, macacão pendurado (cena `lado-bando`). Frase: *"Entrar. Pegar. Sumir."*
  - **Direita — PIRATAS:** navio ao luar com mapa do tesouro (cena `lado-piratas`). Frase: *"Ninguém toca no nosso tesouro."*
- Ao passar o mouse, o lado **acende** (holofote) e o outro escurece.
- Abaixo: escolha do modo **"Contra pessoas"** / **"Contra a máquina"**.

### 8.3 Caracterização — "Vista o uniforme"
- O avatar da dupla aparece no centro, sob um holofote.
- Primeira vez: criador de avatar completo. Nas semanas seguintes: o avatar já existe, e a tela só mostra ele **vestindo o figurino do lado escolhido** com animação (máscara/macacão no Bando; chapéu/colete nos Piratas).
- Ficha ou cartaz da dupla aparece ao lado, como documento confidencial (Bando) ou cartaz de Procurado (Piratas).

### 8.4 Formação dos times — "A equipe está montada"
- Tela de espera: as duplas que escolheram cada lado aparecem como **polaroides presas no mural** (Bando) ou **cartazes no convés** (Piratas).
- Quando a Narradora forma os confrontos: tela **VERSUS** com os dois holofotes (ou o robô no lado oposto).

### 8.5 Briefing da missão — "O Plano" / "O Mapa"
- **Bando:** a planta do museu abre na mesa. Uma rota vermelha tracejada liga **3 pontos (os 3 cadeados)** até o **Cofre**. O Professor explica em balões com glitch.
- **Piratas:** a carta náutica abre. **3 defesas** marcadas até o **X do tesouro**. A Capitã explica em balões.
- **Importante:** essa planta/mapa **vira a trilha de progresso** durante o jogo (substitui a "trilha de cadeados" da v1). Cada cadeado aberto acende o ponto e avança a rota.

### 8.6 Desenvolvimento — os desafios
- Layout do jogo (SPEC 9.2, item 6) com a nova pele:
  - **Topo:** cabo de guerra brilhante sobre fundo escuro + timer em fonte Bebas Neue.
  - **Esquerda:** planta (Bando) ou mapa (Piratas) com a rota acendendo.
  - **Centro:** o desafio dentro de um **documento confidencial** (papel envelhecido) ou de uma **vitrine com moldura de latão**.
  - **Rodapé:** pontos (barras de ouro / recompensa), dicas como **"envelopes lacrados"**, habilidades como **cartas de baralho escuras** com brilho.
- Transmissões da Narradora: tela escurece, rádio com chiado, balão gigante **"TIRE O FONE!"**.

### 8.7 Fim do episódio — o gancho
- Resultado com quadro gigante (VITÓRIA!/QUASE!/EMPATE!) sob holofote.
- Revelação histórica em quadros de HQ.
- **Cliffhanger obrigatório:** tela de **"TRANSMISSÃO INTERCEPTADA"** com glitch, uma frase misteriosa e a silhueta da próxima invenção coberta por um pano, com o carimbo **"PRÓXIMA SEMANA"**.

---

## 9. Ganchos para "quero jogar mais"
- **Cliffhanger** em todo fim de episódio (8.7).
- **Álbum do Museu:** a cada episódio, a dupla ganha a **carta colecionável** da invenção da semana (estilo carta de colecionador, com moldura de latão). As cartas dos episódios futuros aparecem como silhuetas trancadas.
- **Ficha que evolui:** a ficha/cartaz da dupla ganha carimbos e marcas a cada episódio jogado.
- **Recap "Anteriormente na Caçada..."** no começo de cada aula.

---

## 10. Prompt base das imagens (substitui o do IMAGENS.md)

> *noir comic book illustration, dark moody night scene, museum heist atmosphere, dramatic spotlight lighting, deep shadows, bold black ink outlines, halftone dot shading, limited palette of deep navy and charcoal with red alarm accents, blue moonlight accents and warm brass gold highlights, cinematic composition, mysterious but kid-friendly, original characters, no text, no letters, no logos*

- **Bando:** acrescentar *"red accent lighting, red security lasers, blueprint details"*.
- **Piratas:** acrescentar *"blue moonlight, harbor at night, old nautical map details"*.
- **Personagens:** acrescentar *"waist-up portrait, transparent background, rim lighting"*.
- Manter as regras de direitos do IMAGENS.md (máscara de olhos simples tipo dominó, chapéu de palha com fita **azul**, nada de obras existentes).
- **Imagens de referência** (fotos de séries, filmes ou museus reais) servem **só para inspirar o clima**. Nunca colocar essas imagens no repositório nem usá-las como base direta no gerador.

---

## 11. Critério de aceite da v2
- Refazer a página de teste da Etapa 0 com a pele noir: fundo escuro, holofote animado, documento confidencial, planta do museu, carta náutica, onomatopeias brilhando, botões BANDO/PIRATAS acendendo.
- Montar um **protótipo navegável** das telas 8.1 → 8.5 (com placeholders de imagem) **antes** de seguir para a Etapa 1, para a May aprovar o clima.
