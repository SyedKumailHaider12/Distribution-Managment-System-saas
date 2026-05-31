'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

async function createAuditLog(tx: any, organizationId: number, userId: number | undefined, action: string, tableName: string, recordId: number, details: string) {
  await tx.auditLog.create({
    data: {
      organizationId,
      userId,
      action,
      tableName,
      recordId,
      details,
      timestamp: new Date()
    }
  })
}

export async function deletePurchaseInvoice(invoiceId: number) {
  try {
    const session = await getSession()
    if (!session || session.role.toLowerCase() !== 'admin') {
      return { success: false, error: 'Only admins can delete invoices' }
    }

    const organizationId = session.organizationId;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the invoice and its items
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: invoiceId, organizationId },
        include: { items: true }
      })

      if (!invoice) throw new Error('Invoice not found')

      // 2. Reverse Stock
      for (const item of invoice.items) {
        await tx.stock.update({
          where: {
            organizationId_warehouseId_productId_batchId: {
              organizationId,
              warehouseId: invoice.warehouseId,
              productId: item.productId,
              batchId: item.batchId
            }
          },
          data: {
            quantity: { decrement: item.quantity + item.bonus }
          }
        })
      }

      // 3. Update Supplier Ledger
      const lastEntry = await tx.supplierLedgerEntry.findFirst({
        where: { supplierId: invoice.supplierId, organizationId },
        orderBy: { date: 'desc' }
      })

      const prevBalance = lastEntry ? lastEntry.balance : 0
      const newBalance = prevBalance - invoice.netAmount

      await tx.supplierLedgerEntry.create({
        data: {
          organizationId,
          supplierId: invoice.supplierId,
          type: 'DEBIT',
          amount: invoice.netAmount,
          description: `DELETED Purchase Invoice: ${invoice.invoiceNumber}`,
          referenceId: invoice.invoiceNumber,
          balance: newBalance
        }
      })

      // 4. Delete invoice
      await tx.purchaseInvoice.delete({
        where: { id: invoiceId, organizationId }
      })

      // 5. Audit Log
      await createAuditLog(tx, organizationId, session.id, 'DELETE', 'PurchaseInvoice', invoiceId, `Deleted invoice ${invoice.invoiceNumber} worth ${invoice.netAmount}`)

      return true
    })

    revalidatePath('/purchases')
    revalidatePath('/stock')
    return { success: true }
  } catch (error: any) {
    console.error('Purchase deletion error:', error)
    return { success: false, error: error.message }
  }
}

