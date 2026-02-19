import { initCommon } from "../app.js";
import { getProductBySlug, getProducts, getCategoryName, getSeller } from "../data.js";
import { formatRupiah, clamp } from "../format.js";
import { addToCart } from "../cart.js";
import { escapeHtml, toast, renderStars, qs, setText } from "../ui.js";
import { renderThumb } from "../thumbs.js";

function getSlug() {
  const u = new URL(window.location.href);
  return u.searchParams.get("slug") || "";
}

function recoList(all, current) {
  return all
    .filter((p) => p.id !== current.id)
    .sort((a, b) => (b.categoryId === current.categoryId) - (a.categoryId === current.categoryId) || b.rating - a.rating)
    .slice(0, 3);
}

function recoItem(p) {
  return `
    <a class="card pad" style="box-shadow:none" href="product.html?slug=${encodeURIComponent(p.slug)}">
      <div class="row" style="justify-content:space-between; gap:12px; align-items:flex-start">
        <div class="stack" style="gap:6px">
          <strong style="font-size:14px">${escapeHtml(p.name)}</strong>
          <span class="muted" style="font-size:12.5px">${escapeHtml(getCategoryName(p.categoryId))} • ${escapeHtml(renderStars(p.rating))}</span>
        </div>
        <span class="pill">${escapeHtml(formatRupiah(p.price))}</span>
      </div>
    </a>
  `;
}

function main() {
  initCommon();

  const slug = getSlug();
  const p = getProductBySlug(slug);
  if (!p) {
    document.getElementById("pageSubtitle").textContent = "Produk tidak ditemukan.";
    document.getElementById("name").textContent = "Tidak ditemukan";
    document.getElementById("desc").textContent = "Coba kembali ke katalog dan pilih produk lain.";
    document.getElementById("addBtn").disabled = true;
    document.getElementById("buyBtn").disabled = true;
    return;
  }

  document.title = `${p.name} — MarketLite`;
  setText(document.getElementById("pageTitle"), p.name);
  setText(document.getElementById("pageSubtitle"), `${getCategoryName(p.categoryId)} • SKU demo: ${p.id}`);

  const seller = getSeller(p.sellerId);
  qs("#thumb").innerHTML = renderThumb(p.images?.[0], p.name);
  setText(qs("#name"), p.name);
  setText(qs("#category"), getCategoryName(p.categoryId));
  qs("#rating").textContent = `${renderStars(p.rating)} ${p.rating.toFixed(1)}`;
  setText(qs("#desc"), p.description);
  setText(qs("#price"), formatRupiah(p.price));
  qs("#stockPill").textContent = p.stock > 0 ? `Stok ${p.stock}` : "Habis";
  qs("#stockPill").classList.toggle("good", p.stock > 0);
  qs("#stockPill").classList.toggle("bad", p.stock <= 0);

  setText(qs("#sellerName"), seller?.name || "Toko Demo");
  setText(qs("#sellerCity"), seller?.city || "-");
  setText(qs("#sellerRating"), seller ? seller.rating.toFixed(1) : "-");

  const variantSel = qs("#variant");
  variantSel.innerHTML = (p.variants || ["Default"]).map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");

  const qtyEl = qs("#qty");
  qtyEl.addEventListener("input", () => {
    const n = clamp(Number(String(qtyEl.value || "").replace(/[^\d]/g, "")) || 1, 1, 99);
    qtyEl.value = String(n);
  });

  const addBtn = qs("#addBtn");
  const buyBtn = qs("#buyBtn");

  const canBuy = p.stock > 0;
  addBtn.disabled = !canBuy;
  buyBtn.disabled = !canBuy;
  if (!canBuy) {
    addBtn.classList.add("danger");
    buyBtn.classList.add("danger");
  }

  addBtn.addEventListener("click", () => {
    const qty = clamp(Number(qtyEl.value || 1), 1, 99);
    addToCart(p.id, qty, variantSel.value || null);
    toast("Ditambahkan", "Produk masuk ke keranjang.");
    initCommon();
  });

  buyBtn.addEventListener("click", () => {
    const qty = clamp(Number(qtyEl.value || 1), 1, 99);
    addToCart(p.id, qty, variantSel.value || null);
    window.location.href = "checkout.html";
  });

  const all = getProducts();
  const reco = recoList(all, p);
  qs("#reco").innerHTML = reco.map(recoItem).join("") || `<div class="empty">Belum ada rekomendasi.</div>`;
}

main();

