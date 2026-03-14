import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Cardapio       from './views/Cardapio/Cardapio.jsx';
import CheckoutPage   from './views/Checkout/CheckoutPage.jsx';
import StatusPedido   from './views/Status/Statuspedido.jsx';
import Login          from './views/Login/Login.jsx';
import Dashboard      from './views/Dashboard/Dashboard.jsx';
import PerfilPizzaria  from './views/PerfilPizzaria/PerfilPizzaria.jsx';
import CardapioAdmin  from './views/CardapioAdmin/Cardapioadmin.jsx';
import EsqueciSenha   from './views/Login/EsqueciSenha.jsx';
import RedefinirSenha from './views/Login/RedefinirSenha.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas específicas SEMPRE antes de /:pizzariaId e do wildcard */}
        <Route path="/checkout/:pizzariaId"       element={<CheckoutPage />} />
        <Route path="/status/:pedidoId"           element={<StatusPedido />} />
        <Route path="/login"                      element={<Login />} />
        <Route path="/dashboard/:pizzariaId"      element={<Dashboard />} />
        <Route path="/perfil/:pizzariaId"         element={<PerfilPizzaria />} />
        <Route path="/cardapio-admin/:pizzariaId" element={<CardapioAdmin />} />
        <Route path="/esqueci-senha"              element={<EsqueciSenha />} />
        <Route path="/redefinir-senha"            element={<RedefinirSenha />} />

        {/* Rota genérica por último */}
        <Route path="/:pizzariaId" element={<Cardapio />} />
        <Route path="*" element={<p style={{ textAlign: 'center', padding: 80 }}>404 — Página não encontrada</p>} />
      </Routes>
    </BrowserRouter>
  );
}