import React from 'react';
import { X, Server, Globe, Code, Zap, Key, EyeOff, Cpu, Database } from 'lucide-react';

interface DeploymentGuideProps {
  onClose: () => void;
}

export const DeploymentGuide: React.FC<DeploymentGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Server className="text-blue-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Tutorial Deploy & Info Sistem</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-800"
            aria-label="Tutup"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 text-slate-700">
          
          <section>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Cpu className="text-blue-500" size={20} />
              Apakah ini menggunakan Vertex AI? & Cara Kerja Data
            </h3>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-900 space-y-3">
              <p>
                <strong>Ya, aplikasi ini dikonfigurasi untuk menggunakan Vertex AI.</strong>
              </p>
              <p>
                Pada file <code>services/gemini.ts</code>, inisialisasi SDK menggunakan parameter <code>vertexai: true</code>:
                <br/>
                <code className="bg-blue-100 px-2 py-1 rounded mt-1 inline-block">new GoogleGenAI({`{ apiKey: process.env.API_KEY, vertexai: true }`})</code>
              </p>
              <div className="mt-4 bg-white p-3 rounded-lg border border-blue-200">
                <strong className="block mb-1 text-blue-800">Darimana data "Nilai" berasal saat ini?</strong>
                <p className="mb-2">
                  Saat ini, chatbot tidak melakukan query langsung ke database SQL (karena ini adalah aplikasi frontend murni). Data nilai yang Anda lihat berasal dari teknik <strong>Prompt Injection (System Instructions)</strong>.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-1">
                  <li><strong>Default:</strong> Menggunakan data simulasi (hardcode) yang disisipkan ke dalam instruksi awal Gemini.</li>
                  <li>
                    <strong>Google Sheet:</strong> Jika Anda memasukkan URL CSV, aplikasi akan mengunduh teks CSV tersebut dan menyisipkannya ke dalam instruksi Gemini. Gemini kemudian "membaca" teks tersebut untuk menjawab pertanyaan Anda.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-slate-200" />

          <section>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Database className="text-emerald-500" size={20} />
              Tutorial: Hardcode ENV Google Sheet & Sembunyikan UI
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Jika Anda tidak ingin pengguna melihat tombol "Hubungkan Data" dan ingin URL Google Sheet dimuat secara otomatis di latar belakang, ikuti langkah berikut:
              </p>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2">Langkah 1: Sembunyikan UI Connect Data Sheet</h4>
                <p className="text-sm text-slate-600 mb-2">
                  Buka file <code>App.tsx</code>. Di bagian atas (sekitar baris 11), cari variabel konfigurasi berikut dan ubah nilainya menjadi <code>false</code>:
                </p>
                <pre className="bg-slate-800 text-slate-50 p-3 rounded-lg text-xs overflow-x-auto">
{`// Ubah dari true menjadi false
const SHOW_DATA_SOURCE_UI = false;`}
                </pre>
                <p className="text-sm text-slate-600 mt-2">
                  Ini akan menggunakan teknik <em>Conditional Rendering</em> di React untuk menghilangkan tombol dari tampilan.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2">Langkah 2: Tambahkan URL Sheet ke ENV</h4>
                <p className="text-sm text-slate-600 mb-2">
                  Tambahkan URL CSV publik Google Sheet Anda ke dalam file <code>.env</code> atau pengaturan Environment Variables di hosting Anda (Vercel/Netlify):
                </p>
                <pre className="bg-slate-800 text-slate-50 p-3 rounded-lg text-xs overflow-x-auto">
{`VITE_SHEET_URL="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"`}
                </pre>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2">Langkah 3: Modifikasi App.tsx untuk Auto-Fetch</h4>
                <p className="text-sm text-slate-600 mb-2">
                  Di dalam <code>App.tsx</code>, ubah bagian <code>useEffect</code> saat komponen dimuat (mount) agar otomatis mengambil data dari ENV:
                </p>
                <pre className="bg-slate-800 text-slate-50 p-3 rounded-lg text-xs overflow-x-auto">
{`// Di dalam komponen App(), ubah useEffect yang kosong menjadi seperti ini:
useEffect(() => {
  inputRef.current?.focus();
  
  // Ambil URL dari ENV (sesuaikan dengan framework, misal import.meta.env untuk Vite)
  const envSheetUrl = process.env.VITE_SHEET_URL; 
  
  if (envSheetUrl) {
    // Auto-fetch data di background
    fetch(envSheetUrl)
      .then(res => res.text())
      .then(csvData => {
        initChatSession(csvData); // Inisialisasi dengan data Sheet
        setSheetUrl(envSheetUrl);
      })
      .catch(err => {
        console.error("Gagal memuat data sheet:", err);
        initChatSession(); // Fallback ke data default
      });
  } else {
    initChatSession(); // Gunakan data default jika ENV tidak ada
  }
}, []);`}
                </pre>
              </div>
            </div>
          </section>

          <hr className="border-slate-200" />

          <section>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Key className="text-red-500" size={20} />
              Tutorial: Mengatur & Hardcode ENV API Key
            </h3>
            
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <h4 className="font-bold text-red-800 flex items-center gap-2">
                  ⚠️ Peringatan Keamanan (Hardcode)
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  Melakukan "hardcode" API Key langsung ke dalam kode frontend (seperti React/HTML/JS) <strong>sangat tidak disarankan untuk produksi</strong> karena siapa pun dapat melihat key tersebut melalui Inspect Element (DevTools).
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800">Metode 1: Hardcode Langsung (Hanya untuk Testing Lokal)</h4>
                <p className="text-sm text-slate-600 mt-1 mb-2">Buka file <code>services/gemini.ts</code> dan ganti <code>process.env.API_KEY</code> dengan string key Anda:</p>
                <pre className="bg-slate-800 text-slate-50 p-3 rounded-lg text-xs overflow-x-auto">
{`// SEBELUM:
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

// SESUDAH (Hardcode):
const ai = new GoogleGenAI({ apiKey: "AIzaSyA-ContohKeyAnda123456789", vertexai: true });`}
                </pre>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800">Metode 2: Menggunakan File <code>.env</code> (Standar Node.js/React)</h4>
                <p className="text-sm text-slate-600 mt-1 mb-2">Buat file bernama <code>.env</code> di folder root proyek Anda, lalu tambahkan:</p>
                <pre className="bg-slate-800 text-slate-50 p-3 rounded-lg text-xs overflow-x-auto">
{`VITE_API_KEY="AIzaSyA-ContohKeyAnda123456789"
# atau REACT_APP_API_KEY jika menggunakan Create React App`}
                </pre>
                <p className="text-sm text-slate-600 mt-2">Lalu panggil di kode dengan <code>import.meta.env.VITE_API_KEY</code> atau <code>process.env.REACT_APP_API_KEY</code>.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800">Metode 3: Hardcode via Platform Hosting (Vercel/Netlify)</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Ini adalah cara teraman jika Anda tidak memiliki backend. Anda memasukkan key di dashboard Vercel/Netlify pada menu <strong>Settings &gt; Environment Variables</strong>. Platform akan menyuntikkan key tersebut saat proses build.
                </p>
              </div>
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
