import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Zap,
  Building2,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowRight,
  PhoneCall,
  Activity,
  Layers,
  HelpCircle,
  Clock,
  CheckCircle2,
  Lock,
  X,
  Loader2,
} from 'lucide-react';

interface PricingPlansPageProps {
  onOpenLiveOperations?: () => void;
  onOpenStory?: () => void;
}

export const PricingPlansPage: React.FC<PricingPlansPageProps> = ({
  onOpenLiveOperations,
  onOpenStory,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('business');
  const [activeSubscription, setActiveSubscription] = useState<string>('business');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Interactive ROI Calculator States
  const [dailyAppointments, setDailyAppointments] = useState<number>(45);
  const [consultFee, setConsultFee] = useState<number>(1800);
  const [noShowRate, setNoShowRate] = useState<number>(22);

  // ROI Math
  const monthlyAppointments = dailyAppointments * 26; // 26 clinical days
  const potentialLostRevenue = monthlyAppointments * (noShowRate / 100) * consultFee;
  const recoveredRevenue = Math.round(potentialLostRevenue * 0.78); // 78% average recovery rate
  const businessPlanCost = billingCycle === 'annual' ? 23999 : 29999;
  const roiMultiplier = Math.max(1, Number((recoveredRevenue / businessPlanCost).toFixed(1)));

  const plans = [
    {
      id: 'starter',
      name: 'Essential Clinic',
      badge: 'FOR SINGLE PRACTITIONERS',
      tagline: 'Predict and eliminate gaps for solo practices and private clinics.',
      monthlyPrice: 4999,
      annualPrice: 3999,
      features: [
        'Up to 350 appointments / month',
        'Single Doctor / Practitioner seat',
        'Real-Time ML Attendance Probability (94.2% ROC-AUC)',
        'Automated WhatsApp & SMS Confirmation Dispatch',
        'Basic Patient Attendance History Profiling',
        'Standard Email & Chat Support (9am - 6pm)',
        'SSL Encrypted & DPDP Compliant Data Storage',
      ],
      cta: 'Start Essential Tier',
      highlighted: false,
      accentColor: 'border-slate-200',
    },
    {
      id: 'business',
      name: 'Business Plan',
      badge: 'MOST POPULAR FOR CLINIC NETWORKS',
      tagline: 'Autonomous end-to-end capacity operations for multi-specialty clinics & hospitals.',
      monthlyPrice: 29999,
      annualPrice: 23999,
      features: [
        'Unlimited booked appointments & patient streams',
        'Up to 15 Doctor & Department seats',
        'Autonomous Inbound AI Voice Receptionist Desk',
        'Urgent Outbound AI Confirmation Phone Calls',
        'Sub-second Smart Waitlist Auto-Backfill Engine',
        'Explainable AI Telemetry (SHAP Feature Attribution)',
        'Direct EHR / EMR Integration (HL7, FHIR, Practo)',
        'Guaranteed Clinical Capacity Recovery Engine',
        'Dedicated Clinical Operations Success Manager',
        '99.95% Availability SLA & Priority Phone Support',
      ],
      cta: 'Activate Business Plan',
      highlighted: true,
      accentColor: 'border-emerald-500 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.25)]',
    },
    {
      id: 'enterprise',
      name: 'Enterprise Health',
      badge: 'FOR HOSPITAL CHAINS',
      tagline: 'Custom high-concurrency deployment across multi-city hospital networks.',
      monthlyPrice: 69999,
      annualPrice: 55999,
      features: [
        'Multi-hospital hospital group architecture',
        'Unlimited Doctor seats, floors & OPD centers',
        'Custom Fine-Tuned Prediction Model on Hospital Data',
        'Custom Telephony SIP Trunk Integration',
        'On-Premises or Private Cloud (AWS / GCP / Azure) Option',
        'Custom EHR Bi-directional Synchronizer (Epic, Cerner, Napier)',
        '24/7 Dedicated Clinical Reliability Engineer (CRE)',
        '99.99% Guaranteed SLA with financial penalty terms',
        'SOC2 Type II, HIPAA & NABH Compliance Packages',
      ],
      cta: 'Talk to Healthcare Enterprise',
      highlighted: false,
      accentColor: 'border-slate-200',
    },
  ];

  const handleOpenCheckout = (plan: any) => {
    setCheckoutPlan(plan);
    setPaymentSuccess(false);
    setIsCheckoutOpen(true);
  };

  const handleExecutePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      if (checkoutPlan) {
        setActiveSubscription(checkoutPlan.id);
        setSelectedPlanId(checkoutPlan.id);
      }
    }, 1200);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300 text-slate-900">
      {/* 1. Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Transparent Clinical Capacity Pricing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 uppercase leading-tight">
          Predictable Capacity. <br />
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Guaranteed Clinical ROI.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
          SlotSure typically pays for itself within the first 48 hours of deployment by anticipating unconfirmed slots and autonomously backfilling them from your urgent waitlist.
        </p>

        {/* Billing Cycle Toggle (Monthly vs Annual with 20% discount badge) */}
        <div className="pt-4 flex items-center justify-center">
          <div className="p-1.5 rounded-full bg-slate-100 border border-slate-200/90 flex items-center gap-2 shadow-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-extrabold uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Three Primary Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-2">
        {plans.map((plan) => {
          const isBusiness = plan.id === 'business';
          const isCurrent = activeSubscription === plan.id;
          const displayPrice = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`rounded-[32px] p-8 sm:p-9 flex flex-col justify-between relative transition-all duration-300 bg-white border ${
                isBusiness
                  ? 'border-2 border-emerald-600 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.2)] ring-4 ring-emerald-50'
                  : 'border-slate-200/90 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Highlight Badge */}
              {isBusiness && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white font-mono text-[11px] font-extrabold uppercase tracking-widest shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>RECOMMENDED BUSINESS PLAN</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                    {plan.badge}
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                        ACTIVE PLAN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-2 font-normal leading-relaxed">
                    {plan.tagline}
                  </p>
                </div>

                {/* Pricing Display */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-slate-500">₹</span>
                  <span className="text-4xl font-black text-slate-950 tracking-tight">
                    {displayPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    / month {billingCycle === 'annual' && <span className="text-[10px] block text-emerald-700 font-mono font-bold">billed annually</span>}
                  </span>
                </div>

                {/* Key Features List */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 block">
                    INCLUDED CAPABILITIES:
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="font-medium leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-8 mt-6 border-t border-slate-100">
                <button
                  onClick={() => handleOpenCheckout(plan)}
                  className={`w-full py-3.5 rounded-full text-xs font-extrabold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isBusiness
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>{isCurrent ? 'Current Active Subscription' : plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Interactive Clinical ROI Calculator */}
      <div className="p-8 sm:p-12 rounded-[36px] bg-gradient-to-br from-slate-950 to-slate-900 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Explanatory Copy and Sliders */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>Interactive Clinical Value Calculator</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-tight">
              See How Much Revenue <br />
              <span className="text-emerald-400">SlotSure Recovers For You.</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-xl">
              Adjust the sliders to match your clinic's daily operational numbers. Our autonomous engine captures up to 78% of slots that would otherwise sit idle.
            </p>

            {/* Sliders */}
            <div className="space-y-5 pt-2">
              {/* Daily Appointments Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Daily Booked Appointments:</span>
                  <span className="font-bold text-emerald-400 text-sm">{dailyAppointments} patients / day</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={dailyAppointments}
                  onChange={(e) => setDailyAppointments(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Consultation Fee Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Average Consultation Fee:</span>
                  <span className="font-bold text-emerald-400 text-sm">₹{consultFee.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={consultFee}
                  onChange={(e) => setConsultFee(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Current No-Show Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Estimated No-Show / Dropout Rate:</span>
                  <span className="font-bold text-rose-400 text-sm">{noShowRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={noShowRate}
                  onChange={(e) => setNoShowRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right: Real-time Value Calculation Card */}
          <div className="lg:col-span-5 p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 space-y-6 text-center">
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
              ESTIMATED REVENUE PRESERVED
            </span>

            <div>
              <div className="text-5xl sm:text-6xl font-black text-emerald-400 tracking-tight">
                ₹{recoveredRevenue.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-slate-300 mt-1 block font-mono">
                per month into clinic revenue
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-left text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/5">
                <span className="text-slate-400 block text-[10px]">RECOVERED SLOTS</span>
                <span className="text-white font-bold text-base mt-0.5 block">
                  ~{Math.round(monthlyAppointments * (noShowRate / 100) * 0.78)} visits
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <span className="text-slate-400 block text-[10px]">BUSINESS ROI</span>
                <span className="text-emerald-400 font-bold text-base mt-0.5 block">
                  {roiMultiplier}x investment
                </span>
              </div>
            </div>

            <button
              onClick={() => handleOpenCheckout(plans[1])}
              className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>PROTECT CLINICAL CAPACITY NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Complete Feature Comparison Matrix */}
      <div className="p-8 sm:p-10 rounded-[32px] bg-white border border-slate-200/90 shadow-sm space-y-8">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
            SPECIFICATION MATRIX
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight mt-1">
            Compare Plan Capabilities
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono">
                <th className="py-4 font-bold uppercase w-2/5">Capability</th>
                <th className="py-4 font-bold uppercase text-center w-1/5">Essential</th>
                <th className="py-4 font-bold uppercase text-center w-1/5 text-emerald-700 bg-emerald-50/50 rounded-t-xl">Business (Us)</th>
                <th className="py-4 font-bold uppercase text-center w-1/5">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              <tr>
                <td className="py-3.5 font-medium">Real-Time ML Inference (94.2% ROC-AUC)</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold bg-emerald-50/50">✓</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">Automated WhatsApp & SMS Check-ins</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold bg-emerald-50/50">✓ (Priority)</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold">✓ (Custom Routing)</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">Autonomous Outbound AI Voice Phone Calls</td>
                <td className="py-3.5 text-center text-slate-300">—</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold bg-emerald-50/50">✓ (Included)</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold">✓ (Unlimited SIP)</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">Autonomous Waitlist Instant Backfill</td>
                <td className="py-3.5 text-center text-slate-300">—</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold bg-emerald-50/50">✓ (Sub-second)</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold">✓ (Multi-branch)</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">SHAP Feature Attribution & Telemetry Radar</td>
                <td className="py-3.5 text-center text-slate-300">—</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold bg-emerald-50/50">✓</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">EHR / EMR Bi-Directional Synchronization</td>
                <td className="py-3.5 text-center text-slate-300">—</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold bg-emerald-50/50">FHIR / HL7 REST</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold">Epic / Cerner Native</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">Service Level Agreement (SLA)</td>
                <td className="py-3.5 text-center text-slate-500 font-mono">99.0%</td>
                <td className="py-3.5 text-center text-emerald-700 font-bold font-mono bg-emerald-50/50">99.95%</td>
                <td className="py-3.5 text-center text-slate-900 font-bold font-mono">99.99%</td>
              </tr>
              <tr>
                <td className="py-3.5 font-medium">Dedicated Operations Manager</td>
                <td className="py-3.5 text-center text-slate-300">—</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold bg-emerald-50/50">✓</td>
                <td className="py-3.5 text-center text-emerald-600 font-bold">✓ (24/7 Crew)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Simulated Checkout Modal */}
      {isCheckoutOpen && checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {!paymentSuccess ? (
              <>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                    SECURE CHECKOUT
                  </span>
                  <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                    {checkoutPlan.name} Subscription
                  </h3>
                  <p className="text-xs text-slate-500">
                    Billing cycle: {billingCycle === 'annual' ? 'Annual (20% Savings applied)' : 'Monthly'}
                  </p>
                </div>

                {/* Plan Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{checkoutPlan.name}</span>
                    <span className="text-[11px] text-slate-500">Billed {billingCycle}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-950 block">
                      ₹{(billingCycle === 'annual' ? checkoutPlan.annualPrice : checkoutPlan.monthlyPrice).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">+ GST Included</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                    Select Payment Method:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'card'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Card</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>UPI / QR</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'netbanking'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Net Banking</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Payment Credentials */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3 pt-1 text-xs">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Dr. Sharma Healthcare Clinic"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        defaultValue="•••• •••• •••• 4242"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          defaultValue="08/29"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          defaultValue="•••"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <span className="text-xs font-mono font-bold text-slate-700 block">
                      VPA ID: clinic.operations@okhdfcbank
                    </span>
                    <p className="text-[11px] text-slate-500">
                      GPay, PhonePe, Paytm, or BHIM approval will appear instantly.
                    </p>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                    Direct corporate banking clearance via HDFC, ICICI, SBI & Axis Bank.
                  </div>
                )}

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-Bit SSL Encrypted Healthcare Payment</span>
                </div>

                {/* Execute Button */}
                <button
                  disabled={isProcessingPayment}
                  onClick={handleExecutePayment}
                  className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Confirming Healthcare Gateway...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Authorize Payment & Activate</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold block">
                    SUBSCRIPTION CONFIRMED
                  </span>
                  <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
                    {checkoutPlan.name} Activated
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Your clinic capacity is now safeguarded with autonomous prediction, AI voice calls, and waitlist recovery.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs font-mono text-emerald-900 font-bold">
                  <span>Billing Invoice #INV-2026-SS-0982 generated</span>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
                >
                  Return to Command Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
