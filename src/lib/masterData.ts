// src/lib/masterData.ts

import { delay } from './api'; // reuse delay helper

export const fetchCompanies = async (): Promise<Array<{ name: string; address: string; phone: string }>> => {
  await delay(200);
  return [
    { name: 'AzanTech Ltd.', address: '123 Main St, City', phone: '+1 555-0100' },
    { name: 'HealthCorp', address: '456 Health Ave, Town', phone: '+1 555-0200' },
  ];
};

export const fetchBrands = async (): Promise<Array<{ name: string; description: string }>> => {
  await delay(200);
  return [
    { name: 'MediPlus', description: 'Quality medicines' },
    { name: 'CareSoft', description: 'Gentle skin care' },
  ];
};

export const fetchCategories = async (): Promise<Array<{ name: string; description: string }>> => {
  await delay(200);
  return [
    { name: 'Medicines', description: 'Prescription and OTC' },
    { name: 'Cosmetics', description: 'Beauty products' },
  ];
};

export const fetchWarehouses = async (): Promise<Array<{ name: string; location: string; capacity: number }>> => {
  await delay(200);
  return [
    { name: 'Main Warehouse', location: 'Industrial Zone', capacity: 5000 },
    { name: 'Shop', location: 'Downtown', capacity: 800 },
  ];
};

export const fetchProducts = async (): Promise<Array<{ name: string; brand: string; price: number; stock: number }>> => {
  await delay(200);
  return [
    { name: 'Paracetamol 500mg', brand: 'MediPlus', price: 2.5, stock: 120 },
    { name: 'Hand Wash', brand: 'CareSoft', price: 3.0, stock: 200 },
  ];
};
