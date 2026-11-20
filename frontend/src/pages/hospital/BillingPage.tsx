import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  FileCheck,
  Building,
  RotateCw,
  X,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../services/api';
import { SubscriptionPlanItem, HospitalSubscriptionData } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const BillingPage: React.FC = () => {
  const { hospitalFacility } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [subData, setSubData] = useState<HospitalSubscriptionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlanModal, setSelectedPlanModal] = useState<SubscriptionPlanItem | null>(null);
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{
    message: string;
    requestedPlan: string;
    amount: number;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/subscription'),
      ]);
      setPlans(plansRes.data.data || []);
      setSubData(subRes.data.data);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectPlan = async () => {
    if (!selectedPlanModal) return;

    try {
      setOrderSubmitting(true);
      const res = await api.post('/billing/select-plan', {
        planId: selectedPlanModal.planId,
      });

      setOrderConfirmation({
        message: res.data.message,
        requestedPlan: res.data.requestedPlan,
        amount: res.data.planAmountINR,
      });
      setSelectedPlanModal(null);
      fetchData(); // refresh active subscription with upgrade request recorded in MongoDB
    } catch (err) {
      console.error('Failed to select plan:', err);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const activeSub = subData?.subscription;
  const subscriptionPlans = plans.filter((p) => p.tier !== 'pay_as_you_go');
  const payAsYouGoPlan = plans.find((p) => p.tier === 'pay_as_you_go');

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
            <CreditCard className="w-4 h-4" />
            Institutional Subscription & Invoicing
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Subscription Plans & Institutional Billing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            All prices in Indian Rupees (₹ INR). Institutional procurement with dedicated per-test metering for{' '}
            <span className="text-slate-200 font-semibold">{hospitalFacility}</span>.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#122033] hover:bg-[#1a2d47] text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-800"
        >
          <RotateCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh Plans
        </button>
      </div>

      {/* Confirmation Banner if upgrade registered */}
      {orderConfirmation && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <h4 className="font-bold text-emerald-300">
                Plan Selection Registered: {orderConfirmation.requestedPlan} (₹{orderConfirmation.amount?.toLocaleString('en-IN')})
              </h4>
              <p className="text-emerald-200/80 mt-1 leading-relaxed">
                {orderConfirmation.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOrderConfirmation(null)}
            className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Subscription Summary Bar */}
      {activeSub && (
        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Hospital Subscription</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {activeSub.status}
                </span>
                {activeSub.requestedUpgradePlanId && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Upgrade Requested ({activeSub.requestedUpgradePlanId})
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">{activeSub.planName}</h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-[10px] font-sans text-slate-400 block uppercase">Allocated Quota</span>
              <span className="text-white font-bold">{activeSub.totalAllocatedTests.toLocaleString()} Tests</span>
            </div>

            <div>
              <span className="text-[10px] font-sans text-slate-400 block uppercase">Remaining</span>
              <span className="text-emerald-400 font-bold">{activeSub.remainingTests.toLocaleString()} Tests</span>
            </div>

            <div>
              <span className="text-[10px] font-sans text-slate-400 block uppercase">Effective Rate</span>
              <span className="text-white font-bold">₹{activeSub.pricePerTestINR.toFixed(2)} / test</span>
            </div>

            <div>
              <span className="text-[10px] font-sans text-slate-400 block uppercase">Renewal Date</span>
              <span className="text-slate-300 font-semibold font-sans">
                {new Date(activeSub.expiryDate).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Institutional Monthly Screening Quotas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select the tier matching your hospital delivery volume. Unused tests roll over with active auto-renewal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => {
            const isCurrent = activeSub?.planId === plan.planId;
            const isPopular = plan.isPopular;

            return (
              <div
                key={plan.planId}
                className={clsx(
                  'rounded-2xl p-6 border flex flex-col justify-between transition-all relative overflow-hidden',
                  isPopular
                    ? 'bg-gradient-to-b from-[#0f2137] to-[#0a1626] border-blue-500 shadow-xl shadow-blue-500/10'
                    : 'bg-[#0b1623] border-slate-800/80 hover:border-slate-700'
                )}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-bl-xl shadow">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      {plan.tier} Tier
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mt-1.5">{plan.name}</h3>

                  {/* Pricing Box */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">
                        ₹{plan.priceINR.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/{plan.billingPeriod}</span>
                    </div>

                    {/* Effective per-test calculation */}
                    <div className="mt-2 p-2.5 rounded-xl bg-[#122033]/80 border border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Effective Cost:</span>
                      <span className="font-bold text-cyan-400">
                        ₹{plan.effectivePricePerTestINR.toFixed(2)} / test
                      </span>
                    </div>

                    <div className="mt-1 text-right text-[11px] text-slate-400 font-mono">
                      Allocation: <span className="font-bold text-white">{plan.testAllocation} tests</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="mt-5 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Plan Inclusions
                    </span>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {plan.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div className="mt-6 pt-4 border-t border-slate-800/60">
                  <button
                    onClick={() => setSelectedPlanModal(plan)}
                    disabled={isCurrent}
                    className={clsx(
                      'w-full py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-md',
                      isCurrent
                        ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                        : isPopular
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                        : 'bg-[#14263e] hover:bg-[#1c3454] text-white border border-slate-700'
                    )}
                  >
                    {isCurrent ? 'Active Subscription' : 'Select Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pay-As-You-Go Section */}
      {payAsYouGoPlan && (
        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Flexible Alternative
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-800 text-slate-300">
                  No Commitment
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {payAsYouGoPlan.name} (₹{payAsYouGoPlan.priceINR.toFixed(2)} per test)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Need occasional screening without a monthly quota commitment? Pay strictly for tests actually conducted. Ideal for low-census community wards, pilot evaluations, or emergency overflow.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  Standard Bhutani Risk Nomogram
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  No monthly expiration penalty
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  Monthly post-billing invoice
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end justify-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Single Test Rate</div>
                <div className="text-3xl font-extrabold text-white">
                  ₹{payAsYouGoPlan.priceINR.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal"> / test</span>
                </div>
                <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                  Save up to 49% with Enterprise Plan
                </div>
              </div>

              <button
                onClick={() => setSelectedPlanModal(payAsYouGoPlan)}
                className="px-5 py-2.5 bg-[#122033] hover:bg-[#1a2d47] text-white font-bold text-xs rounded-xl transition border border-slate-700"
              >
                Switch to Pay-As-You-Go
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Procurement & Invoicing Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wide">
            <Building className="w-4 h-4 text-blue-400" />
            Institutional Invoicing & GST Compliance
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All plans include GST invoices with hospital SAC/HSN codes. Government tertiary institutions (PGI, RML, KGMU) can process payments via Government e-Marketplace (GeM) or Institutional Purchase Orders (PO).
          </p>
        </div>

        <div className="bg-[#0b1623] border border-slate-800/80 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wide">
            <FileCheck className="w-4 h-4 text-blue-400" />
            Biomedical Service Level Agreement (SLA)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Annual and multi-quarter subscriptions include semi-annual optical dock recalibration, warranty coverage on photodiode sensors, and guaranteed 48-hour hot-swap device replacement.
          </p>
        </div>
      </div>

      {/* Plan Selection Confirmation Modal */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1623] border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">
                  Subscription Upgrade Request
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Confirm Plan: {selectedPlanModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order summary table */}
            <div className="bg-[#101b2a] border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Hospital Facility:</span>
                <span className="font-bold text-white">{hospitalFacility}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Selected Tier:</span>
                <span className="font-semibold text-slate-200 uppercase">{selectedPlanModal.tier}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Test Allocation:</span>
                <span className="font-bold text-blue-400">{selectedPlanModal.testAllocation} tests</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Effective Rate per Test:</span>
                <span className="font-bold text-cyan-400">₹{selectedPlanModal.effectivePricePerTestINR.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 pt-2">
                <span className="font-bold text-white">Total Plan Cost (INR):</span>
                <span className="text-base font-extrabold text-white">
                  ₹{selectedPlanModal.priceINR.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Explicit Notice about payment gateway */}
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-200/90 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-blue-300">
                  Simulated Billing Order Notice
                </span>
                <p className="mt-0.5 leading-relaxed">
                  Live payment gateway checkout is currently not integrated. Confirming will record your institutional upgrade order directly into MongoDB Atlas for administrative review and activation.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedPlanModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSelectPlan}
                disabled={orderSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                {orderSubmitting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Logging Order...
                  </>
                ) : (
                  'Confirm Plan Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
