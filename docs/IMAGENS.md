# 🎨 Lista de imagens do MVP

Tudo o que precisa ser gerado para o MVP (Episódio 1 + telas do jogo).
Enquanto uma imagem não existe, o jogo mostra um **placeholder** com o id, então dá pra gerar aos poucos.

> **O que NÃO vou pedir como imagem** (eu faço em SVG/CSS no código): avatares das duplas (SPEC 9.5 exige SVG em camadas), cadeados, barra do cabo de guerra, onomatopeias, balões, botões, logo, ícones de UI.

## ⚠️ Regras de direitos (obrigatório)

- **Imagens:** nada de _La Casa de Papel_ ou _One Piece_ (os **nomes** dos personagens podem aparecer como opção de nome, decisão da May em 13/11, mas a **arte** continua 100% original): sem máscara de Dalí (usar **máscara de olhos simples, tipo dominó**), sem Luffy, sem chapéu de palha **com fita vermelha** (usar **fita azul**), sem Jolly Roger com chapéu, sem logos.
- Personagens **originais**. Evitar pedir "no estilo de [obra/artista]" no prompt.
- **Imagens de referência** (fotos de séries, filmes ou museus reais) servem **só para inspirar o clima**. Nunca colocar essas imagens no repositório nem usá-las como base direta no gerador.
- Diversidade: variar tons de pele e cabelos nos personagens.

## Estilo "HQ Noir" (usar em TODOS os prompts) — VISUAL.md §10

**Prompt base (em inglês funciona melhor nos geradores):**

> _noir comic book illustration, dark moody night scene, museum heist atmosphere, dramatic spotlight lighting, deep shadows, bold black ink outlines, halftone dot shading, limited palette of deep navy and charcoal with red alarm accents, blue moonlight accents and warm brass gold highlights, cinematic composition, mysterious but kid-friendly, original characters, no text, no letters, no logos_

**Acrescente conforme a imagem:**

| Tipo de imagem             | Acrescentar ao prompt base                                    |
| -------------------------- | ------------------------------------------------------------- |
| Coisas do **Bando**        | _red accent lighting, red security lasers, blueprint details_ |
| Coisas dos **Piratas**     | _blue moonlight, harbor at night, old nautical map details_   |
| **Personagens** (retratos) | _waist-up portrait, transparent background, rim lighting_     |

**Paleta:** noite `#0B0D14`, grafite `#171B26`, alarme `#E63946`, luar `#2F6BFF`, latão `#D4A537`, holofote `#FFF4C2`, papel envelhecido `#EDE3CC`.
**Importante:** **sem texto dentro da imagem** (os textos e balões são colocados pelo jogo). Fundo escuro: as imagens vão aparecer sobre a tela noturna, então evite céus claros/diurnos.

## ✅ Status das entregas

| id                                                                                                                                                                               | Situação                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `tear-ciclos`, `ada-escrevendo`                                                                                                                                                  | ✅ no jogo (margem branca cortada)                        |
| `capita-neutra`, `capita-tensa`, `capita-feliz`, `robo-provocando`, `robo-derrotado`, `robo-feliz`, `narradora-neutra`, `professor-neutro`, `professor-feliz`, `professor-tenso` | ✅ no jogo                                                |
| `capa-entrada`, `lado-bando`, `lado-piratas`, `cofre-fechado`, `cofre-aberto`, `alarme-museu`, `cela-prisao`                                                                     | ✅ no jogo (cofre, alarme e cela aparecem nas Etapas 5–6) |
| `interferencia`                                                                                                                                                                  | ✅ no jogo                                                |
| `capita-navio`, `professor-sombra`, `vitrine-maquina`, `museu-noite`                                                                                                             | ✅ no jogo (margem branca cortada)                        |
| `disfarce`, `planoB`, `ancora`, `escudo`, `bussola` (habilidades), `carta-ep1` (Álbum, fim do episódio), `proximo-ep2` (gancho)                                                  | ✅ no jogo                                                |
| `narradora` (quadro da revelação)                                                                                                                                                | ✅ no jogo                                                |
| `telhado-museu` (extra: telhado do museu à noite)                                                                                                                                | ✅ fundo do projetor                                      |

