// Data contoh keranjang (sama dengan screenshot). Nanti diganti dari tabel cart_items.
export const SELLERS = [
  { id: 1, nama: 'Warma Mart 24/7 · Official Store', badge: 'OFFICIAL STORE', kota: 'Jakarta Selatan', rating: 4.9, icon: 'ok',
    note: 'Packed in an insulated cooler bag with ice gel, available every hour.',
    items: [
      { id: 'susu', nama: 'Warma Fresh Milk Full Cream 1L', info: 'Chilled · 1 litre · Best before 5 days', tags: ['Chilled', 'Daily fresh'], harga: 26500, asli: 31000, qty: 2, img: '/images/c-susu.jpg' },
      { id: 'kopi', nama: 'Kopi Susu Gula Aren Botol 250ml', info: 'Ready to drink · 250 ml · Serve cold', tags: ['Best seller', 'Ready to drink'], harga: 22000, asli: 26000, qty: 1, img: '/images/c-kopi.jpg' },
    ] },
  { id: 2, nama: 'Rumah Tangga Daily Needs Store', badge: 'LOCAL STORE', kota: 'Bandung', rating: 4.8, icon: 'store',
    note: 'Wrapped in recycled paper padding, no plastic filler.',
    items: [
      { id: 'detergen', nama: 'Warma Laundry Detergent Refill 1.5L', info: 'Refill pouch · 1.5 litre · Fresh bloom', tags: ['Household essential'], harga: 42900, asli: 55900, qty: 1, img: '/images/c-detergen.jpg' },
      { id: 'keripik', nama: 'Keripik Singkong Balado 200g', info: 'Spicy balado · 200 g resealable pack', tags: ['Local snack'], harga: 24000, asli: 28000, qty: 1, img: '/images/c-keripik.jpg' },
    ] },
  { id: 3, nama: 'Rizky A.', badge: 'INDIVIDUAL SELLER', kota: 'Sleman', rating: 4.7, icon: 'user',
    note: 'Bubble wrapped, seller replies to chat within 1 hour — even at night.',
    items: [
      { id: 'earbuds', nama: 'Preloved Wireless Earbuds Pro · White', info: 'Charging case + cable · Condition 92%', tags: ['Preloved · 92%'], harga: 615000, asli: 899000, qty: 1, img: '/images/c-earbuds.jpg',
        cond: 'Battery still holds 5 hours per charge · tiny scuff on the case lid · original box and USB-C cable included' },
    ] },
];
