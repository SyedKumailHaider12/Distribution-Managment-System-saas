import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/productService';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // 1. Get products from DB, scoped by organizationId
    const dbProducts = await prisma.product.findMany({
      where: {
        organizationId: session.organizationId,
        OR: [
          { name: { contains: query } },
          { genericName: { contains: query } }
        ]
      },
      take: 10,
      include: { category: true }
    });

    // 2. Get products from Excel scoped by organizationId
    const allMasterProducts = await getProducts(session.organizationId); 
    const filteredMaster = allMasterProducts
      .filter((p: any) => 
        (p.Name && p.Name.toLowerCase().includes(query)) || 
        (p['GenericName/Formula'] && p['GenericName/Formula'].toLowerCase().includes(query))
      )
      .slice(0, 20); // Limit to 20 suggestions

    // Combine results
    const results = [
      ...dbProducts.map(p => ({
        id: p.id,
        name: p.name,
        genericName: p.genericName,
        categoryId: p.categoryId,
        source: 'db'
      })),
      ...filteredMaster.map((p: any) => ({
        name: p.Name,
        genericName: p['GenericName/Formula'],
        categoryName: p.Category,
        source: 'excel'
      }))
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error("Product search error:", error);
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}
