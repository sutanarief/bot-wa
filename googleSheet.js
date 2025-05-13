// import axios from 'axios';
// import dotenv from 'dotenv';
// dotenv.config();

// export const sendToGoogleSheet = async (data) => {
//   await axios.post(process.env.GOOGLE_SHEET_URL, data);
// };

// export const checkUnfinishedStart = async (sender) => {
//   const res = await axios.get(`${process.env.GOOGLE_SHEET_URL}?action=checkUnfinished&sender=${encodeURIComponent(sender)}`);
//   return res.data?.unfinished || false;
// };
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SHEET_URL;

export const postAbsensi = async (jenis, data) => {
  const payload = { jenis, ...data };

  try {
    const { data: result } = await axios.post(GOOGLE_SCRIPT_URL, payload);
    return result;
  } catch (err) {
    console.error('❌ Gagal kirim ke Google Sheet:', err.message);
    throw err;
  }
};

export const checkUnfinishedStart = async (sender) => {
  try {
    const { data } = await axios.get(GOOGLE_SCRIPT_URL, {
      params: {
        action: 'checkUnfinished',
        sender,
      },
    });

    return data.unfinished;
  } catch (err) {
    console.error('❌ Gagal cek unfinished START:', err.message);
    return false;
  }
};