> **Dica para personagens:** em vez de pedir "fundo transparente" (o gerador costuma **desenhar** um xadrez falso), peça **fundo liso de uma cor só**, por exemplo _"plain solid flat dark navy background (#0B0D14), no pattern"_. Fica fácil de recortar e, como o jogo é escuro, às vezes nem precisa recortar.
> **Formato:** `.webp` também serve para personagens (fica ~7× mais leve que PNG).

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

| id                                                                   | Onde aparece                       | Descrição                                                                                                                            |
| -------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `vitrine-maquina`                                                    | Abertura, quadro 2                 | Vitrine de vidro iluminada com uma máquina de engrenagens de latão do século 19 (inacabada), cartões perfurados ao lado.             |
| `professor-sombra`                                                   | Abertura, quadro 3                 | O Professor (líder do Bando) em silhueta/meia-sombra, de óculos, apontando para uma planta do museu numa mesa.                       |
| `capita-navio`, `professor-sombra`, `vitrine-maquina`, `museu-noite` | ✅ no jogo (margem branca cortada) |
| `ada-escrevendo`                                                     | Revelação (fim)                    | Mulher do século 19 (vestido de época) escrevendo notas cheias de fórmulas à luz de vela.                                            |
| `tear-ciclos`                                                        | Revelação (fim)                    | Tear de madeira com cartões perfurados em sequência formando um padrão de estrelas e bolinhas, setas circulares sugerindo repetição. |
| `narradora`                                                          | Revelação (fim)                    | A Narradora: apresentadora animada segurando um microfone/megafone, sorrindo, fundo de raios.                                        |

## 2. Personagens — `src/assets/characters/`

Retrato da cintura pra cima, olhando um pouco para o lado, para caber ao lado dos balões.

| id                                                                                                                                                                               | Descrição                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `professor-neutro`                                                                                                                                                               | **O Professor:** líder do Bando, adulto, óculos, barba curta, macacão vermelho com capuz, máscara de olhos vermelha simples pendurada no pescoço. Calmo e estrategista. |
| `professor-feliz`                                                                                                                                                                | Mesmo personagem, sorriso confiante, um dedo pra cima ("plano perfeito!").                                                                                              |
| `professor-tenso`                                                                                                                                                                | Mesmo personagem, suando, mão no queixo.                                                                                                                                |
| `capita-neutra`                                                                                                                                                                  | **A Capitã:** líder dos Piratas, jovem adulta, chapéu de palha com fita azul, colete azul, lenço no pescoço, mapa enrolado na mão. Corajosa e alegre.                   |
| `capita-feliz`                                                                                                                                                                   | Mesma personagem, rindo, punho erguido.                                                                                                                                 |
| `capita-neutra`, `capita-tensa`, `capita-feliz`, `robo-provocando`, `robo-derrotado`, `robo-feliz`, `narradora-neutra`, `professor-neutro`, `professor-feliz`, `professor-tenso` | ✅ no jogo                                                                                                                                                              |
| `capa-entrada`, `lado-bando`, `lado-piratas`, `cofre-fechado`, `cofre-aberto`, `alarme-museu`, `cela-prisao`                                                                     | ✅ no jogo (cofre, alarme e cela aparecem nas Etapas 5–6)                                                                                                               |
| `interferencia`                                                                                                                                                                  | ✅ no jogo                                                                                                                                                              |
| `narradora-neutra`                                                                                                                                                               | **A Narradora** (a instrutora no jogo): segura um microfone, expressão de suspense divertido.                                                                           |
| `robo-provocando`                                                                                                                                                                | **O Robô** (oponente máquina): robô retrô de lata, cabeça quadrada com antena e tela no rosto, braço apontando, cara de deboche (sem ser assustador).                   |
| `robo-derrotado`                                                                                                                                                                 | Mesmo robô soltando fumaça, olhos em espiral.                                                                                                                           |
| `robo-feliz`                                                                                                                                                                     | Mesmo robô comemorando, luzes piscando.                                                                                                                                 |

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
| `planoB`        | 🔴 Bando   | Prancheta com um plano e um "B" desenhado a giz (pode ter a letra B). |
| `ancora`        | 🔵 Piratas | Âncora pesada dourada.                                                |
| `escudo`        | 🔵 Piratas | Escudo redondo de madeira com borda de metal azul.                    |
| `bussola`       | 🔵 Piratas | Bússola antiga brilhando.                                             |