export async function createPurchaseInvoice(data: {
  branchId?: number
  supplierId: number
  supplierPhone?: string
  warehouseId: number
  invoiceNumber: string
  invoiceDate: string
  totalAmount: number
  discount: number
  netAmount: number
  paidAmount: number
  paymentMethod: string
  items: any[]
}) {
  try {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    const organizationId = session.organizationId;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Resolve branch (must belong to organization)
      let branchId = data.branchId || 1; 

      // 2. Create Invoice
      const invoice = await tx.purchaseInvoice.create({
        data: {
          organizationId,
          branchId,
          supplierId: data.supplierId,
          supplierPhone: data.supplierPhone || null,
          warehouseId: data.warehouseId,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: new Date(data.invoiceDate),
          totalAmount: data.totalAmount,
          discount: data.discount,
          netAmount: data.netAmount,
          paidAmount: data.paidAmount,
          status: data.paidAmount >= data.netAmount ? 'PAID' : (data.paidAmount > 0 ? 'PARTIAL' : 'UNPAID')
        }
      })

      // 2.5 Record initial payment if any
      if (data.paidAmount > 0) {
        await tx.payment.create({
          data: {
            organizationId,
            branchId,
            date: new Date(data.invoiceDate),
            type: 'PURCHASE',
            paymentMethod: data.paymentMethod || 'CASH',
            amount: data.paidAmount,
            referenceNumber: data.invoiceNumber,
            supplierId: data.supplierId,
            invoiceNumber: data.invoiceNumber,
            notes: `Initial payment for Purchase Invoice: ${data.invoiceNumber}`
          }
        })
      }

      // 3. Process items
      for (const item of data.items) {
        let productId = parseInt(item.productId);

        // New product handling needs organizationId
        if (item.isNewProduct) {
          const newProd = await tx.product.create({
            data: {
              organizationId,
              name: item.productName,
              genericName: item.genericName || null,
              categoryId: parseInt(item.categoryId) || null,
              purchasePrice: parseFloat(item.purchasePrice) || 0,
              salePriceRetail: parseFloat(item.salePriceRetail) || 0,
              salePriceDistribution: parseFloat(item.salePriceDistribution) || 0,
            }
          })
          productId = newProd.id
        }

        // Batch handling
        let batchId: number;
        if (item.batchNumber) {
          let batch = await tx.batch.findUnique({
            where: {
              organizationId_productId_batchNumber: {
                organizationId,
                productId: productId,
                batchNumber: item.batchNumber
              }
            }
          })
          if (!batch) {
            batch = await tx.batch.create({
              data: {
                organizationId,
                productId,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                purchasePrice: parseFloat(item.purchasePrice) || 0
              }
            })
          }
          batchId = batch.id
        } else {
            // Default batch handling needs organizationId
            let defaultBatch = await tx.batch.findFirst({
                where: { organizationId, productId, batchNumber: 'DEFAULT' }
            })
            if (!defaultBatch) {
                defaultBatch = await tx.batch.create({
                    data: {
                        organizationId,
                        productId,
                        batchNumber: 'DEFAULT',
                        purchasePrice: parseFloat(item.purchasePrice) || 0
                    }
                })
            }
            batchId = defaultBatch.id
        }

        // Create Item
        await tx.purchaseInvoiceItem.create({
          data: {
            organizationId,
            invoiceId: invoice.id,
            productId,
            batchId,
            quantity: parseInt(item.quantity) || 0,
            bonus: parseInt(item.bonus) || 0,
            purchasePrice: parseFloat(item.purchasePrice) || 0,
            subtotal: parseFloat(item.subtotal) || 0
          }
        })

        // Stock update
        const stock = await tx.stock.findUnique({
          where: {
            organizationId_warehouseId_productId_batchId: {
              organizationId,
              warehouseId: data.warehouseId,
              productId,
              batchId
            }
          }
        })

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id, organizationId },
            data: { quantity: { increment: (parseInt(item.quantity) || 0) + (parseInt(item.bonus) || 0) } }
          })
        } else {
          await tx.stock.create({
            data: {
              organizationId,
              warehouseId: data.warehouseId,
              productId,
              batchId,
              quantity: (parseInt(item.quantity) || 0) + (parseInt(item.bonus) || 0)
            }
          })
        }
      }

      // 4. Ledger
      const lastEntry = await tx.supplierLedgerEntry.findFirst({
        where: { supplierId: data.supplierId, organizationId },
        orderBy: { date: 'desc' }
      })

      await tx.supplierLedgerEntry.create({
        data: {
          organizationId,
          supplierId: data.supplierId,
          type: 'CREDIT',
          amount: data.netAmount,
          description: `Purchase Invoice: ${data.invoiceNumber}`,
          referenceId: data.invoiceNumber,
          balance: (lastEntry?.balance || 0) + data.netAmount
        }
      })

      if (data.paidAmount > 0) {
        const lastEntryAfterInvoice = await tx.supplierLedgerEntry.findFirst({
          where: { supplierId: data.supplierId, organizationId },
          orderBy: { date: 'desc' }
        })
        
        await tx.supplierLedgerEntry.create({
          data: {
            organizationId,
            supplierId: data.supplierId,
            type: 'DEBIT',
            amount: data.paidAmount,
            description: `Payment for Invoice: ${data.invoiceNumber}`,
            referenceId: data.invoiceNumber,
            balance: (lastEntryAfterInvoice?.balance || 0) - data.paidAmount
          }
        })
      }

      return invoice
    })

    revalidatePath('/purchases')
    revalidatePath('/stock')
    return { success: true, invoice: result }
  } catch (error: any) {
    console.error('Purchase creation error:', error)
    return { success: false, error: error.message }
  }
}

