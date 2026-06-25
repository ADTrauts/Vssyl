import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import {
  resolveTierSubscriptionAmount,
  sumKnownSubscriptionAmounts,
} from './subscriptionDisplayAmount';

/** Detect Prisma errors from missing columns (production DB schema drift) */
function isSchemaDriftError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    return msg.includes('does not exist in the current database');
  }

function toSafeNumber(value: number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const converted = Number(value);
    return Number.isFinite(converted) ? converted : 0;
  }

export async function getSubscriptions(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    try {
      const [subscriptions, total, aggregates, statusGroups] = await Promise.all([
        prisma.subscription.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { email: true, name: true }
            }
          }
        }),
        prisma.subscription.count({ where }),
        prisma.subscription.aggregate({
          where,
          _sum: { additionalEmployeeCost: true },
          _count: { id: true },
        }),
        prisma.subscription.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
        }),
      ]);

      const statusCounts = statusGroups.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = row._count.id;
        return acc;
      }, {});

      const resolvedAmounts = subscriptions.map((sub) =>
        resolveTierSubscriptionAmount({
          tier: sub.tier,
          stripeMetadata: sub.stripeMetadata,
        }),
      );
      const { knownTotal, unknownCount } = sumKnownSubscriptionAmounts(resolvedAmounts);

      return {
        subscriptions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        schemaOutOfSync: false,
        summary: {
          activeCount: statusCounts.active || 0,
          pastDueCount: statusCounts.past_due || 0,
          cancelledCount: statusCounts.cancelled || 0,
          unpaidCount: statusCounts.unpaid || 0,
          totalAmount: knownTotal,
          estimatedMonthlyAmount: knownTotal,
          subscriptionsWithUnknownAmount: unknownCount,
          totalSubscriptions: toSafeNumber(aggregates._count.id),
        },
      };
    } catch (error) {
      if (isSchemaDriftError(error)) {
        await logger.warn('Subscriptions query failed (schema drift)', {
          operation: 'admin_get_subscriptions',
          message: error instanceof Error ? error.message : String(error)
        });
        return {
          subscriptions: [],
          total: 0,
          page,
          totalPages: 0,
          schemaOutOfSync: true,
          summary: {
            activeCount: 0,
            pastDueCount: 0,
            cancelledCount: 0,
            unpaidCount: 0,
            totalAmount: 0,
            estimatedMonthlyAmount: 0,
            subscriptionsWithUnknownAmount: 0,
            totalSubscriptions: 0,
          },
        };
      }
      throw error;
    }
  }

  // Note: Payment model was removed, so we'll return empty data for now
