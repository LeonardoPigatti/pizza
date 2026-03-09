import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Cardapio from './views/Cardapio/Cardapio.jsx';
import CheckoutPage from './views/Checkout/CheckoutPage.jsx';
import StatusPedido from './views/Status/Statuspedido.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:pizzariaId" element={<Cardapio />} />
        <Route path="/checkout/:pizzariaId" element={<CheckoutPage />} />
        <Route path="/status/:pedidoId" element={<StatusPedido />} />
        <Route path="*" element={<p style={{ textAlign: 'center', padding: 80 }}>404 — Página não encontrada</p>} />
      </Routes>
    </BrowserRouter>
  );
}