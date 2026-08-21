import { GoogleGenAI, Chat } from '@google/genai';

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

const getSystemInstruction = (customData?: string) => `Anda adalah "EduBot", asisten virtual resmi untuk portal layanan pendidikan sekolah.
Tugas utama Anda adalah membantu siswa dan orang tua dengan memberikan informasi yang jelas, ramah, dan akurat.

Aturan Komunikasi:
- Selalu gunakan Bahasa Indonesia yang baik, sopan, dan mudah dipahami.
- Jika pengguna menyapa, balas sapaan tersebut dengan ramah sebelum menjawab.
- Format jawaban Anda agar mudah dibaca (gunakan tabel atau poin-poin jika perlu).
- JIKA DATA REFERENSI DIBERIKAN, gunakan HANYA data tersebut untuk menjawab pertanyaan spesifik (seperti nilai, NIS, jadwal, kelas). 
- Jika informasi yang ditanyakan tidak ada di dalam data referensi, katakan dengan jujur bahwa Anda tidak memiliki informasi tersebut saat ini.

${customData ? `=== DATA REFERENSI DARI SPREADSHEET ===\n${customData}\n=====================================` : `=== DATA SIMULASI (DEFAULT) ===\n- Leaderboard Top 3 Saat Ini: \n  1. Budi Santoso (Kelas 9A, Skor: 980)\n  2. Siti Aminah (Kelas 8B, Skor: 950)\n  3. Andi Wijaya (Kelas 9C, Skor: 910)\n- Jadwal Kegiatan Harian Umum: \n  07:00 - 07:30 : Apel Pagi / Upacara\n  07:30 - 12:00 : Kegiatan Belajar Mengajar (KBM)\n  12:00 - 13:00 : Istirahat & Sholat\n  13:00 - 15:00 : Lanjutan KBM / Ekstrakurikuler\n- Informasi Kelas: Sekolah memiliki kelas 7, 8, dan 9 (masing-masing paralel A sampai D).\n- Format NIS: Terdiri dari 6 digit angka (contoh format: 123456).\n- Nilai: Jika pengguna menanyakan nilai spesifik seseorang, berikan contoh simulasi yang masuk akal.\n=====================================`}`;

let chatSession: Chat | null = null;
let currentContextData: string = '';

export const initChatSession = (customData?: string) => {
  if (customData !== undefined) {
    currentContextData = customData;
  }
  
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(currentContextData),
      temperature: 0.2, // Suhu rendah agar jawaban lebih faktual berdasarkan data sheet
    }
  });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendMessageToGemini = async (message: string, maxRetries = 3): Promise<string> => {
  if (!chatSession) {
    initChatSession();
  }
  
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await chatSession!.sendMessage({ message });
      if (!response || !response.text) {
        throw new Error("Empty response from API");
      }
      return response.text;
    } catch (error: any) {
      console.error(`Error communicating with Gemini (Attempt ${retries + 1}/${maxRetries}):`, error);
      
      const isClientError = error?.status >= 400 && error?.status < 500 && error?.status !== 429;
      
      if (isClientError) {
        return "Maaf, terjadi kesalahan pada permintaan. Silakan coba lagi dengan pertanyaan yang berbeda.";
      }

      retries++;
      if (retries >= maxRetries) {
        return "Maaf, terjadi kesalahan koneksi ke server setelah beberapa kali percobaan. Silakan coba beberapa saat lagi.";
      }
      
      const delay = Math.pow(2, retries - 1) * 1000;
      await sleep(delay);
    }
  }
  
  return "Maaf, terjadi kesalahan yang tidak terduga.";
};
