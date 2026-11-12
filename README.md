# A Grande Caçada aos Códigos 🔴⚔️🔵

Jogo web em episódios semanais (HQ + cabo de guerra) para o Núcleo WIT, de Barueri/SP.
Especificação completa: [`SPEC.md`](./SPEC.md) · Direção de arte: [`VISUAL.md`](./VISUAL.md) · Regras para o Claude: [`CLAUDE.md`](./CLAUDE.md) · Imagens: [`docs/IMAGENS.md`](./docs/IMAGENS.md)

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencher com os dados do Firebase
npm run dev                  # http://localhost:5173  (kit visual: /teste-hq · protótipo: /prototipo)
```

Scripts: `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run seed`.

> As rotas `/api/*` só rodam na Vercel (ou com `npx vercel dev`).

---

## Configuração (uma vez só)

### 1. Firebase

1. Em https://console.firebase.google.com, clique em **Adicionar projeto** (pode desligar o Google Analytics). O plano **Spark (gratuito)** basta.
2. **Authentication** → _Vamos começar_ → aba **Método de login** → ative **Google**.
3. **Firestore Database** → _Criar banco de dados_ → modo **produção** → região `southamerica-east1 (São Paulo)`.
4. **Configurações do projeto** (engrenagem) → _Seus apps_ → ícone **Web `</>`** → registre o app. Copie `apiKey`, `authDomain`, `projectId` e `appId` para as variáveis `VITE_FIREBASE_*`.
5. **Configurações do projeto** → **Contas de serviço** → _Gerar nova chave privada_. Vai baixar um `.json`. **Nunca commite esse arquivo.** Abra o arquivo no Bloco de Notas, copie **todo** o conteúdo (de `{` até `}`) e cole como valor de `FIREBASE_SERVICE_ACCOUNT_JSON` na Vercel. Não precisa converter (base64 também é aceito).

6. **Regras e índices** (Firebase CLI):
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add          # escolha o projeto
   firebase deploy --only firestore
   ```
7. **Seed** (escolas + admin): depois do deploy, abra `https://SEU-PROJETO.vercel.app/api/setup` uma vez. (Alternativa local: `npm run seed` com o `.env.local` preenchido.)

### 2. Vercel

1. Em https://vercel.com, clique em **Add New → Project** e importe o repositório do GitHub. O framework é detectado como **Vite** (o `vercel.json` já configura o build).
2. Em **Settings → Environment Variables**, cadastre as 6 variáveis do `.env.example` (Production e Preview).
3. Faça o deploy. Depois, no Firebase: **Authentication → Configurações → Domínios autorizados** → adicione o domínio `*.vercel.app` do projeto.
4. Teste: abra `https://SEU-PROJETO.vercel.app/teste-hq` e `https://SEU-PROJETO.vercel.app/api/health`. O health deve responder `firebaseAdmin: true`.

### Variáveis de ambiente

| Variável                        | Onde        | O que é                  |
| ------------------------------- | ----------- | ------------------------ |
| `VITE_FIREBASE_API_KEY`         | front       | config do app Web        |
| `VITE_FIREBASE_AUTH_DOMAIN`     | front       | config do app Web        |
| `VITE_FIREBASE_PROJECT_ID`      | front       | config do app Web        |
| `VITE_FIREBASE_APP_ID`          | front       | config do app Web        |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | só servidor | JSON da conta de serviço |
| `ADMIN_EMAIL`                   | só servidor | e-mail Google da admin   |