export async function updatePurchaseInvoice(invoiceId: number, data: any) {
  try {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    const organizationId = session.organizationId;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the existing invoice with its items
      const oldInvoice = await tx.purchaseInvoice.findUnique({
        where: { id: invoiceId, organizationId },
        include: { items: true }
      });
      if (!oldInvoice) throw new Error('Invoice not found');

      const oldNetAmount = oldInvoice.netAmount;
      const warehouseId = data.warehouseId || oldInvoice.warehouseId;

      // 2. REVERSE old items' stock (decrement)
      for (const oldItem of oldInvoice.items) {
        const totalQty = oldItem.quantity + oldItem.bonus;
        if (totalQty > 0) {
          await tx.stock.update({
            where: {
              organizationId_warehouseId_productId_batchId: {
                organizationId,
                warehouseId: oldInvoice.warehouseId,
                productId: oldItem.productId,
                batchId: oldItem.batchId
              }
            },
            data: { quantity: { decrement: totalQty } }
          });
        }
      }

      // 3. Delete all old PurchaseInvoiceItems (cascade-safe since we already reversed stock)
      await tx.purchaseInvoiceItem.deleteMany({
        where: { invoiceId, organizationId }
      });

      // 4. Process new items: create batches, items, and increment stock
      for (const item of data.items) {
        let productId = parseInt(item.productId);

        // Handle new product creation
        if (item.isNewProduct) {
          const newProd = await tx.product.create({
            data: {
              organizationId,
              name: item.productName,
              genericName: item.genericName || null,
              categoryId: parseInt(item.categoryId) || null,
              purchasePrice: parseFloat(item.purchasePrice) || 0,
              salePriceRetail: parseFloat(item.salePriceRetail) || 0,
              salePriceDistribution: parseFloat(item.salePriceDistribution) || 0,
            }
          });
          productId = newProd.id;
        }

        // Batch resolution
        let batchId: number;
        if (item.batchNumber) {
          let batch = await tx.batch.findUnique({
            where: {
              organizationId_productId_batchNumber: {
                organizationId,
                productId,
                batchNumber: item.batchNumber
              }
            }
          });
          if (!batch) {
            batch = await tx.batch.create({
              data: {
                organizationId,
                productId,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                purchasePrice: parseFloat(item.purchasePrice) || 0
              }
            });
          } else if (item.expiryDate && !batch.expiryDate) {
            // Update batch expiry if it was missing and user is now providing it
            await tx.batch.update({
              where: { id: batch.id },
              data: { expiryDate: new Date(item.expiryDate) }
            });
          }
          batchId = batch.id;
        } else {
          let defaultBatch = await tx.batch.findFirst({
            where: { organizationId, productId, batchNumber: 'DEFAULT' }
          });
          if (!defaultBatch) {
            defaultBatch = await tx.batch.create({
              data: {
                organizationId,
                productId,
                batchNumber: 'DEFAULT',
                purchasePrice: parseFloat(item.purchasePrice) || 0
              }
            });
          }
          batchId = defaultBatch.id;
        }

        // Create new PurchaseInvoiceItem
        await tx.purchaseInvoiceItem.create({
          data: {
            organizationId,
            invoiceId,
            productId,
            batchId,
            quantity: parseInt(item.quantity) || 0,
            bonus: parseInt(item.bonus) || 0,
            purchasePrice: parseFloat(item.purchasePrice) || 0,
            subtotal: parseFloat(item.subtotal) || 0
          }
        });

        // Increment stock for new item
        const totalQty = (parseInt(item.quantity) || 0) + (parseInt(item.bonus) || 0);
        const stock = await tx.stock.findUnique({
          where: {
            organizationId_warehouseId_productId_batchId: {
              organizationId,
              warehouseId,
              productId,
              batchId
            }
          }
        });

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { increment: totalQty } }
          });
        } else {
          await tx.stock.create({
            data: { organizationId, warehouseId, productId, batchId, quantity: totalQty }
          });
        }
      }

      // 5. Calculate new totals
      const newNetAmount = data.netAmount;
      const existingPaidAmount = oldInvoice.paidAmount;

      // Determine new status based on existing paid amount vs new net amount
      let newStatus: string;
      if (existingPaidAmount >= newNetAmount) {
        newStatus = 'PAID';
      } else if (existingPaidAmount > 0) {
        newStatus = 'PARTIAL';
      } else {
        newStatus = 'UNPAID';
      }

      // 6. Update the Invoice record (paidAmount stays unchanged!)
      await tx.purchaseInvoice.update({
        where: { id: invoiceId },
        data: {
          supplierId: data.supplierId,
          supplierPhone: data.supplierPhone || null,
          warehouseId,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: new Date(data.invoiceDate),
          totalAmount: data.totalAmount,
          discount: data.discount,
          netAmount: newNetAmount,
          status: newStatus
          // NOTE: paidAmount is NOT modified during edit
        }
      });

      // 7. Ledger adjustment — only if the net amount actually changed
      const amountDifference = newNetAmount - oldNetAmount;
      if (Math.abs(amountDifference) > 0.01) {
        const lastEntry = await tx.supplierLedgerEntry.findFirst({
          where: { supplierId: data.supplierId, organizationId },
          orderBy: { date: 'desc' }
        });

        if (amountDifference > 0) {
          // Invoice total increased — supplier is owed more (CREDIT)
          await tx.supplierLedgerEntry.create({
            data: {
              organizationId,
              supplierId: data.supplierId,
              type: 'CREDIT',
              amount: amountDifference,
              description: `Edit Adjustment (increase) for Invoice: ${data.invoiceNumber}`,
              referenceId: data.invoiceNumber,
              balance: (lastEntry?.balance || 0) + amountDifference
            }
          });
        } else {
          // Invoice total decreased — supplier is owed less (DEBIT)
          await tx.supplierLedgerEntry.create({
            data: {
              organizationId,
              supplierId: data.supplierId,
              type: 'DEBIT',
              amount: Math.abs(amountDifference),
              description: `Edit Adjustment (decrease) for Invoice: ${data.invoiceNumber}`,
              referenceId: data.invoiceNumber,
              balance: (lastEntry?.balance || 0) + amountDifference
            }
          });
        }
      }

      // 8. Audit
      await createAuditLog(tx, organizationId, session.id, 'UPDATE', 'PurchaseInvoice', invoiceId,
        `Edited invoice ${data.invoiceNumber}. Old total: ${oldNetAmount}, New total: ${newNetAmount}`
      );

      return { id: invoiceId };
    });

    revalidatePath('/purchases');
    revalidatePath('/stock');
    revalidatePath('/dashboard');
    return { success: true, invoice: result };
  } catch (error: any) {
    console.error('Purchase update error:', error);
    return { success: false, error: error.message };
  }
}

