import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

/**
 * Retrieves the product list for a given company.
 * If Settings.useApi is true, fetches from the configured external API.
 * Otherwise reads the Excel file located at Settings.excelPath (relative to project root).
 */
export async function getProducts(organizationId: number) {
  const settings = await prisma.settings.findUnique({
    where: { organizationId },
  });

  // Use API if configured
  if (settings && settings.useApi && settings.apiUrl) {
    const response = await fetch(settings.apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch products from API: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  }

  // Fallback to local Excel file
  const excelPath = settings?.excelPath ?? 'src/data/Products.xlsx';
  const absolutePath = path.resolve(process.cwd(), excelPath);
  
  if (!fs.existsSync(absolutePath)) {
    console.warn(`Excel file not found at ${absolutePath}, returning empty list.`);
    return [];
  }

  try {
    // Using readFileSync + XLSX.read is often more resilient to locks than XLSX.readFile
    const fileBuffer = fs.readFileSync(absolutePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Use defval to ensure all fields exist, and trim keys just in case
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    // Normalize keys to handle exact user provided headers
    return jsonData.map((item: any) => ({
      ...item,
      // NO., Name, GenericName/Formula, Catgory
      Name: item['Name'] || '',
      'GenericName/Formula': item['GenericName/Formula'] || '',
      Category: item['Catgory'] || ''
    }));
  } catch (error: any) {
    console.error(`ERROR: Access denied to Excel file at ${absolutePath}. Details:`, error.message);
    console.warn("ADVICE: Please close 'Products.xlsx' if it is open in Excel.");
    return [];
  }
}
