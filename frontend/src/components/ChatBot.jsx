import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../lib/axios';
import robotIcon from '../assets/robot-icon.png';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: <>Hi! I am the <span style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700, color: '#4f46e5', fontSize: '18px' }}>FolioFlo</span> Assistant. How can I help you with your research today?</> }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isSearchPage = location.pathname === '/search';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, selectedImage]);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleChatBot', handleToggle);
    return () => window.removeEventListener('toggleChatBot', handleToggle);
  }, []);

  const getContext = async () => {
    const pathname = window.location.pathname;
    if (pathname.includes('/search')) {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('query') || urlParams.get('query_id') || 'Unknown Query';
      
      const titles = Array.from(document.querySelectorAll('h3.line-clamp-2'))
        .map(el => el.innerText);
      
      if (titles.length > 0) {
        return `Current Search Query: "${query}"\nCurrently Viewable Papers:\n${titles.map((t, i) => `${i+1}. ${t}`).join('\n')}`;
      }
    } else if (pathname.startsWith('/projects/')) {
      const projectId = pathname.split('/')[2];
      if (projectId) {
        try {
          const res = await apiClient.get(`/projects/${projectId}`);
          const p = res.data;
          const paperTitles = p.papers && p.papers.length > 0 ? p.papers.map(x => x.title).join(', ') : 'None';
          const notesContent = p.note && p.note.content ? p.note.content : 'None';
          return `User is working on project: ${p.name}. Description: ${p.description || 'None'}. Papers in this project: ${paperTitles}. Notes: ${notesContent}`;
        } catch (e) {
          console.error('Failed to get project context for chatbot', e);
        }
      }
    }
    return '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setMessages(prev => [...prev, { role: 'system', content: 'Image too large. Please upload an image under 5MB.' }]);
      e.target.value = null; // reset input
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage({
        file,
        dataUrl: reader.result,
        base64: reader.result.split(',')[1],
        mediaType: file.type
      });
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleSend = async () => {
    const userMessage = input.trim();
    const currentImage = selectedImage;
    
    if (!userMessage && !currentImage) return;
    
    setInput('');
    setSelectedImage(null);
    
    const msgObject = { role: 'user', content: userMessage };
    if (currentImage) msgObject.image = currentImage.dataUrl;
    
    setMessages(prev => [...prev, msgObject]);
    setIsTyping(true);

    try {
      const context = await getContext();
      
      const payload = {
        message: userMessage || null,
        context: context || null,
        image_base64: currentImage ? currentImage.base64 : null,
        image_media_type: currentImage ? currentImage.mediaType : null
      };

      const response = await apiClient.post('/chat/', payload);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.reply,
        papers: response.data.papers,
        suggested_query: response.data.suggested_query
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error communicating with the server." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 sm:w-96 mb-4 flex flex-col overflow-hidden"
            style={{ height: '550px', maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center shadow-md z-10 shrink-0">
              <div className="flex items-center text-white">
                <Bot className="h-5 w-5 mr-2" />
                <h3 className="font-bold text-sm flex items-center gap-1"><span style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700, color: '#4f46e5', fontSize: '18px' }}>FolioFlo</span> Assistant</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-indigo-100 hover:text-white hover:bg-indigo-700 p-1 rounded-full transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
              {messages.map((msg, idx) => {
                if (msg.role === 'system') {
                  return (
                    <div key={idx} className="flex justify-center my-1">
                      <span className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded-full font-medium shadow-sm border border-red-100">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-sm' 
                          : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-sm'
                      }`}
                    >
                      {/* Image Preview (User) */}
                      {msg.image && (
                        <img src={msg.image} alt="Upload" className="max-w-full h-auto rounded-lg mb-2 shadow-sm border border-white/20" />
                      )}
                      
                      {/* Message Content */}
                      {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}

                      {/* Vision AI Related Papers (Assistant) */}
                      {msg.papers && msg.papers.length > 0 && (
                        <div className="mt-4 border-t border-gray-200/50 pt-3">
                          <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Bot className="h-3.5 w-3.5" />
                            Related Papers Found
                          </h4>
                          <div className="flex flex-col gap-2.5">
                            {msg.papers.map((p, pIdx) => (
                              <div key={p.id || pIdx} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 shadow-sm hover:shadow hover:border-gray-200 transition-all">
                                <div className="font-semibold text-gray-900 leading-tight mb-1.5 text-xs line-clamp-2" title={p.title}>{p.title}</div>
                                <div className="flex justify-between items-center text-[10px] text-gray-500">
                                  <span className="bg-white px-1.5 py-0.5 rounded border border-gray-100 font-medium truncate max-w-[120px]">
                                    {p.source} • {p.published_date ? new Date(p.published_date).getFullYear() : 'N/A'}
                                  </span>
                                  {(p.pdf_url || p.url || p.doi) && (
                                    <a 
                                      href={p.pdf_url || p.url || (p.doi ? `https://doi.org/${p.doi}` : '#')} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-indigo-600 font-bold hover:underline ml-2 shrink-0"
                                    >
                                      Read
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Search Redirect Button */}
                          {msg.suggested_query && (
                            <button 
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/search', { state: { query: msg.suggested_query } });
                              }}
                              className="w-full mt-3 block text-center bg-indigo-50 border border-indigo-100 text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors"
                            >
                              <span className="flex items-center justify-center gap-1">Search <span style={{ fontFamily: '"Dancing Script", cursive', fontWeight: 700, color: '#4f46e5', fontSize: '18px' }}>FolioFlo</span> for this topic</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 w-16">
                    <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected Image Preview Bar */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2 bg-indigo-50/50 border-t border-gray-100 flex items-center justify-between shrink-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={selectedImage.dataUrl} alt="Preview" className="h-10 w-10 object-cover rounded shadow-sm border border-indigo-100" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 truncate max-w-[140px]">{selectedImage.file.name}</span>
                  </div>
                  <button onClick={() => setSelectedImage(null)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/jpeg, image/jpg, image/png, image/webp" 
                className="hidden" 
                onChange={handleFileChange} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors focus:outline-none"
                title="Attach Image"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              
              <input 
                type="text"
                placeholder="Ask or upload an image..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isTyping}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {(!isSearchPage || isOpen) && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`${isOpen ? 'bg-gray-800' : 'bg-indigo-600 shadow-xl shadow-indigo-600/30'} text-white p-4 rounded-full transition-colors focus:outline-none z-50`}
        >
          {isOpen ? <X className="h-6 w-6" /> : <img src={robotIcon} alt="Robot" className="h-7 w-7 brightness-0 invert" />}
        </motion.button>
      )}
    </div>
  );
};

export default ChatBot;
