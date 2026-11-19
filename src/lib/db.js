import mysql from 'mysql2/promise';

// Satu pool dipakai ulang agar hot-reload di mode dev tidak membuka koneksi baru terus-menerus.
const g = globalThis;
export const pool = (g._warmaPool ??= mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'warma_db',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 3000,
}));

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
