import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Cardapio from './views/Cardapio/Cardapio.jsx';
import CheckoutPage from './views/Checkout/CheckoutPage.jsx';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:pizzariaId" element={<Cardapio />} />
        <Route path="*" element={<p style={{textAlign:'center', padding: 80}}>404 — Página não encontrada</p>} />
        <Route path="/checkout/:pizzariaId" element={<CheckoutPage />} />
     </Routes>
    </BrowserRouter>
  );
}