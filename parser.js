export const parseMessage = (body) => {
  const lines = body.replace(/\u00A0/g, ' ').trim().split('\n'); // replace non-breaking space with normal space
  const jenisLine = lines[0].toLowerCase();
  const isStart = jenisLine.includes('start');
  const isFinish = jenisLine.includes('finish');
  console.log(lines, 'data Mentah')

  const fields = {};
  lines.slice(1).forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length > 0) {
      fields[key.trim().toLowerCase()] = rest.join(':').trim();
    }
  });

  console.log(fields, 'data sudah disusun')

  return {
    jenis: isStart ? 'start' : isFinish ? 'finish' : '',
    nama: fields['nama'] || '',
    mobil: fields['mobil'] || '',
    nopol: fields['nopol'] || '',
    km: fields['km awal'] || fields['km akhir'] || '',
    bensin: fields['bensin awal'] || fields['bensin akhir'] || '',
    saldoEtoll: fields['saldo etoll awal'] || fields['saldo etoll akhir'] || '0',
    uangCash: fields['uang cash awal'] || fields['uang cash akhir'] || '0',
    parkirEtoll: fields['parkir etoll'] || '0',
    parkirCash: fields['parkir cash'] || '0',
    isiBensin: fields['isi bensin'] || '0',
    isiTol: fields['isi tol'] || '0'
  };
};