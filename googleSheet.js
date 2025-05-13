import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const sendToGoogleSheet = async (data) => {
    try {
        const response = await axios.post(process.env.GOOGLE_SHEET_URL, data);
        return response.data
    } catch (err) {
        console.error('❌ Gagal kirim ke Google Sheet:', err.message);
        throw err
    }
};
