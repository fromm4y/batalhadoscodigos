# Status do projeto — A Grande Caçada aos Códigos

_Atualizado em 15/11/2026._

**Resumo:** o **Episódio 1 está completo e testado** (cabe em 50 min, sem erros). Os **Ep. 2 a 5 já estão no projeto como conteúdo** (validados por teste), mas ainda **não são jogáveis**: cada um precisa do seu tipo de desafio novo. A **Parte A (LGPD) e a Parte B (temporada dinâmica) do SPEC-02** estão prontas.

## 🗺️ Plano em andamento (15/11)

| #   | Item                                                                           | Situação                   |
| --- | ------------------------------------------------------------------------------ | -------------------------- |
| 1   | SPEC-02 **A** (correções + LGPD) e **B** (temporada dinâmica) + pedidos da May | ✅ pronto, **para testar** |
| 2   | SPEC-03 **Ep. 2** — Enigma, tipo `cipher` (disco de cifra)                     | ⏳ próximo                 |
| 3   | SPEC-02 **C** — "Anteriormente na Caçada" + Álbum do Museu                     | ⏳                         |
| 4   | SPEC-03 **Ep. 3** — ENIAC, tipo `wiring`                                       | ⏳                         |
| 5   | SPEC-03 **Ep. 4** — Apollo 11, tipo `priority`                                 | ⏳                         |
| 6   | SPEC-02 **D + E** — ficha que evolui, selos, certificados                      | ⏳                         |
| 7   | SPEC-03 **Ep. 5** — Deep Blue, modo `coop`                                     | ⏳                         |
| 8   | SPEC-02 **F** — relatório da turma                                             | ⏳                         |

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

### Por baixo

- Regras do Firestore fechadas por padrão, com testes; pontos sempre com extrato; sem dados pessoais de aluno.
- **Conteúdo validado por teste:** formato de todos os episódios e as conferências do SPEC-03 §7 (cifras, uma única ordem dos cabos, combinação ótima, jogo da velha, minimax).
- **Testes:** 97 unitários + 69 de regras/API no emulador + testes ponta a ponta de cada etapa + ensaio geral de 43 min.

---

## ⏳ O que falta

### Com você

| O quê                                                 | Por quê                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Publicar o `firestore.rules`** deste PR no Firebase | Sem isso: alarme pelas duplas, `config/season`, arquivar e `auditLog` não funcionam                                  |
| **Testar num computador da escola**                   | Som, voz do "Ouvir" e desempenho em máquina mais fraca                                                               |
| **Imagens** (`docs/IMAGENS.md`)                       | 31 dos personagens (faltam os pares de `menina-05`, `menino-04`, `menino-05` e mais 14 personagens) e 32 dos Ep. 2–5 |

### No código

- Itens 2 a 8 do plano acima.
- Certificados no "Encerrar temporada": entram com a Parte E (hoje só o CSV do ranking).
