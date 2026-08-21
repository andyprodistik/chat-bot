import React, { useState } from 'react';
import { X, Database, Link as LinkIcon, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface DataSourceModalProps {
  onClose: () => void;
  onSave: (csvData: string, url: string) => void;
  currentUrl: string;
}

export const DataSourceModal: React.FC<DataSourceModalProps> = ({ onClose, onSave, currentUrl }) => {
  const [url, setUrl] = useState(currentUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFetchAndSave = async () => {
    if (!url.trim()) {
      // Jika dikosongkan, kembalikan ke data simulasi default
      onSave('', '');
      setSuccess(true);
      setTimeout(onClose, 1500);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validasi URL dasar
      new URL(url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Gagal mengambil data: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      
      // Validasi sederhana apakah ini terlihat seperti CSV/Text dan bukan HTML error page
      if (csvText.trim().startsWith('<!DOCTYPE html>') || csvText.trim().startsWith('<html')) {
        throw new Error("URL mengembalikan halaman web (HTML), bukan data CSV mentah. Pastikan Anda mempublikasikan sheet sebagai CSV.");
      }

      onSave(csvText, url);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengambil data. Pastikan URL valid dan CORS diizinkan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Database className="text-emerald-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Sumber Data (Google Sheet)</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-slate-700">
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
            <Info className="shrink-0 mt-0.5" size={20} />
            <div>
              <strong className="block mb-1">Cara Kerja Integrasi Data:</strong>
              Aplikasi frontend ini dapat membaca data dari Google Sheet secara langsung <strong>jika Sheet tersebut dipublikasikan ke web sebagai CSV</strong>. Data CSV tersebut akan diunduh dan disisipkan ke dalam "otak" (System Instruction) Gemini, sehingga chatbot bisa menjawab berdasarkan data sekolah Anda yang sebenarnya.
              <br/><br/>
              <em>Catatan: Untuk membaca Sheet Privat yang tidak dipublikasikan, Anda memerlukan server backend terpisah dengan kredensial Service Account (Hardcode ENV).</em>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              URL Google Sheet (Format CSV Publik)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="text-slate-400" size={18} />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Kosongkan input ini dan simpan untuk kembali menggunakan data simulasi default.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            <strong className="block mb-2 text-slate-800">Cara mendapatkan URL CSV Publik:</strong>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 ml-1">
              <li>Buka Google Sheet Anda.</li>
              <li>Klik menu <strong>File</strong> &gt; <strong>Share</strong> (Bagikan) &gt; <strong>Publish to web</strong> (Publikasikan ke web).</li>
              <li>Pilih tab/sheet yang berisi data (misal: Sheet1).</li>
              <li>Ubah format dari "Web page" menjadi <strong>"Comma-separated values (.csv)"</strong>.</li>
              <li>Klik <strong>Publish</strong>, lalu salin link yang diberikan dan tempel di atas.</li>
            </ol>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-200">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg text-sm border border-emerald-200">
              <CheckCircle size={18} className="shrink-0" />
              <p>Data berhasil diambil dan diintegrasikan ke chatbot!</p>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            disabled={isLoading}
          >
            Batal
          </button>
          <button 
            onClick={handleFetchAndSave}
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
            {isLoading ? 'Mengambil Data...' : 'Terapkan Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
