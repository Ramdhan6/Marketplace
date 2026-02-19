import { initCommon, setActiveNav } from "../app.js";
import { listOrders, getOrder, updateOrderStatus } from "../orders.js";
import { formatRupiah, formatDateTime } from "../format.js";
import { getProfile } from "../profile.js";
import { escapeHtml, toast, qs, setText } from "../ui.js";

function getIdParam() {
  const u = new URL(window.location.href);
  return u.searchParams.get("id") || "";
}

function statusPill(status) {
  const s = String(status || "");
  const cls =
    s === "Menunggu Pembayaran"
      ? "warn"
      : s === "Diproses"
        ? "good"
        : s === "Dikirim"
          ? "good"
          : s === "Selesai"
            ? "good"
            : "pill";
  return `<span class="pill ${cls}">${escapeHtml(s)}</span>`;
}

function listRow(o) {
  const total = o?.pricing?.total ?? 0;
  return `
    <a class="card pad" style="box-shadow:none; margin-bottom:12px" href="orders.html?id=${encodeURIComponent(o.id)}">
      <div class="row" style="justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap">
        <div class="stack" style="gap:6px">
          <strong>Order ${escapeHtml(o.id)}</strong>
          <span class="muted" style="font-size:12.5px">${escapeHtml(formatDateTime(o.createdAt))} • ${o.lines?.length || 0} item</span>
        </div>
        <div class="stack" style="gap:8px; align-items:flex-end">
          ${statusPill(o.status)}
          <span class="pill">${escapeHtml(formatRupiah(total))}</span>
        </div>
      </div>
    </a>
  `;
}

function detailView(o, role) {
  const buyer = o.buyer || {};
  const p = o.pricing || {};
  const actions =
    role === "seller"
      ? `
        <div class="row" style="gap:10px; flex-wrap:wrap; margin-top:10px">
          <button class="btn small" data-status="Diproses" type="button">Tandai Diproses</button>
          <button class="btn small" data-status="Dikirim" type="button">Tandai Dikirim</button>
          <button class="btn small primary" data-status="Selesai" type="button">Tandai Selesai</button>
        </div>
      `
      : `
        <div class="row" style="gap:10px; flex-wrap:wrap; margin-top:10px">
          <span class="pill">Tip: toggle ke mode penjual untuk ubah status (demo)</span>
        </div>
      `;

  return `
    <div data-order="${escapeHtml(o.id)}">
      <div class="row" style="justify-content:space-between; flex-wrap:wrap; gap:10px">
        <div class="stack" style="gap:6px">
          <strong>Order ${escapeHtml(o.id)}</strong>
          <span class="muted" style="font-size:12.5px">${escapeHtml(formatDateTime(o.createdAt))}</span>
        </div>
        ${statusPill(o.status)}
      </div>
      <div class="hr"></div>
      <div class="stack" style="gap:10px">
        <strong>Item</strong>
        ${(o.lines || [])
          .map((l) => {
            const variant = l.variant ? ` • <span class="muted">Varian:</span> <strong>${escapeHtml(l.variant)}</strong>` : "";
            return `
              <div class="row" style="justify-content:space-between; gap:14px; align-items:flex-start">
                <div class="stack" style="gap:6px">
                  <a href="product.html?slug=${encodeURIComponent(l.slug)}"><strong style="font-size:14px">${escapeHtml(l.name)}</strong></a>
                  <span class="muted" style="font-size:12.5px">${l.qty} x ${escapeHtml(formatRupiah(l.price))}${variant}</span>
                </div>
                <span class="pill">${escapeHtml(formatRupiah(l.lineTotal))}</span>
              </div>
            `;
          })
          .join("")}
      </div>
      <div class="hr"></div>
      <div class="stack" style="gap:10px">
        <strong>Penerima</strong>
        <div class="row" style="justify-content:space-between"><span class="muted">Nama</span><span>${escapeHtml(buyer.name || "-")}</span></div>
        <div class="row" style="justify-content:space-between"><span class="muted">HP</span><span>${escapeHtml(buyer.phone || "-")}</span></div>
        <div class="stack" style="gap:6px">
          <span class="muted">Alamat</span>
          <div class="card pad" style="box-shadow:none">${escapeHtml(buyer.address || "-")}</div>
        </div>
      </div>
      <div class="hr"></div>
      <div class="stack" style="gap:10px">
        <strong>Pembayaran</strong>
        <div class="row" style="justify-content:space-between"><span class="muted">Metode</span><span class="pill">${escapeHtml(o.payment || "-")}</span></div>
      </div>
      <div class="hr"></div>
      <div class="stack" style="gap:10px">
        <strong>Ringkasan</strong>
        <div class="row" style="justify-content:space-between"><span class="muted">Subtotal</span><span>${escapeHtml(formatRupiah(p.subtotal || 0))}</span></div>
        <div class="row" style="justify-content:space-between"><span class="muted">Ongkir</span><span>${escapeHtml(formatRupiah(p.ship || 0))}</span></div>
        <div class="row" style="justify-content:space-between"><span class="muted">Biaya</span><span>${escapeHtml(formatRupiah(p.fee || 0))}</span></div>
        <div class="hr"></div>
        <div class="row" style="justify-content:space-between"><span class="muted">Total</span><strong>${escapeHtml(formatRupiah(p.total || 0))}</strong></div>
      </div>
      ${actions}
    </div>
  `;
}

function main() {
  initCommon();
  setActiveNav("orders");

  const profile = getProfile();
  setText(qs("#roleHint"), profile.role === "seller" ? "Mode Penjual" : "Mode Pembeli");

  const orders = listOrders();
  setText(qs("#meta"), `${orders.length} pesanan tersimpan (LocalStorage)`);

  qs("#list").innerHTML =
    orders.length === 0
      ? `<div class="empty">Belum ada pesanan. Coba <a class="chip" href="catalog.html">belanja</a> lalu checkout.</div>`
      : orders.map(listRow).join("");

  const selectedId = getIdParam();
  const detail = qs("#detail");
  if (selectedId) {
    const o = getOrder(selectedId);
    detail.innerHTML = o ? detailView(o, profile.role) : `<div class="empty">Pesanan tidak ditemukan.</div>`;
  }

  detail.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-status]");
    if (!btn) return;
    const wrap = e.target.closest("[data-order]");
    const id = wrap?.getAttribute("data-order");
    if (!id) return;
    const status = btn.getAttribute("data-status");
    const updated = updateOrderStatus(id, status);
    if (!updated) return;
    toast("Status diperbarui", `Sekarang: ${status}`);
    window.setTimeout(() => {
      window.location.href = `orders.html?id=${encodeURIComponent(id)}`;
    }, 300);
  });
}

main();

