import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import { sendToGoogleSheet } from './googleSheet.js';
import { parseMessage } from './parser.js';

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
};

app.post('/webhook', async (req, res) => {
  try {
    const body = req.body.Body || '';
    const sender = req.body.From || '';
    const lat = req.body.Latitude || '';
    const lon = req.body.Longitude || '';

    const parsed = parseMessage(body);

    // VALIDASI
    if (!parsed.jenis || !parsed.nama) {
      return res.send(`<Response><Message>❌ Format salah. Harap sertakan Nama dan ${parsed.jenis === 'Masuk' ? 'Mobil' : 'KM'}.</Message></Response>`);
    }

    if (parsed.jenis === 'Masuk' && !parsed.mobil) {
      return res.send(`<Response><Message>❌ Harap sertakan "Mobil".</Message></Response>`);
    }

    if (parsed.jenis === 'Pulang' && !parsed.km) {
      return res.send(`<Response><Message>❌ Harap sertakan "KM".</Message></Response>`);
    }

    // CEK ABSEN GANDA
    const checkURL = `${process.env.GOOGLE_SHEET_URL}?sender=${encodeURIComponent(sender)}&jenis=${parsed.jenis}`;
    const checkRes = await axios.get(checkURL);
    const { exists } = checkRes.data;

    if (exists) {
      return res.send(`<Response><Message>⚠️ Kamu sudah absen ${parsed.jenis.toLowerCase()} hari ini.</Message></Response>`);
    }

    // KIRIM KE SHEETS
    const data = {
      waktu: new Date().toISOString(),
      jenis: parsed.jenis,
      nama: parsed.nama,
      mobil: parsed.mobil,
      km: parsed.km,
      sender,
      latitude: lat,
      longitude: lon
    };

    await sendToGoogleSheet(data);

    const reply = parsed.jenis === 'Masuk'
      ? `${getGreeting()}, ${parsed.nama}! Absen masuk berhasil ✅`
      : `Terima kasih ${parsed.nama}, absen pulang sudah dicatat. 🏁`;

    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>${reply}</Message></Response>`);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).send('<Response><Message>❌ Gagal mencatat absen.</Message></Response>');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bot aktif di port ${PORT}`));
