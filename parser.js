export const parseMessage = (body) => {
  const lower = body.toLowerCase();
  const isMasuk = lower.includes('start');
  const isPulang = lower.includes('finish');
  const payload = lower.split(' ')
  console.log(payload)
  const nama = payload[1]
  const mobil = payload[2]
  const km = payload[3]

  return {
    jenis: isMasuk ? 'start' : isPulang ? 'finish' : '',
    nama,
    mobil,
    km
  };
};
