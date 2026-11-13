# Status do projeto — A Grande Caçada aos Códigos

_Atualizado em 13/11/2026._

**Resumo:** o **Episódio 1 está completo e testado**. Ele cabe numa aula de 50 min, sem erros. As 8 etapas do plano do SPEC estão prontas. O que falta é **conteúdo novo** (Episódios 2 a 5), **imagens** e **testes na escola**, e mais algumas melhorias da lista "depois do MVP".

---

## ✅ O que está pronto

### Para a dupla (aluno)

- Abertura com o museu no escuro e a lanterna; código da sala; criar dupla (personagem, codinome, nome pirata e PIN) ou entrar com o PIN.
- Nomes em abas: personagens da série e do anime **ou** cidades do Brasil / nomes piratas.
- Planejamento: HQ de abertura, dossiê, ranking da turma, escolha de lado (Bando ou Piratas) e de modo (contra pessoas ou contra o robô), e tela VERSUS.
- **7 tipos de desafio**, espelhados nos dois lados e em 3 níveis (A, B, C): quiz, enigma, anagrama, cartão perfurado (ler e furar) e blocos de programação (montar e consertar).
- Cabo de guerra ao vivo, 6 habilidades, dicas, pista falada pela Narradora.
- Robô adversário, com falas.
- Alarme do museu ("Alarme Falso?") e prisão de 60 s.
- Fim em 4 capítulos: resultado e extrato, ranking com ⭐ destaque da aula, revelação histórica com carta do episódio, e o gancho "TRANSMISSÃO INTERCEPTADA".
- Som 100% gerado pelo jogo (efeitos e música por fase), com mudo e volumes salvos. Botão 🔊 "Ouvir" (voz em português).
- Login que não cai: só sai quando clica em sair.

### Para a Narradora (instrutora)

- Login com Google (lista de professoras liberadas), turmas, duplas, resetar PIN, ranking da temporada.
- Painel ao vivo:
  - controle das fases (nada avança sozinho)
  - formar e desfazer confrontos
  - transmissão
  - alarme (automático ou manual)
  - congelar telas
  - chamados de ajuda
  - linha do tempo
  - roteiro de falas
  - ações por dupla: pontos, dica, habilidade, fase só dela, trocar lado, extrato
- Tela do projetor para cada fase.
- Página de admin: professoras liberadas e escolas.
- **Roteiro prático da aula:** `docs/ROTEIRO-DA-AULA.md`.

### Por baixo (segurança e qualidade)

- Regras do Firestore fechadas por padrão, com testes. Pontos sempre com extrato, e o total nunca fica negativo.
- Sem dados pessoais de aluno (LGPD): nomes só de listas fechadas, personagens só da lista.
- **129 testes automáticos**, mais testes ponta a ponta de cada etapa e um **ensaio geral de 43 min em tempo real** sem nenhum erro.

---

## ⏳ O que falta

### 1. Você precisa fazer (rápido)

| O quê                                                                  | Por quê                                                                                             |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Publicar o `firestore.rules` atual no Firebase (se ainda não publicou) | Sem isso, o ⭐ destaque da aula não aparece para o aluno                                            |
| **Testar num computador da escola** (Chrome, 1366×768, com fone)       | Último aceite que eu não consigo fazer daqui: som, voz do "Ouvir", desempenho em máquina mais fraca |
| **Gerar as 48 imagens dos personagens** (`docs/IMAGENS.md`, seção 6)   | Enquanto não chegam, as duplas usam o criador em desenho                                            |

### 2. Conteúdo (o maior trabalho que falta)

Hoje **só o Episódio 1 (Máquina Analítica)** existe. Os outros aparecem na temporada como "em breve":

| Episódio               | O que precisa                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Ep. 2 — Máquina Enigma | Conteúdo (JSON) + **desafio novo: cifra** (Bando decifra, Piratas cifram) + imagens |
| Ep. 3 — ENIAC          | Conteúdo + **desafio novo: ligar cabos** + imagens                                  |
| Ep. 4 — Apollo 11      | Conteúdo + **desafio novo: prioridade de tarefas** + imagens                        |
| Ep. 5 — Deep Blue      | Conteúdo + **modo novo: a turma toda contra a máquina** (cooperativo) + imagens     |

> Cada episódio novo = 1 arquivo de conteúdo + o desafio novo + umas 10 imagens. Dá pra fazer **um por semana**, como o SPEC sugere. Se as aulas terminarem em 11/12, a temporada pode ter 4 episódios (o SPEC já prevê isso).

### 3. Melhorias que o SPEC/VISUAL deixaram para depois

| Item                                                                                   | Situação                                                                                           |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Arquivar turmas e apagar sessões antigas** (botão do admin, LGPD)                    | ❌ Não feito. O SPEC pede (seção 8.4); recomendo fazer **antes do fim da temporada**               |
| **Álbum do Museu** (página com as cartas ganhas e as futuras como silhuetas trancadas) | ⚠️ Parcial: a carta aparece no fim do episódio, mas ainda não tem a página do álbum                |
| **"Anteriormente na Caçada..."** (resumo no começo da aula)                            | ❌ Só faz sentido a partir do Ep. 2                                                                |
| **Ficha que evolui** (carimbos a cada episódio jogado)                                 | ❌ Não feito                                                                                       |
| **Selo do episódio** (dupla mais rápida no Cofre) e certificado da temporada           | ❌ Não feito (pós-MVP)                                                                             |
| **Relatório da turma** (acertos por desafio, uso de dicas)                             | ❌ Não feito (pós-MVP); seria ótimo para o mestrado 📊                                             |
| **Respostas conferidas no servidor** (anti-trapaça forte)                              | ❌ Pós-MVP. Hoje é o nível combinado do MVP: respostas fora do console e do HTML, build minificado |

### 4. Pequenas pendências técnicas

- O Howler.js continua instalado, mas não é usado (o som é todo gerado pelo jogo). Dá pra remover.
- O alarme automático depende da **aba do painel aberta** (está no roteiro).

---

## 🧭 Sugestão de ordem

1. Publicar as regras → **testar na escola** → me contar o que achou.
2. Botão de **arquivar/limpar** (LGPD) — é pequeno e importante.
3. **Episódio 2** (Enigma), com o desafio de cifra.
4. **Álbum do Museu + "Anteriormente"**: é o que faz o aluno querer voltar na semana seguinte.
5. **Relatório da turma** (se for útil para a pesquisa).
