import { useEffect, useRef } from 'react';
import './Chat.css';

function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Chat reutilizável.
 * Props:
 *  - mensagens   : array de { texto, autor, hora }
 *  - texto       : string do input controlado
 *  - setTexto    : setter
 *  - enviar      : fn()
 *  - handleKeyDown: fn(e)
 *  - autorLocal  : 'cliente' | 'pizzaria' — quem está usando esse componente
 */
export default function Chat({ mensagens, texto, setTexto, enviar, handleKeyDown, autorLocal, carregando }) {
  const fimRef = useRef(null);

  // Scroll automático para última mensagem
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  return (
    <div className="chat-wrapper">

      <div className="chat-mensagens">
        {carregando && (
          <div className="chat-vazio">Carregando histórico...</div>
        )}
        {!carregando && mensagens.length === 0 && (
          <div className="chat-vazio">
            Nenhuma mensagem ainda.<br />Mande uma mensagem!
          </div>
        )}

        {mensagens.map((msg, i) => {
          const souEu = msg.autor === autorLocal;
          return (
            <div key={i} className={`chat-bolha-wrapper ${souEu ? 'eu' : 'outro'}`}>
              <div className="chat-bolha">{msg.texto}</div>
              <div className="chat-bolha-autor">
                {souEu ? 'Você' : msg.autor === 'pizzaria' ? '🍕 Pizzaria' : '👤 Cliente'} · {formatarHora(msg.hora)}
              </div>
            </div>
          );
        })}
        <div ref={fimRef} />
      </div>

      <div className="chat-input-wrapper">
        <textarea
          className="chat-input"
          placeholder="Digite uma mensagem..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="chat-btn-enviar"
          onClick={enviar}
          disabled={!texto.trim()}
          aria-label="Enviar"
        >
          ➤
        </button>
      </div>

    </div>
  );
}