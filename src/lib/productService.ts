import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

/**
 * In-memory cache for Excel product data.
 * Keyed by organizationId. Each entry stores the parsed rows,
 * the file mtime at parse time, and the absolute path used.
 * Cache is invalidated when the file changes on disk.
 */
interface CacheEntry {
  products: any[];
  mtime: number;
  filePath: string;
}

const excelCache = new Map<number, CacheEntry>();

/**
 * Returns the parsed Excel product list for an organization.
 * Reads from disk only on first call or when the file has changed.
 * Subsequent calls return the cached in-memory array instantly.
 */
export async function getProducts(organizationId: number): Promise<any[]> {
  const settings = await prisma.settings.findUnique({
    where: { organizationId },
  });

  // Use API if configured — no caching needed for external APIs
  if (settings && settings.useApi && settings.apiUrl) {
    const response = await fetch(settings.apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch products from API: ${response.statusText}`);
    }
    return response.json();
  }

  // Resolve Excel file path
  const excelPath = settings?.excelPath ?? 'src/data/Products.xlsx';
  const absolutePath = path.resolve(process.cwd(), excelPath);

  if (!fs.existsSync(absolutePath)) {
    console.warn(`Excel file not found at ${absolutePath}, returning empty list.`);
    return [];
  }

  // Check file modification time
  let mtime: number;
  try {
    mtime = fs.statSync(absolutePath).mtimeMs;
  } catch {
    mtime = 0;
  }

  // Return cached data if file hasn't changed
  const cached = excelCache.get(organizationId);
  if (cached && cached.filePath === absolutePath && cached.mtime === mtime) {
    return cached.products;
  }

  // Parse the Excel file
  try {
    const fileBuffer = fs.readFileSync(absolutePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const products = jsonData.map((item: any) => ({
      ...item,
      Name: item['Name'] || '',
      'GenericName/Formula': item['GenericName/Formula'] || '',
      Category: item['Catgory'] || '',
    }));

    // Store in cache
    excelCache.set(organizationId, { products, mtime, filePath: absolutePath });

    console.log(`[productService] Loaded ${products.length} products from Excel for org ${organizationId}`);
    return products;
  } catch (error: any) {
    console.error(`ERROR: Access denied to Excel file at ${absolutePath}. Details:`, error.message);
    console.warn("ADVICE: Please close 'Products.xlsx' if it is open in Excel.");
    return [];
  }
}

/**
 * Clears the Excel cache for a specific organization (or all orgs).
 * Call this after uploading a new Excel file.
 */
export function clearProductCache(organizationId?: number) {
  if (organizationId !== undefined) {
    excelCache.delete(organizationId);
  } else {
    excelCache.clear();
  }
}
