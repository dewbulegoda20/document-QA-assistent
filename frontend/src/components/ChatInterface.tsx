import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, ChatInterfaceProps } from '../types';

// Component to render answer with references after each section
const AnswerWithReferences: React.FC<{
  content: string;
  chunks: any[];
  onReferenceClick: (chunk: any) => void;
}> = ({ content, chunks, onReferenceClick }) => {
  // Split content into lines and group by numbered sections
  const lines = content.split('\n');
  const sections: { text: string; hasNumber: boolean }[] = [];
  let currentSection = '';
  let currentHasNumber = false;
  
  lines.forEach((line) => {
    const numberedMatch = line.match(/^(\d+)\.\s+/);
    
    if (numberedMatch) {
      // Save previous section if exists
      if (currentSection.trim()) {
        sections.push({
          text: currentSection.trim(),
          hasNumber: currentHasNumber
        });
      }
      // Start new section
      currentSection = line;
      currentHasNumber = true;
    } else {
      // Continue current section
      currentSection += '\n' + line;
    }
  });
  
  // Add the last section
  if (currentSection.trim()) {
    sections.push({
      text: currentSection.trim(),
      hasNumber: currentHasNumber
    });
  }
  
  // Filter to only numbered sections
  const numberedSections = sections.filter(s => s.hasNumber);
  
  console.log('Numbered sections found:', numberedSections.length);
  console.log('Chunks available:', chunks.length);
  
  return (
    <div style={{ color: '#1f2937' }}>
      {numberedSections.map((section, index) => {
        // Use modulo to cycle through available chunks if we have more sections than chunks
        const chunkIndex = index % chunks.length;
        const chunk = chunks[chunkIndex];
        
        return (
          <div key={index} style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.text}
              </ReactMarkdown>
            </div>
            
            {/* Always show reference if we have any chunks */}
            {chunk && (
              <div style={{ 
                marginLeft: '20px',
                marginTop: '4px',
                marginBottom: '4px'
              }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onReferenceClick(chunk);
                  }}
                  style={{
                    fontSize: '11px',
                    color: '#2563eb',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#dbeafe';
                    (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '#eff6ff';
                    (e.currentTarget as HTMLElement).style.borderColor = '#bfdbfe';
                  }}
                  title={`Click to navigate to page ${chunk.page || 'unknown'}`}
                >
                  <span>�</span>
                  <span>Page {chunk.page || '?'}</span>
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

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

      if (result && result.success) {
        // Safely handle the response structure
        const relevantChunks = Array.isArray(result.relevantChunks) ? result.relevantChunks : [];
        
        console.log('Received chunks from API:', relevantChunks);
        console.log('First chunk page:', relevantChunks[0]?.page);
        
        // Validate each chunk has required properties
        const validChunks = relevantChunks.filter((chunk: any) => 
          chunk && 
          typeof chunk === 'object' && 
          typeof chunk.text === 'string' &&
          typeof chunk.start === 'number' &&
          typeof chunk.end === 'number'
        );

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.answer || 'No answer provided',
          timestamp: new Date(),
          relevantChunks: validChunks,
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Only highlight valid chunks
        onHighlightChunks(validChunks);
      } else {
        throw new Error(result?.error || 'Failed to get answer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReferenceClick = (chunk: any) => {
    console.log('🔗 Reference clicked! Chunk:', chunk);
    console.log('📄 Page number:', chunk.page);
    // Highlight only the specific chunk that was clicked, which will trigger page navigation in DocumentViewer
    onHighlightChunks([chunk]);
  };

  return (
    <div className="chat-container" style={{ background: 'white' }}>
      {/* Messages - Hidden for clean look, just show input */}
      <div className="messages" style={{ 
        background: 'white',
        display: messages.length === 0 ? 'flex' : 'block',
        alignItems: 'center',
        justifyContent: 'center',
        padding: messages.length === 0 ? '40px 30px' : '20px 30px'
      }}>
        {messages.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic' }}>
            Your conversation will appear here...
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.type}`}
            style={{ 
              cursor: 'default',
            }}
          >
            {/* Message content with Markdown formatting */}
            <div className="markdown-content" style={{ color: '#1f2937' }}>
              {message.type === 'assistant' && message.relevantChunks && message.relevantChunks.length > 0 ? (
                <AnswerWithReferences
                  content={message.content}
                  chunks={message.relevantChunks}
                  onReferenceClick={handleReferenceClick}
                />
              ) : message.type === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p style={{ margin: 0, color: '#1f2937', fontWeight: '500' }}>{message.content}</p>
              )}
            </div>
            
            {/* Metadata */}
            <div style={{ 
              fontSize: '11px', 
              color: '#9ca3af', 
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span>{message.timestamp.toLocaleTimeString()}</span>
              
              {message.searchMetadata?.maxSimilarity !== undefined && (
                <span style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: '#f0fdf4',
                  borderRadius: '10px',
                  color: '#16a34a',
                  fontSize: '10px',
                  fontWeight: '500'
                }}>
                  ✓ {(message.searchMetadata.maxSimilarity * 100).toFixed(0)}% relevant
                </span>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant" style={{ opacity: 0.8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="loading"></div>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Analyzing document...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="error">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Input Form - Styled as large textarea */}
      <form onSubmit={handleSubmit} className="chat-form" style={{ 
        flexDirection: 'column',
        padding: '14px 20px',
        background: 'white',
        borderTop: '1px solid #e5e7eb'
      }}>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your question here..."
          className="input"
          disabled={isLoading}
          style={{
            minHeight: '60px',
            resize: 'vertical',
            marginBottom: '12px',
            fontFamily: 'inherit',
            fontSize: '14px',
            padding: '10px 14px'
          }}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            alignSelf: 'flex-end',
            minWidth: '100px'
          }}
        >
          <Send size={16} />
          <span>{isLoading ? 'Sending...' : 'Send'}</span>
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;