# TODO - Purchase “add item” logic doc

## Completed
- ✅ Located purchase workflow code in:
  - `src/app/purchases/actions.ts`
  - `src/app/purchases/PurchasesClient.tsx`

## Next
- [ ] Create/update a Markdown file that explains, step-by-step, the **purchase add-item logic**: how the UI derives per-unit price, quantity from packing (packQty × packSize), applies bonus + discount, and sends the final `items[]` payload to `createPurchaseInvoice` / `updatePurchaseInvoice`.

