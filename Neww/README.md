## Marketplace Prototype (Static)

Prototipe aplikasi marketplace berbasis **HTML/CSS/JavaScript** (tanpa dependency). Data produk dummy disimpan di **LocalStorage** agar bisa mensimulasikan alur belanja.

### Fitur yang tersedia
- **Katalog produk**: pencarian, filter kategori, sort harga/rating, pagination ringan.
- **Detail produk**: foto, stok, varian sederhana, tambah ke keranjang.
- **Keranjang**: ubah kuantitas, hapus item, ringkasan biaya.
- **Checkout**: form alamat + metode pembayaran (simulasi).
- **Pesanan**: daftar pesanan & detail.
- **Dashboard penjual (demo)**: kelola produk (tambah/edit), lihat pesanan masuk.

### Cara menjalankan
**Opsi A (disarankan): jalankan server lokal via PowerShell**
1. Buka PowerShell di folder ini.
2. Jalankan:

```powershell
.\scripts\serve.ps1 -Port 8080
```

3. Buka browser ke `http://localhost:8080`

**Opsi B: buka file langsung**
- Buka `index.html` dengan browser.

### Struktur folder
- `assets/css/` styling
- `assets/js/` modul data, state, cart, orders, ui
- `scripts/` utilitas menjalankan server lokal
- `index.html` dan halaman lainnya di root

