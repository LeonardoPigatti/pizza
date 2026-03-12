import { useLocation, useNavigate } from 'react-router-dom';
import Checkout from './Checkout.jsx';

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const itens       = state?.itens       || [];
  const subtotal    = state?.subtotal    || 0;
  const pizzariaId  = state?.pizzariaId  || '';

  return (
    <Checkout
      itens={itens}
      subtotal={subtotal}
      pizzariaId={pizzariaId}
      onPedidoConfirmado={() => {}}
    />
  );
}