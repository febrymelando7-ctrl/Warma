export const rp = (n) => 'Rp' + Number(n).toLocaleString('id-ID');

export function agoShort(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'Baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' mnt lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  return Math.floor(s / 86400) + ' hari lalu';
}
