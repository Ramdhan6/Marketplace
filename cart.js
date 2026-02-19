import { initCommon, setActiveNav } from "../app.js";
import { getCart, updateQty, removeItem, clearCart } from "../cart.js";
import { getProductById, getCategoryName, getSeller } from "../data.js";
import { formatRupiah, clamp } from "../format.js";
import { escapeHtml, toast, qs, setText } from "../ui.js";
import { renderThumb } from "../thumbs.js";

const SHIPPING = 18000;
const FEE = 2000;

function lineItemRow(it, product) {
  const seller = getSeller(product.sellerId);
  const variant = it.variant ? ` • <span class="muted">Varian:</span> <strong>${escapeHtml(it.variant)}</strong>` : "";
  return `
    <div class="card pad" style="box-shadow:none; margin-bottom:12px" data-key="${escapeHtml(it.key)}">
      <div class="row" style="gap:14px; align-items:flex-start; flex-wrap:wrap">
        <a class="thumb" style="width:92px; height:92px" href="product.html?slug=${encodeURIComponent(product.slug)}">
          ${renderThumb(product.images?.[0], product.name)}
        </a>
        <div class="stack" style="gap:8px; flex:1; min-width:240px">
          <div class="row" style="justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap">
            <div class="stack" style="gap:6px">
              <strong>${escapeHtml(product.name)}</strong>
              <span class="muted" style="font-size:12.5px">
                ${escapeHtml(getCategoryName(product.categoryId))} • ${escapeHtml(seller?.name || "Toko")}
                ${variant}
              </span>
            </div>
            <span class="pill">${escapeHtml(formatRupiah(product.price))}</span>
          </div>

          <div class="row" style="justify-content:space-between; flex-wrap:wrap">
            <div class="row" style="gap:8px">
              <button class="btn small" data-dec type="button">-</button>
              <input class="input" style="width:72px; text-align:center" inputmode="numeric" data-qty value="${escapeHtml(String(it.qty || 1))}" />
              <button class="btn small" data-inc type="button">+</button>
            </div>
            <div class="row" style="gap:10px">
              <button class="btn small danger" data-remove type="button">Hapus</button>
              <span class="pill">Item: <strong>${escapeHtml(formatRupiah(product.price * (it.qty || 1)))}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function calc(cart) {
  const lines = cart.items
    .map((it) => {
      const p = getProductById(it.productId);
      if (!p) return null;
      return { it, p, lineTotal: p.price * (it.qty || 0) };
    })
    .filter(Boolean);

  const subtotal = lines.reduce((a, x) => a + x.lineTotal, 0);
  const ship = lines.length ? SHIPPING : 0;
  const fee = lines.length ? FEE : 0;
  const total = subtotal + ship + fee;
  return { lines, subtotal, ship, fee, total };
}

function render() {
  const cart = getCart();
  const { lines, subtotal, ship, fee, total } = calc(cart);

  setText(qs("#meta"), `${lines.length} item • ${cart.items.reduce((a, it) => a + (it.qty || 0), 0)} qty`);
  qs("#items").innerHTML =
    lines.length === 0
      ? `<div class="empty">Keranjang masih kosong. Mulai dari <a class="chip" href="catalog.html">katalog</a>.</div>`
      : lines.map((x) => lineItemRow(x.it, x.p)).join("");

  setText(qs("#sub"), formatRupiah(subtotal));
  setText(qs("#ship"), formatRupiah(ship));
  setText(qs("#fee"), formatRupiah(fee));
  setText(qs("#total"), formatRupiah(total));

  const checkoutBtn = qs("#checkoutBtn");
  checkoutBtn.classList.toggle("danger", lines.length === 0);
  checkoutBtn.textContent = lines.length === 0 ? "Pilih produk dulu" : "Lanjut ke checkout";
  checkoutBtn.setAttribute("aria-disabled", lines.length === 0 ? "true" : "false");
  checkoutBtn.style.pointerEvents = lines.length === 0 ? "none" : "auto";
}

function main() {
  initCommon();
  setActiveNav("cart");
  render();

  qs("#items").addEventListener("click", (e) => {
    const root = e.target.closest("[data-key]");
    if (!root) return;
    const key = root.getAttribute("data-key");
    const cart = getCart();
    const it = cart.items.find((x) => x.key === key);
    if (!it) return;

    if (e.target.closest("[data-remove]")) {
      removeItem(key);
      toast("Dihapus", "Item dihapus dari keranjang.");
      initCommon();
      render();
      return;
    }
    if (e.target.closest("[data-inc]")) {
      updateQty(key, (it.qty || 1) + 1);
      initCommon();
      render();
      return;
    }
    if (e.target.closest("[data-dec]")) {
      updateQty(key, (it.qty || 1) - 1);
      initCommon();
      render();
      return;
    }
  });

  qs("#items").addEventListener("input", (e) => {
    const qtyEl = e.target.closest("[data-qty]");
    if (!qtyEl) return;
    const root = qtyEl.closest("[data-key]");
    const key = root?.getAttribute("data-key");
    if (!key) return;
    const n = clamp(Number(String(qtyEl.value || "").replace(/[^\d]/g, "")) || 1, 1, 99);
    qtyEl.value = String(n);
    updateQty(key, n);
    initCommon();
    render();
  });

  qs("#clearBtn").addEventListener("click", () => {
    clearCart();
    toast("Keranjang dikosongkan", "Semua item sudah dihapus.");
    initCommon();
    render();
  });
}

main();

