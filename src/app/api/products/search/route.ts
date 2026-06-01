import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/productService';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim().toLowerCase() || '';

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Run DB query and Excel cache lookup in parallel
    const [dbProducts, allMasterProducts] = await Promise.all([
      prisma.product.findMany({
        where: {
          organizationId: session.organizationId,
          OR: [
            { name: { contains: query } },
            { genericName: { contains: query } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          genericName: true,
          categoryId: true,
        },
      }),
      // getProducts returns from in-memory cache after first load — very fast
      getProducts(session.organizationId),
    ]);

    // Filter Excel products in-memory (cache is already loaded)
    const filteredMaster = allMasterProducts
      .filter((p: any) => {
        const name = (p.Name || '').toLowerCase();
        const generic = (p['GenericName/Formula'] || '').toLowerCase();
        return name.includes(query) || generic.includes(query);
      })
      .slice(0, 20);

    // Combine: DB results first (they have IDs and are confirmed in stock),
    // then Excel suggestions for new products
    const results = [
      ...dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        genericName: p.genericName,
        categoryId: p.categoryId,
        source: 'db' as const,
      })),
      ...filteredMaster.map((p: any) => ({
        name: p.Name,
        genericName: p['GenericName/Formula'],
        categoryName: p.Category,
        source: 'excel' as const,
      })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 });
  }
}
