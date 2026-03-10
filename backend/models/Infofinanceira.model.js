const mongoose = require('mongoose');

const InfoFinanceiraSchema = new mongoose.Schema({
  pizzariaId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Pizzaria', required: true },

  // Período
  data:              { type: Date, default: Date.now },      // dia do fechamento
  horaAbertura:      { type: String, default: '' },          // ex: "18:00"
  horaFechamento:    { type: String, default: '' },          // ex: "23:45"

  // Pedidos
  totalPedidos:      { type: Number, default: 0 },           // todos concluídos
  pedidosEntrega:    { type: Number, default: 0 },           // tipo Entrega
  pedidosRetirada:   { type: Number, default: 0 },           // tipo Retirada

  // Financeiro
  faturamentoTotal:  { type: Number, default: 0 },           // soma de todos os pedidos
  ticketMedio:       { type: Number, default: 0 },           // faturamento / pedidos

  // Formas de pagamento
  totalCartaoOnline: { type: Number, default: 0 },           // valor em R$
  totalDinheiro:     { type: Number, default: 0 },           // valor em R$
  qtdCartaoOnline:   { type: Number, default: 0 },           // quantidade de pedidos
  qtdDinheiro:       { type: Number, default: 0 },           // quantidade de pedidos

  // Produtos mais vendidos (top 5)
  topProdutos: [{
    nome:       { type: String },
    quantidade: { type: Number },
    faturamento:{ type: Number },
    _id: false,
  }],

  // Avaliação média do dia
  avaliacaoMediaDia:  { type: Number, default: null },
  totalAvaliacoesDia: { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('InfoFinanceira', InfoFinanceiraSchema);