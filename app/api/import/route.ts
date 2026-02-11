import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { verifyCsrfToken } from "@/lib/csrf";

// VULN-08 fix: Define strict schemas for imported entities to whitelist fields
const importCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  sortingOrder: z.number().int().min(0),
});

const importMenuItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  category: z.string().min(1),
  isVeg: z.boolean().optional().default(true),
  dineIn: z.boolean().optional().default(true),
  takeAway: z.boolean().optional().default(true),
  homeDelivery: z.boolean().optional().default(true),
  aggregators: z.boolean().optional().default(true),
  image: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  modifiers: z.unknown().optional(),
  stockQuantity: z.number().int().nullable().optional(),
  lowStockThreshold: z.number().int().nullable().optional(),
  available: z.boolean().optional().default(true),
});

const importTableSchema = z.object({
  tableNumber: z.string().min(1),
  capacity: z.number().int().min(1).optional().default(4),
  status: z.string().optional().default("available"),
});

const ALLOWED_IMPORT_ROLES = ["manager", "waiter", "cashier", "kitchen", "staff"];

const importUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().min(10),
  passcode: z.string().min(4),
  role: z.string().refine((r) => ALLOWED_IMPORT_ROLES.includes(r), {
    message: "Invalid role for import",
  }),
  status: z.string().optional().default("active"),
});

// POST /api/import - Import restaurant data from JSON backup
export async function POST(request: Request) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const session = await getApiSession(request);
  const body = await request.json();

  const { restaurantId, data, merge = false, confirm = false } = body;

  if (!restaurantId || !data) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // SEC: Only admins can import data (destructive operation)
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: "Only admins can import data" }, { status: 403 });
  }

  try {
    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // If not merging, require confirmation and show what will be deleted
    if (!merge) {
      const existingCounts = await Promise.all([
        prisma.category.count({ where: { restaurantId } }),
        prisma.menuItem.count({ where: { restaurantId } }),
        prisma.order.count({ where: { restaurantId } }),
        prisma.table.count({ where: { restaurantId } }),
        prisma.user.count({ where: { restaurantId, role: { not: "admin" } } }),
        prisma.reservation.count({ where: { restaurantId } }),
        prisma.inventoryItem.count({ where: { restaurantId } }),
        prisma.expense.count({ where: { restaurantId } }),
        prisma.customer.count({ where: { restaurantId } }),
      ]);

      const willDelete = {
        categories: existingCounts[0],
        menuItems: existingCounts[1],
        orders: existingCounts[2],
        tables: existingCounts[3],
        users: existingCounts[4],
        reservations: existingCounts[5],
        inventoryItems: existingCounts[6],
        expenses: existingCounts[7],
        customers: existingCounts[8],
      };

      const totalRecords = existingCounts.reduce((a, b) => a + b, 0);

      if (!confirm && totalRecords > 0) {
        return NextResponse.json({
          requiresConfirmation: true,
          message: `This will DELETE ${totalRecords} existing records before importing. Send again with confirm: true to proceed.`,
          willDelete,
          willImport: {
            categories: data.categories?.length || 0,
            menuItems: data.menuItems?.length || 0,
            tables: data.tables?.length || 0,
            users: data.users?.filter((u: any) => u.role !== "admin")?.length || 0,
          },
        });
      }

      // Confirmed — proceed with deletion
      await prisma.$transaction([
        prisma.category.deleteMany({ where: { restaurantId } }),
        prisma.menuItem.deleteMany({ where: { restaurantId } }),
        prisma.order.deleteMany({ where: { restaurantId } }),
        prisma.table.deleteMany({ where: { restaurantId } }),
        prisma.user.deleteMany({ where: { restaurantId, role: { not: "admin" } } }),
        prisma.reservation.deleteMany({ where: { restaurantId } }),
        prisma.inventoryItem.deleteMany({ where: { restaurantId } }),
        prisma.expense.deleteMany({ where: { restaurantId } }),
        prisma.customer.deleteMany({ where: { restaurantId } }),
      ]);
    }

    // Import data - VULN-08 fix: validate each entity and generate server-side IDs
    const importOps = [];
    const validationErrors: string[] = [];

    if (data.categories?.length) {
      const validCategories = [];
      for (const cat of data.categories) {
        const parsed = importCategorySchema.safeParse(cat);
        if (parsed.success) {
          validCategories.push({
            id: `cat_${crypto.randomUUID()}`,
            ...parsed.data,
            restaurantId,
          });
        } else {
          validationErrors.push(`Category "${cat?.name || "unknown"}": ${parsed.error.issues[0].message}`);
        }
      }
      if (validCategories.length) {
        importOps.push(prisma.category.createMany({ data: validCategories }));
      }
    }

    if (data.menuItems?.length) {
      const validItems = [];
      for (const item of data.menuItems) {
        const parsed = importMenuItemSchema.safeParse(item);
        if (parsed.success) {
          validItems.push({
            id: `item_${crypto.randomUUID()}`,
            ...parsed.data,
            restaurantId,
            modifiers: parsed.data.modifiers ?? Prisma.JsonNull,
          });
        } else {
          validationErrors.push(`MenuItem "${item?.name || "unknown"}": ${parsed.error.issues[0].message}`);
        }
      }
      if (validItems.length) {
        importOps.push(prisma.menuItem.createMany({ data: validItems }));
      }
    }

    if (data.tables?.length) {
      const validTables = [];
      for (const table of data.tables) {
        const parsed = importTableSchema.safeParse(table);
        if (parsed.success) {
          validTables.push({
            id: `table_${crypto.randomUUID()}`,
            ...parsed.data,
            restaurantId,
          });
        } else {
          validationErrors.push(`Table "${table?.tableNumber || "unknown"}": ${parsed.error.issues[0].message}`);
        }
      }
      if (validTables.length) {
        importOps.push(prisma.table.createMany({ data: validTables }));
      }
    }

    if (data.users?.length) {
      // Only import non-admin users
      const nonAdminUsers = data.users.filter((user: any) => user.role !== "admin");
      const validUsers = [];
      for (const user of nonAdminUsers) {
        const parsed = importUserSchema.safeParse(user);
        if (parsed.success) {
          // Hash passcode before storing
          const hashedPasscode = await bcrypt.hash(parsed.data.passcode, 12);
          validUsers.push({
            id: `user_${crypto.randomUUID()}`,
            ...parsed.data,
            passcode: hashedPasscode,
            restaurantId,
            lastLogin: null,
          });
        } else {
          validationErrors.push(`User "${user?.name || "unknown"}": ${parsed.error.issues[0].message}`);
        }
      }
      if (validUsers.length) {
        importOps.push(prisma.user.createMany({ data: validUsers }));
      }
    }

    // Update restaurant settings and nextOrderNumber
    if (data.settings || data.nextOrderNumber) {
      importOps.push(
        prisma.restaurant.update({
          where: { id: restaurantId },
          data: {
            settings: data.settings || {},
            nextOrderNumber: data.nextOrderNumber || 1,
          },
        })
      );
    }

    // Update restaurant store
    importOps.push(
      prisma.restaurantStore.upsert({
        where: { restaurantId },
        update: { data },
        create: { restaurantId, data },
      })
    );

    await prisma.$transaction(importOps);

    return NextResponse.json({
      ok: true,
      imported: true,
      ...(validationErrors.length > 0 && {
        warnings: validationErrors,
        message: `Import completed with ${validationErrors.length} skipped entities due to validation errors`,
      }),
    });
  } catch (error) {
    console.error("Import error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}
