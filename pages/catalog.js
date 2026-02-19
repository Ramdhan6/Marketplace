import { initCommon, setActiveNav } from "../app.js";
import { Categories, getProducts, getCategoryName, getSeller } from "../data.js";
import { formatRupiah, clamp } from "../format.js";
import { addToCart } from "../cart.js";
import { escapeHtml, toast, renderStars, iconBag, iconBolt, qs, setText } from "../ui.js";
import { renderThumb } from "../thumbs.js";

const PER_PAGE = 9;

function parseIntLoose(v, fallback) {
  const n = Number(String(v || "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function getParams() {
  const u = new URL(window.location.href);
  return {
    q: u.searchParams.get("q") || "",
    cat: u.searchParams.get("cat") || "all",
    min: u.searchParams.get("min") || "",
    max: u.searchParams.get("max") || "",
    sort: u.searchParams.get("sort") || "reco",
    page: clamp(parseIntLoose(u.searchParams.get("page"), 1), 1, 999),
  };
}

function setParams(next) {
  const u = new URL(window.location.href);
  Object.entries(next).forEach(([k, v]) => {
    if (v === "" || v === null || v === undefined) u.searchParams.delete(k);
    else u.searchParams.set(k, String(v));
  });
  window.location.href = u.toString();
}

function matchesQuery(p, q) {
  if (!q) return true;
  const hay = `${p.name} ${p.description || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function applySort(items, sort) {
  const arr = [...items];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => a.price - b.price);
    case "price_desc":
      return arr.sort((a, b) => b.price - a.price);
    case "rating_desc":
      return arr.sort((a, b) => b.rating - a.rating);
    case "new_desc":
      return arr.sort((a, b) => b.createdAt - a.createdAt);
    case "reco":
    default:
      return arr.sort((a, b) => b.rating * 10 + b.stock - (a.rating * 10 + a.stock));
  }
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

function wireGrid(grid, products) {
  grid.addEventListener("click", (e) => {
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
  setActiveNav("catalog");

  const params = getParams();
  const products = getProducts();

  // controls init
  const catSel = qs("#cat");
  catSel.innerHTML = [
    `<option value="all">Semua</option>`,
    ...Categories.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`),
  ].join("");

  qs("#q").value = params.q;
  qs("#cat").value = params.cat;
  qs("#min").value = params.min;
  qs("#max").value = params.max;
  qs("#sort").value = params.sort;

  // filtering
  const q = params.q.trim();
  const min = params.min ? parseIntLoose(params.min, 0) : null;
  const max = params.max ? parseIntLoose(params.max, 0) : null;

  let items = products.filter((p) => matchesQuery(p, q));
  if (params.cat !== "all") items = items.filter((p) => p.categoryId === params.cat);
  if (min !== null) items = items.filter((p) => p.price >= min);
  if (max !== null) items = items.filter((p) => p.price <= max);
  items = applySort(items, params.sort);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = clamp(params.page, 1, pageCount);
  const start = (page - 1) * PER_PAGE;
  const pageItems = items.slice(start, start + PER_PAGE);

  const grid = qs("#grid");
  const meta = qs("#resultMeta");
  const pageMeta = qs("#pageMeta");

  if (total === 0) {
    grid.innerHTML = `<div class="col-span-12 empty">Tidak ada produk yang cocok. Coba ubah kata kunci atau reset filter.</div>`;
  } else {
    grid.innerHTML = pageItems.map(productCard).join("");
  }

  setText(meta, `${total} produk • ${pageItems.length} ditampilkan`);
  setText(pageMeta, `Halaman ${page} dari ${pageCount}`);

  wireGrid(grid, products);

  qs("#applyBtn").addEventListener("click", () => {
    setParams({
      q: qs("#q").value.trim(),
      cat: qs("#cat").value,
      min: qs("#min").value.trim(),
      max: qs("#max").value.trim(),
      sort: qs("#sort").value,
      page: 1,
    });
  });

  qs("#resetBtn").addEventListener("click", () => {
    window.location.href = "catalog.html";
  });

  qs("#prevBtn").addEventListener("click", () => {
    if (page <= 1) return;
    setParams({ page: page - 1 });
  });
  qs("#nextBtn").addEventListener("click", () => {
    if (page >= pageCount) return;
    setParams({ page: page + 1 });
  });

  // Enter-to-apply
  ["#q", "#min", "#max"].forEach((sel) => {
    qs(sel).addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      qs("#applyBtn").click();
    });
  });
}

main();

