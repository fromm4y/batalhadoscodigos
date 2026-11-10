# 🎨 Lista de imagens do MVP

Tudo o que precisa ser gerado para o MVP (Episódio 1 + telas do jogo).
Enquanto uma imagem não existe, o jogo mostra um **placeholder** com o id, então dá pra gerar aos poucos.

> **O que NÃO vou pedir como imagem** (eu faço em SVG/CSS no código): avatares das duplas (SPEC 9.5 exige SVG em camadas), cadeados, barra do cabo de guerra, onomatopeias, balões, botões, logo, ícones de UI.

## ⚠️ Regras de direitos (obrigatório)

- **Nada** de _La Casa de Papel_ ou _One Piece_: sem máscara de Dalí (usar **máscara de olhos simples, tipo dominó**), sem Luffy, sem chapéu de palha **com fita vermelha** (usar **fita azul**), sem Jolly Roger com chapéu, sem logos.
- Personagens **originais**. Evitar pedir "no estilo de [obra/artista]" no prompt.
- Diversidade: variar tons de pele e cabelos nos personagens.

## Estilo (usar em TODOS os prompts)

**Prompt base (em inglês funciona melhor nos geradores):**

> _comic book illustration, bold black ink outlines, flat vibrant colors, halftone dot shading, dynamic composition, kid-friendly, original characters, no text, no letters, no logos_

**Paleta:** vermelho `#E63946`, azul `#1D4ED8`, amarelo palha `#F4C430`, papel `#FFF8E7`, tinta `#111111`.
**Importante:** **sem texto dentro da imagem** (os textos e balões são colocados pelo jogo).

## Formatos e onde salvar

| Grupo                   | Tamanho                           | Formato | Pasta                    |
| ----------------------- | --------------------------------- | ------- | ------------------------ |
| Quadros de HQ           | 1200 × 800 (3:2)                  | `.webp` | `src/assets/comic/`      |
| Retratos de personagens | 800 × 800, **fundo transparente** | `.png`  | `src/assets/characters/` |
| Cenários/fundos de tela | 1920 × 1080                       | `.webp` | `src/assets/scenes/`     |
| Cartas de habilidade    | 512 × 512, **fundo transparente** | `.png`  | `src/assets/abilities/`  |

O **nome do arquivo** tem que ser **exatamente o id** da tabela (ex.: `museu-noite.webp`).

---

## 1. Quadros do Episódio 1 (ids do JSON) — `src/assets/comic/`

| id                 | Onde aparece       | Descrição                                                                                                                            |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `museu-noite`      | Abertura, quadro 1 | Fachada de um museu de tecnologia moderno à meia-noite, lua cheia, holofotes, clima de suspense.                                     |
| `vitrine-maquina`  | Abertura, quadro 2 | Vitrine de vidro iluminada com uma máquina de engrenagens de latão do século 19 (inacabada), cartões perfurados ao lado.             |
| `professor-sombra` | Abertura, quadro 3 | O Professor (líder do Bando) em silhueta/meia-sombra, de óculos, apontando para uma planta do museu numa mesa.                       |
| `capita-navio`     | Abertura, quadro 4 | A Capitã no convés de um navio, chapéu de palha com fita azul, olhando por uma luneta para o museu no porto.                         |
| `ada-escrevendo`   | Revelação (fim)    | Mulher do século 19 (vestido de época) escrevendo notas cheias de fórmulas à luz de vela.                                            |
| `tear-ciclos`      | Revelação (fim)    | Tear de madeira com cartões perfurados em sequência formando um padrão de estrelas e bolinhas, setas circulares sugerindo repetição. |
| `narradora`        | Revelação (fim)    | A Narradora: apresentadora animada segurando um microfone/megafone, sorrindo, fundo de raios.                                        |

## 2. Personagens — `src/assets/characters/`

Retrato da cintura pra cima, olhando um pouco para o lado, para caber ao lado dos balões.

| id                 | Descrição                                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `professor-neutro` | **O Professor:** líder do Bando, adulto, óculos, barba curta, macacão vermelho com capuz, máscara de olhos vermelha simples pendurada no pescoço. Calmo e estrategista. |
| `professor-feliz`  | Mesmo personagem, sorriso confiante, um dedo pra cima ("plano perfeito!").                                                                                              |
| `professor-tenso`  | Mesmo personagem, suando, mão no queixo.                                                                                                                                |
| `capita-neutra`    | **A Capitã:** líder dos Piratas, jovem adulta, chapéu de palha com fita azul, colete azul, lenço no pescoço, mapa enrolado na mão. Corajosa e alegre.                   |
| `capita-feliz`     | Mesma personagem, rindo, punho erguido.                                                                                                                                 |
| `capita-tensa`     | Mesma personagem, segurando o chapéu contra o vento, preocupada.                                                                                                        |
| `narradora-neutra` | **A Narradora** (a instrutora no jogo): segura um microfone, expressão de suspense divertido.                                                                           |
| `robo-provocando`  | **O Robô** (oponente máquina): robô retrô de lata, cabeça quadrada com antena e tela no rosto, braço apontando, cara de deboche (sem ser assustador).                   |
| `robo-derrotado`   | Mesmo robô soltando fumaça, olhos em espiral.                                                                                                                           |
| `robo-feliz`       | Mesmo robô comemorando, luzes piscando.                                                                                                                                 |

## 3. Cenários de tela — `src/assets/scenes/`

| id              | Onde aparece         | Descrição                                                                                                      |
| --------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `capa-entrada`  | Tela de código (`/`) | Fachada do museu com o céu noturno ao fundo, espaço vazio no centro (o logo vai por cima).                     |
| `lado-bando`    | Escolha de lado      | Mesa de planejamento com planta do museu, lanterna, ferramentas, macacão vermelho pendurado. Clima de assalto. |
| `lado-piratas`  | Escolha de lado      | Navio ancorado no porto com mapa do tesouro aberto, bússola e lanterna. Clima de aventura.                     |
| `cela-prisao`   | Prisão (60 s)        | Cela de cadeia de desenho animado, grades, banquinho, uma janelinha com lua. Nada assustador.                  |
| `cofre-fechado` | Fase do Cofre        | Porta de cofre redonda gigante com engrenagens e um encaixe de cartão perfurado.                               |
| `cofre-aberto`  | Vitória no Cofre     | A mesma porta aberta com brilho dourado saindo.                                                                |
| `alarme-museu`  | Evento do museu      | Corredor do museu com luzes de alarme vermelhas girando.                                                       |

## 4. Cartas de habilidade — `src/assets/abilities/`

Ícone central grande, estilo emblema, fundo transparente.

| id              | Lado       | Descrição                                                             |
| --------------- | ---------- | --------------------------------------------------------------------- |
| `interferencia` | 🔴 Bando   | Antena emitindo raios de estática/chiado.                             |
| `disfarce`      | 🔴 Bando   | Óculos com nariz e bigode falsos.                                     |
| `plano-b`       | 🔴 Bando   | Prancheta com um plano e um "B" desenhado a giz (pode ter a letra B). |
| `ancora`        | 🔵 Piratas | Âncora pesada dourada.                                                |
| `escudo`        | 🔵 Piratas | Escudo redondo de madeira com borda de metal azul.                    |
| `bussola`       | 🔵 Piratas | Bússola antiga brilhando.                                             |

---

**Total: 30 imagens** (7 quadros + 10 retratos + 7 cenários + 6 habilidades).
**Prioridade** se faltar tempo: 1) quadros do Ep. 1 → 2) personagens neutros + robô provocando → 3) o resto.
