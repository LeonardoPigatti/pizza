const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const Usuario = require('../models/Usuario.model');

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario._id, email: usuario.email, pizzariaId: usuario.pizzaria, perfil: usuario.perfil },
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

    res.status(201).json({ token, usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email, pizzariaId: usuario.pizzaria, perfil: usuario.perfil } });
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
    res.json({ token, usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email, pizzariaId: usuario.pizzaria, perfil: usuario.perfil } });
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

// POST /api/auth/esqueci-senha
router.post('/esqueci-senha', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ erro: 'Email obrigatório' });

    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (!usuario) return res.json({ mensagem: 'Se o email existir, você receberá o link em breve.' });

    // Gerar token único
    const crypto = require('crypto');
    const token  = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    usuario.resetSenhaToken  = token;
    usuario.resetSenhaExpira = expira;
    await usuario.save({ validateBeforeSave: false });

    // Montar link
    const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link     = `${BASE_URL}/redefinir-senha?token=${token}`;

    // Enviar email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password do Gmail
      },
    });

    await transporter.sendMail({
      from:    `"Pizzaria App" <${process.env.EMAIL_USER}>`,
      to:      usuario.email,
      subject: 'Redefinição de senha',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#e03c1f">Redefinição de senha</h2>
          <p>Olá, <strong>${usuario.nome}</strong>!</p>
          <p>Clique no botão abaixo para redefinir sua senha. O link expira em <strong>1 hora</strong>.</p>
          <a href="${link}" style="display:inline-block;background:#e03c1f;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
            Redefinir senha
          </a>
          <p style="color:#aaa;font-size:12px">Se você não solicitou isso, ignore este email.</p>
          <p style="color:#aaa;font-size:12px">Link: ${link}</p>
        </div>
      `,
    });

    res.json({ mensagem: 'Se o email existir, você receberá o link em breve.' });
  } catch (err) {
    console.error('[Reset senha]', err.message);
    res.status(500).json({ erro: 'Erro ao enviar email. Tente novamente.' });
  }
});

// POST /api/auth/redefinir-senha
router.post('/redefinir-senha', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) return res.status(400).json({ erro: 'Token e nova senha obrigatórios' });
    if (novaSenha.length < 6)  return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });

    const usuario = await Usuario.findOne({
      resetSenhaToken:  token,
      resetSenhaExpira: { $gt: new Date() },
    });

    if (!usuario) return res.status(400).json({ erro: 'Link inválido ou expirado. Solicite um novo.' });

    usuario.senha            = novaSenha;
    usuario.resetSenhaToken  = null;
    usuario.resetSenhaExpira = null;
    await usuario.save();

    res.json({ mensagem: 'Senha redefinida com sucesso! Faça login.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;