export async function getPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    try {
      const { page = 1, limit = 20, status } = params;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const [payments, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            subscription: {
              include: { user: true }
            },
            moduleSubscription: {
              include: { 
                user: true,
                module: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.invoice.count({ where })
      ]);

      // Add Stripe URLs to each payment
      const { StripeSyncService } = await import('../stripeSyncService.js');
      
      return {
        payments: payments.map(payment => {
          const stripeUrls = {
            invoice: StripeSyncService.getStripeInvoiceUrl(payment.stripeInvoiceId),
            charge: payment.stripeChargeId
              ? `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test'}/payments/${payment.stripeChargeId}`
              : null,
            customer: StripeSyncService.getStripeCustomerUrl(payment.stripeCustomerId)
          };

          return {
            id: payment.id,
            subscriptionId: payment.subscriptionId,
            moduleSubscriptionId: payment.moduleSubscriptionId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            createdAt: payment.createdAt.toISOString(),
            paidAt: payment.paidAt?.toISOString(),
            customerEmail: payment.subscription?.user?.email || payment.moduleSubscription?.user?.email || 'Unknown',
            stripeInvoiceId: payment.stripeInvoiceId,
            stripeChargeId: payment.stripeChargeId,
            stripeFee: payment.stripeFee,
            stripeNetAmount: payment.stripeNetAmount,
            refundAmount: payment.refundAmount,
            refundCount: payment.refundCount,
            lastSyncedAt: payment.lastSyncedAt?.toISOString(),
            stripeUrls,
            metadata: payment.stripeMetadata || {}
          };
        }),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        schemaOutOfSync: false
      };
    } catch (error) {
      if (isSchemaDriftError(error)) {
        await logger.warn('Payments query failed (schema drift)', {
          operation: 'admin_get_payments',
          message: error instanceof Error ? error.message : String(error)
        });
        return {
          payments: [],
          total: 0,
          page: params.page ?? 1,
          totalPages: 0,
          schemaOutOfSync: true
        };
      }
      await logger.error('Failed to get payments', {
        operation: 'admin_get_payments',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }

export async function getDeveloperPayouts(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    try {
      const { page = 1, limit = 20, status } = params;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (status) where.payoutStatus = status;

      const [payouts, total, payoutAggregates, payoutStatusGroups] = await Promise.all([
        prisma.developerRevenue.findMany({
          where,
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            module: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.developerRevenue.count({ where }),
        prisma.developerRevenue.aggregate({
          where,
          _sum: {
            totalRevenue: true,
            platformRevenue: true,
            developerRevenue: true,
          },
        }),
        prisma.developerRevenue.groupBy({
          by: ['payoutStatus'],
          where,
          _sum: { developerRevenue: true },
          _count: { id: true },
        }),
      ]);

      const payoutStatusSummary = payoutStatusGroups.reduce<
        Record<string, { count: number; amount: number }>
      >((acc, row) => {
        acc[row.payoutStatus] = {
          count: row._count.id,
          amount: toSafeNumber(row._sum.developerRevenue),
        };
        return acc;
      }, {});

      return {
        payouts: payouts.map(payout => ({
          id: payout.id,
          developerId: payout.developerId,
          developerName: payout.developer?.name || payout.developer?.email || 'Unknown Developer',
          developerEmail: payout.developer?.email || 'Unknown',
          moduleName: payout.module?.name || 'Unknown Module',
          amount: payout.developerRevenue,
          totalRevenue: payout.totalRevenue,
          platformRevenue: payout.platformRevenue,
          status: payout.payoutStatus,
          requestedAt: payout.createdAt.toISOString(),
          paidAt: payout.payoutDate?.toISOString(),
          periodStart: payout.periodStart.toISOString(),
          periodEnd: payout.periodEnd.toISOString()
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        schemaOutOfSync: false,
        summary: {
          pendingCount: payoutStatusSummary.pending?.count || 0,
          paidCount: payoutStatusSummary.paid?.count || 0,
          failedCount: payoutStatusSummary.failed?.count || 0,
          pendingAmount: payoutStatusSummary.pending?.amount || 0,
          paidAmount: payoutStatusSummary.paid?.amount || 0,
          failedAmount: payoutStatusSummary.failed?.amount || 0,
          totalRevenue: toSafeNumber(payoutAggregates._sum.totalRevenue),
          totalPlatformRevenue: toSafeNumber(payoutAggregates._sum.platformRevenue),
          totalDeveloperRevenue: toSafeNumber(payoutAggregates._sum.developerRevenue),
        },
      };
    } catch (error) {
      if (isSchemaDriftError(error)) {
        await logger.warn('Developer payouts query failed (schema drift)', {
          operation: 'admin_get_developer_payouts',
          message: error instanceof Error ? error.message : String(error)
        });
        return {
          payouts: [],
          total: 0,
          page: params.page ?? 1,
          totalPages: 0,
          schemaOutOfSync: true,
          summary: {
            pendingCount: 0,
            paidCount: 0,
            failedCount: 0,
            pendingAmount: 0,
            paidAmount: 0,
            failedAmount: 0,
            totalRevenue: 0,
            totalPlatformRevenue: 0,
            totalDeveloperRevenue: 0,
          },
        };
      }
      await logger.error('Failed to get developer payouts', {
        operation: 'admin_get_developer_payouts',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw error;
    }
  }

  // ============================================================================

export async function getEnhancedSubscription(id: string) {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      business: { select: { name: true } },
      invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
}

export async function getEnhancedInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      subscription: { include: { user: { select: { email: true, name: true } } } },
      moduleSubscription: { include: { user: { select: { email: true, name: true } } } },
      refunds: { orderBy: { createdAt: 'desc' } },
    },
  });
}
