"use server";

import prisma from '../prisma';
import { getSession } from '../auth';

/**
 * Records a payment from a customer and updates their ledger balance.
 */
export async function receiveCustomerPayment(data: {
  branchId: number;
  customerId: number;
  amount: number;
  paymentMethod: string;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.$transaction(async (tx) => {
    // 1. Create the Payment record
    const payment = await tx.payment.create({
      data: {
        branchId: data.branchId,
        customerId: data.customerId,
        type: 'INCOMING',
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        notes: data.notes,
        organizationId: session.organizationId,
      }
    });

    // 2. Get current Customer balance (sum of all entries)
    // Positive balance = they owe us. Negative = we owe them.
    // Wait, the ledger needs a running balance.
    const lastEntry = await tx.customerLedgerEntry.findFirst({
      where: { customerId: data.customerId },
      orderBy: { id: 'desc' }
    });

    const currentBalance = lastEntry ? lastEntry.balance : 0;
    
    // Receipt reduces what they owe us, so balance decreases.
    const newBalance = currentBalance - data.amount;

    // 3. Create the Ledger Entry
    const ledgerEntry = await tx.customerLedgerEntry.create({
      data: {
        customerId: data.customerId,
        type: 'CREDIT', // Credit to customer account
        amount: data.amount,
        description: `Payment Received via ${data.paymentMethod}`,
        referenceId: `PAY-${payment.id}`,
        balance: newBalance,
        organizationId: session.organizationId,
      }
    });

    return { payment, ledgerEntry };
  });
}

/**
 * Records a payment made to a supplier and updates their ledger balance.
 */
export async function makeSupplierPayment(data: {
  branchId: number;
  supplierId: number;
  amount: number;
  paymentMethod: string;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.$transaction(async (tx) => {
    // 1. Create Payment record
    const payment = await tx.payment.create({
      data: {
        branchId: data.branchId,
        supplierId: data.supplierId,
        type: 'OUTGOING',
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        notes: data.notes,
        organizationId: session.organizationId,
      }
    });

    // 2. Calculate running balance
    // Positive balance = we owe them.
    const lastEntry = await tx.supplierLedgerEntry.findFirst({
      where: { supplierId: data.supplierId },
      orderBy: { id: 'desc' }
    });

    const currentBalance = lastEntry ? lastEntry.balance : 0;
    
    // Payment decreases what we owe them.
    const newBalance = currentBalance - data.amount;

    // 3. Create Ledger Entry
    const ledgerEntry = await tx.supplierLedgerEntry.create({
      data: {
        supplierId: data.supplierId,
        type: 'DEBIT', // Debit supplier account
        amount: data.amount,
        description: `Payment Made via ${data.paymentMethod}`,
        referenceId: `PAY-${payment.id}`,
        balance: newBalance,
        organizationId: session.organizationId,
      }
    });

    return { payment, ledgerEntry };
  });
}
