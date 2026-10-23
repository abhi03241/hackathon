import type {Condition, PlanType, ProgrammeType} from '@/types';
import {CONDITION_LABELS} from '@/lib/routing';

export const STUDIO_WHATSAPP_NUMBER = '919171744543';

export const PLAN_DETAILS: Record<
  PlanType,
  {label: string; durationDays: number; price: number; cappedRenewalPrice: number}
> = {
  '1month': {
    label: '1 Month Practice Pass',
    durationDays: 30,
    price: 1500,
    cappedRenewalPrice: 1350, // 10% loyalty protection
  },
  '3months': {
    label: '3 Months Practice Commitment',
    durationDays: 90,
    price: 4000,
    cappedRenewalPrice: 3600,
  },
  '6months': {
    label: '6 Months Deep Transformation',
    durationDays: 180,
    price: 7500,
    cappedRenewalPrice: 6750,
  },
};

export function buildWhatsAppUrl(phone10Digit: string, message: string): string {
  const cleanPhone = phone10Digit.replace(/\D/g, '').slice(-10);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/91${cleanPhone}?text=${encoded}`;
}

/**
 * Standard SRS Level 2 & Crisis Addendum Template B: Pre-Expiry Renewal
 */
export function buildRenewalWhatsApp(params: {
  name: string;
  phone: string;
  expiryDate: string;
  planType: PlanType;
  useCrisisTemplate?: boolean;
}): {url: string; message: string} {
  const plan = PLAN_DETAILS[params.planType];
  const message = params.useCrisisTemplate
    ? `Hi ${params.name}, your NG Yoga Studio membership concludes on ${params.expiryDate}. To safeguard your continuous progress with our senior instructors, renew your ${plan.label} today at our locked studio rate of Rs ${plan.cappedRenewalPrice} (saving 10% with zero price hikes). Contact us at NG Yoga Studio, Prem Plaza, Ashok Nagar, Indore.`
    : `Hi ${params.name}, your NG Yoga Studio membership expires on ${params.expiryDate}. Renew now to keep your spot. Contact us at NG Yoga Studio, Ashok Nagar, Indore.`;

  return {
    message,
    url: buildWhatsAppUrl(params.phone, message),
  };
}

/**
 * Standard SRS Level 2 & Crisis Addendum Template A: Inactive Member (Human Care & Reactivation)
 */
export function buildInactivityWhatsApp(params: {
  name: string;
  phone: string;
  daysInactive: number;
  useCrisisTemplate?: boolean;
}): {url: string; message: string} {
  const message = params.useCrisisTemplate
    ? `Hi ${params.name}, we noticed you haven't attended class in ${params.daysInactive} days at NG Yoga Studio. Generic apps cannot adjust for posture fatigue or injury risks like your instructor can. Book an exclusive 15-minute instructor posture-alignment review included with your plan this week. Contact us at NG Yoga Studio, Ashok Nagar, Indore.`
    : `Hi ${params.name}, we have not seen you at NG Yoga Studio for ${params.daysInactive} days. We hope you are well. Come back and continue your wellness journey. Contact us at NG Yoga Studio, Ashok Nagar, Indore.`;

  return {
    message,
    url: buildWhatsAppUrl(params.phone, message),
  };
}

/**
 * Crisis Addendum Template C: Unconverted Trial (Safe Clinical Matching)
 */
export function buildUnconvertedTrialWhatsApp(params: {
  name: string;
  phone: string;
  conditions: Condition[];
  recommendedProgramme: ProgrammeType;
}): {url: string; message: string} {
  const condList =
    params.conditions.filter((c) => c !== 'none').length > 0
      ? params.conditions
          .filter((c) => c !== 'none')
          .map((c) => CONDITION_LABELS[c])
          .join(', ')
      : 'foundational posture alignment';

  const message = `Hi ${params.name}, thank you for taking your trial session at NG Yoga Studio. Because your intake indicates ${condList}, unsupervised digital apps pose high strain risks. Our senior instructor has opened a special ${params.recommendedProgramme} micro-group session (maximum 6 members) for your specific needs. Join this week at NG Yoga Studio, Ashok Nagar, Indore.`;

  return {
    message,
    url: buildWhatsAppUrl(params.phone, message),
  };
}

/**
 * Waitlist Auto-Promotion Notification (Level 3 FR-6.2)
 */
export function buildWaitlistPromotionWhatsApp(params: {
  name: string;
  phone: string;
  programmeName: string;
  batchDate: string;
  timingLabel: string;
}): {url: string; message: string} {
  const message = `Namaste ${params.name}! Great news from NG Yoga Studio, Ashok Nagar: A mat has opened up and you have been automatically promoted from #1 on the waitlist to a CONFIRMED seat in ${params.programmeName} (${params.timingLabel}) on ${params.batchDate}. See you on the mat at Prem Plaza!`;

  return {
    message,
    url: buildWhatsAppUrl(params.phone, message),
  };
}
