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

function getFormTemplate(jenis) {
  if (jenis === 'start') {
    return `🟢 *FORM ABSEN START*  
Ketik dan kirim dengan format berikut:

START
Nama:  
Mobil:  
Nopol:  
KM Awal:  
Bensin Awal:  
Saldo Etoll Awal:  
Uang Cash Awal:  
    `;
  }

  if (jenis === 'finish') {
    return `🔴 *FORM ABSEN FINISH*  
Ketik dan kirim dengan format berikut:

FINISH
Nama:  
KM Akhir:  
Bensin Akhir:  
Saldo Etoll Akhir:  
Parkir Etoll:  
Parkir Cash:  
Isi Bensin:  
Isi Tol:  
    `;
  }

  return null;
}




app.post('/webhook', async (req, res) => {
  try {
    const body = (req.body.Body || '').trim();
    const sender = req.body.From || '';
    const lat = req.body.Latitude || '';
    const lon = req.body.Longitude || '';
    const lower = body.toLowerCase();

    // 1. Deteksi permintaan form
    if (lower === 'start' || lower === 'finish') {
      const template = getFormTemplate(lower);
      res.set('Content-Type', 'text/xml');
      return res.send(`<Response><Message>${template}</Message></Response>`);
    }

    // 2. Parsing structured message
    const parsed = parseMessage(body);

    if (!parsed.jenis) {
      return res.send(`<Response><Message>❌ Format tidak dikenali. Ketik "start" atau "finish" untuk mulai absen.</Message></Response>`);
    }

    // 3. Validasi isi form
    const requiredFields = parsed.jenis === 'start'
      ? ['nama', 'mobil', 'nopol', 'km', 'bensin', 'saldoEtoll', 'uangCash']
      : ['nama', 'km', 'bensin', 'saldoEtoll', 'parkirEtoll', 'parkirCash', 'isiBensin', 'isiTol'];

    const missing = requiredFields.filter(k => !parsed[k]);
    if (missing.length > 0) {
      return res.send(`<Response><Message>❌ Kolom wajib belum diisi: ${missing.join(', ')}</Message></Response>`);
    }

    // 4. Cek ganda (opsional)
    const checkURL = `${process.env.GOOGLE_SHEET_URL}?sender=${encodeURIComponent(sender)}&jenis=${parsed.jenis}`;
    const checkRes = await axios.get(checkURL);
    const { exists } = checkRes.data;

    if (exists) {
      return res.send(`<Response><Message>⚠️ Kamu sudah absen ${parsed.jenis} hari ini.</Message></Response>`);
    }

    // 5. Kirim ke Google Sheets
    const data = {
      waktu: formatTanggalIndonesia(new Date()),
      jenis: parsed.jenis,
      nama: parsed.nama,
      mobil: parsed.mobil,
      nopol: parsed.nopol,
      km: parsed.km,
      bensin: parsed.bensin,
      saldoEtoll: parsed.saldoEtoll,
      uangCash: parsed.uangCash,
      parkirEtoll: parsed.parkirEtoll,
      parkirCash: parsed.parkirCash,
      isiBensin: parsed.isiBensin,
      isiTol: parsed.isiTol,
      sender,
      latitude: lat,
      longitude: lon
    };

    await sendToGoogleSheet(data);

    const reply = parsed.jenis === 'start'
      ? `✅ Absen START berhasil dicatat!\n\n📌 Nama: ${data.nama}\n🚗 Mobil: ${data.mobil}\n📍 KM Awal: ${data.km}\n🕒 Waktu: ${data.waktu}\n\nSelamat bekerja! 🙏`
      : `✅ Absen FINISH berhasil dicatat!\n\n📌 Nama: ${data.nama}\n🚗 Mobil: ${data.mobil || '-'}\n📍 KM Akhir: ${data.km}\n🕒 Waktu: ${data.waktu}\n\nTerima kasih, selamat istirahat 🙏`;

    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>${reply}</Message></Response>`);

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).send('<Response><Message>❌ Gagal mencatat absen.</Message></Response>');
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bot aktif di port ${PORT}`));
