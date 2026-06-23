# Purchase — Add Item Logic (UI → Server)

This document explains the tested logic behind **adding an item in the Purchases screen**: where the user enters values, how the UI derives the final `items[]` objects, and what the server does with those items.

> Key files
- UI (derives `items[]`): `src/app/purchases/PurchasesClient.tsx`
- Server logic (creates/updates invoice, batches, stock): `src/app/purchases/actions.ts`

---

## 1) Where the user enters purchase item inputs

In `PurchasesClient.tsx`, when the header is locked (`isStepLocked === true`), the **Item Details Entry** section collects per-item fields in this form:

### Product selection
- `currentItem.productName` (via `BarcodeInput` + suggestions)
- When selecting an existing product from DB, `selectSuggestion()` sets:
  - `productId`
  - `productName`
  - `genericName`
  - `categoryId`
  - `isNewProduct = false`
- When selecting from Excel import, it sets:
  - `isNewProduct = true` (then the server creates the product)

### Batch/expiry inputs
- `currentItem.batchNumber`
- `currentItem.expiryDate`

> Note: the UI currently forces `needsBatch = true` (batch + expiry must be enabled).

### Packing fields (boxes/packs)
- `currentItem.packQty` = number of boxes/packs
- `currentItem.packSize` = units per box/pack
- Derived by UI:
  - `totalUnits = packQty × packSize`

### Bonus
- `currentItem.bonus` = bonus units (smallest unit)

### Purchase cost
- `currentItem.boxPrice` = price per box/pack from the invoice
- UI derives per-unit cost:
  - `perUnitPrice = boxPrice ÷ packSize`

### Sale prices (stored on product)
- `salePriceMode` toggle:
  - **Per Unit**: use `salePriceRetail` and `salePriceDistribution`
  - **Per Pack**: use `salePriceRetailPack` and `salePriceDistributionPack`, then UI divides by `packSize` to get per-unit

> These sale prices are stored on the **product** when `isNewProduct` is true.

### Discount
- `currentItem.discount` (%)

---

## 2) UI math: how the item subtotal is calculated

When the user clicks **“ADD ITEM TO TABLE”**, the function `addItemToTable()` runs in `PurchasesClient.tsx`.

### Step A — derive packing → quantity
Inside `addItemToTable()`:
- `packQty = Number(currentItem.packQty) || 1`
- `packSize = Number(currentItem.packSize) || 1`
- `boxPrice = Number(currentItem.boxPrice) || 0`
- `perUnitPrice = packSize > 0 ? boxPrice / packSize : 0`
- `totalUnits = packQty × packSize`

Then the final quantity stored in the item object is:
- `quantity = totalUnits`
- and the item carries `bonus` separately

### Step B — resolve sale prices (unit per DB)
If `salePriceMode === 'pack'` and `packSize > 1`:
- `salePriceRetail = salePriceRetailPack ÷ packSize`
- `salePriceDistribution = salePriceDistributionPack ÷ packSize`

Else (per-unit mode):
- use `salePriceRetail` and `salePriceDistribution` directly

### Step C — build the final `finalItem`
`finalItem` includes:
- `quantity` = totalUnits as string
- `bonus` = currentItem.bonus (as string)
- `purchasePrice` = `perUnitPrice` (fixed)
- `salePriceRetail`, `salePriceDistribution` (fixed)
- `batchNumber`, `expiryDate`
- `categoryId`, etc.

### Step D — compute line subtotal
`finalItem.subtotal = calculateItemSubtotal(finalItem)`

`calculateItemSubtotal(item)` does:
- `qty = Number(item.quantity) + Number(item.bonus)`
- `disc = Number(item.discount) || 0` (percent)
- `price = Number(item.purchasePrice) || 0`
- `subtotal = (qty × price) - (qty × price × disc / 100)`

So bonus units are included in the taxable/discounted quantity for the line.

---

## 3) UI → server: what payload is sent

When saving the purchase invoice, `handleSubmit()` decides create vs edit.

### Create mode
`createPurchaseInvoice(createPayload)` receives:
- `supplierId`, `warehouseId`, `invoiceNumber`, `invoiceDate`
- `totalAmount = grandTotal` (sum of all item.subtotal)
- `discount: 0` (invoice-level discount is not used here)
- `netAmount = grandTotal`
- `paidAmount`, `paymentMethod`
- `items: items` (the table rows built by `addItemToTable()`)

### Edit mode
`updatePurchaseInvoice(invoiceId, editPayload)` receives:
- same data shape as create (except `paidAmount` is not sent; payments are separate)

---

## 4) Server-side add-item logic (batches, items, and stock)

The server logic is in `src/app/purchases/actions.ts`.

### 4.1 createPurchaseInvoice(data)
For each element in `data.items`:

#### Step 1 — product resolution
If `item.isNewProduct` is true:
- `tx.product.create({ organizationId, name, genericName, categoryId, purchasePrice, salePriceRetail, salePriceDistribution })`
- server sets `productId` to the new product’s id

If not new:
- uses `item.productId`

#### Step 2 — batch resolution
If `item.batchNumber` is present:
- tries to find existing batch by `(organizationId, productId, batchNumber)`
- if missing, creates it with:
  - `expiryDate`
  - `purchasePrice`

If `item.batchNumber` is empty:
- uses a default batch with `batchNumber = 'DEFAULT'`
- finds/creates it per `(organizationId, productId, 'DEFAULT')`

#### Step 3 — create invoice line item
Creates:
- `tx.purchaseInvoiceItem.create({ quantity, bonus, purchasePrice, subtotal })`

#### Step 4 — update stock
Looks up stock for the tuple:
- `(organizationId, warehouseId, productId, batchId)`

If stock exists:
- increments `quantity` by `(quantity + bonus)`

If not exists:
- creates stock with `quantity = quantity + bonus`

This mirrors the UI: bonus units are added to stock immediately.

### 4.2 updatePurchaseInvoice(invoiceId, data)
The server update reverses the old invoice then applies the new items.

Order:
1. Fetch old invoice + items
2. Reverse old stock:
   - decrements stock by `(oldItem.quantity + oldItem.bonus)`
3. Delete old items:
   - `purchaseInvoiceItem.deleteMany(...)`
4. Re-run batch resolution + item creation + stock increment for the new `data.items`

Ledger adjustment:
- only adjusts supplier ledger if the invoice net amount actually changed.

---

## 5) Quick checklist (user flow)

To add a new purchase invoice line successfully:
1. Select **Supplier**, **Warehouse**, **Invoice Number**, **Date**, **Category**
2. Unlock step to allow adding items (`Unlock Header`)
3. Select or create a Product (via DB search or Excel import)
4. Enter:
   - Batch number + expiry
   - Pack Qty + Pack Size + Box Price
   - Bonus
   - Discount %
   - Sale prices (unit or pack)
5. Click **ADD ITEM TO TABLE**
6. Click **SAVE INVOICE TO DATABASE**

---

## 6) Important implementation notes

- UI subtotal includes **bonus**:
  - subtotal uses `(quantity + bonus)`
- Stock increment also includes **bonus**:
  - stock quantity is increased by `(quantity + bonus)`
- Invoice-level discount is currently fixed to `0` in the payload.
- Per-unit purchase price is derived from `boxPrice ÷ packSize`.

