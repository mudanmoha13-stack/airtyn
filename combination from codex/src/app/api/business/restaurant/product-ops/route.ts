import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminFirestore } from '@/lib/server/firebase-admin';
import { col, ensureBusinessTenantDoc, makeId, nowIso } from '@/lib/server/firestore-data';
import { resolveBusinessOwnerEmail, resolveBusinessTenantId } from '@/lib/server/business-tenant';

const baseSchema = z.object({
  entityType: z.enum([
    'menu',
    'menu_item',
    'modifier',
    'modifier_option',
    'recipe',
    'recipe_component',
    'pricing_rule',
    'availability_rule',
    'waste_log',
    'replenishment',
    'stock_move',
  ]),
});

const createSchema = z.discriminatedUnion('entityType', [
  baseSchema.extend({
    entityType: z.literal('menu'),
    name: z.string().min(1),
    branchId: z.string().optional(),
    serviceWindow: z.string().optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
  }),
  baseSchema.extend({
    entityType: z.literal('menu_item'),
    menuId: z.string().min(1),
    productId: z.string().min(1),
    branchId: z.string().optional(),
    priceOverride: z.number().nonnegative().optional(),
    displayOrder: z.number().int().min(0).optional(),
    featured: z.boolean().optional(),
    recommended: z.boolean().optional(),
    availabilityMode: z.enum(['always', 'scheduled', 'out_of_stock']).optional(),
  }),
  baseSchema.extend({
    entityType: z.literal('modifier'),
    name: z.string().min(1),
    required: z.boolean().optional(),
    maxSelection: z.number().int().min(1).optional(),
    kitchenInstruction: z.string().optional(),
  }),
  baseSchema.extend({
    entityType: z.literal('modifier_option'),
    modifierId: z.string().min(1),
    name: z.string().min(1),
    priceDelta: z.number().optional(),
    isDefault: z.boolean().optional(),
  }),
  baseSchema.extend({
    entityType: z.literal('recipe'),
    productId: z.string().min(1),
    yieldQuantity: z.number().positive().optional(),
    yieldUomId: z.string().optional(),
    prepMode: z.enum(['cook_to_order', 'prep_batch', 'sub_recipe']).optional(),
    notes: z.string().optional(),
  }),
  baseSchema.extend({
    entityType: z.literal('recipe_component'),
    recipeId: z.string().min(1),
    ingredientId: z.string().min(1),
    quantity: z.number().positive(),
    uomId: z.string().optional(),
    station: z.string().optional(),
    wasteFactor: z.number().min(0).optional(),
  }),
  baseSchema.extend({
    entityType: z.literal('pricing_rule'),
    productId: z.string().min(1),
    branchId: z.string().optional(),
    channel: z.enum(['dine_in', 'takeaway', 'delivery', 'all']).optional(),
    price: z.number().nonnegative(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    status: z.enum(['active', 'scheduled', 'inactive']).optional(),
  }),
  baseSchema.extend({
    entityType: z.literal('availability_rule'),
    productId: z.string().min(1),
    branchId: z.string().optional(),
    daypart: z.string().optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    stockBasedDisable: z.boolean().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
  baseSchema.extend({
    entityType: z.literal('waste_log'),
    productId: z.string().min(1),
    branchId: z.string().optional(),
    quantity: z.number().positive(),
    reason: z.string().min(1),
    costImpact: z.number().nonnegative().optional(),
    station: z.string().optional(),
    loggedBy: z.string().optional(),
  }),
  baseSchema.extend({
    entityType: z.literal('replenishment'),
    branchId: z.string().optional(),
    componentProductId: z.string().min(1),
    reorderPoint: z.number().nonnegative().optional(),
    suggestedQty: z.number().positive().optional(),
    status: z.enum(['pending', 'approved', 'ordered']).optional(),
  }),
  baseSchema.extend({
    entityType: z.literal('stock_move'),
    productId: z.string().min(1),
    branchId: z.string().optional(),
    warehouseId: z.string().optional(),
    quantity: z.number(),
    moveType: z.enum(['purchase_receipt', 'consumption', 'transfer', 'adjustment', 'waste', 'return']),
    stockState: z.enum(['on_hand', 'reserved', 'available', 'in_transit']).optional(),
    reference: z.string().optional(),
    fromLocation: z.string().optional(),
    toLocation: z.string().optional(),
  }),
]);

const patchSchema = z.object({
  entityType: z.enum([
    'menu',
    'menu_item',
    'modifier',
    'modifier_option',
    'recipe',
    'recipe_component',
    'pricing_rule',
    'availability_rule',
    'waste_log',
    'replenishment',
    'stock_move',
  ]),
  id: z.string().min(1),
  status: z.string().optional(),
  featured: z.boolean().optional(),
  recommended: z.boolean().optional(),
  priceOverride: z.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const ENTITY_COLLECTIONS = {
  menu: col.bizMenus,
  menu_item: col.bizMenuItems,
  modifier: col.bizModifiers,
  modifier_option: col.bizModifierOptions,
  recipe: col.bizRecipes,
  recipe_component: col.bizRecipeComponents,
  pricing_rule: col.bizProductPricing,
  availability_rule: col.bizProductAvailability,
  waste_log: col.bizWasteLogs,
  replenishment: col.bizRestaurantReplenishment,
  stock_move: col.bizStockMoves,
} as const;

export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));

    const [
      menusSnap,
      menuItemsSnap,
      modifiersSnap,
      modifierOptionsSnap,
      recipesSnap,
      recipeComponentsSnap,
      pricingSnap,
      availabilitySnap,
      wasteSnap,
      replenishmentSnap,
      stockMoveSnap,
      productsSnap,
    ] = await Promise.all([
      adminFirestore.collection(col.bizMenus).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizMenuItems).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizModifiers).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizModifierOptions).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizRecipes).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizRecipeComponents).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizProductPricing).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizProductAvailability).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizWasteLogs).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizRestaurantReplenishment).where('tenantId', '==', tenantId).get(),
      adminFirestore.collection(col.bizStockMoves).where('tenantId', '==', tenantId).limit(200).get(),
      adminFirestore.collection(col.bizProducts).where('tenantId', '==', tenantId).get(),
    ]);

    const products = new Map(productsSnap.docs.map((doc) => [doc.id, doc.data()]));
    const optionsByModifier = new Map<string, Array<Record<string, unknown>>>();
    modifierOptionsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const key = String(data.modifierId ?? '');
      const list = optionsByModifier.get(key) ?? [];
      list.push({ id: doc.id, ...data });
      optionsByModifier.set(key, list);
    });

    const menuItemsByMenu = new Map<string, Array<Record<string, unknown>>>();
    menuItemsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const key = String(data.menuId ?? '');
      const list = menuItemsByMenu.get(key) ?? [];
      const product = products.get(String(data.productId ?? ''));
      list.push({
        id: doc.id,
        ...data,
        product: product
          ? { id: String(data.productId), name: String(product.name ?? ''), sku: String(product.sku ?? '') }
          : null,
      });
      menuItemsByMenu.set(key, list);
    });

    const recipeComponentsByRecipe = new Map<string, Array<Record<string, unknown>>>();
    recipeComponentsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const key = String(data.recipeId ?? '');
      const ingredient = products.get(String(data.ingredientId ?? ''));
      const list = recipeComponentsByRecipe.get(key) ?? [];
      list.push({
        id: doc.id,
        ...data,
        ingredient: ingredient
          ? { id: String(data.ingredientId), name: String(ingredient.name ?? ''), sku: String(ingredient.sku ?? '') }
          : null,
      });
      recipeComponentsByRecipe.set(key, list);
    });

    return NextResponse.json({
      ok: true,
      menus: menusSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        items: menuItemsByMenu.get(doc.id) ?? [],
      })),
      modifiers: modifiersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        options: optionsByModifier.get(doc.id) ?? [],
      })),
      recipes: recipesSnap.docs.map((doc) => {
        const data = doc.data();
        const product = products.get(String(data.productId ?? ''));
        return {
          id: doc.id,
          ...data,
          product: product
            ? { id: String(data.productId), name: String(product.name ?? ''), sku: String(product.sku ?? '') }
            : null,
          components: recipeComponentsByRecipe.get(doc.id) ?? [],
        };
      }),
      pricingRules: pricingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      availabilityRules: availabilitySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      wasteLogs: wasteSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      replenishment: replenishmentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      stockMoves: stockMoveSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to load restaurant product operations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    await ensureBusinessTenantDoc(tenantId, resolveBusinessOwnerEmail(request));
    const payload = createSchema.parse(await request.json());
    const now = nowIso();

    const targetCollection = ENTITY_COLLECTIONS[payload.entityType];
    const id =
      payload.entityType === 'stock_move' && payload.moveType === 'waste'
        ? makeId(col.bizStockMoves)
        : makeId(targetCollection);

    const common = { id, tenantId, createdAt: now, updatedAt: now };
    let record: Record<string, unknown>;

    switch (payload.entityType) {
      case 'menu':
        record = {
          ...common,
          name: payload.name.trim(),
          nameLower: payload.name.trim().toLowerCase(),
          branchId: payload.branchId ?? null,
          serviceWindow: payload.serviceWindow ?? null,
          startsAt: payload.startsAt ?? null,
          endsAt: payload.endsAt ?? null,
          status: payload.status ?? 'draft',
        };
        break;
      case 'menu_item':
        record = {
          ...common,
          menuId: payload.menuId,
          productId: payload.productId,
          branchId: payload.branchId ?? null,
          priceOverride: payload.priceOverride ?? null,
          displayOrder: payload.displayOrder ?? 0,
          featured: payload.featured ?? false,
          recommended: payload.recommended ?? false,
          availabilityMode: payload.availabilityMode ?? 'always',
          status: 'active',
        };
        break;
      case 'modifier':
        record = {
          ...common,
          name: payload.name.trim(),
          nameLower: payload.name.trim().toLowerCase(),
          required: payload.required ?? false,
          maxSelection: payload.maxSelection ?? 1,
          kitchenInstruction: payload.kitchenInstruction ?? null,
          status: 'active',
        };
        break;
      case 'modifier_option':
        record = {
          ...common,
          modifierId: payload.modifierId,
          name: payload.name.trim(),
          nameLower: payload.name.trim().toLowerCase(),
          priceDelta: payload.priceDelta ?? 0,
          isDefault: payload.isDefault ?? false,
          status: 'active',
        };
        break;
      case 'recipe':
        record = {
          ...common,
          productId: payload.productId,
          yieldQuantity: payload.yieldQuantity ?? 1,
          yieldUomId: payload.yieldUomId ?? null,
          prepMode: payload.prepMode ?? 'cook_to_order',
          notes: payload.notes ?? null,
          status: 'active',
        };
        break;
      case 'recipe_component':
        record = {
          ...common,
          recipeId: payload.recipeId,
          ingredientId: payload.ingredientId,
          quantity: payload.quantity,
          uomId: payload.uomId ?? null,
          station: payload.station ?? null,
          wasteFactor: payload.wasteFactor ?? 0,
        };
        break;
      case 'pricing_rule':
        record = {
          ...common,
          productId: payload.productId,
          branchId: payload.branchId ?? null,
          channel: payload.channel ?? 'all',
          price: payload.price,
          startsAt: payload.startsAt ?? null,
          endsAt: payload.endsAt ?? null,
          status: payload.status ?? 'active',
        };
        break;
      case 'availability_rule':
        record = {
          ...common,
          productId: payload.productId,
          branchId: payload.branchId ?? null,
          daypart: payload.daypart ?? null,
          startsAt: payload.startsAt ?? null,
          endsAt: payload.endsAt ?? null,
          stockBasedDisable: payload.stockBasedDisable ?? true,
          status: payload.status ?? 'active',
        };
        break;
      case 'waste_log':
        record = {
          ...common,
          productId: payload.productId,
          branchId: payload.branchId ?? null,
          quantity: payload.quantity,
          reason: payload.reason.trim(),
          costImpact: payload.costImpact ?? null,
          station: payload.station ?? null,
          loggedBy: payload.loggedBy ?? null,
          status: 'logged',
        };
        break;
      case 'replenishment':
        record = {
          ...common,
          branchId: payload.branchId ?? null,
          componentProductId: payload.componentProductId,
          reorderPoint: payload.reorderPoint ?? null,
          suggestedQty: payload.suggestedQty ?? null,
          status: payload.status ?? 'pending',
        };
        break;
      case 'stock_move':
        record = {
          ...common,
          productId: payload.productId,
          branchId: payload.branchId ?? null,
          warehouseId: payload.warehouseId ?? null,
          quantity: payload.quantity,
          moveType: payload.moveType,
          stockState: payload.stockState ?? 'on_hand',
          reference: payload.reference ?? null,
          fromLocation: payload.fromLocation ?? null,
          toLocation: payload.toLocation ?? null,
        };
        break;
    }

    await adminFirestore.collection(targetCollection).doc(id).set(record);

    if (payload.entityType === 'waste_log') {
      const moveId = makeId(col.bizStockMoves);
      await adminFirestore.collection(col.bizStockMoves).doc(moveId).set({
        id: moveId,
        tenantId,
        productId: payload.productId,
        branchId: payload.branchId ?? null,
        quantity: -Math.abs(payload.quantity),
        moveType: 'waste',
        stockState: 'on_hand',
        reference: `waste:${id}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to save restaurant product record' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = resolveBusinessTenantId(request);
    const payload = patchSchema.parse(await request.json());
    const targetCollection = ENTITY_COLLECTIONS[payload.entityType];
    const ref = adminFirestore.collection(targetCollection).doc(payload.id);
    const snapshot = await ref.get();

    if (!snapshot.exists || String(snapshot.data()?.tenantId ?? '') !== tenantId) {
      return NextResponse.json({ ok: false, error: 'Record not found for tenant' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: nowIso() };
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.featured !== undefined) updates.featured = payload.featured;
    if (payload.recommended !== undefined) updates.recommended = payload.recommended;
    if (payload.priceOverride !== undefined) updates.priceOverride = payload.priceOverride;
    if (payload.notes !== undefined) updates.notes = payload.notes;

    await ref.set(updates, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, errors: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to update restaurant product record' },
      { status: 500 }
    );
  }
}
