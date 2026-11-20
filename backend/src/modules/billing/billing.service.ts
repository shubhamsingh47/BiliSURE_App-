import { SubscriptionPlanModel, ISubscriptionPlan } from '../../models/SubscriptionPlan';
import { HospitalSubscriptionModel, IHospitalSubscription } from '../../models/HospitalSubscription';
import { TestUsageRecordModel, ITestUsageRecord } from '../../models/TestUsageRecord';
import { NotFoundError, BadRequestError } from '../../common/errors';

export class BillingService {
  /**
   * Get simplified test balance for hospital
   */
  static async getBalance(facility: string) {
    if (!['PGI', 'RML', 'KGMU'].includes(facility)) {
      throw new BadRequestError('Test balance accounts exist only for PGI, RML, and KGMU hospitals.');
    }
    const sub = await HospitalSubscriptionModel.findOne({ facility });
    if (!sub) {
      return {
        facility,
        configured: false,
        totalAllocated: 0,
        usedTests: 0,
        remainingTests: 0,
        usagePercent: 0,
      };
    }
    const remaining = Math.max(0, sub.totalAllocatedTests - sub.usedTests);
    const usagePercent = sub.totalAllocatedTests > 0
      ? Math.round((sub.usedTests / sub.totalAllocatedTests) * 100)
      : 0;
    return {
      facility,
      configured: true,
      planName: sub.planName,
      totalAllocated: sub.totalAllocatedTests,
      usedTests: sub.usedTests,
      remainingTests: remaining,
      usagePercent,
      isLowCredit: remaining < sub.totalAllocatedTests * 0.15,
      expiryDate: sub.expiryDate,
    };
  }

  /**
   * Get district-wide test balances for Super Admin (PGI, RML, KGMU separately + combined)
   */
  static async getDistrictBalances() {
    const facilities = ['PGI', 'RML', 'KGMU'];
    const subs = await HospitalSubscriptionModel.find({ facility: { $in: facilities } });

    const hospitals = facilities.map((fac) => {
      const sub = subs.find((s) => s.facility === fac);
      if (!sub) {
        return {
          facility: fac,
          configured: false,
          totalAllocated: 0,
          usedTests: 0,
          remainingTests: 0,
          usagePercent: 0,
        };
      }
      const remaining = Math.max(0, sub.totalAllocatedTests - sub.usedTests);
      const usagePercent = sub.totalAllocatedTests > 0
        ? Math.round((sub.usedTests / sub.totalAllocatedTests) * 100)
        : 0;
      return {
        facility: fac,
        configured: true,
        planName: sub.planName,
        totalAllocated: sub.totalAllocatedTests,
        usedTests: sub.usedTests,
        remainingTests: remaining,
        usagePercent,
        isLowCredit: remaining < sub.totalAllocatedTests * 0.15,
        expiryDate: sub.expiryDate,
      };
    });

    const combinedAllocated = hospitals.reduce((sum, h) => sum + h.totalAllocated, 0);
    const combinedUsed = hospitals.reduce((sum, h) => sum + h.usedTests, 0);
    const combinedRemaining = Math.max(0, combinedAllocated - combinedUsed);
    const combinedUsagePercent = combinedAllocated > 0
      ? Math.round((combinedUsed / combinedAllocated) * 100)
      : 0;

    return {
      hospitals,
      combined: {
        totalAllocated: combinedAllocated,
        usedTests: combinedUsed,
        remainingTests: combinedRemaining,
        usagePercent: combinedUsagePercent,
      },
    };
  }

  /**
   * Get all active subscription plans
   */
  static async getPlans() {
    const plans = await SubscriptionPlanModel.find({ isActive: true }).sort({ priceINR: 1 });
    return plans;
  }

  /**
   * Get hospital active subscription and key metrics
   */
  static async getHospitalSubscription(facility: string) {
    if (!['PGI', 'RML', 'KGMU'].includes(facility)) {
      throw new BadRequestError('Subscription accounts only exist for hospital facilities (PGI, RML, KGMU). Super Admin is a monitoring entity.');
    }

    let sub = await HospitalSubscriptionModel.findOne({ facility });
    
    // Fallback if not yet created in DB
    if (!sub) {
      // Find default clinical plan or create baseline active subscription
      const defaultPlan = await SubscriptionPlanModel.findOne({ tier: 'clinical' });
      sub = await HospitalSubscriptionModel.create({
        subscriptionId: `SUB-${facility}-${Date.now()}`,
        facility,
        planId: defaultPlan?.planId || 'plan_clinical_500',
        planName: defaultPlan?.name || 'Clinical Care Plan',
        tier: defaultPlan?.tier || 'clinical',
        status: 'active',
        billingCycle: 'monthly',
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        expiryDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 16 days remaining
        totalAllocatedTests: defaultPlan?.testAllocation || 500,
        usedTests: 342,
        remainingTests: 158,
        pricePerTestINR: defaultPlan?.effectivePricePerTestINR || 40.0,
        planAmountINR: defaultPlan?.priceINR || 19999,
        autoRenew: true,
      });
    }

    const usagePercent = sub.totalAllocatedTests > 0
      ? Math.round((sub.usedTests / sub.totalAllocatedTests) * 100)
      : 0;

    return {
      subscription: sub,
      metrics: {
        totalAllocatedTests: sub.totalAllocatedTests,
        usedTests: sub.usedTests,
        remainingTests: sub.remainingTests,
        usagePercent,
        effectivePricePerTestINR: sub.pricePerTestINR,
        status: sub.status,
        expiryDate: sub.expiryDate,
        isLowCredit: sub.remainingTests < (sub.totalAllocatedTests * 0.15),
      },
    };
  }

