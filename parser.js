export const parseMessage = (body) => {
  const lower = body.toLowerCase();
  const isMasuk = lower.includes('start');
  const isPulang = lower.includes('finish');

  const nama = body.match(/Nama:\s*(.*)/i)?.[1]?.split("\n")[0]?.trim() || '';
  const mobil = body.match(/Mobil:\s*(.*)/i)?.[1]?.split("\n")[0]?.trim() || '';
  const km = body.match(/KM:\s*(.*)/i)?.[1]?.split("\n")[0]?.trim() || '';

  return {
    jenis: isMasuk ? 'start' : isPulang ? 'finish' : '',
    nama,
    mobil,
    km
  };
};
