import { initCommon, setActiveNav } from "../app.js";
import { getCart, clearCart } from "../cart.js";
import { getProductById } from "../data.js";
import { formatRupiah } from "../format.js";
import { createOrder } from "../orders.js";
import { escapeHtml, toast, qs, setText } from "../ui.js";

const SHIPPING = 18000;
const FEE = 2000;

function calc(cart) {
  const lines = cart.items
    .map((it) => {
      const p = getProductById(it.productId);
      if (!p) return null;
      const qty = it.qty || 0;
      return {
        key: it.key,
        productId: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        variant: it.variant || null,
        qty,
        lineTotal: p.price * qty,
        sellerId: p.sellerId,
      };
    })
    .filter(Boolean);
  const subtotal = lines.reduce((a, x) => a + x.lineTotal, 0);
  const ship = lines.length ? SHIPPING : 0;
  const fee = lines.length ? FEE : 0;
  const total = subtotal + ship + fee;
  return { lines, subtotal, ship, fee, total };
}

function lineRow(l) {
  const variant = l.variant ? ` • <span class="muted">Varian:</span> <strong>${escapeHtml(l.variant)}</strong>` : "";
  return `
    <div class="row" style="justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:10px">
      <div class="stack" style="gap:6px">
        <a href="product.html?slug=${encodeURIComponent(l.slug)}"><strong style="font-size:14px">${escapeHtml(l.name)}</strong></a>
        <span class="muted" style="font-size:12.5px">${l.qty} x ${escapeHtml(formatRupiah(l.price))}${variant}</span>
      </div>
      <span class="pill">${escapeHtml(formatRupiah(l.lineTotal))}</span>
    </div>
  `;
}

function main() {
  initCommon();
  setActiveNav("checkout");

  const cart = getCart();
  const { lines, subtotal, ship, fee, total } = calc(cart);

  setText(qs("#meta"), `${lines.length} item di checkout`);
  qs("#lines").innerHTML =
    lines.length === 0
      ? `<div class="empty">Keranjang kosong. Kembali ke <a class="chip" href="catalog.html">katalog</a>.</div>`
      : lines.map(lineRow).join("");

  setText(qs("#sub"), formatRupiah(subtotal));
  setText(qs("#ship"), formatRupiah(ship));
  setText(qs("#fee"), formatRupiah(fee));
  setText(qs("#total"), formatRupiah(total));

  const form = qs("#form");
  const payBtn = qs("#payBtn");
  if (lines.length === 0) {
    payBtn.disabled = true;
    payBtn.classList.add("danger");
    payBtn.textContent = "Keranjang kosong";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (lines.length === 0) return;

    const name = qs("#name").value.trim();
    const phone = qs("#phone").value.trim();
    const address = qs("#address").value.trim();
    const payment = qs("#payment").value;

    if (!name || !phone || !address) {
      toast("Form belum lengkap", "Isi nama, nomor HP, dan alamat.");
      return;
    }

    const order = createOrder({
      buyer: { name, phone, address },
      payment,
      lines,
      pricing: { subtotal, ship, fee, total },
    });

    clearCart();
    toast("Pesanan dibuat", `Order ID: ${order.id}`);
    initCommon();
    window.setTimeout(() => {
      window.location.href = `orders.html?id=${encodeURIComponent(order.id)}`;
    }, 450);
  });
}

main();

