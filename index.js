import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import { sendToGoogleSheet } from './googleSheet.js';
import { parseMessage } from './parser.js';

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

function formatTanggalIndonesia(date) {
  const optionsTanggal = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  };

  const optionsWaktu = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  };

  const bagianTanggal = date.toLocaleDateString('id-ID', optionsTanggal);
  const bagianWaktu = date
    .toLocaleTimeString('id-ID', optionsWaktu)
    .replace(/\./g, ':');

  return `${bagianTanggal}, ${bagianWaktu}`;
}



app.post('/webhook', async (req, res) => {
  try {
    const body = req.body.Body || '';
    const sender = req.body.From || '';
    const lat = req.body.Latitude || '';
    const lon = req.body.Longitude || '';
    console.log(body)

    const parsed = parseMessage(body);
    const jenis = parsed.jenis.toLowerCase()
    const mobil = parsed.mobil.toLowerCase()

    // VALIDASI
    if (!parsed.jenis || !parsed.nama) {
        return res.send(`<Response><Message>❌ Format salah. Harap sertakan Nama dan ${parsed.jenis === 'start' ? 'Mobil' : 'KM'}.</Message></Response>`);
    }

    if (jenis === 'start' && !mobil) {
      return res.send(`<Response><Message>❌ Harap sertakan "Mobil".</Message></Response>`);
    }

    if (parsed.jenis === 'finish' && !parsed.km) {
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
      waktu: formatTanggalIndonesia(new Date()),
      jenis: parsed.jenis,
      nama: parsed.nama,
      mobil: parsed.mobil,
      km: parsed.km,
      sender,
      latitude: lat,
      longitude: lon
    };

    await sendToGoogleSheet(data);

    const reply = parsed.jenis === 'start'
      ? 
    `✅ Absen START berhasil dicatat!

        📌 Nama: ${data.nama}  
        🚗 Mobil: ${data.mobil}
        📍 KM Awal: ${data.km}
        🕒 Waktu: ${data.waktu}
        
        Selamat bekerja, hati-hati di jalan! 🙏
        `
      : `
      ⛔ Absen FINISH berhasil dicatat!

         📌 Nama: ${data.nama}  
        🚗 Mobil: ${data.mobil}
        📍 KM Awal: ${data.km}
        🕒 Waktu: ${data.waktu}
        
        Terima kasih atas kerja hari ini. Selamat beristirahat, semoga sehat selalu! 🙏
      `;

    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>${reply}</Message></Response>`);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).send('<Response><Message>❌ Gagal mencatat absen.</Message></Response>');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bot aktif di port ${PORT}`));
