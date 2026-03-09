const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const Usuario = require('../models/Usuario.model');

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario._id, email: usuario.email, pizzariaId: usuario.pizzaria },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/registro
// Cria um novo usuário vinculado a uma pizzaria
router.post('/registro', async (req, res) => {
  try {
    const { nome, email, senha, pizzariaId } = req.body;
    if (!nome || !email || !senha || !pizzariaId) {
      return res.status(400).json({ erro: 'Preencha todos os campos' });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ erro: 'Email já cadastrado' });

    const usuario = await Usuario.create({ nome, email, senha, pizzaria: pizzariaId });
    const token   = gerarToken(usuario);

    res.status(201).json({ token, usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email, pizzariaId: usuario.pizzaria } });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios' });

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(401).json({ erro: 'Email ou senha incorretos' });

    const senhaCorreta = await usuario.compararSenha(senha);
    if (!senhaCorreta) return res.status(401).json({ erro: 'Email ou senha incorretos' });

    const token = gerarToken(usuario);
    res.json({ token, usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email, pizzariaId: usuario.pizzaria } });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/auth/me — valida token e retorna usuário logado
router.get('/me', require('../middleware/auth.middleware'), async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-senha').populate('pizzaria');
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;