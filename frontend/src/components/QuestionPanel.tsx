import { useState } from 'react';
import { Send } from 'lucide-react';

interface QuestionPanelProps {
  onAskQuestion: (question: string) => void;
  isLoading: boolean;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ onAskQuestion, isLoading }) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onAskQuestion(question);
      setQuestion('');
    }
  };

  return (
    <div style={{
      padding: '30px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '20px'
      }}>
        Ask a Question
      </h2>

      {/* Question Input Area */}
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question here..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '15px',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s',
            backgroundColor: isLoading ? '#f9fafb' : 'white'
          }}
          onFocus={(e) => e.target.style.borderColor = '#2563eb'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="btn"
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            alignSelf: 'flex-end'
          }}
        >
          {isLoading ? (
            <>
              <div className="loading" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Send</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default QuestionPanel;
