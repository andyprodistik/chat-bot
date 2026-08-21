import React, { useState, useRef, useEffect } from 'react';
import { Send, GraduationCap, Info, Loader2, Trash2, Database } from 'lucide-react';
import { Message } from './types.ts';
import { ChatMessage } from './components/ChatMessage.tsx';
import { sendMessageToGemini, initChatSession } from './services/gemini.ts';
import { DeploymentGuide } from './components/DeploymentGuide.tsx';
import { DataSourceModal } from './components/DataSourceModal.tsx';

// --- KONFIGURASI UI ---
// Ubah nilai ini menjadi `false` jika Anda ingin menyembunyikan tombol "Atur Sumber Data"
// Di React, kita menggunakan variabel ini untuk "Conditional Rendering" (mirip dengan properti reaktif di Lit Element)
const SHOW_DATA_SOURCE_UI = true; 

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: 'model',
  text: 'Halo! Saya EduBot, asisten virtual layanan pendidikan Anda. Ada yang bisa saya bantu terkait **Nilai**, **Leaderboard**, **Jadwal Kegiatan**, **Info Kelas**, atau **NIS**?',
  timestamp: new Date(),
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDataSource, setShowDataSource] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    initChatSession(); // Initialize Gemini chat session with default data
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(trimmedInput);
      
      const newModelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newModelMessage]);
    } catch (error) {
      console.error("Failed to get response:", error);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus riwayat percakapan?')) {
      setMessages([INITIAL_MESSAGE]);
      // Re-initialize session to clear history, keeping current custom data if any
      initChatSession(); 
    }
  };

  const handleSaveDataSource = (csvData: string, url: string) => {
    setSheetUrl(url);
    
    // Re-initialize Gemini session with the new CSV data
    initChatSession(csvData);
    
    // Add a system notification message to the chat
    const notificationMsg: Message = {
      id: Date.now().toString(),
      role: 'model',
      text: url 
        ? '✅ **Sumber data berhasil diperbarui dari Google Sheet!**\nSaya sekarang akan menjawab pertanyaan Anda berdasarkan data terbaru tersebut.'
        : '🔄 **Sumber data dikembalikan ke default.**\nSaya sekarang menggunakan data simulasi bawaan sistem.',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, notificationMsg]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-5xl mx-auto shadow-2xl overflow-hidden sm:border-x sm:border-slate-200">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
            <GraduationCap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">EduBot</h1>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Online {sheetUrl && <span className="text-slate-400 ml-1">(Data Terhubung)</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Contoh 1: Menyembunyikan elemen menggunakan Conditional Rendering (Cara React yang paling umum) */}
          {SHOW_DATA_SOURCE_UI && (
            <button 
              onClick={() => setShowDataSource(true)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${sheetUrl ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'text-slate-500 hover:bg-slate-100'}`}
              title="Atur Sumber Data"
            >
              <Database size={18} />
              <span className="hidden md:inline">{sheetUrl ? 'Sheet Aktif' : 'Hubungkan Data'}</span>
            </button>
          )}

          {SHOW_DATA_SOURCE_UI && <div className="w-px h-6 bg-slate-200 mx-1"></div>}

          <button 
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Percakapan"
          >
            <Trash2 size={20} />
          </button>
          
          {/* Contoh 2: Menyembunyikan elemen menggunakan atribut HTML 'hidden' (Mirip Lit Element) */}
          {/* Jika Anda mengubah SHOW_DATA_SOURCE_UI menjadi false, tombol ini akan disembunyikan via CSS display:none bawaan browser */}
          <button 
            hidden={!SHOW_DATA_SOURCE_UI}
            onClick={() => setShowGuide(true)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Tutorial Deploy & Konfigurasi"
          >
            <Info size={20} />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/90 bg-blend-overlay">
        <div className="max-w-3xl mx-auto">
          {/* Welcome Banner */}
          {messages.length === 1 && (
            <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="inline-block bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <GraduationCap size={48} className="mx-auto text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Selamat Datang di Layanan EduBot</h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  Tanyakan apa saja seputar nilai ujian, peringkat siswa, jadwal kegiatan sekolah, informasi kelas, atau pengecekan NIS.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['Siapa peringkat 1?', 'Jadwal hari ini', 'Cek nilai Budi'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInputValue(suggestion)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages List */}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex w-full mb-6 justify-start animate-in fade-in">
              <div className="flex max-w-[80%] flex-row">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-500 mr-3 flex items-center justify-center">
                  <Database size={20} className="text-white" />
                </div>
                <div className="px-5 py-4 rounded-2xl rounded-tl-none bg-white border border-slate-200 shadow-sm flex items-center gap-2">
                  <Loader2 size={18} className="text-emerald-500 animate-spin" />
                  <span className="text-sm text-slate-500 font-medium">Menganalisis data...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tanyakan tentang nilai, jadwal, kelas..."
              className="flex-1 bg-transparent border-none focus:ring-0 px-3 py-2 text-slate-800 placeholder-slate-400 min-h-[44px]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white p-3 rounded-xl transition-colors flex items-center justify-center h-[44px] w-[44px]"
              aria-label="Kirim pesan"
            >
              <Send size={20} className={inputValue.trim() && !isLoading ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''} />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            EduBot dapat membuat kesalahan. Harap verifikasi informasi penting ke pihak sekolah.
          </p>
        </div>
      </footer>

      {/* Modals */}
      {showGuide && <DeploymentGuide onClose={() => setShowGuide(false)} />}
      {showDataSource && (
        <DataSourceModal 
          onClose={() => setShowDataSource(false)} 
          onSave={handleSaveDataSource}
          currentUrl={sheetUrl}
        />
      )}
      
    </div>
  );
}