  /**
   * Get paginated test consumption usage logs
   */
  static async getUsageHistory(params: {
    facility?: string;
    isSuperAdmin?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { facility, isSuperAdmin = false, page = 1, limit = 20 } = params;
    const filter: any = {};

    if (facility && facility !== 'All') {
      filter.facility = facility;
    } else {
      filter.facility = { $in: ['PGI', 'RML', 'KGMU'] };
    }

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      TestUsageRecordModel.find(filter).sort({ testTimestamp: -1 }).skip(skip).limit(limit),
      TestUsageRecordModel.countDocuments(filter),
    ]);

    // Aggregate monthly/daily usage trend for charts
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trendRecords = await TestUsageRecordModel.find({
      ...filter,
      testTimestamp: { $gte: thirtyDaysAgo },
    }).sort({ testTimestamp: 1 });

    const trendMap: { [dateStr: string]: number } = {};
    trendRecords.forEach((r) => {
      const d = new Date(r.testTimestamp).toISOString().split('T')[0];
      trendMap[d] = (trendMap[d] || 0) + (r.creditsConsumed || 1);
    });

    const trend = Object.entries(trendMap).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      records,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      trend,
    };
  }

  /**
   * Register hospital upgrade or plan selection interest (Simulated / Payment gateway pending)
   */
  static async selectPlan(facility: string, planId: string) {
    const plan = await SubscriptionPlanModel.findOne({ planId });
    if (!plan) {
      throw new NotFoundError(`Subscription plan ${planId} not found.`);
    }

    let sub = await HospitalSubscriptionModel.findOne({ facility });
    if (!sub) {
      sub = new HospitalSubscriptionModel({
        subscriptionId: `SUB-${facility}-${Date.now()}`,
        facility,
        planId: plan.planId,
        planName: plan.name,
        tier: plan.tier,
        status: 'active',
        billingCycle: plan.billingPeriod,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalAllocatedTests: plan.testAllocation,
        usedTests: 0,
        remainingTests: plan.testAllocation,
        pricePerTestINR: plan.effectivePricePerTestINR,
        planAmountINR: plan.priceINR,
        autoRenew: true,
      });
    }

    sub.requestedUpgradePlanId = plan.planId;
    sub.requestedUpgradeAt = new Date();
    await sub.save();

    return {
      success: true,
      facility,
      requestedPlan: plan.name,
      planAmountINR: plan.priceINR,
      effectivePricePerTestINR: plan.effectivePricePerTestINR,
      testAllocation: plan.testAllocation,
      message:
        `Upgrade request for "${plan.name}" (₹${plan.priceINR.toLocaleString('en-IN')}) registered successfully. Live payment gateway integration is pending; subscription order logged in database.`,
      status: 'pending_fulfillment',
    };
  }

  /**
   * Super Admin Cross-Hospital Billing Aggregates
   */
  static async getSuperAdminSummary(facility?: string) {
    const subFilter: any = {};
    if (facility && facility !== 'All') {
      subFilter.facility = facility;
    } else {
      subFilter.facility = { $in: ['PGI', 'RML', 'KGMU'] };
    }

    const usageMatch: any = {};
    if (facility && facility !== 'All') {
      usageMatch.facility = facility;
    } else {
      usageMatch.facility = { $in: ['PGI', 'RML', 'KGMU'] };
    }

    const [subscriptions, plans, totalTestsUsage] = await Promise.all([
      HospitalSubscriptionModel.find(subFilter).sort({ facility: 1 }),
      SubscriptionPlanModel.find({ isActive: true }).sort({ priceINR: 1 }),
      TestUsageRecordModel.aggregate([
        { $match: usageMatch },
        {
          $group: {
            _id: '$facility',
            totalTestsConsumed: { $sum: '$creditsConsumed' },
            totalBilledCostINR: { $sum: '$costINR' },
            uniquePatientsScreened: { $addToSet: '$babyUhid' },
          },
        },
      ]),
    ]);

    const totalAllocated = subscriptions.reduce((acc, s) => acc + s.totalAllocatedTests, 0);
    const totalConsumed = subscriptions.reduce((acc, s) => acc + s.usedTests, 0);
    const totalRemaining = subscriptions.reduce((acc, s) => acc + s.remainingTests, 0);
    const expiringOrExhaustedCount = subscriptions.filter(
      (s) => s.status === 'expiring_soon' || s.status === 'exhausted' || s.remainingTests < s.totalAllocatedTests * 0.15
    ).length;

    const hospitalStats = subscriptions.map((sub) => {
      const usageAgg = totalTestsUsage.find((u) => u._id === sub.facility);
      return {
        facility: sub.facility,
        planName: sub.planName,
        tier: sub.tier,
        status: sub.status,
        totalAllocated: sub.totalAllocatedTests,
        consumed: sub.usedTests,
        remaining: sub.remainingTests,
        usagePercent: sub.totalAllocatedTests > 0 ? Math.round((sub.usedTests / sub.totalAllocatedTests) * 100) : 0,
        totalBilledCostINR: usageAgg?.totalBilledCostINR || 0,
        uniquePatientsCount: usageAgg?.uniquePatientsScreened?.length || 0,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        billingCycle: sub.billingCycle || 'monthly',
        planAmountINR: sub.planAmountINR || 19999,
        pricePerTestINR: sub.pricePerTestINR || 39.99,
        payPerTestRateINR: 65.0,
      };
    });

    return {
      aggregate: {
        totalAllocated,
        totalConsumed,
        totalRemaining,
        overallUsagePercent: totalAllocated > 0 ? Math.round((totalConsumed / totalAllocated) * 100) : 0,
        totalActiveSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
        expiringOrExhaustedCount,
      },
      hospitalStats,
      plans,
      facilityFilter: facility && facility !== 'All' ? facility : 'All Hospitals',
    };
  }
}
