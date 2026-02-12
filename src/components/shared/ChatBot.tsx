import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ExternalLink, Copy, Check } from 'lucide-react';
import {
  quickActions,
  matchUserIntent,
  shouldEscalateToSupport,
  getTopicById,
  searchTopics,
  KnowledgeTopic
} from '../../lib/chatbotKnowledge';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  topic?: KnowledgeTopic;
  isEscalation?: boolean;
  isQuickAction?: boolean;
}

const WHATSAPP_LINK = 'https://chat.whatsapp.com/FkLVwP6EDMNCOO4PkASezY?mode=gi_t';
const STORAGE_KEY = 'belleya-support-chat-history';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading chat history:', error);
        initializeChat();
      }
    } else {
      initializeChat();
    }
  }, []);

  const initializeChat = () => {
    addBotMessage(
      'Bonjour ! Je suis votre assistant Belleya. Je peux vous aider avec toutes les fonctionnalités de l\'application.\n\nChoisissez une action rapide ci-dessous ou posez-moi votre question.',
      undefined,
      false,
      true
    );
  };

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (text: string, topic?: KnowledgeTopic, isEscalation = false, isQuickAction = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      topic,
      isEscalation,
      isQuickAction
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'contact-support') {
      addUserMessage('Je veux parler à un agent');
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage(
          'Parfait ! Notre équipe support est disponible sur WhatsApp pour vous aider directement et répondre à toutes vos questions.',
          undefined,
          true
        );
        setIsTyping(false);
      }, 500);
      return;
    }

    const topic = getTopicById(actionId);
    if (topic) {
      addUserMessage(topic.title);
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage('', topic);
        setIsTyping(false);
      }, 600);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    addUserMessage(messageText);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      if (shouldEscalateToSupport(messageText)) {
        addBotMessage(
          'Je comprends que vous avez besoin d\'une aide personnalisée. Notre équipe support est disponible sur WhatsApp pour vous accompagner.',
          undefined,
          true
        );
      } else {
        const matchResult = matchUserIntent(messageText);

        if (matchResult.topic) {
          addBotMessage('', matchResult.topic);

          if (matchResult.topic.relatedTopics && matchResult.topic.relatedTopics.length > 0) {
            setTimeout(() => {
              const relatedTitles = matchResult.topic!.relatedTopics!
                .map(id => {
                  const t = getTopicById(id);
                  return t ? `• ${t.title}` : null;
                })
                .filter(Boolean)
                .join('\n');

              if (relatedTitles) {
                addBotMessage(`📚 Questions liées :\n\n${relatedTitles}\n\nVous pouvez me poser une de ces questions.`);
              }
            }, 800);
          }
        } else if (matchResult.score > 0) {
          const suggestions = searchTopics(messageText);
          if (suggestions.length > 0) {
            const suggestionText = suggestions.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
            addBotMessage(
              `Je n'ai pas trouvé de réponse exacte, mais voici des sujets qui pourraient vous intéresser :\n\n${suggestionText}\n\nVous pouvez reformuler votre question ou choisir un de ces sujets.`
            );
          } else {
            addBotMessage(
              'Je n\'ai pas d\'information précise sur ce sujet dans ma base de connaissances Belleya.\n\nPour une aide personnalisée, je vous recommande de contacter notre support.',
              undefined,
              true
            );
          }
        } else {
          addBotMessage(
            'Je n\'ai pas compris votre question. Pouvez-vous la reformuler ou choisir une action rapide ci-dessus ?\n\nSi vous avez besoin d\'une aide immédiate, contactez notre support.',
            undefined,
            true
          );
        }
      }

      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    initializeChat();
  };

  const copyToClipboard = async (text: string, index: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const renderTopicResponse = (topic: KnowledgeTopic) => {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-brand-50 to-blue-50 p-3 rounded-xl border border-brand-200">
          <h4 className="font-bold text-brand-900 mb-1 text-sm">{topic.title}</h4>
          <p className="text-sm text-brand-700 leading-relaxed">{topic.summary}</p>
        </div>

        {topic.steps && topic.steps.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <h5 className="font-bold text-gray-900 text-xs mb-2 flex items-center gap-2">
              <span className="bg-brand-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">✓</span>
              Étapes à suivre
            </h5>
            <ol className="space-y-2">
              {topic.steps.map((step, idx) => (
                <li key={idx} className="flex gap-2 text-xs leading-relaxed">
                  <span className="font-bold text-brand-600 flex-shrink-0">{idx + 1}.</span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {topic.uiPaths && topic.uiPaths.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
            <h5 className="font-bold text-purple-900 text-xs mb-2 flex items-center gap-2">
              <span>🎯</span>
              Où cliquer dans l'app
            </h5>
            <div className="space-y-1.5">
              {topic.uiPaths.map((path, idx) => (
                <div key={idx} className="flex items-start gap-2 group">
                  <code className="text-[11px] bg-purple-100 text-purple-800 px-2 py-1 rounded flex-1 font-mono leading-relaxed">
                    {path}
                  </code>
                  <button
                    onClick={() => copyToClipboard(path, `${topic.id}-path-${idx}`)}
                    className="p-1 hover:bg-purple-200 rounded transition-colors opacity-0 group-hover:opacity-100 md:opacity-0 opacity-100"
                    title="Copier"
                    style={{ touchAction: 'manipulation' }}
                  >
                    {copiedIndex === `${topic.id}-path-${idx}` ? (
                      <Check className="w-3 h-3 text-belleya-bright" />
                    ) : (
                      <Copy className="w-3 h-3 text-purple-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {topic.troubleshooting && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <h5 className="font-bold text-amber-900 text-xs mb-2 flex items-center gap-2">
              <span>⚠️</span>
              En cas de problème
            </h5>

            {topic.troubleshooting.symptoms.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-amber-800 mb-1">Symptômes :</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {topic.troubleshooting.symptoms.map((symptom, idx) => (
                    <li key={idx} className="text-xs text-amber-700">{symptom}</li>
                  ))}
                </ul>
              </div>
            )}

            {topic.troubleshooting.causes.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-amber-800 mb-1">Causes probables :</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {topic.troubleshooting.causes.map((cause, idx) => (
                    <li key={idx} className="text-xs text-amber-700">{cause}</li>
                  ))}
                </ul>
              </div>
            )}

            {topic.troubleshooting.fixes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-1">Solutions :</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {topic.troubleshooting.fixes.map((fix, idx) => (
                    <li key={idx} className="text-xs text-amber-700">{fix}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5">
          <p className="text-[11px] text-gray-600 leading-relaxed">
            💡 <span className="font-semibold">Astuce :</span> Si vous avez encore des questions, n'hésitez pas à les poser ou à contacter notre support.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
          aria-label="Ouvrir le support bot"
          style={{ touchAction: 'manipulation' }}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-base font-medium">
            Besoin d'aide ? Ouvrir le support
          </span>
        </button>
      )}

      {isOpen && (
        <div
          className="w-full bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200"
          style={{
            maxHeight: '600px'
          }}
        >
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
                  <MessageCircle className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h3 className="font-bold text-base">Support Belleya</h3>
                  <p className="text-xs text-white/90">Assistance opérationnelle 24/7</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                aria-label="Fermer le support"
                style={{ touchAction: 'manipulation' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                minHeight: '300px',
                maxHeight: '400px'
              }}
            >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-brand-500 text-white px-4 py-3'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm p-3'
                  }`}
                >
                  {message.sender === 'bot' && message.topic ? (
                    renderTopicResponse(message.topic)
                  ) : (
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  )}

                  {message.isEscalation && (
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 bg-belleya-vivid hover:bg-belleya-bright text-white px-4 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg hover:shadow-xl"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Parler à un agent sur WhatsApp
                    </a>
                  )}

                  {message.isQuickAction && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action.id)}
                          className="bg-white hover:bg-brand-50 text-brand-700 border border-brand-200 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:shadow-md hover:border-brand-300 flex items-center gap-2"
                          style={{ touchAction: 'manipulation' }}
                        >
                          <span className="text-base">{action.icon}</span>
                          <span className="text-left leading-tight">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] mt-2 opacity-60">
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex gap-2 mb-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                disabled={isTyping}
                style={{ touchAction: 'manipulation' }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="bg-brand-500 text-white p-2.5 rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
                aria-label="Envoyer"
                style={{ touchAction: 'manipulation' }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={clearChat}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                style={{ touchAction: 'manipulation' }}
              >
                Nouvelle conversation
              </button>
              <span className="text-[10px] text-gray-400">
                Propulsé par l'IA Belleya
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
