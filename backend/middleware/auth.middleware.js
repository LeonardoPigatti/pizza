const jwt = require('jsonwebtoken');

module.exports = function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, email, pizzariaId }
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};