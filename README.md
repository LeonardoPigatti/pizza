# 🍕 PizzaApp — SaaS de Gestão para Pizzarias

> Plataforma completa de pedidos online com painel administrativo, rastreamento em tempo real e análises financeiras.

---

## 📸 Screenshots

| Cardápio | Dashboard Admin | Status do Pedido |
|----------|-----------------|------------------|
| ![Cardápio](./docs/screenshots/cardapio.png) | ![Dashboard](./docs/screenshots/dashboard.png) | ![Status](./docs/screenshots/status.png) |

---

## 🚀 Demo

🔗 **[Ver demo ao vivo →](https://seu-dominio.com)**

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@demo.com | demo123 |
| Motoboy | motoboy@demo.com | demo123 |

---

## ✨ Funcionalidades

### 👤 Para o Cliente
- 🛒 Cardápio com categorias, busca dinâmica e filtros
- 🍕 Seleção de sabores múltiplos por pizza (½ + ½) com cálculo automático do maior preço
- ➕ Adicionais personalizados por produto
- 🏷️ Cupons de desconto (percentual, valor fixo, frete grátis) com suporte a acumulação
- 📦 Checkout em 4 etapas com busca automática de CEP
- 💳 Pagamento online (crédito, débito, Pix) ou na entrega (dinheiro, maquininha)
- 📍 Entrega ou retirada na loja
- 📱 Acompanhamento do pedido em tempo real com cronômetro
- 🔐 Código de segurança para confirmar a entrega
- 💬 Chat em tempo real com a pizzaria
- ⭐ Avaliação após a entrega
- 🚫 Cancelamento com regras de negócio (atraso de 100%)
- ❓ Página de FAQ com busca

### 🍕 Para a Pizzaria (Admin)
- 📊 Painel de pedidos com filtros por status
- 🔄 Avanço de status com um clique (Aguardando → Preparando → Saiu para entrega → Concluído)
- ↩️ Retrocesso de status com registro de motivo
- 🚫 Cancelamento de pedido com justificativa
- 🔐 Validação de código de segurança ao confirmar entrega
- 💬 Chat em tempo real com o cliente
- 🏪 Abertura/fechamento manual da loja
- ⏰ Abertura automática por horário e dia da semana
- 🕐 Horários individuais por dia da semana (ex: sexta abre às 17h, segunda às 19h)
- 📊 Painel analítico com gráficos de faturamento, top produtos, entrega vs retirada e avaliações
- 💰 Relatório financeiro gerado automaticamente no fechamento do caixa
- 🎟️ Gestão de cupons (criar, ativar/desativar, deletar)
- ✏️ Edição completa do perfil da pizzaria
- 🍕 Gestão do cardápio com categorias e subcategorias

### 🛵 Para o Motoboy
- 👁️ Visualiza apenas pedidos de entrega (sem retiradas)
- ✅ Confirma retirada da pizza na pizzaria
- 🗺️ Integração com Google Maps para navegação
- 📞 Ligação direta para o cliente
- 💬 Chat com o cliente durante a entrega
- ✅ Confirmação de entrega com código de segurança

---

## 🛠️ Stack Tecnológica

### Frontend
```
React 18          — Interface de usuário
React Router v6   — Roteamento SPA
Vite              — Build tool e dev server
CSS puro          — Estilização (sem frameworks CSS)
```

### Backend
```
Node.js           — Runtime
Express.js        — Framework web
MongoDB           — Banco de dados
Mongoose          — ODM para MongoDB
Socket.IO         — Chat e notificações em tempo real
JWT               — Autenticação stateless
bcryptjs          — Hash de senhas
Nodemailer        — Envio de emails (recuperação de senha)
```

### Infraestrutura e Integrações
```
ViaCEP API        — Busca automática de endereço por CEP
Google Maps API   — Navegação para motoboy
Nodemailer + Gmail — Emails transacionais
```

---

## 🏗️ Arquitetura

```
pizzaapp/
├── frontend/                  # React + Vite
│   └── src/
│       └── views/
│           ├── Cardapio/      # Cardápio do cliente
│           ├── Checkout/      # Fluxo de compra (4 etapas)
│           ├── Status/        # Acompanhamento do pedido
│           ├── Dashboard/     # Painel admin + motoboy
│           ├── PainelAnalitico/  # Relatórios e gráficos
│           ├── PerfilPizzaria/   # Configurações da pizzaria
│           ├── CardapioAdmin/    # Gestão de produtos
│           ├── Login/            # Autenticação + recuperação de senha
│           ├── Chat/             # Componente de chat em tempo real
│           ├── Carrinho/         # Carrinho persistente (localStorage)
│           └── FAQ/              # Perguntas frequentes
│
└── backend/                   # Node.js + Express
    ├── models/
    │   ├── Pedido.model.js    # Pedidos com histórico de status
    │   ├── Pizzaria.model.js  # Perfil, horários por dia, configurações
    │   ├── Produto.model.js   # Produtos com tamanhos e adicionais
    │   ├── Usuario.model.js   # Auth com reset de senha
    │   ├── Cupom.model.js     # Cupons com suporte a acumulação
    │   ├── InfoFinanceira.model.js  # Dados de fechamento do caixa
    │   └── Mensagem.model.js  # Mensagens do chat
    ├── routes/
    │   ├── pedido.routes.js   # CRUD + status + cancelamento
    │   ├── pizzaria.routes.js # Perfil + status da loja
    │   ├── produto.routes.js  # Gestão do cardápio
    │   ├── auth.routes.js     # Login + registro + reset de senha
    │   ├── cupom.routes.js    # Gestão e validação de cupons
    │   ├── avaliacao.routes.js
    │   ├── infoFinanceira.routes.js
    │   └── mensagem.routes.js
    ├── middleware/
    │   └── auth.middleware.js # Validação JWT
    └── server.js              # App + Socket.IO + cron de abertura automática
```

---

## ⚙️ Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- MongoDB (local ou Atlas)
- Conta Gmail com App Password (para emails)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/pizzaapp.git
cd pizzaapp
```

### 2. Configure o Backend
```bash
cd backend
npm install
```

Crie o arquivo `.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/pizzaapp
JWT_SECRET=seu_jwt_secret_aqui
EMAIL_USER=seu@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   # App Password do Gmail
FRONTEND_URL=http://localhost:5173
```

Inicie o servidor:
```bash
npm run dev
```

### 3. Configure o Frontend
```bash
cd frontend
npm install
```

Crie o arquivo `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

Inicie o app:
```bash
npm run dev
```

### 4. Acesse
- **Cardápio:** `http://localhost:5173/:pizzariaId`
- **Dashboard:** `http://localhost:5173/dashboard/:pizzariaId`
- **Login:** `http://localhost:5173/login`

---

## 🔌 API — Principais Endpoints

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/registro` | Novo usuário |
| GET  | `/api/auth/me` | Usuário autenticado |
| POST | `/api/auth/esqueci-senha` | Envia email de reset |
| POST | `/api/auth/redefinir-senha` | Redefine senha com token |

### Pedidos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/api/pedidos` | Lista pedidos (auth) |
| POST | `/api/pedidos` | Criar pedido |
| GET  | `/api/pedidos/:id` | Buscar pedido por ID |
| PATCH | `/api/pedidos/:id/status` | Atualizar status |
| POST | `/api/pedidos/:id/cancelar` | Cancelar pedido |
| PATCH | `/api/pedidos/:id/pegar` | Motoboy confirma retirada |

### Pizzaria
| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/api/pizzarias/:id` | Dados da pizzaria |
| PATCH | `/api/pizzarias/:id` | Atualizar perfil (auth) |
| PATCH | `/api/pizzarias/:id/status` | Abrir/fechar loja (auth) |

### Cupons
| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/api/cupons?pizzariaId=` | Listar cupons (auth) |
| POST | `/api/cupons` | Criar cupom (auth) |
| GET  | `/api/cupons/validar?codigo=&pizzariaId=` | Validar cupom (público) |
| PATCH | `/api/cupons/:id/toggle` | Ativar/desativar (auth) |
| DELETE | `/api/cupons/:id` | Deletar (auth) |

---

## 🔐 Regras de Negócio

### Pedidos
- Código de segurança único de 6 caracteres gerado automaticamente (sem O, 0, I, 1 para evitar confusão)
- Cancelamento por pagamento online **não é permitido**
- Cliente só pode cancelar após **100% do tempo estimado** ter passado
- Status não pode retroceder sem **motivo registrado**

### Loja
- Fechamento manual **bloqueado** se houver pedidos em andamento
- Abertura automática respeita o **horário individual de cada dia da semana**
- Ao fechar automaticamente com pedidos em aberto, o sistema **aguarda** e tenta novamente a cada minuto

### Pizzas
- Pizza com 2 sabores cobra o **preço do sabor mais caro**
- Cupons com `acumulavel: false` não podem ser combinados com outros

---

## 📊 Modelo de Dados — Pedido

```json
{
  "statusPedido": "Aguardando confirmacao | Preparando | Saiu para entrega | Concluido | Cancelado",
  "tipoEntrega": "Entrega | Retirada",
  "pagamento": "Cartao online | Dinheiro na entrega | Maquina na entrega",
  "cupons": [{ "codigo": "PROMO10", "tipo": "percentual", "desconto": 10 }],
  "codigoSeguranca": "K7M2XP",
  "cancelamento": {
    "motivoCancelamento": "...",
    "canceladoPor": "pizzaria | cliente",
    "canceladoEm": "2026-01-01T00:00:00Z"
  },
  "historicoStatus": [{ "de": "Preparando", "para": "Aguardando confirmacao", "motivo": "..." }]
}
```

---

## 🗺️ Roadmap

- [ ] Integração com gateway de pagamento (Mercado Pago — Pix real)
- [ ] Página inicial com listagem de pizzarias
- [ ] Onboarding de novas pizzarias (cadastro self-service)
- [ ] Notificações push para novos pedidos
- [ ] Relatórios exportáveis em PDF/Excel
- [ ] App mobile (React Native)
- [ ] Métricas de tempo médio de preparo por produto

---

## 💼 Modelo de Negócio

Este projeto foi desenvolvido como um **SaaS multi-tenant** para pizzarias:

| Plano | Valor |
|-------|-------|
| Trial | 2 meses grátis |
| Mensalidade | R$ 150/mês |
| Anual à vista | R$ 1.500 |
| Renovação anual | R$ 200 |
| Setup sem trial | R$ 400 |

---

## 👨‍💻 Autor

Desenvolvido por **[Seu Nome]**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/seu-perfil)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/seu-usuario)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
