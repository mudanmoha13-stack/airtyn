import { PrismaClient } from '@/generated/business-client';

declare global {
  // eslint-disable-next-line no-var
  var __pinkplanBusinessPrisma__: PrismaClient | undefined;
}

export const businessPrisma =
  global.__pinkplanBusinessPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__pinkplanBusinessPrisma__ = businessPrisma;
}

export const BUSINESS_DEFAULT_TENANT_ID = process.env.BUSINESS_DEFAULT_TENANT_ID ?? 'biz-demo-tenant';

export async function ensureBusinessTenant() {
  const existing = await businessPrisma.tenant.findUnique({ where: { id: BUSINESS_DEFAULT_TENANT_ID } });
  if (existing) return existing;

  return businessPrisma.tenant.create({
    data: {
      id: BUSINESS_DEFAULT_TENANT_ID,
      name: 'Business Demo Tenant',
      status: 'active',
    },
  });
}

export async function ensureInventoryWarehouse(tenantId: string, warehouseName: string) {
  const existing = await businessPrisma.invWarehouse.findFirst({
    where: { tenantId, name: warehouseName },
  });

  if (existing) return existing;

  return businessPrisma.invWarehouse.create({
    data: {
      tenantId,
      name: warehouseName,
      region: 'default',
    },
  });
}

export async function ensureInventoryProduct(tenantId: string, sku: string, productName?: string) {
  const existing = await businessPrisma.invProduct.findFirst({
    where: { tenantId, sku },
  });

  if (existing) return existing;

  return businessPrisma.invProduct.create({
    data: {
      tenantId,
      name: productName ?? sku,
      sku,
      productType: 'physical',
      category: 'general',
      lifecycle: 'active',
    },
  });
}