export async function recordPurchasePayment(invoiceId: number, amount: number, paymentMethod: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    const organizationId = session.organizationId;

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: invoiceId, organizationId }
      });

      if (!invoice) throw new Error('Invoice not found');

      if (amount + invoice.paidAmount > invoice.netAmount) {
        throw new Error('Total payment exceeds invoice net amount');
      }

      const newPaidAmount = invoice.paidAmount + amount;
      const newStatus = newPaidAmount >= invoice.netAmount ? 'PAID' : 'PARTIAL';

      // Update Invoice
      await tx.purchaseInvoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaidAmount, status: newStatus }
      });

      // Create Payment Record
      await tx.payment.create({
        data: {
          organizationId,
          branchId: invoice.branchId,
          date: new Date(),
          type: 'PURCHASE',
          paymentMethod,
          amount,
          referenceNumber: invoice.invoiceNumber,
          supplierId: invoice.supplierId,
          invoiceNumber: invoice.invoiceNumber,
          notes: `Additional payment for Purchase Invoice: ${invoice.invoiceNumber}`
        }
      });

      // Update Ledger
      const lastEntry = await tx.supplierLedgerEntry.findFirst({
        where: { supplierId: invoice.supplierId, organizationId },
        orderBy: { date: 'desc' }
      });

      await tx.supplierLedgerEntry.create({
        data: {
          organizationId,
          supplierId: invoice.supplierId,
          type: 'DEBIT',
          amount,
          description: `Payment for Invoice: ${invoice.invoiceNumber}`,
          referenceId: invoice.invoiceNumber,
          balance: (lastEntry?.balance || 0) - amount
        }
      });

      return { newPaidAmount, newStatus };
    });

    revalidatePath('/purchases');
    revalidatePath('/dashboard');
    return { success: true, result };
  } catch (error: any) {
    console.error('Record payment error:', error);
    return { success: false, error: error.message };
  }
}
