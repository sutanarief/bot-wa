import fs from 'fs';
const filePath = './status.json';

const readStatus = () => {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw || '{}');
};

const writeStatus = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

export const setDriverStatus = (sender, status) => {
  const current = readStatus();
  current[sender] = status;
  writeStatus(current);
};

export const getDriverStatus = (sender) => {
  const current = readStatus();
  return current[sender] || null;
};

export const clearDriverStatus = (sender) => {
  const current = readStatus();
  delete current[sender];
  writeStatus(current);
};
