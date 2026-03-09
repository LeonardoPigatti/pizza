import { useLocation, useNavigate } from 'react-router-dom';
import Checkout from './Checkout.jsx';

/**
 * Wrapper de rota para o Checkout.
 * Recebe itens e subtotal via location.state (passado pelo Cardapio ao navegar).
 */
export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const itens    = state?.itens    || [];
  const subtotal = state?.subtotal || 0;

  function handlePedidoConfirmado() {
    // pode limpar carrinho global aqui se precisar
  }

  return (
    <Checkout
      itens={itens}
      subtotal={subtotal}
      onPedidoConfirmado={handlePedidoConfirmado}
    />
  );
}