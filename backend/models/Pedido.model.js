const mongoose = require('mongoose');

const AdicionalSelecionadoSchema = new mongoose.Schema({
  nome:       { type: String, required: true },
  preco:      { type: Number, required: true },
  quantidade: { type: Number, default: 1 },
}, { _id: false });

const PizzaPedidoSchema = new mongoose.Schema({
  produtoId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
  tamanho:    { type: String, enum: ['Pequena', 'Media', 'Grande'], required: true },
  sabores:    { type: [String], required: true },
  adicionais: { type: [AdicionalSelecionadoSchema], default: [] },
  quantidade: { type: Number, default: 1 },
  observacao: { type: String, default: '' },
}, { _id: false });

const EnderecoEntregaSchema = new mongoose.Schema({
  rua:         { type: String },
  numero:      { type: String },
  complemento: { type: String },
  bairro:      { type: String },
  cidade:      { type: String },
  estado:      { type: String },
  cep:         { type: String },
  referencia:  { type: String },
}, { _id: false });

const ContatoSchema = new mongoose.Schema({
  nome:     { type: String, required: true },
  telefone: { type: String, required: true },
  email:    { type: String },
}, { _id: false });

const CupomSchema = new mongoose.Schema({
  codigo:      { type: String, required: true },
  desconto:    { type: Number, default: 0 },
  porcentagem: { type: Number },
  valido:      { type: Boolean, default: true },
}, { _id: false });

// Histórico de retorno de status
const HistoricoStatusSchema = new mongoose.Schema({
  de:        { type: String, required: true },
  para:      { type: String, required: true },
  motivo:    { type: String, required: true },
  criadoEm:  { type: Date, default: Date.now },
}, { _id: false });

const PedidoSchema = new mongoose.Schema({
  pizzas:              { type: [PizzaPedidoSchema], required: true },
  tipoEntrega:         { type: String, enum: ['Entrega', 'Retirada'], required: true },
  enderecoEntrega:     { type: EnderecoEntregaSchema, default: null },
  contato:             { type: ContatoSchema, required: true },
  cupom:               { type: CupomSchema, default: null },
  pagamento:           { type: String, enum: ['Cartao online', 'Dinheiro na entrega'], required: true },
  statusPedido:        {
    type:    String,
    enum:    ['Aguardando confirmacao', 'Preparando', 'Saiu para entrega', 'Concluido'],
    default: 'Aguardando confirmacao',
  },
  tempoEsperaEstimado: { type: Number, default: 40 },
  historicoStatus:     { type: [HistoricoStatusSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Pedido', PedidoSchema);