---

## 5. Ganchos "quero jogar mais" (VISUAL.md §8.7 e §9) — `src/assets/scenes/`

| id            | Onde aparece                        | Descrição                                                                                                                                                                                           |
| ------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `carta-ep1`   | Álbum do Museu (carta colecionável) | A Máquina Analítica como "carta de colecionador": a máquina de engrenagens em destaque, fundo escuro, brilho de vitrine. Formato **retrato 600 × 840**, `.png`. (A moldura de latão o jogo coloca.) |
| `proximo-ep2` | Cliffhanger do fim do Ep. 1         | Objeto do tamanho de uma máquina de escrever **coberto por um pano**, só a silhueta, sob um holofote, num depósito escuro. (O carimbo "PRÓXIMA SEMANA" o jogo coloca.)                              |

---

## 6. Personagens das duplas (pedido da May, 13/11) — `src/assets/characters/`

A dupla escolhe **quem quer ser** e o jogo troca sozinho a roupa conforme o lado. Cada personagem tem **duas imagens da MESMA pessoa** (mesmo rosto, cabelo e pele): uma no figurino do **Bando** e outra no dos **Piratas**.

- **Quantidade:** 12 meninas + 12 meninos = **24 personagens × 2 versões = 48 imagens**. Pode entregar aos poucos: o personagem aparece no jogo assim que as **duas** versões dele existirem. Enquanto não houver nenhum, continua o criador de avatar em desenho.
- **Ids (nome do arquivo):** `avatar-menina-01-bando`, `avatar-menina-01-piratas`, … até `avatar-menina-12-…`; e `avatar-menino-01-bando`, `avatar-menino-01-piratas`, … até `avatar-menino-12-…`.
- **Formato:** retrato **vertical 600 × 720** (proporção 5:6), **da cintura para cima**, personagem centralizado, **fundo liso de uma cor só** (eu recorto). `.webp`, `.png` ou o `.jfif` do Gemini, tanto faz.
- **Idade:** crianças/pré-adolescentes de **9 a 14 anos**, simpáticas, cheias de atitude, nada assustador.
- **Diversidade:** variar tom de pele, tipo e cor de cabelo (crespo, cacheado, liso, trança, black, raspado), óculos, aparelho nos dentes, sardas, hijab, cadeira de rodas (de cintura pra cima aparece o encosto), aparelho auditivo.
- **Figurino Bando:** macacão vermelho com capuz, **máscara de olhos simples vermelha** (tipo dominó; **nunca** a máscara de Dalí), luvas pretas, lanterna ou planta do museu na mão.
- **Figurino Piratas:** chapéu de palha com **fita azul** (nunca vermelha), colete azul, lenço no pescoço, luneta ou mapa na mão.

**Prompt modelo** (troque o que está entre colchetes e gere as duas versões em seguida, pedindo "same character"):

> _noir comic book illustration, waist-up portrait of an original kid character, [11]-year-old [girl/boy] with [dark brown skin, curly black hair in two puffs, round glasses], confident friendly smile, wearing [a red hooded jumpsuit and a simple red domino eye mask, holding a flashlight] / [a straw hat with a blue ribbon, blue vest and neck scarf, holding a spyglass], bold black ink outlines, halftone shading, dramatic rim lighting, plain solid flat dark navy background (#0B0D14), no pattern, no text, no logos_

---

**Total: 32 imagens** (7 quadros + 10 retratos + 7 cenários + 6 habilidades + 2 ganchos), todas entregues ✅, **+ 48 dos personagens das duplas** (seção 6).
**Prioridade** se faltar tempo: 1) `capa-entrada`, `lado-bando`, `lado-piratas` e os quadros do Ep. 1 (são as telas do protótipo) → 2) personagens neutros + robô provocando → 3) o resto.

> O robô, a fachada do museu e as cenas de lado já têm uma versão provisória em SVG no código. A imagem gerada substitui automaticamente quando o arquivo com o id certo aparece na pasta.
