import { initCommon, setActiveNav } from "../app.js";
import { getProducts, getCategoryName, getSeller } from "../data.js";
import { formatRupiah } from "../format.js";
import { addToCart } from "../cart.js";
import { escapeHtml, toast, renderStars, iconBag, iconBolt } from "../ui.js";
import { renderThumb } from "../thumbs.js";

function pickFeatured(products) {
  return [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);
}

function productCard(p) {
  const seller = getSeller(p.sellerId);
  const variant = p.variants?.[0] || null;
  return `
    <article class="card product" data-id="${escapeHtml(p.id)}">
      <a class="thumb" href="product.html?slug=${encodeURIComponent(p.slug)}">
        ${renderThumb(p.images?.[0], p.name)}
      </a>
      <div class="stack" style="gap:10px">
        <div class="stack" style="gap:6px">
          <a href="product.html?slug=${encodeURIComponent(p.slug)}">
            <h3 class="p-title">${escapeHtml(p.name)}</h3>
          </a>
          <div class="row" style="justify-content:space-between; align-items:flex-start">
            <span class="muted">${escapeHtml(getCategoryName(p.categoryId))} • ${escapeHtml(seller?.name || "Toko")}</span>
            <span class="pill">${escapeHtml(renderStars(p.rating))} <span class="muted">${p.rating.toFixed(1)}</span></span>
          </div>
        </div>
        <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap">
          <span class="price">${escapeHtml(formatRupiah(p.price))}</span>
          <span class="pill ${p.stock > 0 ? "good" : "bad"}">${p.stock > 0 ? `Stok ${p.stock}` : "Habis"}</span>
        </div>
        <div class="row" style="gap:10px; justify-content:space-between">
          <button class="btn small primary" data-add>
            ${iconBag()} <span>Tambah</span>
          </button>
          <a class="btn small" href="product.html?slug=${encodeURIComponent(p.slug)}">
            ${iconBolt()} <span>Detail</span>
          </a>
        </div>
        <div class="muted" style="font-size:12.5px">
          Varian cepat: <strong>${escapeHtml(variant || "-")}</strong>
        </div>
      </div>
    </article>
  `;
}

function wireFeatured(root, products) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const card = btn.closest("[data-id]");
    const id = card?.getAttribute("data-id");
    const p = products.find((x) => x.id === id);
    if (!p) return;
    if (p.stock <= 0) {
      toast("Stok habis", "Produk ini sedang tidak tersedia.");
      return;
    }
    const v = p.variants?.[0] || null;
    addToCart(p.id, 1, v);
    toast("Ditambahkan", "Produk masuk ke keranjang.");
    initCommon();
  });
}

function main() {
  initCommon();
  setActiveNav("home");

  const grid = document.getElementById("featuredGrid");
  const products = getProducts();
  const featured = pickFeatured(products);
  grid.innerHTML = featured.map(productCard).join("");
  wireFeatured(grid, products);
}

main();

