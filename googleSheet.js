import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const sendToGoogleSheet = async (data) => {
  await axios.post(process.env.GOOGLE_SHEET_URL, data);
};

export const checkUnfinishedStart = async (sender) => {
  const res = await axios.get(`${process.env.GOOGLE_SHEET_URL}?action=checkUnfinished&sender=${encodeURIComponent(sender)}`);
  return res.data?.unfinished || false;
};
