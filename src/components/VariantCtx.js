'use client';
import { createContext, useContext, useState } from 'react';
import { rp } from '@/lib/format';

// Menyimpan varian yang dipilih supaya harga, stok, dan tombol beli ikut berubah
const Ctx = createContext(null);
export const useVariant = () => useContext(Ctx);

export function VariantProvider({ base, label, variants, children }) {
  const first = variants.find((v) => v.stok > 0) || variants[0] || null;
  const [sel, setSel] = useState(first ? first.id : null);
  const cur = variants.find((v) => v.id === sel);
  const current = cur ? { variantId: cur.id, nama: cur.nama, harga: cur.harga, stok: cur.stok } : { variantId: null, nama: null, harga: base.harga, stok: base.stok };
  return <Ctx.Provider value={{ label, variants, sel, setSel, current, base }}>{children}</Ctx.Provider>;
}

export function PriceBlock() {
  const { current, base } = useVariant();
  const hemat = base.asli > current.harga ? Math.round(((base.asli - current.harga) / base.asli) * 100) : 0;
  return <div className="pdprice"><b>{rp(current.harga)}</b>{hemat > 0 && <><span className="tag p">{hemat}%</span><s>{rp(base.asli)}</s></>}</div>;
}

export function VariantPicker() {
  const { label, variants, sel, setSel } = useVariant();
  if (!variants.length) return null;
  const cur = variants.find((v) => v.id === sel);
  return (
    <div className="vpick">
      <b>Pilih {label || 'varian'}: <span className="meta">{cur?.nama}</span></b>
      <div>{variants.map((v) => <button key={v.id} type="button" className={v.id === sel ? 'on' : ''} disabled={v.stok < 1} onClick={() => setSel(v.id)} title={v.stok < 1 ? 'Stok habis' : `Stok ${v.stok}`}>{v.nama}</button>)}</div>
    </div>
  );
}
