import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, AlertCircle } from 'lucide-react';
import type { Message, ChatInterfaceProps } from '../types';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ documentId, onHighlightChunks }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputMessage,
          documentId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.answer,
          timestamp: new Date(),
          relevantChunks: result.relevantChunks,
        };

        setMessages(prev => [...prev, assistantMessage]);
        onHighlightChunks(result.relevantChunks);
      } else {
        throw new Error(result.error || 'Failed to get answer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageClick = (message: Message) => {
    if (message.relevantChunks) {
      onHighlightChunks(message.relevantChunks);
    }
  };

  return (
    <div className="chat-container">
      {/* Messages */}
      <div className="messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '32px' }}>
            <MessageCircle size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>Start asking questions about your document</p>
            <p style={{ fontSize: '14px' }}>Try asking: "What is this document about?" or "Summarize the main points"</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.type}`}
            onClick={() => handleMessageClick(message)}
            style={{ 
              cursor: message.relevantChunks ? 'pointer' : 'default',
              ...(message.relevantChunks && { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' })
            }}
            title={message.relevantChunks ? 'Click to highlight references in document' : ''}
          >
            {/* Message content with AI Agent formatting */}
            <div style={{ marginBottom: '8px' }}>
              {message.type === 'assistant' ? (
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {message.content.split('\n').map((line, index) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      // Bold headers like **Confidence Level:** or **Answer:**
                      return (
                        <div key={index} style={{ 
                          fontWeight: 'bold', 
                          color: '#1f2937', 
                          marginBottom: '8px', 
                          marginTop: index > 0 ? '12px' : '0',
                          fontSize: '15px'
                        }}>
                          {line.replace(/\*\*/g, '')}
                        </div>
                      );
                    } else if (line.startsWith('- ')) {
                      // Bullet points
                      return (
                        <div key={index} style={{ 
                          marginLeft: '16px', 
                          marginBottom: '4px', 
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          • {line.substring(2)}
                        </div>
                      );
                    } else if (line.trim() === '') {
                      // Empty lines
                      return <div key={index} style={{ height: '8px' }} />;
                    } else {
                      // Regular text
                      return (
                        <div key={index} style={{ 
                          marginBottom: '4px', 
                          lineHeight: '1.5',
                          color: '#374151'
                        }}>
                          {line}
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '14px', marginBottom: '0' }}>{message.content}</p>
              )}
            </div>
            
            {/* Metadata */}
            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
              <span>{message.timestamp.toLocaleTimeString()}</span>
              
              {message.relevantChunks && message.relevantChunks.length > 0 && (
                <span style={{ marginLeft: '12px' }}>
                  📍 {message.relevantChunks.length} reference{message.relevantChunks.length !== 1 ? 's' : ''} found
                </span>
              )}
              
              {message.searchMetadata?.maxSimilarity !== undefined && (
                <span style={{ marginLeft: '12px', color: '#059669' }}>
                  {(message.searchMetadata.maxSimilarity * 100).toFixed(1)}% relevance
                </span>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="loading"></div>
              <span style={{ fontSize: '14px' }}>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="error" style={{ display: 'flex', alignItems: 'center' }}>
          <AlertCircle size={20} style={{ marginRight: '8px' }} />
          <p>{error}</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask a question about the document..."
          className="input chat-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            opacity: (!inputMessage.trim() || isLoading) ? 0.5 : 1,
            cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer'
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;