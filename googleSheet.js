import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const sendToGoogleSheet = async (data) => {
  const response = await axios.post(process.env.GOOGLE_SHEET_URL, data);
  console.log(response, 'response dari gsheet')
  return response
};
