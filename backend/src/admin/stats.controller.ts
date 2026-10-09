import { Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Roles } from '../common/decorators';
import { PrismaService } from '../prisma.service';
import { orderInclude } from './orders.service';

class RangeQuery {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
class DaysQuery { @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) days = 14; }
class LimitQuery { @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 5; }

const DAY = 86_400_000;
const PAID = ['PAID', 'PARTIALLY_REFUNDED'] as const;

@Roles('ADMIN')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private prisma: PrismaService) {}

  /** CA = encaissements nets des remboursements, sur les commandes passées dans la période (30 jours par défaut). */
  @Get('overview')
  async overview(@Query() q: RangeQuery) {
    const to = q.to ? new Date(q.to) : new Date();
    const from = q.from ? new Date(q.from) : new Date(to.getTime() - 30 * DAY);
    const range = { gte: from, lte: to };
    const [[money], orders, toProcess, customers, newCustomers, items] = await Promise.all([
      this.prisma.$queryRaw<{ revenue: bigint; paidOrders: bigint }[]>`
        SELECT COALESCE(SUM(p."amountCents" - p."refundedCents"), 0)::bigint AS revenue, COUNT(DISTINCT o.id)::bigint AS "paidOrders"
        FROM orders o JOIN payments p ON p."orderId" = o.id
        WHERE p.status IN ('PAID', 'PARTIALLY_REFUNDED') AND o."placedAt" BETWEEN ${from} AND ${to}`,
      this.prisma.order.count({ where: { placedAt: range } }),
      this.prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null, createdAt: { gte: new Date(Date.now() - 7 * DAY) } } }),
      this.prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { order: { placedAt: range, paymentStatus: { in: [...PAID] } } } }),
    ]);
    const revenueCents = Number(money.revenue), paidOrders = Number(money.paidOrders);
    return {
      data: {
        from, to, revenueCents, ordersCount: orders, paidOrders, ordersToProcess: toProcess,
        customersCount: customers, newCustomersLast7Days: newCustomers,
        averageBasketCents: paidOrders ? Math.round(revenueCents / paidOrders) : 0, itemsSold: items._sum.quantity ?? 0,
      },
    };
  }

  /** Une ligne par jour (heure de Casablanca), jours sans vente inclus. */
  @Get('sales-by-day')
  async salesByDay(@Query() q: DaysQuery) {
    const rows = await this.prisma.$queryRaw<{ day: string; revenue: bigint; orders: bigint }[]>`
      WITH days AS (
        SELECT generate_series((now() AT TIME ZONE 'Africa/Casablanca')::date - (${q.days}::int - 1), (now() AT TIME ZONE 'Africa/Casablanca')::date, '1 day')::date AS day
      )
      SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
             COALESCE(SUM(p."amountCents" - p."refundedCents"), 0)::bigint AS revenue,
             COUNT(DISTINCT o.id)::bigint AS orders
      FROM days d
      LEFT JOIN orders o ON (o."placedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Casablanca')::date = d.day
      LEFT JOIN payments p ON p."orderId" = o.id AND p.status IN ('PAID', 'PARTIALLY_REFUNDED')
      GROUP BY d.day ORDER BY d.day`;
    return { data: rows.map((r) => ({ day: r.day, revenueCents: Number(r.revenue), orders: Number(r.orders) })) };
  }

  @Get('top-products')
  async topProducts(@Query() q: LimitQuery) {
    const data = await this.prisma.product.findMany({
      where: { status: { not: 'ARCHIVED' } }, orderBy: { soldCount: 'desc' }, take: q.limit,
      select: { id: true, name: true, sku: true, slug: true, soldCount: true },
    });
    return { data };
  }

  @Get('recent-orders')
  async recentOrders(@Query() q: LimitQuery) {
    const data = await this.prisma.order.findMany({
      orderBy: { placedAt: 'desc' }, take: q.limit,
      select: { id: true, number: true, status: true, totalCents: true, placedAt: true, user: orderInclude.user },
    });
    return { data };
  }

  @Get('low-stock')
  async lowStock() {
    const data = await this.prisma.$queryRaw<{ id: string; name: string; sku: string; stock: number; lowStockThreshold: number }[]>`
      SELECT id, name, sku, stock, "lowStockThreshold" FROM products
      WHERE status <> 'ARCHIVED' AND stock <= "lowStockThreshold" ORDER BY stock, name`;
    return { data };
  }
}
