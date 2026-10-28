# MokaPro POS Frontend — Project Context

## Project

MokaPro adalah aplikasi POS (Point of Sale) untuk coffee shop.

Frontend menggunakan:

- React
- Vite
- JavaScript / JSX
- React Router DOM
- CSS

Source of truth untuk UI adalah desain Figma dan screenshot yang tersedia.

---

## Development Rules

- Jangan membuat semua halaman sekaligus.
- Implementasikan berdasarkan flow dan screenshot secara bertahap.
- Screenshot Figma adalah source of truth untuk visual.
- Jangan membuat halaman baru jika desain sebenarnya adalah modal.
- Gunakan reusable components.
- Hindari duplicate code.
- Jangan membuat backend/API/database kecuali diminta.
- Gunakan local assets jika tersedia.
- Prioritaskan visual fidelity terhadap screenshot.
- Setiap page/component memiliki CSS sendiri.
- `index.css` hanya untuk global styling.
- `App.css` hanya untuk app-level styling.

---

## Page Structure

### Public

```text
/
/select-user
```

### Cashier

```text
/cashier/pin
/cashier
/cashier/shift
/history
```

### Barista

```text
/barista/pin
/kds
```

### Admin / Pengelola

```text
/admin/pin
/admin
/admin/inventory
/admin/menu
/admin/reports
/history
```

---

## Existing Cashier Flow

Cashier flow yang sudah diimplementasikan secara bertahap:

```text
Cashier
   ↓
ProductCard
   ↓
Customize Product
   ↓
Cart
   ↓
Checkout
   ↓
Table Selection
   ↓
Payment
      ├── QRIS
      └── Cash
```

Yang SUDAH dibuat:

- Cashier page
- ProductCard
- ProductGrid
- Cart
- CustomizeProductModal
- TableSelectionModal
- QRISPaymentModal
- CashPaymentModal

---

## Cashier Flow Still To Do

Tahap berikutnya:

```text
Payment
   ↓
Payment Success
   ↓
Receipt
   ↓
Reset Transaction
```

Referensi screenshot:

```text
pembayaran berhasil.png
struk.png
```

Implementasikan:

```text
src/components/PaymentSuccessModal/
├── PaymentSuccessModal.jsx
└── PaymentSuccessModal.css

src/components/ReceiptModal/
├── ReceiptModal.jsx
└── ReceiptModal.css
```

Keduanya adalah MODAL, bukan halaman.

Jangan membuat route baru untuk Payment Success atau Receipt.

---

## Important Cashier Behavior

Setelah pembayaran berhasil:

```text
Payment
↓
PaymentSuccessModal
↓
ReceiptModal
↓
Transaction selesai
↓
Reset cart
↓
Reset selected table
↓
Reset payment state
↓
Cashier siap untuk transaksi baru
```

Jangan menggunakan:

```js
window.location.reload()
```

Gunakan React state.

---

## Existing Architecture

Gunakan struktur seperti:

```text
src/
├── assets/
├── components/
│   ├── PublicNavbar/
│   ├── DashboardNavbar/
│   ├── PinLogin/
│   ├── ProductCard/
│   ├── ProductGrid/
│   ├── Cart/
│   ├── CustomizeProductModal/
│   ├── TableSelectionModal/
│   ├── QRISPaymentModal/
│   ├── CashPaymentModal/
│   ├── PaymentSuccessModal/
│   └── ReceiptModal/
│
├── pages/
│   ├── Welcome/
│   ├── SelectUser/
│   ├── CashierPin/
│   ├── BaristaPin/
│   ├── AdminPin/
│   ├── Cashier/
│   ├── KDS/
│   ├── Inventory/
│   ├── Reports/
│   ├── TransactionHistory/
│   ├── AdminDashboard/
│   ├── MenuManagement/
│   └── ShiftReport/
│
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

Before creating a new component, inspect the existing project and reuse existing components whenever possible.

---

## Remaining Project Flow

After finishing Payment Success + Receipt, continue with:

```text
KDS / Barista
↓
Inventory
↓
Admin Dashboard
↓
Menu Management
↓
Reports
↓
Transaction History
↓
Shift Report
```

Do not implement everything at once.

Implement one logical section at a time based on the provided screenshot.

---

## Important

When continuing an existing task:

1. Inspect the current codebase first.
2. Do not assume previous files are missing.
3. Do not recreate existing components.
4. Check existing routes before adding routes.
5. Check existing state management before creating new state.
6. Preserve working functionality.
7. Run the project after modifications.
8. Fix errors before finishing.
9. Follow the screenshot as the visual source of truth.

The project may be continued from a different Antigravity account/session, so the codebase itself should be treated as the primary source of project context.