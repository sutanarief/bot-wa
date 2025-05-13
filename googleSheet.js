import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const sendToGoogleSheet = async (data) => {
  await axios.post(process.env.GOOGLE_SHEET_URL, data);
};
