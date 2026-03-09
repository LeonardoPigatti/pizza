import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
const API        = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  const [carregando, setCarregando] = useState(false);
  const salaAtual                 = useRef(null);

  useEffect(() => {
    if (!pedidoId) return;

    const socket = getSocket();

    // Sai da sala anterior
    if (salaAtual.current && salaAtual.current !== pedidoId) {
      socket.emit('sair_sala', salaAtual.current);
    }

    salaAtual.current = pedidoId;
    setMensagens([]);
    setCarregando(true);

    // Carrega histórico do banco
    fetch(`${API}/mensagens/${pedidoId}`)
      .then(r => r.json())
      .then(data => {
        const historico = data.map(m => ({
          _id:   m._id,
          texto: m.texto,
          autor: m.autor,
          hora:  m.createdAt,
        }));
        setMensagens(historico);
      })
      .catch(console.error)
      .finally(() => setCarregando(false));

    // Entra na sala para receber novas mensagens
    socket.emit('entrar_sala', pedidoId);

    function onMensagem(msg) {
      // Evita duplicar mensagens que já vieram do histórico
      setMensagens(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    }

    socket.on('mensagem', onMensagem);

    return () => {
      socket.off('mensagem', onMensagem);
    };
  }, [pedidoId]);

  const enviar = useCallback(() => {
    if (!texto.trim() || !pedidoId) return;
    getSocket().emit('mensagem', { pedidoId, texto: texto.trim(), autor });
    setTexto('');
  }, [texto, pedidoId, autor]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return { mensagens, texto, setTexto, enviar, handleKeyDown, carregando };
}