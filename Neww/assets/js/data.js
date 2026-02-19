import { ensureOnce, Keys, readJson, writeJson } from "./storage.js";

export const Categories = [
  { id: "fashion", name: "Fashion" },
  { id: "elektronik", name: "Elektronik" },
  { id: "rumah", name: "Rumah & Dapur" },
  { id: "hobi", name: "Hobi" },
  { id: "kecantikan", name: "Kecantikan" },
];

export const Sellers = [
  { id: "s-aurora", name: "Aurora Store", city: "Bandung", rating: 4.8 },
  { id: "s-nusa", name: "Nusa Gadget", city: "Jakarta", rating: 4.7 },
  { id: "s-loka", name: "Loka Living", city: "Surabaya", rating: 4.6 },
];

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function seedProducts() {
  const now = Date.now();
  const base = [
    {
      name: "Sepatu Lari AirLite",
      categoryId: "fashion",
      sellerId: "s-aurora",
      price: 389000,
      rating: 4.7,
      stock: 18,
      tags: ["ringan", "daily run"],
      variants: ["39", "40", "41", "42"],
      description:
        "Sepatu lari ringan dengan bantalan responsif. Cocok untuk lari harian dan jalan santai.",
    },
    {
      name: "Hoodie Fleece Urban",
      categoryId: "fashion",
      sellerId: "s-aurora",
      price: 219000,
      rating: 4.6,
      stock: 32,
      tags: ["hangat", "oversize"],
      variants: ["S", "M", "L", "XL"],
      description:
        "Hoodie fleece nyaman untuk cuaca dingin. Jahitan rapih, bahan tidak mudah berbulu.",
    },
    {
      name: "Earbuds Nova ANC",
      categoryId: "elektronik",
      sellerId: "s-nusa",
      price: 499000,
      rating: 4.8,
      stock: 24,
      tags: ["ANC", "wireless"],
      variants: ["Hitam", "Putih"],
      description:
        "Earbuds dengan Active Noise Cancelling, baterai tahan lama, dan mode transparansi.",
    },
    {
      name: "Keyboard Mekanik 75%",
      categoryId: "elektronik",
      sellerId: "s-nusa",
      price: 589000,
      rating: 4.5,
      stock: 12,
      tags: ["hot-swap", "RGB"],
      variants: ["Blue Switch", "Red Switch"],
      description:
        "Keyboard ringkas layout 75% dengan hot-swap. Cocok untuk kerja dan gaming.",
    },
    {
      name: "Set Pisau Dapur 5-in-1",
      categoryId: "rumah",
      sellerId: "s-loka",
      price: 159000,
      rating: 4.4,
      stock: 40,
      tags: ["stainless", "anti karat"],
      variants: ["Standar"],
      description:
        "Set pisau dapur lengkap untuk masak harian. Pegangan ergonomis, mudah dibersihkan.",
    },
    {
      name: "Lampu Meja Minimalis",
      categoryId: "rumah",
      sellerId: "s-loka",
      price: 129000,
      rating: 4.6,
      stock: 27,
      tags: ["warm light", "hemat energi"],
      variants: ["Warm", "Neutral"],
      description:
        "Lampu meja minimalis dengan pencahayaan nyaman. Cocok untuk kamar dan meja kerja.",
    },
    {
      name: "Set Cat Air Premium",
      categoryId: "hobi",
      sellerId: "s-aurora",
      price: 99000,
      rating: 4.5,
      stock: 55,
      tags: ["melukis", "warna solid"],
      variants: ["12 warna", "24 warna"],
      description:
        "Cat air dengan pigmen kuat untuk pemula hingga intermediate. Mudah dibawa.",
    },
    {
      name: "Serum Niacinamide 10%",
      categoryId: "kecantikan",
      sellerId: "s-loka",
      price: 79000,
      rating: 4.7,
      stock: 66,
      tags: ["brightening", "skin barrier"],
      variants: ["30ml"],
      description:
        "Serum niacinamide untuk bantu mencerahkan dan menenangkan kulit. Tekstur ringan.",
    },
  ];

  return base.map((p, idx) => {
    const id = `p-${idx + 1}`;
    const slug = slugify(p.name);
    return {
      id,
      slug,
      ...p,
      createdAt: now - idx * 36e5,
      images: [`grad-${(idx % 6) + 1}`],
    };
  });
}

export function getProducts() {
  return ensureOnce(Keys.products, seedProducts);
}

export function saveProducts(products) {
  writeJson(Keys.products, products);
  return products;
}

function nextProductId(products) {
  const used = new Set(products.map((p) => p.id));
  for (let i = 1; i < 9999; i++) {
    const id = `p-${i}`;
    if (!used.has(id)) return id;
  }
  return `p-${Date.now()}`;
}

function uniqueSlug(products, baseSlug, forId = null) {
  const used = new Set(
    products
      .filter((p) => (forId ? p.id !== forId : true))
      .map((p) => String(p.slug || "").toLowerCase()),
  );
  if (!used.has(baseSlug)) return baseSlug;
  for (let i = 2; i < 999; i++) {
    const cand = `${baseSlug}-${i}`;
    if (!used.has(cand)) return cand;
  }
  return `${baseSlug}-${Date.now().toString(16).slice(-5)}`;
}

export function upsertProduct(input) {
  const products = readJson(Keys.products, null) || getProducts();
  const isUpdate = Boolean(input?.id && products.some((p) => p.id === input.id));
  const id = isUpdate ? input.id : nextProductId(products);

  const baseSlug = slugify(input.name || "produk");
  const slug = uniqueSlug(products, baseSlug, id);

  const existing = products.find((p) => p.id === id) || {};
  const merged = {
    ...existing,
    id,
    slug,
    name: String(input.name || existing.name || "Produk Baru"),
    categoryId: input.categoryId || existing.categoryId || "fashion",
    sellerId: input.sellerId || existing.sellerId || "s-aurora",
    price: Number(input.price ?? existing.price ?? 0),
    rating: Number(input.rating ?? existing.rating ?? 4.5),
    stock: Number(input.stock ?? existing.stock ?? 0),
    tags: Array.isArray(input.tags) ? input.tags : existing.tags || [],
    variants: Array.isArray(input.variants) ? input.variants : existing.variants || ["Default"],
    description: String(input.description || existing.description || ""),
    images: Array.isArray(input.images) ? input.images : existing.images || ["grad-1"],
    createdAt: existing.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  const next = isUpdate ? products.map((p) => (p.id === id ? merged : p)) : [merged, ...products];
  saveProducts(next);
  return merged;
}

export function deleteProduct(id) {
  const products = readJson(Keys.products, null) || getProducts();
  const next = products.filter((p) => p.id !== id);
  saveProducts(next);
  return next;
}

export function getProductById(id) {
  return getProducts().find((p) => p.id === id) || null;
}

export function getProductBySlug(slug) {
  return getProducts().find((p) => p.slug === slug) || null;
}

export function getCategoryName(categoryId) {
  return Categories.find((c) => c.id === categoryId)?.name || "Lainnya";
}

export function getSeller(sellerId) {
  return Sellers.find((s) => s.id === sellerId) || null;
}

