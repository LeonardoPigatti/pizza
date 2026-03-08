require('dotenv').config();
const mongoose = require('mongoose');

// ── Schemas inline para não depender de paths ──
const ProdutoSchema = new mongoose.Schema({
  nome:       String,
  descricao:  String,
  categorias: [String],
  tamanhos:   [{ tamanho: String, preco: Number, maxSabores: Number }],
  adicionais: [{ nome: String, preco: Number }],
}, { timestamps: true });

const PizzariaSchema = new mongoose.Schema({
  nome:     String,
  endereco: Object,
  telefone: String,
}, { timestamps: true });

const Produto  = mongoose.model('Produto',  ProdutoSchema);
const Pizzaria = mongoose.model('Pizzaria', PizzariaSchema);

// ── Dados ──
const produtos = [
  {
    nome: 'Margherita',
    descricao: 'Molho de tomate, mussarela fresca e manjericão.',
    categorias: ['Tradicional'],
    tamanhos: [
      { tamanho: 'Pequena', preco: 32, maxSabores: 1 },
      { tamanho: 'Média',   preco: 45, maxSabores: 2 },
      { tamanho: 'Grande',  preco: 58, maxSabores: 2 },
    ],
    adicionais: [
      { nome: 'Borda recheada', preco: 8 },
      { nome: 'Extra mussarela', preco: 6 },
    ],
  },
  {
    nome: 'Calabresa',
    descricao: 'Calabresa fatiada, cebola roxa e azeitona.',
    categorias: ['Tradicional'],
    tamanhos: [
      { tamanho: 'Pequena', preco: 34, maxSabores: 1 },
      { tamanho: 'Média',   preco: 47, maxSabores: 2 },
      { tamanho: 'Grande',  preco: 60, maxSabores: 2 },
    ],
    adicionais: [
      { nome: 'Borda recheada', preco: 8 },
      { nome: 'Pimenta', preco: 2 },
    ],
  },
  {
    nome: 'Quatro Queijos',
    descricao: 'Mussarela, parmesão, provolone e gorgonzola.',
    categorias: ['Especial'],
    tamanhos: [
      { tamanho: 'Pequena', preco: 40, maxSabores: 1 },
      { tamanho: 'Média',   preco: 55, maxSabores: 2 },
      { tamanho: 'Grande',  preco: 70, maxSabores: 2 },
    ],
    adicionais: [
      { nome: 'Borda recheada', preco: 8 },
      { nome: 'Extra gorgonzola', preco: 7 },
    ],
  },
  {
    nome: 'Frango com Catupiry',
    descricao: 'Frango desfiado temperado com catupiry cremoso.',
    categorias: ['Especial'],
    tamanhos: [
      { tamanho: 'Pequena', preco: 38, maxSabores: 1 },
      { tamanho: 'Média',   preco: 52, maxSabores: 2 },
      { tamanho: 'Grande',  preco: 66, maxSabores: 2 },
    ],
    adicionais: [
      { nome: 'Borda recheada', preco: 8 },
      { nome: 'Extra catupiry', preco: 5 },
    ],
  },
  {
    nome: 'Vegana da Casa',
    descricao: 'Molho de tomate, abobrinha, pimentão, cogumelos e rúcula.',
    categorias: ['Vegana'],
    tamanhos: [
      { tamanho: 'Pequena', preco: 36, maxSabores: 1 },
      { tamanho: 'Média',   preco: 50, maxSabores: 2 },
      { tamanho: 'Grande',  preco: 64, maxSabores: 2 },
    ],
    adicionais: [
      { nome: 'Borda de alho', preco: 6 },
      { nome: 'Extra legumes', preco: 5 },
    ],
  },
  {
    nome: 'Portuguesa',
    descricao: 'Presunto, ovos, cebola, azeitona e pimentão.',
    categorias: ['Tradicional'],
    tamanhos: [
      { tamanho: 'Pequena', preco: 35, maxSabores: 1 },
      { tamanho: 'Média',   preco: 48, maxSabores: 2 },
      { tamanho: 'Grande',  preco: 62, maxSabores: 2 },
    ],
    adicionais: [
      { nome: 'Borda recheada', preco: 8 },
      { nome: 'Extra presunto', preco: 5 },
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado ao MongoDB');

  // Limpa collections
  await Produto.deleteMany({});
  await Pizzaria.deleteMany({});
  console.log('🗑️  Collections limpas');

  // Insere produtos
  const produtosSalvos = await Produto.insertMany(produtos);
  console.log(`🍕 ${produtosSalvos.length} produtos inseridos`);

  // Insere pizzaria com referência aos produtos
  const pizzaria = await Pizzaria.create({
    nome: 'La Pizza',
    endereco: {
      rua: 'Rua das Pizzas',
      numero: '42',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100',
    },
    telefone: '(11) 99999-0000',
  });

  console.log(`🏪 Pizzaria criada com ID: ${pizzaria._id}`);
  console.log(`\n👉 Acesse: http://localhost:5173/${pizzaria._id}\n`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});