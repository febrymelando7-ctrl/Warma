-- Warma · skema & data awal untuk XAMPP (MySQL/MariaDB)
-- Cara pakai: buka http://localhost/phpmyadmin → tab Import → pilih file ini.
CREATE DATABASE IF NOT EXISTS warma_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE warma_db;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(40) NOT NULL UNIQUE,
  nama VARCHAR(80) NOT NULL,
  jumlah_produk INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(60) NOT NULL UNIQUE,
  nama VARCHAR(160) NOT NULL,
  harga INT NOT NULL,
  harga_asli INT NOT NULL,
  diskon TINYINT NOT NULL DEFAULT 0,
  kategori VARCHAR(80) NOT NULL,
  toko VARCHAR(100) NOT NULL,
  tipe_toko ENUM('resmi','pengguna','lokal') NOT NULL DEFAULT 'resmi',
  lokasi VARCHAR(60) NOT NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  terjual VARCHAR(20) NOT NULL DEFAULT '0',
  flash_sale TINYINT(1) NOT NULL DEFAULT 0,
  persen_terjual TINYINT NOT NULL DEFAULT 0,
  gambar VARCHAR(120) NOT NULL,
  stok INT NOT NULL DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(80), badge VARCHAR(10), deskripsi VARCHAR(160), minimal VARCHAR(60),
  berlaku VARCHAR(60), kuota VARCHAR(80), warna ENUM('hijau','biru','tosca') DEFAULT 'hijau'
);
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  peran ENUM('pembeli','penjual') DEFAULT 'pembeli',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, product_id INT NOT NULL, qty INT NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL, total INT NOT NULL,
  metode_bayar VARCHAR(40), status ENUM('baru','diproses','dikirim','selesai','batal') DEFAULT 'baru',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL, toko VARCHAR(100), nama VARCHAR(160) NOT NULL, harga INT NOT NULL, qty INT NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Kolom untuk dasbor penjual (MariaDB/XAMPP mendukung IF NOT EXISTS)
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id INT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status ENUM('aktif','jeda') NOT NULL DEFAULT 'aktif';
ALTER TABLE products ADD COLUMN IF NOT EXISTS deskripsi TEXT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS berat INT NOT NULL DEFAULT 500;
ALTER TABLE products ADD COLUMN IF NOT EXISTS varian_label VARCHAR(40) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS alamat TEXT NULL;
CREATE TABLE IF NOT EXISTS toko_favorit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, toko VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_fav (user_id, toko),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS chat_threads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL, seller_id INT NOT NULL,
  last_message VARCHAR(200) NULL, last_sender INT NULL, last_msg_id INT NOT NULL DEFAULT 0,
  buyer_read_id INT NOT NULL DEFAULT 0, seller_read_id INT NOT NULL DEFAULT 0,
  last_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_thread (buyer_id, seller_id),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  thread_id INT NOT NULL, sender_id INT NOT NULL,
  isi VARCHAR(1000) NOT NULL DEFAULT '', product_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_thread (thread_id, id),
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS gambar VARCHAR(160) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tgl_lahir DATE NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(10) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telepon VARCHAR(20) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto VARCHAR(160) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tema VARCHAR(10) NOT NULL DEFAULT 'terang';
ALTER TABLE users ADD COLUMN IF NOT EXISTS filter_warna VARCHAR(12) NOT NULL DEFAULT 'standar';
ALTER TABLE users ADD COLUMN IF NOT EXISTS aksen VARCHAR(10) NOT NULL DEFAULT 'hijau';
ALTER TABLE users ADD COLUMN IF NOT EXISTS sesi_versi INT NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS notif_prefs (
  user_id INT NOT NULL, kode VARCHAR(30) NOT NULL, aktif TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, kode),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS rekening_bank (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, bank VARCHAR(30) NOT NULL, no_rek VARCHAR(25) NOT NULL, atas_nama VARCHAR(100) NOT NULL,
  utama TINYINT(1) NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS ewallet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, jenis VARCHAR(10) NOT NULL, nomor VARCHAR(20) NOT NULL,
  UNIQUE KEY uniq_ew (user_id, jenis),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE products ADD COLUMN IF NOT EXISTS video VARCHAR(160) NULL;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS caption VARCHAR(80) NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS kode VARCHAR(20) NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS tipe VARCHAR(10) NOT NULL DEFAULT 'persen';
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS nilai INT NOT NULL DEFAULT 0;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS maks_potongan INT NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS min_belanja INT NOT NULL DEFAULT 0;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS berlaku_sampai DATE NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS kuota_total INT NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS hanya_baru TINYINT(1) NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS user_vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, voucher_id INT NOT NULL,
  dipakai TINYINT(1) NOT NULL DEFAULT 0, order_id INT NULL,
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, used_at TIMESTAMP NULL,
  UNIQUE KEY uniq_user_voucher (user_id, voucher_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, judul VARCHAR(120) NOT NULL, isi VARCHAR(300) NOT NULL DEFAULT '', link VARCHAR(160) NULL,
  dibaca TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notif_user (user_id, dibaca, id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_wish (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  label VARCHAR(30) NOT NULL DEFAULT 'Home',
  nama VARCHAR(100) NOT NULL, telepon VARCHAR(20) NOT NULL,
  alamat VARCHAR(300) NOT NULL, kota VARCHAR(80) NOT NULL, provinsi VARCHAR(80) NOT NULL, kode_pos VARCHAR(5) NULL,
  utama TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id INT NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS varian VARCHAR(60) NULL;
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL, nama VARCHAR(60) NOT NULL, harga INT NOT NULL, stok INT NOT NULL DEFAULT 0, urutan INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
ALTER TABLE products ADD COLUMN IF NOT EXISTS terjual_n INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS kondisi VARCHAR(20) NOT NULL DEFAULT 'Baru';
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL, url VARCHAR(160) NOT NULL, urutan INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL, user_id INT NOT NULL, rating TINYINT NOT NULL,
  komentar VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_review (product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

DELETE FROM categories;
INSERT INTO categories (slug,nama,jumlah_produk) VALUES
('fashion','Fashion & Pakaian',184920),
('olahraga','Olahraga & Outdoor',42180),
('elektronik','Elektronik & Gadget',96540),
('rumah','Rumah & Interior',128300),
('otomotif','Otomotif',38760),
('kecantikan','Kesehatan & Kecantikan',152640),
('hobi','Hobi & Koleksi',27480),
('preloved','Preloved & Bekas',61900);
INSERT INTO products (slug,nama,harga,harga_asli,diskon,kategori,toko,tipe_toko,lokasi,rating,terjual,flash_sale,persen_terjual,gambar) VALUES
('susu','Susu UHT Cokelat Kemasan 1 Liter',18500,33500,45,'Makanan & Minuman','Warma Mart 24/7','resmi','Jakarta Selatan',4.9,'12 rb',1,84,'/images/p-susu.jpg'),
('kopi','Kopi Susu Gula Aren Botol 250ml',15900,25000,36,'Makanan & Minuman','Warma Mart 24/7','resmi','Jakarta Selatan',4.9,'9 rb',1,91,'/images/p-kopi.jpg'),
('powerbank','Powerbank 20.000mAh Fast Charge 22.5W',189000,349000,46,'Elektronik & Gadget','Voltix Official','resmi','Jakarta Pusat',4.8,'3 rb',1,76,'/images/p-powerbank.jpg'),
('keripik','Keripik Pisang Pedas Manis 250g',12900,22000,41,'Makanan & Minuman','Rumah Tangga Daily Needs Store','lokal','Bandung',4.8,'6 rb',1,68,'/images/p-keripik.jpg'),
('handuk','Handuk Mandi Microfiber 70×140cm',49000,89000,45,'Rumah & Interior','Rumah Tangga Daily Needs Store','lokal','Bandung',4.7,'2 rb',1,88,'/images/p-handuk.jpg'),
('sepatu','Sepatu Sneakers Putih Classic Unisex',289000,459000,37,'Fashion & Pakaian','Langkah Official Store','resmi','Jakarta Barat',4.9,'2,3 rb',0,0,'/images/p-sepatu.jpg'),
('kaos','Kaos Oversize Cotton Combed 30s Premium',89000,139000,36,'Fashion & Pakaian','Kaos Kalcer Studio','pengguna','Bandung',4.8,'5,1 rb',0,0,'/images/p-kaos.jpg'),
('tws','TWS Bluetooth 5.3 Garansi Resmi 1 Tahun',249000,499000,50,'Elektronik & Gadget','Voltix Official','resmi','Jakarta Pusat',4.9,'9,8 rb',0,0,'/images/p-tws.jpg'),
('ricecooker','Rice Cooker Mini 1.2L Anti Lengket',219000,339000,35,'Rumah & Interior','Dapur Pintar Official','resmi','Semarang',4.7,'1,4 rb',0,0,'/images/p-ricecooker.jpg'),
('serum','Serum Niacinamide 10% + Zinc 30ml',78000,129000,39,'Kesehatan & Kecantikan','Glowlab Official','resmi','Jakarta Selatan',5.0,'18,2 rb',0,0,'/images/p-serum.jpg'),
('kamera','Kamera Mirrorless Preloved 95% Like New',4250000,6800000,37,'Preloved & Bekas','Rizky A.','pengguna','Sleman',4.8,'94',0,0,'/images/p-kamera.jpg'),
('sepeda','Sepeda Lipat 20 Inch 7 Speed Ringan',1980000,2640000,25,'Otomotif','Roda Nusantara','resmi','Bekasi',4.7,'372',0,0,'/images/p-sepeda.jpg'),
('rak','Rak Dinding Minimalis Kayu Jati Solid',165000,259000,36,'Rumah & Interior','Kayu Krya Jepara','pengguna','Jepara',4.9,'876',0,0,'/images/p-rak.jpg'),
('blender','Blender Portable USB 400ml Tahan Panas',139000,221000,37,'Rumah & Interior','Dapur Pintar Official','resmi','Tangerang',4.6,'2,9 rb',0,0,'/images/p-blender.jpg')
ON DUPLICATE KEY UPDATE nama=VALUES(nama), harga=VALUES(harga), harga_asli=VALUES(harga_asli), diskon=VALUES(diskon), kategori=VALUES(kategori), toko=VALUES(toko), tipe_toko=VALUES(tipe_toko), lokasi=VALUES(lokasi), rating=VALUES(rating), terjual=VALUES(terjual), flash_sale=VALUES(flash_sale), persen_terjual=VALUES(persen_terjual), gambar=VALUES(gambar);
INSERT INTO vouchers (judul,badge,deskripsi,minimal,berlaku,kuota,warna)
SELECT 'Cashback 20%','20%','Maksimal Rp40.000 untuk semua kategori','Min. belanja Rp150.000','Berlaku s/d 30 Nov 2026','Kuota 5.000 · 1x per akun','hijau' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE judul = 'Cashback 20%');
INSERT INTO vouchers (judul,badge,deskripsi,minimal,berlaku,kuota,warna)
SELECT 'Gratis Ongkir Rp0','Rp0','Potongan ongkir sampai Rp25.000','Tanpa minimum belanja','Berlaku s/d 31 Des 2026','Kuota 25.000 · semua kurir','biru' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE judul = 'Gratis Ongkir Rp0');
INSERT INTO vouchers (judul,badge,deskripsi,minimal,berlaku,kuota,warna)
SELECT 'Diskon Pengguna Baru','30%','Potongan langsung untuk transaksi pertama','Min. belanja Rp75.000','Berlaku s/d 31 Des 2026','Khusus akun baru · 1x pakai','tosca' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM vouchers WHERE judul = 'Diskon Pengguna Baru');

-- Deskripsi produk contoh (ubah sesuai kebutuhan)
UPDATE products SET deskripsi = 'Susu UHT rasa cokelat dalam kemasan 1 liter, praktis untuk sarapan, bekal, atau campuran minuman dan kue. Simpan di tempat sejuk dan kocok sebelum diminum. Setelah dibuka, simpan di kulkas dan habiskan dalam 2 hari.' WHERE slug = 'susu' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Kopi susu dengan gula aren dalam botol 250 ml, siap diminum. Paling nikmat disajikan dingin. Kocok perlahan sebelum diminum dan simpan di kulkas.' WHERE slug = 'kopi' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Powerbank berkapasitas 20.000 mAh dengan dukungan pengisian cepat 22,5 W. Cocok dibawa bepergian untuk mengisi daya ponsel beberapa kali dalam satu perjalanan. Pastikan kabel dan perangkatmu mendukung pengisian cepat.' WHERE slug = 'powerbank' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Keripik pisang rasa pedas manis dalam kemasan 250 g. Renyah dan cocok untuk camilan santai atau oleh-oleh. Setelah dibuka, tutup rapat agar tetap renyah.' WHERE slug = 'keripik' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Handuk mandi berbahan microfiber ukuran 70×140 cm. Teksturnya lembut, ringan, dan cepat kering. Cuci terpisah pada pemakaian pertama.' WHERE slug = 'handuk' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Sepatu sneakers putih model klasik untuk pria dan wanita (unisex). Desainnya sederhana dan mudah dipadukan dengan pakaian sehari-hari. Pastikan ukuran sudah sesuai sebelum memesan.' WHERE slug = 'sepatu' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Kaos oversize berbahan cotton combed 30s yang nyaman dan menyerap keringat. Potongannya longgar untuk tampilan santai. Cuci dengan air dingin dan hindari menjemur di bawah terik matahari langsung agar warna awet.' WHERE slug = 'kaos' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Earphone TWS dengan Bluetooth 5.3 dan garansi resmi 1 tahun. Koneksinya stabil dan praktis untuk musik, telepon, dan video. Simpan bukti pembelian untuk klaim garansi.' WHERE slug = 'tws' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Rice cooker mini berkapasitas 1,2 liter dengan lapisan anti lengket. Pas untuk 1–3 orang. Bersihkan bagian dalamnya setelah dingin agar lapisannya awet.' WHERE slug = 'ricecooker' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Serum wajah dengan niacinamide 10% dan zinc, kemasan 30 ml. Gunakan setelah membersihkan wajah, lanjutkan dengan pelembap, dan pakai tabir surya di siang hari. Lakukan uji tempel di area kecil kulit sebelum pemakaian pertama.' WHERE slug = 'serum' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Kamera mirrorless preloved dengan kondisi 95% seperti baru, dijual oleh penjual perorangan. Periksa foto dan keterangan kondisi dengan teliti sebelum memesan. Berlaku retur 7 hari melalui Warma bila barang tidak sesuai deskripsi.' WHERE slug = 'kamera' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Sepeda lipat 20 inci dengan 7 kecepatan dan bodi ringan. Praktis dilipat untuk disimpan di rumah atau dibawa di kendaraan. Periksa rem dan baut sebelum dipakai pertama kali.' WHERE slug = 'sepeda' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Rak dinding minimalis dari kayu jati solid. Desainnya sederhana, cocok untuk buku, tanaman, atau pajangan. Pasang pada dinding yang kuat dan jangan melebihi batas beban.' WHERE slug = 'rak' AND seller_id IS NULL;
UPDATE products SET deskripsi = 'Blender portable USB dengan botol 400 ml tahan panas. Cocok untuk jus dan smoothie porsi satu orang. Isi daya sebelum dipakai dan hindari memasukkan es yang terlalu keras.' WHERE slug = 'blender' AND seller_id IS NULL;
UPDATE products SET kondisi = 'Bekas' WHERE slug = 'kamera' AND seller_id IS NULL;

-- Jumlah terjual (angka) untuk pengurutan "Terlaris"
UPDATE products SET terjual_n = 12000 WHERE slug = 'susu' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 9000 WHERE slug = 'kopi' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 3000 WHERE slug = 'powerbank' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 6000 WHERE slug = 'keripik' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 2000 WHERE slug = 'handuk' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 2300 WHERE slug = 'sepatu' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 5100 WHERE slug = 'kaos' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 9800 WHERE slug = 'tws' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 1400 WHERE slug = 'ricecooker' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 18200 WHERE slug = 'serum' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 94 WHERE slug = 'kamera' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 372 WHERE slug = 'sepeda' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 876 WHERE slug = 'rak' AND seller_id IS NULL AND terjual_n = 0;
UPDATE products SET terjual_n = 2900 WHERE slug = 'blender' AND seller_id IS NULL AND terjual_n = 0;

-- Contoh varian: kaos (S-XL) dan sepatu (ukuran 39-43)
UPDATE products SET varian_label = 'Ukuran' WHERE slug IN ('kaos', 'sepatu') AND seller_id IS NULL AND varian_label IS NULL;
INSERT INTO product_variants (product_id, nama, harga, stok, urutan)
SELECT p.id, v.nama, v.harga, v.stok, v.u FROM products p
JOIN (SELECT 'kaos' AS s, 'S' AS nama, 89000 AS harga, 20 AS stok, 1 AS u
      UNION ALL SELECT 'kaos', 'M', 89000, 30, 2 UNION ALL SELECT 'kaos', 'L', 89000, 25, 3 UNION ALL SELECT 'kaos', 'XL', 95000, 10, 4
      UNION ALL SELECT 'sepatu', '39', 289000, 8, 1 UNION ALL SELECT 'sepatu', '40', 289000, 12, 2 UNION ALL SELECT 'sepatu', '41', 289000, 15, 3
      UNION ALL SELECT 'sepatu', '42', 289000, 10, 4 UNION ALL SELECT 'sepatu', '43', 299000, 5, 5) v ON v.s = p.slug
WHERE p.seller_id IS NULL AND NOT EXISTS (SELECT 1 FROM product_variants x WHERE x.product_id = p.id);
UPDATE products p SET p.stok = (SELECT COALESCE(SUM(v.stok), 0) FROM product_variants v WHERE v.product_id = p.id) WHERE p.slug IN ('kaos', 'sepatu') AND p.seller_id IS NULL;

-- Aturan voucher (dibaca checkout). Ubah nilainya langsung di tabel bila perlu.
UPDATE vouchers SET kode = 'CASHBACK20', tipe = 'persen', nilai = 20, maks_potongan = 40000, min_belanja = 150000, berlaku_sampai = '2026-11-30', kuota_total = 5000, hanya_baru = 0 WHERE judul = 'Cashback 20%' AND kode IS NULL;
UPDATE vouchers SET kode = 'ONGKIR0', tipe = 'ongkir', nilai = 25000, maks_potongan = NULL, min_belanja = 0, berlaku_sampai = '2026-12-31', kuota_total = 25000, hanya_baru = 0 WHERE judul = 'Gratis Ongkir Rp0' AND kode IS NULL;
UPDATE vouchers SET kode = 'BARU30', tipe = 'persen', nilai = 30, maks_potongan = NULL, min_belanja = 75000, berlaku_sampai = '2026-12-31', kuota_total = NULL, hanya_baru = 1 WHERE judul = 'Diskon Pengguna Baru' AND kode IS NULL;
