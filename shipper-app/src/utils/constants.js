// ==========================================
// CẤU HÌNH KẾT NỐI MẠNG CHO SHIPPER APP
// ==========================================
// Bật TRUE nếu dùng Ngrok, FALSE nếu dùng Wifi Local
const USE_NGROK = true;

const LOCAL_URL = 'http://192.168.1.15:3500'; // IP Local của máy tính
const NGROK_URL = 'https://dejected-radio-myspace.ngrok-free.dev'; // Thay link ngrok mới vào đây nếu có
const PRODUCTION_URL = 'https://timifood.onrender.com'; // Link Render (Dự phòng)

export const SERVER_URL = USE_NGROK ? NGROK_URL : LOCAL_URL;

export const COLORS = {
  primary: '#E53E3E',
  primaryLight: '#FFF5F5',
  secondary: '#3182CE',
  secondaryLight: '#BEE3F8',
  success: '#38A169',
  warning: '#D69E2E',
  warningLight: '#FEFCBF',
  textDark: '#2D3748',
  textMuted: '#718096',
  textLight: '#A0AEC0',
  background: '#F7FAFC',
  cardBackground: '#FFFFFF',
  border: '#EDF2F7',
  dangerLight: '#FED7D7'
};
