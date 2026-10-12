import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  X,
  Send,
  FileUp,
  FileText,
  ExternalLink,
  Bot,
  Database,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import { formatPrice } from "./ProductCard";

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  // Persistent conversation ID stored in localStorage as specified in PDF
  const [conversationId] = useState(() => {
    let id = localStorage.getItem("shopsphere_conversation_id");
    if (!id) {
      id = "conv-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now());
      localStorage.setItem("shopsphere_conversation_id", id);
    }
    return id;
  });

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "ai",
      text: "👋 Hi there! I'm SphereAI, your shopping assistant powered by Spring AI & Google Gemini. I have MySQL memory and can also read PDF documents using RAG!",
      suggestedProducts: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // PDF Document RAG state as specified in PDF
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ragStatus, setRagStatus] = useState("");
  const [activeDocument, setActiveDocument] = useState(null);
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const quickPrompts = [
    "🎧 Best headphones under ₹3,000",
    "⌚ Top rated smartwatches",
    "🚚 Shipping & delivery timeline",
    "↩️ Return & refund guarantee",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load history from MySQL on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.get(`/ai/history/${conversationId}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          const loaded = res.data.map((m, idx) => ({
            id: "hist-" + idx,
            role: m.role === "assistant" ? "ai" : m.role,
            text: m.content,
            suggestedProducts: [],
          }));
          setMessages((prev) => [prev[0], ...loaded]);
        }
      } catch (ignored) {}
    }
    loadHistory();
  }, [conversationId]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (messageToSend) => {
    const text = (messageToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      if (activeDocument) {
        // Query Document RAG endpoint
        const res = await api.post("/rag/chat", { message: text });
        const aiReply = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: res.data.response || "No response received from RAG engine.",
          isRag: true,
          suggestedProducts: [],
        };
        setMessages((prev) => [...prev, aiReply]);
      } else {
        // Query Standard Assistant endpoint with MySQL Memory
        const res = await api.post("/ai/chat", {
          message: text,
          conversationId,
        });
        const aiReply = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: res.data.reply || "Here is what I found for you:",
          suggestedProducts: res.data.suggestedProducts || [],
        };
        setMessages((prev) => [...prev, aiReply]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: "I encountered a network issue. Please make sure the Spring Boot backend is running and retry!",
          suggestedProducts: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF documents are allowed for RAG indexing.");
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setRagStatus("Extracting text via PDFBox and chunking...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/rag/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setActiveDocument(res.data.documentName || file.name);
      setRagStatus(`Indexed ${res.data.totalChunks || 1} chunks (${res.data.extractedCharacters || 0} chars)`);

      // Add notification in chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: `📄 Document indexed successfully: **${file.name}** (${res.data.totalChunks || 1} chunks). Ask me anything grounded in this document!`,
          isRag: true,
          suggestedProducts: [],
        },
      ]);
    } catch (err) {
      setRagStatus("Upload failed. Verify Spring Boot is running.");
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([messages[0]]);
    const newId = "conv-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now());
    localStorage.setItem("shopsphere_conversation_id", newId);
    setActiveDocument(null);
    setRagStatus("");
    setSelectedFile(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-assistant-wrapper">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          className="ai-trigger-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open SphereAI Shopping Assistant"
          title="Chat with SphereAI Assistant"
        >
          <div className="ai-trigger-pulse" />
          <Sparkles size={20} className="ai-trigger-icon" />
          <span className="ai-trigger-label">SphereAI</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar-badge">
                <Bot size={18} />
                <span className="ai-status-dot" />
              </div>
              <div>
                <h3 className="ai-chat-title">SphereAI Assistant</h3>
                <span className="ai-chat-subtitle">Spring AI + Gemini + PDF RAG</span>
              </div>
            </div>
            <div className="ai-header-actions">
              <button
                type="button"
                className="ai-action-icon-btn"
                onClick={handleClearChat}
                title="Clear Conversation & Start New Session"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                className="ai-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close Assistant"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Persistent Memory & RAG Status Strip */}
          <div className="ai-status-strip">
            <div className="ai-memory-badge">
              <Database size={12} />
              <span>MySQL Memory Active</span>
            </div>
            {activeDocument ? (
              <div className="ai-rag-active-pill" title={`Grounded on ${activeDocument}`}>
                <CheckCircle2 size={12} />
                <span>RAG: {activeDocument}</span>
              </div>
            ) : (
              <label className="ai-rag-upload-btn" title="Upload PDF to enable RAG answering">
                <FileUp size={12} />
                <span>Upload PDF for RAG</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Quick Starter Chips */}
          <div className="ai-quick-chips">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="ai-chip-btn"
                onClick={() => handleSend(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="ai-messages-container">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-message-row ${msg.role === "user" ? "user-row" : "ai-row"}`}
              >
                {msg.role === "ai" && (
                  <div className="ai-msg-avatar">
                    <Sparkles size={14} />
                  </div>
                )}
                <div
                  className={`ai-message-bubble ${
                    msg.role === "user" ? "user-bubble" : "ai-bubble"
                  } ${msg.isRag ? "rag-bubble" : ""}`}
                >
                  <p>{msg.text}</p>

                  {/* Attached Catalog Products */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="ai-products-deck">
                      {msg.suggestedProducts.map((prod) => (
                        <div key={prod.id} className="ai-product-card">
                          <img
                            src={
                              prod.imageUrl ||
                              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80"
                            }
                            alt={prod.name}
                            className="ai-prod-thumb"
                          />
                          <div className="ai-prod-details">
                            <span className="ai-prod-name" title={prod.name}>
                              {prod.name}
                            </span>
                            <div className="ai-prod-meta">
                              <strong>{formatPrice(prod.price)}</strong>
                              <span className="ai-prod-rating">★ {prod.rating || 4.5}</span>
                            </div>
                            <Link
                              to={`/products/${prod.id}`}
                              className="ai-prod-link"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>View Product</span>
                              <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-message-row ai-row">
                <div className="ai-msg-avatar">
                  <Sparkles size={14} />
                </div>
                <div className="ai-message-bubble ai-bubble typing-bubble">
                  <div className="ai-typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Upload Status Banner (if actively uploading) */}
          {uploading && (
            <div className="ai-uploading-banner">
              <span className="spinner-micro" />
              <span>{ragStatus}</span>
            </div>
          )}

          {/* Input Footer */}
          <div className="ai-chat-footer">
            <div className="ai-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  activeDocument
                    ? `Ask about ${activeDocument}...`
                    : "Ask SphereAI about products or store info..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="ai-text-input"
              />
              <button
                type="button"
                className="ai-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                aria-label="Send Message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
