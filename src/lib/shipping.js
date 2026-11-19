// Dipakai bersama oleh halaman checkout (browser) dan API pesanan (server),
// supaya ongkir yang tampil sama dengan yang dihitung server.
// [nama, estimasi, ongkir, catatan]
export const SHIP = {
  resmi: [['Instant 30 min', 'Today · within 30 minutes', 9000, 'Jakarta only'], ['Same day', 'Today · before 22:00', 6000], ['Next day', 'Tomorrow · 24/7 slot', 0, 'Free shipping']],
  lokal: [['Regular', '2–3 days', 15000], ['Cargo', '4–6 days', 9000], ['Economy', '5–7 days', 0, 'Free shipping']],
  pengguna: [['Instant Courier', 'Today · 3–5 hours', 22000, 'Yogyakarta area'], ['Regular', '2–4 days', 18000], ['Self pickup', 'Ready in 3 hours', 0, 'COD at pickup point']],
};
export const DEFAULT_SHIP = { resmi: 1, lokal: 0, pengguna: 1 };
// Kode demo yang selalu berlaku (tanpa klaim)
export const DEMO_VOUCHERS = [
  { kode: 'WARMA50', judul: 'Voucher demo Rp50.000', tipe: 'nominal', nilai: 50000, min_belanja: 0, maks_potongan: 0 },
  { kode: 'BUKA247', judul: 'Voucher demo gratis ongkir', tipe: 'ongkir', nilai: 1000000000, min_belanja: 0, maks_potongan: 0 },
];

// Hitung potongan voucher. tipe: persen | nominal | ongkir
export function voucherCut(v, sub, ongkir) {
  if (sub < (v.min_belanja || 0)) return { cut: 0, err: `Minimal belanja Rp${Number(v.min_belanja).toLocaleString('id-ID')} untuk voucher ini.` };
  if (v.tipe === 'persen') { let c = Math.floor((sub * v.nilai) / 100); if (v.maks_potongan) c = Math.min(c, v.maks_potongan); return { cut: c }; }
  if (v.tipe === 'ongkir') return { cut: Math.min(ongkir, v.nilai) };
  return { cut: Math.min(v.nilai, sub) };
}
export const BUYER_FEE = 3000;
