# Configurar o Firebase + Vercel do zero (conta nova)

> Use este roteiro sempre que precisar trocar de conta ou criar o projeto de novo.
> Tempo: uns 20 minutos. Tudo no **plano gratuito (Spark)**; não precisa de cartão.
> ⚠️ **Os dados do projeto antigo não vêm junto** (turmas, duplas e pontos). Depois de trocar, as turmas são criadas de novo.

---

## Parte 1 — Firebase (console.firebase.google.com)

Entre com a **conta Google pessoal** que vai ser a dona do projeto.

### 1. Criar o projeto

1. **Adicionar projeto** → nome, por exemplo `cacada-aos-codigos`.
2. **Google Analytics:** pode **desativar** (não usamos).
3. Clique em **Criar projeto** e espere terminar.

### 2. Login com Google (para as Narradoras)

1. Menu da esquerda: **Criação → Authentication → Vamos começar**.
2. Aba **Método de login** → **Google** → **Ativar** → escolha o **e-mail de suporte** → **Salvar**.
3. Ainda dentro de **Authentication**, clique na aba **Configurações** (em inglês: **Settings**), no alto da página, ao lado de "Usuários" e "Método de login".
   - No menu que aparece à esquerda **dentro** dessa aba, clique em **Domínios autorizados** (**Authorized domains**).
   - Já vêm `localhost` e `SEU-PROJETO.firebaseapp.com`. Clique em **Adicionar domínio** e cole o endereço do site na Vercel, **sem `https://` e sem `/` no fim**, por exemplo `cacada-aos-codigos.vercel.app`.
   - Onde achar esse endereço: na Vercel, abra o projeto → página **Overview** → campo **Domains** (o que termina em `.vercel.app`).
   - Se tiver domínio próprio, adicione também.
   - Sem isso, o "Entrar com Google" da Narradora dá o erro `auth/unauthorized-domain`.

> As duplas **não** usam login do Google (entram pelo código + PIN). Não precisa ativar mais nada.

### 3. Banco de dados (Firestore)

1. **Criação → Firestore Database → Criar banco de dados**.
2. Local: **`southamerica-east1 (São Paulo)`** (fica mais rápido no Brasil e **não dá para mudar depois**).
3. Modo: **produção** → **Criar**.

### 4. Regras de segurança

1. Firestore → aba **Regras**.
2. Apague tudo o que estiver lá.
3. Abra o arquivo **`firestore.rules`** do repositório no GitHub (botão **Raw**), copie **tudo** e cole.
4. **Publicar**.

> Sempre que um PR disser "publicar o `firestore.rules`", é este passo de novo.

### 5. Índices

Firestore → aba **Índices → Compostos → Criar índice**. Crie estes dois (escopo **Coleção**):

| Coleção    | Campo 1                    | Campo 2                |
| ---------- | -------------------------- | ---------------------- |
| `sessions` | `code` — Crescente         | `status` — Crescente   |
| `classes`  | `instructorId` — Crescente | `archived` — Crescente |

Leva alguns minutos até ficarem **Ativado**.

### 6. App da Web (as chaves do site)

1. ⚙️ (engrenagem ao lado de "Visão geral do projeto") → **Configurações do projeto**.
2. Em **Seus apps**, clique no ícone **`</>`** (Web).
3. Apelido: `Caçada site`. **Não** marque Firebase Hosting. **Registrar app**.
4. Vai aparecer um código com `firebaseConfig`. Anote 4 valores:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`

> Estas 4 chaves podem ficar visíveis (vão para o navegador). A segurança está nas regras.

### 7. Chave do servidor (conta de serviço) — SECRETA

1. Configurações do projeto → aba **Contas de serviço**.
2. **Gerar nova chave privada** → **Gerar chave**. Baixa um arquivo `.json`.
3. **Guarde com cuidado e não mande para ninguém** (nem em chat, nem por e-mail). Quem tiver este arquivo controla o banco inteiro.

---

## Parte 2 — Vercel (vercel.com)

### 8. Trocar as variáveis

Projeto → **Settings → Environment Variables**. Edite (ou crie) estas 6, marcando **Production** e **Preview**:

| Nome                            | Valor                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`         | o `apiKey` do passo 6                                                                                             |
| `VITE_FIREBASE_AUTH_DOMAIN`     | o `authDomain` (ex.: `cacada-aos-codigos.firebaseapp.com`)                                                        |
| `VITE_FIREBASE_PROJECT_ID`      | o `projectId`                                                                                                     |
| `VITE_FIREBASE_APP_ID`          | o `appId`                                                                                                         |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | **o conteúdo inteiro** do arquivo `.json` do passo 7 (abra no Bloco de Notas, copie tudo, de `{` até `}`, e cole) |
| `ADMIN_EMAIL`                   | o seu e-mail Google pessoal (a administradora)                                                                    |

### 9. Publicar de novo (obrigatório)

As variáveis `VITE_*` entram no site **na hora de montar**. Então:
**Deployments** → no último deploy, **⋯ → Redeploy** → **Redeploy**.

---

## Parte 3 — Ligar tudo

### 10. Conferir se a Vercel enxerga o Firebase

Abra no navegador: `https://SEU-SITE.vercel.app/api/health` → precisa aparecer `"firebaseAdmin": true` (o número de escolas ainda é 0; o passo 11 cria).

### 11. Criar escolas e a administradora (um clique)

Abra: `https://SEU-SITE.vercel.app/api/setup` → deve aparecer **"Tudo pronto! Escolas e admin configuradas."**
Pode abrir de novo sem medo (não duplica nada).

### 12. Entrar

1. `https://SEU-SITE.vercel.app/instrutor` → **Entrar com Google** (conta do `ADMIN_EMAIL`).
2. Em **Admin**, autorize os e-mails das outras Narradoras (Guilherme, Francisco, Dante, Julio...).
3. Em **Admin → Temporada**, escolha **longa** ou **curta**.
4. Crie as turmas e teste com uma sessão.

---

## Se der erro

| Sintoma                                   | Causa provável                                                    | O que fazer                                                   |
| ----------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| "Firebase não configurado" no site        | Faltou o Redeploy (passo 9) ou alguma `VITE_*`                    | Conferir as 4 `VITE_*` e fazer Redeploy                       |
| Login do Google fecha e não entra         | Domínio não autorizado (passo 2.3)                                | Adicionar o domínio da Vercel em Authentication               |
| "Você ainda não foi autorizada"           | E-mail fora da lista                                              | Abrir `/api/setup` (admin) ou autorizar no Admin              |
| `/api/setup` dá erro 500                  | `FIREBASE_SERVICE_ACCOUNT_JSON` incompleto ou `ADMIN_EMAIL` vazio | Colar o JSON inteiro de novo e fazer Redeploy                 |
| "Missing or insufficient permissions"     | Regras não publicadas (passo 4)                                   | Colar o `firestore.rules` atual e publicar                    |
| Erro pedindo índice ("requires an index") | Faltou um índice (passo 5)                                        | Clicar no link do erro (cria o índice sozinho) ou criar à mão |

## Limites do plano gratuito (Spark)

- 50 mil leituras e 20 mil gravações por dia no Firestore. Uma aula com 10 duplas fica bem abaixo disso.
- Se um dia aparecer "quota exceeded", o limite zera à meia-noite (horário do Pacífico, umas 5h da manhã no Brasil).
