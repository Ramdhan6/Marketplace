import { initCommon, setActiveNav } from "../app.js";
import { Categories, getProducts, getCategoryName, getSeller, upsertProduct, deleteProduct } from "../data.js";
import { listOrders } from "../orders.js";
import { getProfile } from "../profile.js";
import { formatRupiah, formatDateTime, clamp } from "../format.js";
import { escapeHtml, toast, qs, setText } from "../ui.js";

function parseNum(v, fallback = 0) {
  const n = Number(String(v || "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function productRow(p) {
  return `
    <div class="card pad" style="box-shadow:none; margin-bottom:12px" data-pid="${escapeHtml(p.id)}">
      <div class="row" style="justify-content:space-between; gap:14px; flex-wrap:wrap; align-items:flex-start">
        <div class="stack" style="gap:6px; min-width:240px; flex:1">
          <strong>${escapeHtml(p.name)}</strong>
          <span class="muted" style="font-size:12.5px">${escapeHtml(getCategoryName(p.categoryId))} • SKU: ${escapeHtml(p.id)}</span>
        </div>
        <div class="row" style="gap:10px; flex-wrap:wrap">
          <span class="pill">Harga: <strong>${escapeHtml(formatRupiah(p.price))}</strong></span>
          <span class="pill ${p.stock > 0 ? "good" : "bad"}">Stok: <strong>${p.stock}</strong></span>
        </div>
      </div>
      <div class="hr"></div>
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap:10px">
        <div class="field">
          <span class="label">Harga (Rp)</span>
          <input class="input" data-price inputmode="numeric" value="${escapeHtml(String(p.price))}" />
        </div>
        <div class="field">
          <span class="label">Stok</span>
          <input class="input" data-stock inputmode="numeric" value="${escapeHtml(String(p.stock))}" />
        </div>
        <div class="field" style="grid-column: 1 / -1">
          <span class="label">Nama</span>
          <input class="input" data-name value="${escapeHtml(p.name)}" />
        </div>
        <div class="field" style="grid-column: 1 / -1">
          <span class="label">Kategori</span>
          <select class="select" data-cat>
            ${Categories.map((c) => `<option value="${escapeHtml(c.id)}" ${c.id === p.categoryId ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field" style="grid-column: 1 / -1">
          <span class="label">Varian (koma)</span>
          <input class="input" data-var value="${escapeHtml((p.variants || []).join(", "))}" />
        </div>
        <div class="field" style="grid-column: 1 / -1">
          <span class="label">Deskripsi</span>
          <textarea class="textarea" data-desc>${escapeHtml(p.description || "")}</textarea>
        </div>
        <div class="row" style="grid-column: 1 / -1; justify-content:space-between; flex-wrap:wrap; gap:10px">
          <button class="btn danger" data-del type="button">Hapus</button>
          <button class="btn primary" data-save type="button">Simpan perubahan</button>
        </div>
      </div>
    </div>
  `;
}

function inboxRow(o, sellerId) {
  const lines = (o.lines || []).filter((l) => l.sellerId === sellerId);
  const subtotal = lines.reduce((a, l) => a + (l.lineTotal || 0), 0);
  return `
    <a class="card pad" style="box-shadow:none; margin-bottom:12px" href="orders.html?id=${encodeURIComponent(o.id)}">
      <div class="row" style="justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap">
        <div class="stack" style="gap:6px">
          <strong>Order ${escapeHtml(o.id)}</strong>
          <span class="muted" style="font-size:12.5px">${escapeHtml(formatDateTime(o.createdAt))} • ${lines.length} item toko kamu</span>
        </div>
        <div class="stack" style="gap:8px; align-items:flex-end">
          <span class="pill">${escapeHtml(o.status || "-")}</span>
          <span class="pill">${escapeHtml(formatRupiah(subtotal))}</span>
        </div>
      </div>
    </a>
  `;
}

function renderAll() {
  const profile = getProfile();
  const seller = getSeller(profile.sellerId);

  setText(qs("#sellerPill"), seller ? `Toko: ${seller.name}` : `Seller: ${profile.sellerId}`);
  setText(qs("#meta"), profile.role === "seller" ? "Mode penjual aktif (demo)." : "Kamu di mode pembeli. Toggle mode untuk fitur penjual.");

  const allProducts = getProducts();
  const mine = allProducts.filter((p) => p.sellerId === profile.sellerId);
  qs("#productList").innerHTML =
    mine.length === 0 ? `<div class="empty">Belum ada produk. Tambahkan lewat form di bawah.</div>` : mine.map(productRow).join("");

  const orders = listOrders();
  const inbox = orders.filter((o) => (o.lines || []).some((l) => l.sellerId === profile.sellerId));
  setText(qs("#inboxPill"), `${inbox.length} pesanan`);
  qs("#inbox").innerHTML =
    inbox.length === 0 ? `<div class="empty">Belum ada pesanan masuk untuk toko ini.</div>` : inbox.slice(0, 6).map((o) => inboxRow(o, profile.sellerId)).join("");
}

function main() {
  initCommon();
  setActiveNav("seller");

  const profile = getProfile();
  const catSel = qs("#cCat");
  catSel.innerHTML = Categories.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("");

  renderAll();

  qs("#createForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = qs("#cName").value.trim();
    const categoryId = qs("#cCat").value;
    const price = parseNum(qs("#cPrice").value, 0);
    const stock = clamp(parseNum(qs("#cStock").value, 0), 0, 99999);
    const variantsRaw = qs("#cVar").value.trim();
    const description = qs("#cDesc").value.trim();

    if (!name) {
      toast("Nama wajib", "Isi nama produk dulu.");
      return;
    }

    const variants = variantsRaw
      ? variantsRaw.split(",").map((x) => x.trim()).filter(Boolean)
      : ["Default"];

    upsertProduct({
      name,
      categoryId,
      sellerId: profile.sellerId,
      price,
      stock,
      variants,
      description,
      images: ["grad-1"],
      rating: 4.6,
      tags: [],
    });

    qs("#createForm").reset();
    toast("Produk dibuat", "Produk baru tersimpan (LocalStorage).");
    renderAll();
  });

  qs("#productList").addEventListener("click", (e) => {
    const row = e.target.closest("[data-pid]");
    if (!row) return;
    const id = row.getAttribute("data-pid");

    if (e.target.closest("[data-del]")) {
      deleteProduct(id);
      toast("Produk dihapus", "Produk sudah dihapus dari daftar.");
      renderAll();
      return;
    }

    if (e.target.closest("[data-save]")) {
      const name = row.querySelector("[data-name]")?.value?.trim() || "";
      const categoryId = row.querySelector("[data-cat]")?.value || "fashion";
      const price = parseNum(row.querySelector("[data-price]")?.value, 0);
      const stock = clamp(parseNum(row.querySelector("[data-stock]")?.value, 0), 0, 99999);
      const variantsRaw = row.querySelector("[data-var]")?.value?.trim() || "";
      const description = row.querySelector("[data-desc]")?.value?.trim() || "";
      const variants = variantsRaw
        ? variantsRaw.split(",").map((x) => x.trim()).filter(Boolean)
        : ["Default"];

      if (!name) {
        toast("Nama wajib", "Nama produk tidak boleh kosong.");
        return;
      }

      upsertProduct({
        id,
        name,
        categoryId,
        sellerId: profile.sellerId,
        price,
        stock,
        variants,
        description,
      });
      toast("Tersimpan", "Perubahan produk sudah disimpan.");
      renderAll();
    }
  });
}

main();

