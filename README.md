# Controle de Estoque (MVP acadêmico)

Stack: React + Vite + Tailwind CSS (client) · Node.js + Express + MySQL (server).

## Como executar

Requisitos: Node.js 18 ou superior e MySQL 8.0.16 ou superior.

```bash
npm run install:all   # instala dependências da raiz, do server e do client
npm run seed          # apaga os dados existentes e insere dados de teste
npm run dev           # sobe API (3001) e site (5173) juntos
```

Antes de iniciar, crie o banco MySQL e configure a conexão:

```sql
CREATE DATABASE estoque_varejo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

Copie `server/.env.example` para `server/.env` e preencha `MYSQL_HOST`, `MYSQL_PORT`,
`MYSQL_USER`, `MYSQL_PASSWORD` e `MYSQL_DATABASE`. O usuário MySQL precisa de permissão
para criar tabelas e índices no banco. A API cria as tabelas ao iniciar.

Para transferir os dados atuais do arquivo SQLite `server/src/database/estoque.db`,
configure a conexão acima e execute **antes de iniciar a API ou popular o banco**:

```bash
npm run migrate:sqlite --prefix server
```

A importação preserva IDs, produtos, movimentações e datas. Ela só importa para tabelas
vazias; se o banco de destino já tiver dados, a operação é cancelada sem sobrescrevê-los.
Faça backup do SQLite e confira as contagens após a importação. O arquivo SQLite original
é mantido como backup e origem da migração.

Abra http://localhost:5173

## Usuários e autenticação

As senhas são armazenadas com hash scrypt. As sessões ficam no banco e usam cookie
`HttpOnly`, `SameSite=Strict` e, em produção, `Secure`. Todas as rotas da API de estoque
exigem sessão válida; o login permite até 10 tentativas por 15 minutos por IP.

### Criar a conta inicial no deploy

1. Configure o banco de produção e as variáveis de conexão no painel do serviço de deploy.
2. Gere uma chave exclusiva para a configuração inicial, por exemplo com
   `openssl rand -hex 32`.
3. Cadastre o resultado como variável secreta `AUTH_SETUP_KEY` **no serviço do servidor/API**,
   nunca nas variáveis públicas do cliente. Faça o deploy/redeploy do servidor.
4. Acesse o site. Enquanto não houver usuários, ele direciona para a configuração inicial.
   Informe nome de usuário, senha e a mesma chave secreta para criar a conta administradora.
5. Depois da criação, a configuração inicial é bloqueada no banco. Remova `AUTH_SETUP_KEY`
   das variáveis do deploy e reinicie o servidor. A conta já criada continuará funcionando.

O nome de usuário aceita de 3 a 40 caracteres (letras sem acento, números, ponto, `_` ou
`-`); a senha deve ter de 12 a 128 caracteres. A criação inicial é limitada a 5 tentativas
por 15 minutos por IP e protegida contra requisições simultâneas.

Administradores podem criar contas comuns na tela **Usuários** do sistema. Essas contas
não podem administrar outros usuários. A API também verifica a permissão de administrador,
portanto proteger a tela no cliente não é a única barreira.

Para desenvolvimento ou recuperação administrativa, também é possível criar uma conta pelo
terminal interativo:

```bash
npm run create:user --prefix server
```

O comando solicita a senha sem exibi-la e cria uma conta administradora. Nunca passe
senhas como argumentos nem as envie ao repositório.

## Estrutura

```
server/src
  database/   schema.sql, db.js (conexão MySQL), seed.js (dados fictícios), migrar-sqlite.js
  routes/     rotas HTTP, incluindo autenticação e administração de usuários
  services/   consultas ao banco, validação e dashboard.service.js
client/src
  components/ Layout, StatusBadge, TipoBadge, ResumoCard, Variacao, Campo, Aviso, Segmentado
  pages/      Login, ConfigurarConta, Usuarios, Dashboard, Produtos, ProdutoForm, ProdutoDetalhe, EstoqueBaixo, RegistrarMovimentacao (entrada e saída), Historico
  services/   api.js (chamadas à API)
  utils/      formatar.js (moeda, datas, preço), estoque.js (status e quantidade)
  styles/     index.css (Tailwind, paleta e classes .btn, .campo, .card)
```

## Telas

- `/` Login
- `/configurar` criação inicial, disponível somente sem usuários e com chave configurada
- `/usuarios` administração de contas (administrador)
- `/dashboard` Dashboard: cards, reposição e últimas movimentações
- `/produtos` lista com busca, filtro por status e cartões de resumo
- `/produtos/novo` cadastro
- `/produtos/:id` visualização
- `/produtos/:id/editar` edição
- `/estoque-baixo` produtos sem estoque ou no mínimo, para repor
- `/entrada` registrar entrada de mercadorias
- `/saida` registrar saída de produtos
- `/historico` todas as movimentações, com filtros por tipo, produto e período

## Status do estoque

- estoque > mínimo: normal
- 0 < estoque <= mínimo: baixo
- estoque = 0: sem estoque

## Endpoints

- POST `/api/auth/login`   corpo: `{ "usuario": "nome", "senha": "..." }`
- GET  `/api/auth/setup-status` disponibilidade da configuração inicial
- POST `/api/auth/setup` cria a primeira conta administradora; exige `AUTH_SETUP_KEY`
- GET  `/api/auth/session` sessão atual
- POST `/api/auth/logout`  encerra a sessão
- GET  `/api/admin/users` lista usuários (administrador)
- POST `/api/admin/users` cria usuário comum (administrador)
- GET  /api/dashboard   (resumo, estoque baixo, sem estoque e últimas movimentações)
- GET  /api/produtos?busca=&status=normal|estoque_baixo|sem_estoque
- POST /api/produtos
- GET  /api/produtos/:id
- PUT  /api/produtos/:id  (não altera a quantidade em estoque)
- GET  /api/produtos/categorias
- GET  /api/produtos/resumo
- GET  /api/produtos/reposicao   (sem estoque ou estoque <= mínimo; sem estoque primeiro)
- GET  /api/movimentacoes?produtoId=&tipo=entrada|saida&dataInicio=AAAA-MM-DD&dataFim=AAAA-MM-DD
- POST /api/movimentacoes/entrada   corpo: { "produto_id": 1, "quantidade": 20 }
- POST /api/movimentacoes/saida     corpo: { "produto_id": 1, "quantidade": 2 }

## Regras de movimentação

- Quantidade deve ser um inteiro maior que zero.
- Saída maior que o estoque é recusada (HTTP 409): "Estoque insuficiente. Há apenas X unidades disponíveis."
- Estoque, histórico e data são gravados juntos, em uma única transação: se algo falhar, nada é salvo.
- O status do produto é calculado a cada consulta, então muda sozinho após cada movimentação.
