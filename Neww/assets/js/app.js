import { getCartCount } from "./cart.js";
import { getProfile, toggleRole } from "./profile.js";
import { qs, setText, toast } from "./ui.js";

export function initCommon() {
  const countEl = document.getElementById("cartCount");
  setText(countEl, String(getCartCount()));

  const rolePill = document.getElementById("rolePill");
  const p = getProfile();
  if (rolePill) {
    rolePill.textContent = p.role === "seller" ? "Mode: Penjual" : "Mode: Pembeli";
    rolePill.classList.toggle("active", p.role === "seller");
  }

  const btn = document.getElementById("toggleRoleBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const next = toggleRole();
      toast("Mode diganti", next === "seller" ? "Sekarang kamu di mode penjual." : "Sekarang kamu di mode pembeli.");
      window.setTimeout(() => window.location.reload(), 450);
    });
  }

  const quickSearch = qs("#quickSearch");
  if (quickSearch) {
    quickSearch.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const q = String(quickSearch.value || "").trim();
      window.location.href = q ? `catalog.html?q=${encodeURIComponent(q)}` : "catalog.html";
    });
  }
}

export function setActiveNav(pathname) {
  const nav = document.querySelectorAll("[data-nav]");
  nav.forEach((a) => {
    const target = a.getAttribute("data-nav");
    a.classList.toggle("active", target === pathname);
  });
}

