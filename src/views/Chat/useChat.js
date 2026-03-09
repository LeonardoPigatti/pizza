import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

// Socket único compartilhado pela aplicação
let socketGlobal = null;

function getSocket() {
  if (!socketGlobal || socketGlobal.disconnected) {
    socketGlobal = io(SOCKET_URL);
  }
  return socketGlobal;
}

export function useChat(pedidoId, autor) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto]         = useState('');
  const salaAtual                 = useRef(null);

  useEffect(() => {
    if (!pedidoId) return;

    const socket = getSocket();

    // Sai da sala anterior se existir
    if (salaAtual.current && salaAtual.current !== pedidoId) {
      socket.emit('sair_sala', salaAtual.current);
    }

    // Limpa mensagens ao trocar de pedido
    setMensagens([]);
    salaAtual.current = pedidoId;

    // Entra na nova sala
    socket.emit('entrar_sala', pedidoId);

    // Listener de mensagens
    function onMensagem(msg) {
      setMensagens((prev) => [...prev, msg]);
    }

    socket.on('mensagem', onMensagem);

    return () => {
      socket.off('mensagem', onMensagem);
    };
  }, [pedidoId]);

  const enviar = useCallback(() => {
    if (!texto.trim() || !pedidoId) return;
    const socket = getSocket();
    socket.emit('mensagem', { pedidoId, texto: texto.trim(), autor });
    setTexto('');
  }, [texto, pedidoId, autor]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return { mensagens, texto, setTexto, enviar, handleKeyDown };
}