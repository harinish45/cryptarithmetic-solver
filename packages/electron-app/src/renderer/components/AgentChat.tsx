import React, { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'agent' | 'system', content: string };

export function AgentChat({ onClose }: { onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'agent', content: 'Hi there! I am your Cryptarithmetic Puzzle Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            });

            const data = await res.json();

            if (data.error) {
                setMessages(prev => [...prev, { role: 'system', content: `Error: ${data.error}` }]);
            } else {
                // Handle ADK response format (adjust depending on ADK output structure, usually `data.text` or `data.content`)
                setMessages(prev => [...prev, { role: 'agent', content: data.text || data.content || "I computed a response but couldn't format it." }]);
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'system', content: `Network Error: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="agent-chat-overlay" style={styles.overlay}>
            <div className="agent-chat-container" style={styles.container}>
                <div style={styles.header}>
                    <h3 style={{ margin: 0 }}>✨ AI Assistant</h3>
                    <button onClick={onClose} style={styles.closeBtn}>✕</button>
                </div>

                <div style={styles.chatLog}>
                    {messages.map((m, idx) => (
                        <div key={idx} style={{ ...styles.message, ...(m.role === 'user' ? styles.userMsg : styles.agentMsg) }}>
                            <strong>{m.role === 'user' ? 'You' : m.role === 'agent' ? 'AI Assistant' : 'System'}: </strong>
                            <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ ...styles.message, ...styles.agentMsg, opacity: 0.7 }}>
                            <strong>AI Assistant: </strong> Thinking...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div style={styles.inputArea}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        style={styles.input}
                        placeholder="Ask me for a hint or to make a puzzle..."
                    />
                    <button onClick={handleSend} disabled={loading || !input.trim()} style={styles.sendBtn}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed' as const,
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'flex-end',
    },
    container: {
        width: '380px',
        height: '500px',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column' as const,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden'
    },
    header: {
        padding: '16px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        fontSize: '1.2rem',
    },
    chatLog: {
        flex: 1,
        padding: '16px',
        overflowY: 'auto' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    message: {
        padding: '10px 14px',
        borderRadius: '8px',
        fontSize: '0.95rem',
        lineHeight: 1.4,
        maxWidth: '85%'
    },
    userMsg: {
        backgroundColor: '#3b82f6',
        color: '#fff',
        alignSelf: 'flex-end',
        borderBottomRightRadius: '0'
    },
    agentMsg: {
        backgroundColor: '#334155',
        color: '#f8fafc',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: '0'
    },
    inputArea: {
        padding: '16px',
        display: 'flex',
        gap: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        backgroundColor: '#0f172a'
    },
    input: {
        flex: 1,
        padding: '10px 12px',
        borderRadius: '6px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        outline: 'none'
    },
    sendBtn: {
        padding: '10px 16px',
        backgroundColor: '#8b5cf6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold'
    }
};
