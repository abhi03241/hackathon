import fs from 'fs';
import path from 'path';
import type {
  Batch,
  Booking,
  Checkin,
  Condition,
  ConversionStats,
  ExperienceLevel,
  Goal,
  HealthProfile,
  Member,
  Membership,
  PlanType,
  Programme,
  ProgrammeType,
  RetentionRiskItem,
  WaitlistEntry,
} from '@/types';
import {routeMember} from '@/lib/routing';
import {
  buildInactivityWhatsApp,
  buildRenewalWhatsApp,
  buildUnconvertedTrialWhatsApp,
  buildWaitlistPromotionWhatsApp,
  PLAN_DETAILS,
} from '@/lib/whatsapp';

export interface DatabaseSchema {
  programmes: Programme[];
  members: Member[];
  health_profiles: HealthProfile[];
  batches: Batch[];
  memberships: Membership[];
  bookings: Booking[];
  checkins: Checkin[];
  waitlist: WaitlistEntry[];
}

const DB_FILE_PATH = path.join(process.cwd(), '.data', 'ng-yoga-db.json');

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function buildInitialSeedData(): DatabaseSchema {
  const today = getTodayDateString();
  const tomorrow = addDays(today, 1);

  const programmes: Programme[] = [
    {
      id: 'prog-yoga-therapy',
      name: 'Back Pain Relief & Wall Rope Yoga Therapy',
      type: 'Yoga Therapy',
      description:
        'Clinical lumbar decompression, sciatica relief, and knee joint rehabilitation using Iyengar wall ropes, wooden blocks, and bolsters.',
      focusAreas: 'Lumbar Traction • Cervical Alignment • Knee Rehabilitation',
      propsUsed: 'Wall Ropes • Wooden Blocks • Cotton Bolsters',
      instructor: 'NG Gothane (Founder & Therapy Specialist)',
      instructorCredentials: 'Certified Iyengar Wall-Rope & Spinal Therapy Specialist',
      is_active: true,
    },
    {
      id: 'prog-pcod',
      name: 'PCOD / PCOS Hormonal & Metabolic Recovery',
      type: 'PCOD',
      description:
        'Specialized neuro-endocrine sequence combining pelvic floor circulation, Baddha Konasana variations, and cortisol-lowering pranayama.',
      focusAreas: 'Pelvic Circulation • Endocrine Balance • Insulin Sensitivity',
      propsUsed: 'Bolsters • Yoga Straps • Blankets',
      instructor: 'Acharya Kavita Sharma',
      instructorCredentials: 'Women’s Health & Therapeutic Yoga Specialist',
      is_active: true,
    },
    {
      id: 'prog-weight-loss',
      name: 'Metabolic Vinyasa & Weight Loss Flow',
      type: 'Weight Loss',
      description:
        'Continuous breath-led Surya Namaskar variations, core metabolic conditioning, and lean stamina building for sustainable fat loss.',
      focusAreas: 'Metabolic Burn • Core Conditioning • Respiratory Stamina',
      propsUsed: 'Non-Slip Studio Mat • Alignment Blocks',
      instructor: 'NG Gothane',
      instructorCredentials: 'Lead Vinyasa & Metabolic Conditioning Coach',
      is_active: true,
    },
    {
      id: 'prog-traditional',
      name: 'Traditional Hatha & Pranayama Foundation',
      type: 'Traditional',
      description:
        'Grounded Hatha postures, Nadi Shodhana breathwork, and mindful stillness safe for all ages, beginners, and blood pressure regulation.',
      focusAreas: 'Postural Steadiness • Nervous System Reset • Blood Pressure Care',
      propsUsed: 'Meditation Cushions • Studio Mats',
      instructor: 'Pt. Devendra Joshi',
      instructorCredentials: 'Traditional Hatha & Pranayama Master',
      is_active: true,
    },
    {
      id: 'prog-iyengar',
      name: 'Iyengar Precision Alignment & Prop Mobility',
      type: 'Iyengar',
      description:
        'Anatomical precision using studio props to unlock stiff hips, hamstrings, and shoulders without straining the spine or cardiovascular system.',
      focusAreas: 'Structural Symmetry • Joint Opening • Safe Hold Duration',
      propsUsed: 'Wall Ropes • Chairs • Wooden Bricks • Belts',
      instructor: 'NG Gothane',
      instructorCredentials: 'Senior Alignment & Prop-Assisted Asana Instructor',
      is_active: true,
    },
    {
      id: 'prog-power',
      name: 'Dynamic Power Yoga & Core Strength',
      type: 'Power',
      description:
        'High-intensity athletic flow, Chaturanga transitions, and isometric strength holds for injury-free intermediate and advanced practitioners.',
      focusAreas: 'Upper Body Strength • Cardiovascular Endurance • Sweat Flow',
      propsUsed: 'Studio Mat',
      instructor: 'Rohan Deshmukh',
      instructorCredentials: 'Ashtanga & Dynamic Power Flow Instructor',
      is_active: true,
    },
    {
      id: 'prog-advanced',
      name: 'Advanced Backbends, Splits & Inversions',
      type: 'Advanced',
      description:
        'Deep Chakrasana (Wheel), Purna Dhanurasana, Hanumanasana splits, and Sirsasana headstands for seasoned practitioners.',
      focusAreas: 'Deep Thoracic Backbends • Inversions • Advanced Arm Balances',
      propsUsed: 'Wall Ropes • Backbend Bench',
      instructor: 'NG Gothane',
      instructorCredentials: 'Master Asana & Advanced Backbend Coach',
      is_active: true,
    },
  ];

  // Seed Members covering all SRS & Crisis Adaptation Test Cases:
  // 1. Rahul Mehra (9826011111) — Active 3-Month Plan, Last check-in 11 days ago (Priority 2: INACTIVE_ACTIVE_MEMBER)
  // 2. Sunita Khandelwal (9826022222) — Active 1-Month Plan, Expires in 4 days (Priority 1: EXPIRING_SOON)
  // 3. Amit Patidar (9826033333) — Beginner, High BP + Back Pain (Test Case 3 Safety Guardrail + Active 6-Month Plan)
  // 4. Anjali Verma (9876543210) — Beginner, PCOD, Weight Loss goal, Expired Membership (Tests B4 Check-in Denial & Renew Now)
  // 5. Priya Nair (9826044444) — Completed Trial 5 days ago, PCOD + Back Pain, Unconverted Trial (Priority 3: UNCONVERTED_TRIAL)
  // 6. Vikramaditya Joshi (9826055555) — Active 3-Month Plan, Expires in 2 days (Priority 1: EXPIRING_SOON)
  // 7. Neha Agrawal (9826066666) — Active 1-Month Plan, Last check-in 9 days ago (Priority 2: INACTIVE_ACTIVE_MEMBER)
  // 8. Sneha Tiwari (9826077777) — Active 3-Month Plan, Waitlisted #1 on full Morning Yoga Therapy batch (Tests Level 3 Waitlist Auto-Promotion)
  // 9. Karan Malhotra (9826088888) — Completed Trial 4 days ago, Weight Loss goal, Unconverted Trial (Priority 3: UNCONVERTED_TRIAL)

  const members: Member[] = [
    {
      id: 'mem-rahul',
      tenant_id: 'tenant-indore-ashok-nagar',
      name: 'Rahul Mehra',
      phone: '9826011111',
      age: 38,
      experience_level: 'intermediate',
      created_at: addDays(today, -45) + 'T07:00:00Z',
      updated_at: addDays(today, -11) + 'T07:00:00Z',
    },
    {
      id: 'mem-sunita',
      tenant_id: 'tenant-indore-ashok-nagar',
      name: 'Sunita Khandelwal',
      phone: '9826022222',
      age: 46,
      experience_level: 'beginner',
      created_at: addDays(today, -26) + 'T08:30:00Z',
      updated_at: addDays(today, -2) + 'T08:30:00Z',
    },
    {
      id: 'mem-amit',
      tenant_id: 'tenant-indore-ashok-nagar',
      name: 'Amit Patidar',
      phone: '9826033333',
      age: 52,
      experience_level: 'beginner',
      created_at: addDays(today, -20) + 'T08:30:00Z',
      updated_at: addDays(today, -1) + 'T08:30:00Z',
    },
    {
      id: 'mem-anjali',
      tenant_id: 'tenant-indore-ashok-nagar',
      name: 'Anjali Verma',
      phone: '9876543210',
      age: 32,
      experience_level: 'beginner',
      created_at: addDays(today, -40) + 'T09:00:00Z',
      updated_at: addDays(today, -5) + 'T09:00:00Z',
    },
    {
      id: 'mem-priya',
      tenant_id: 'tenant-indore-ashok-nagar',
      name: 'Priya Nair',
      phone: '9826044444',
      age: 27,
      experience_level: 'beginner',
      created_at: addDays(today, -5) + 'T17:30:00Z',
      updated_at: addDays(today, -5) + 'T17:30:00Z',
    },
    {
      id: 'mem-vikram',
      tenant_id: 'tenant-indore-ashok-nagar',
      name: 'Vikramaditya Joshi',
      phone: '9826055555',
      age: 41,
      experience_level: 'intermediate',
      created_at: addDays(today, -88) + 'T06:30:00Z',
      updated_at: addDays(today, -1) + 'T06:30:00Z',
    },
    {
      id: 'mem-neha',
      tenant_id: 'tenant-indore-ashok-nagar',
      name: 'Neha Agrawal',
      phone: '9826066666',
      age: 34,
      experience_level: 'beginner',
      created_at: addDays(today, -18) + 'T07:30:00Z',
      updated_at: addDays(today, -9) + 'T07:30:00Z',
    },
    {
      id: 'mem-sneha',
      tenant_id: 'tenant-indore-ashok-nagar',
      name: 'Sneha Tiwari',
      phone: '9826077777',
      age: 29,
      experience_level: 'intermediate',
      created_at: addDays(today, -15) + 'T08:00:00Z',
      updated_at: addDays(today, -1) + 'T08:00:00Z',
    },
    {
      id: 'mem-karan',
      tenant_id: 'tenant-indore-ashok-nagar',
      name: 'Karan Malhotra',
      phone: '9826088888',
      age: 31,
      experience_level: 'beginner',
      created_at: addDays(today, -4) + 'T18:00:00Z',
      updated_at: addDays(today, -4) + 'T18:00:00Z',
    },
  ];

  const health_profiles: HealthProfile[] = [
    {
      id: 'hp-rahul',
      member_id: 'mem-rahul',
      conditions: ['back_pain'],
      main_goal: 'flexibility',
      consent_given: true,
      created_at: addDays(today, -45) + 'T07:00:00Z',
      updated_at: addDays(today, -45) + 'T07:00:00Z',
    },
    {
      id: 'hp-sunita',
      member_id: 'mem-sunita',
      conditions: ['knee_pain'],
      main_goal: 'stress_relief',
      consent_given: true,
      created_at: addDays(today, -26) + 'T08:30:00Z',
      updated_at: addDays(today, -26) + 'T08:30:00Z',
    },
    {
      id: 'hp-amit',
      member_id: 'mem-amit',
      conditions: ['high_bp', 'back_pain'],
      main_goal: 'fitness',
      consent_given: true,
      created_at: addDays(today, -20) + 'T08:30:00Z',
      updated_at: addDays(today, -20) + 'T08:30:00Z',
    },
    {
      id: 'hp-anjali',
      member_id: 'mem-anjali',
      conditions: ['pcod'],
      main_goal: 'weight_loss',
      consent_given: true,
      created_at: addDays(today, -40) + 'T09:00:00Z',
      updated_at: addDays(today, -40) + 'T09:00:00Z',
    },
    {
      id: 'hp-priya',
      member_id: 'mem-priya',
      conditions: ['pcod', 'back_pain'],
      main_goal: 'weight_loss',
      consent_given: true,
      created_at: addDays(today, -5) + 'T17:30:00Z',
      updated_at: addDays(today, -5) + 'T17:30:00Z',
    },
    {
      id: 'hp-vikram',
      member_id: 'mem-vikram',
      conditions: ['high_bp'],
      main_goal: 'stress_relief',
      consent_given: true,
      created_at: addDays(today, -88) + 'T06:30:00Z',
      updated_at: addDays(today, -88) + 'T06:30:00Z',
    },
    {
      id: 'hp-neha',
      member_id: 'mem-neha',
      conditions: ['none'],
      main_goal: 'weight_loss',
      consent_given: true,
      created_at: addDays(today, -18) + 'T07:30:00Z',
      updated_at: addDays(today, -18) + 'T07:30:00Z',
    },
    {
      id: 'hp-sneha',
      member_id: 'mem-sneha',
      conditions: ['back_pain'],
      main_goal: 'flexibility',
      consent_given: true,
      created_at: addDays(today, -15) + 'T08:00:00Z',
      updated_at: addDays(today, -15) + 'T08:00:00Z',
    },
    {
      id: 'hp-karan',
      member_id: 'mem-karan',
      conditions: ['none'],
      main_goal: 'weight_loss',
      consent_given: true,
      created_at: addDays(today, -4) + 'T18:00:00Z',
      updated_at: addDays(today, -4) + 'T18:00:00Z',
    },
  ];

  const batches: Batch[] = [
    {
      id: 'batch-1-therapy-am',
      programme_id: 'prog-yoga-therapy',
      programme_type: 'Yoga Therapy',
      programme_name: 'Back Pain Relief & Wall Rope Therapy (Micro-Cohort)',
      tenant_id: 'tenant-indore-ashok-nagar',
      time_slot: 'morning',
      timing_label: '08:30 AM – 09:30 AM',
      batch_date: today,
      capacity: 6, // Full batch to demonstrate B1 capacity lock & Level 3 waitlist auto-promotion!
      booked_count: 6,
      instructor: 'NG Gothane',
      is_micro_group: true,
      is_active: true,
      created_at: addDays(today, -30) + 'T00:00:00Z',
    },
    {
      id: 'batch-2-therapy-pm',
      programme_id: 'prog-yoga-therapy',
      programme_type: 'Yoga Therapy',
      programme_name: 'Evening Spine Decompression & Lumbar Care',
      tenant_id: 'tenant-indore-ashok-nagar',
      time_slot: 'evening',
      timing_label: '05:00 PM – 06:00 PM',
      batch_date: today,
      capacity: 8,
      booked_count: 5,
      instructor: 'NG Gothane',
      is_micro_group: true,
      is_active: true,
      created_at: addDays(today, -30) + 'T00:00:00Z',
    },
    {
      id: 'batch-3-pcod-am',
      programme_id: 'prog-pcod',
      programme_type: 'PCOD',
      programme_name: 'PCOD / PCOS Hormonal & Metabolic Recovery',
      tenant_id: 'tenant-indore-ashok-nagar',
      time_slot: 'morning',
      timing_label: '09:00 AM – 10:00 AM',
      batch_date: today,
      capacity: 8,
      booked_count: 6,
      instructor: 'Acharya Kavita Sharma',
      is_micro_group: true,
      is_active: true,
      created_at: addDays(today, -30) + 'T00:00:00Z',
    },
    {
      id: 'batch-4-weightloss-am',
      programme_id: 'prog-weight-loss',
      programme_type: 'Weight Loss',
      programme_name: 'Sunrise Metabolic Vinyasa & Surya Namaskar',
      tenant_id: 'tenant-indore-ashok-nagar',
      time_slot: 'morning',
      timing_label: '06:30 AM – 07:30 AM',
      batch_date: today,
      capacity: 15,
      booked_count: 12,
      instructor: 'NG Gothane',
      is_micro_group: false,
      is_active: true,
      created_at: addDays(today, -30) + 'T00:00:00Z',
    },
    {
      id: 'batch-5-weightloss-pm',
      programme_id: 'prog-weight-loss',
      programme_type: 'Weight Loss',
      programme_name: 'Evening Metabolic Vinyasa & Core Burn',
      tenant_id: 'tenant-indore-ashok-nagar',
      time_slot: 'evening',
      timing_label: '06:00 PM – 07:00 PM',
      batch_date: today,
      capacity: 15,
      booked_count: 11,
      instructor: 'NG Gothane',
      is_micro_group: false,
      is_active: true,
      created_at: addDays(today, -30) + 'T00:00:00Z',
    },
    {
      id: 'batch-6-traditional-am',
      programme_id: 'prog-traditional',
      programme_type: 'Traditional',
      programme_name: 'Traditional Hatha, Pranayama & BP Care',
      tenant_id: 'tenant-indore-ashok-nagar',
      time_slot: 'morning',
      timing_label: '07:30 AM – 08:30 AM',
      batch_date: today,
      capacity: 15,
      booked_count: 9,
      instructor: 'Pt. Devendra Joshi',
      is_micro_group: false,
      is_active: true,
      created_at: addDays(today, -30) + 'T00:00:00Z',
    },
    {
      id: 'batch-7-iyengar-pm',
      programme_id: 'prog-iyengar',
      programme_type: 'Iyengar',
      programme_name: 'Iyengar Precision Alignment & Wall Props',
      tenant_id: 'tenant-indore-ashok-nagar',
      time_slot: 'evening',
      timing_label: '07:00 PM – 08:00 PM',
      batch_date: today,
      capacity: 12,
      booked_count: 8,
      instructor: 'NG Gothane',
      is_micro_group: false,
      is_active: true,
      created_at: addDays(today, -30) + 'T00:00:00Z',
    },
    {
      id: 'batch-8-power-pm',
      programme_id: 'prog-power',
      programme_type: 'Power',
      programme_name: 'Dynamic Power Yoga & Core Strength',
      tenant_id: 'tenant-indore-ashok-nagar',
      time_slot: 'evening',
      timing_label: '07:30 PM – 08:30 PM',
      batch_date: today,
      capacity: 14,
      booked_count: 10,
      instructor: 'Rohan Deshmukh',
      is_micro_group: false,
      is_active: true,
      created_at: addDays(today, -30) + 'T00:00:00Z',
    },
    {
      id: 'batch-9-advanced-am',
      programme_id: 'prog-advanced',
      programme_type: 'Advanced',
      programme_name: 'Advanced Backbends (Chakrasana) & Inversions',
      tenant_id: 'tenant-indore-ashok-nagar',
      time_slot: 'morning',
      timing_label: '07:00 AM – 08:30 AM',
      batch_date: tomorrow,
      capacity: 10,
      booked_count: 7,
      instructor: 'NG Gothane',
      is_micro_group: false,
      is_active: true,
      created_at: addDays(today, -30) + 'T00:00:00Z',
    },
  ];

  const memberships: Membership[] = [
    {
      id: 'ms-rahul',
      member_id: 'mem-rahul',
      plan_type: '3months',
      plan_label: '3 Months Practice Commitment',
      price: 4000,
      start_date: addDays(today, -45),
      expiry_date: addDays(today, 45),
      status: 'active',
      created_at: addDays(today, -45) + 'T07:00:00Z',
    },
    {
      id: 'ms-sunita',
      member_id: 'mem-sunita',
      plan_type: '1month',
      plan_label: '1 Month Practice Pass',
      price: 1500,
      start_date: addDays(today, -26),
      expiry_date: addDays(today, 4), // Expires in 4 days (Test Case 2: EXPIRING_SOON)
      status: 'active',
      created_at: addDays(today, -26) + 'T08:30:00Z',
    },
    {
      id: 'ms-amit',
      member_id: 'mem-amit',
      plan_type: '6months',
      plan_label: '6 Months Deep Transformation',
      price: 7500,
      start_date: addDays(today, -20),
      expiry_date: addDays(today, 160),
      status: 'active',
      created_at: addDays(today, -20) + 'T08:30:00Z',
    },
    {
      id: 'ms-anjali',
      member_id: 'mem-anjali',
      plan_type: '1month',
      plan_label: '1 Month Practice Pass',
      price: 1500,
      start_date: addDays(today, -38),
      expiry_date: addDays(today, -8), // Expired 8 days ago (Tests B4 Check-in Denial & Renew Now)
      status: 'expired',
      created_at: addDays(today, -38) + 'T09:00:00Z',
    },
    {
      id: 'ms-vikram',
      member_id: 'mem-vikram',
      plan_type: '3months',
      plan_label: '3 Months Practice Commitment',
      price: 4000,
      start_date: addDays(today, -88),
      expiry_date: addDays(today, 2), // Expires in 2 days (EXPIRING_SOON)
      status: 'active',
      created_at: addDays(today, -88) + 'T06:30:00Z',
    },
    {
      id: 'ms-neha',
      member_id: 'mem-neha',
      plan_type: '1month',
      plan_label: '1 Month Practice Pass',
      price: 1500,
      start_date: addDays(today, -18),
      expiry_date: addDays(today, 12),
      status: 'active',
      created_at: addDays(today, -18) + 'T07:30:00Z',
    },
    {
      id: 'ms-sneha',
      member_id: 'mem-sneha',
      plan_type: '3months',
      plan_label: '3 Months Practice Commitment',
      price: 4000,
      start_date: addDays(today, -15),
      expiry_date: addDays(today, 75),
      status: 'active',
      created_at: addDays(today, -15) + 'T08:00:00Z',
    },
  ];

  const bookings: Booking[] = [
    // Bookings in batch-1-therapy-am (Full capacity 6/6)
    {
      id: 'bk-amit-1',
      member_id: 'mem-amit',
      member_name: 'Amit Patidar',
      member_phone: '9826033333',
      batch_id: 'batch-1-therapy-am',
      programme_type: 'Yoga Therapy',
      batch_date: today,
      time_slot: 'morning',
      timing_label: '08:30 AM – 09:30 AM',
      booking_type: 'member',
      status: 'confirmed',
      created_at: addDays(today, -2) + 'T08:00:00Z',
    },
    {
      id: 'bk-sunita-1',
      member_id: 'mem-sunita',
      member_name: 'Sunita Khandelwal',
      member_phone: '9826022222',
      batch_id: 'batch-1-therapy-am',
      programme_type: 'Yoga Therapy',
      batch_date: today,
      time_slot: 'morning',
      timing_label: '08:30 AM – 09:30 AM',
      booking_type: 'member',
      status: 'confirmed',
      created_at: addDays(today, -2) + 'T08:15:00Z',
    },
    // Historical Trial bookings (some converted, some unconverted)
    {
      id: 'bk-trial-rahul',
      member_id: 'mem-rahul',
      member_name: 'Rahul Mehra',
      member_phone: '9826011111',
      batch_id: 'batch-2-therapy-pm',
      programme_type: 'Yoga Therapy',
      batch_date: addDays(today, -45),
      time_slot: 'evening',
      timing_label: '05:00 PM – 06:00 PM',
      booking_type: 'trial',
      status: 'confirmed',
      created_at: addDays(today, -45) + 'T06:00:00Z',
    },
    {
      id: 'bk-trial-sunita',
      member_id: 'mem-sunita',
      member_name: 'Sunita Khandelwal',
      member_phone: '9826022222',
      batch_id: 'batch-1-therapy-am',
      programme_type: 'Yoga Therapy',
      batch_date: addDays(today, -27),
      time_slot: 'morning',
      timing_label: '08:30 AM – 09:30 AM',
      booking_type: 'trial',
      status: 'confirmed',
      created_at: addDays(today, -27) + 'T07:00:00Z',
    },
    {
      id: 'bk-trial-amit',
      member_id: 'mem-amit',
      member_name: 'Amit Patidar',
      member_phone: '9826033333',
      batch_id: 'batch-1-therapy-am',
      programme_type: 'Yoga Therapy',
      batch_date: addDays(today, -21),
      time_slot: 'morning',
      timing_label: '08:30 AM – 09:30 AM',
      booking_type: 'trial',
      status: 'confirmed',
      created_at: addDays(today, -21) + 'T07:00:00Z',
    },
    {
      id: 'bk-trial-anjali',
      member_id: 'mem-anjali',
      member_name: 'Anjali Verma',
      member_phone: '9876543210',
      batch_id: 'batch-3-pcod-am',
      programme_type: 'PCOD',
      batch_date: addDays(today, -39),
      time_slot: 'morning',
      timing_label: '09:00 AM – 10:00 AM',
      booking_type: 'trial',
      status: 'confirmed',
      created_at: addDays(today, -39) + 'T07:00:00Z',
    },
    {
      id: 'bk-trial-priya',
      member_id: 'mem-priya',
      member_name: 'Priya Nair',
      member_phone: '9826044444',
      batch_id: 'batch-3-pcod-am',
      programme_type: 'PCOD',
      batch_date: addDays(today, -5),
      time_slot: 'morning',
      timing_label: '09:00 AM – 10:00 AM',
      booking_type: 'trial',
      status: 'confirmed',
      created_at: addDays(today, -5) + 'T10:00:00Z',
    },
    {
      id: 'bk-trial-karan',
      member_id: 'mem-karan',
      member_name: 'Karan Malhotra',
      member_phone: '9826088888',
      batch_id: 'batch-4-weightloss-am',
      programme_type: 'Weight Loss',
      batch_date: addDays(today, -4),
      time_slot: 'morning',
      timing_label: '06:30 AM – 07:30 AM',
      booking_type: 'trial',
      status: 'confirmed',
      created_at: addDays(today, -4) + 'T09:00:00Z',
    },
  ];

  const checkins: Checkin[] = [
    // Rahul Mehra: last check-in 11 days ago (Test Case 1: Inactive 11 days)
    {
      id: 'chk-rahul-1',
      member_id: 'mem-rahul',
      member_name: 'Rahul Mehra',
      member_phone: '9826011111',
      batch_id: 'batch-2-therapy-pm',
      programme_type: 'Yoga Therapy',
      checkin_time: addDays(today, -11) + 'T17:02:00Z',
    },
    // Sunita Khandelwal: checked in 2 days ago
    {
      id: 'chk-sunita-1',
      member_id: 'mem-sunita',
      member_name: 'Sunita Khandelwal',
      member_phone: '9826022222',
      batch_id: 'batch-1-therapy-am',
      programme_type: 'Yoga Therapy',
      checkin_time: addDays(today, -2) + 'T08:28:00Z',
    },
    // Amit Patidar: checked in yesterday
    {
      id: 'chk-amit-1',
      member_id: 'mem-amit',
      member_name: 'Amit Patidar',
      member_phone: '9826033333',
      batch_id: 'batch-1-therapy-am',
      programme_type: 'Yoga Therapy',
      checkin_time: addDays(today, -1) + 'T08:25:00Z',
    },
    // Vikramaditya Joshi: checked in yesterday
    {
      id: 'chk-vikram-1',
      member_id: 'mem-vikram',
      member_name: 'Vikramaditya Joshi',
      member_phone: '9826055555',
      batch_id: 'batch-6-traditional-am',
      programme_type: 'Traditional',
      checkin_time: addDays(today, -1) + 'T07:28:00Z',
    },
    // Neha Agrawal: last check-in 9 days ago (Inactive 9 days)
    {
      id: 'chk-neha-1',
      member_id: 'mem-neha',
      member_name: 'Neha Agrawal',
      member_phone: '9826066666',
      batch_id: 'batch-4-weightloss-am',
      programme_type: 'Weight Loss',
      checkin_time: addDays(today, -9) + 'T06:31:00Z',
    },
    // Sneha Tiwari: checked in yesterday
    {
      id: 'chk-sneha-1',
      member_id: 'mem-sneha',
      member_name: 'Sneha Tiwari',
      member_phone: '9826077777',
      batch_id: 'batch-2-therapy-pm',
      programme_type: 'Yoga Therapy',
      checkin_time: addDays(today, -1) + 'T17:00:00Z',
    },
  ];

  const waitlist: WaitlistEntry[] = [
    {
      id: 'wl-sneha-1',
      member_id: 'mem-sneha',
      member_name: 'Sneha Tiwari',
      member_phone: '9826077777',
      batch_id: 'batch-1-therapy-am',
      programme_type: 'Yoga Therapy',
      batch_date: today,
      timing_label: '08:30 AM – 09:30 AM',
      position: 1,
      notified: false,
      created_at: addDays(today, -1) + 'T10:15:00Z',
    },
    {
      id: 'wl-rahul-2',
      member_id: 'mem-rahul',
      member_name: 'Rahul Mehra',
      member_phone: '9826011111',
      batch_id: 'batch-1-therapy-am',
      programme_type: 'Yoga Therapy',
      batch_date: today,
      timing_label: '08:30 AM – 09:30 AM',
      position: 2,
      notified: false,
      created_at: addDays(today, -1) + 'T11:30:00Z',
    },
  ];

  return {
    programmes,
    members,
    health_profiles,
    batches,
    memberships,
    bookings,
    checkins,
    waitlist,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __ngYogaMemDb: DatabaseSchema | undefined;
}

export function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      global.__ngYogaMemDb = parsed;
      return parsed;
    }
  } catch {
    // Fallback to memory if file read fails
  }

  if (!global.__ngYogaMemDb) {
    const seed = buildInitialSeedData();
    writeDb(seed);
    return seed;
  }

  return global.__ngYogaMemDb;
}

export function writeDb(data: DatabaseSchema): void {
  global.__ngYogaMemDb = data;
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Ignore write errors in read-only edge environments; memory store persists
  }
}

export function resetDbToSeed(): DatabaseSchema {
  const seed = buildInitialSeedData();
  writeDb(seed);
  return seed;
}

/**
 * Repository Operations (SRS Section 12.2)
 */
export const studioRepo = {
  getAllSnapshot() {
    const db = readDb();
    return {
      ...db,
      retention_triage: this.getRetentionRiskRegistry(true),
      conversion_stats: this.getConversionStats(),
    };
  },

  upsertMemberWithHealthProfile(input: {
    name: string;
    phone: string;
    age: number;
    experience_level: ExperienceLevel;
    main_goal: Goal;
    conditions: Condition[];
    consent_given: boolean;
  }) {
    const db = readDb();
    const nowIso = new Date().toISOString();

    let member = db.members.find((m) => m.phone === input.phone);
    if (member) {
      member.name = input.name;
      member.age = input.age;
      member.experience_level = input.experience_level;
      member.updated_at = nowIso;
    } else {
      member = {
        id: `mem-${Date.now().toString(36)}`,
        tenant_id: 'tenant-indore-ashok-nagar',
        name: input.name,
        phone: input.phone,
        age: input.age,
        experience_level: input.experience_level,
        created_at: nowIso,
        updated_at: nowIso,
      };
      db.members.unshift(member);
    }

    let profile = db.health_profiles.find((hp) => hp.member_id === member!.id);
    if (profile) {
      profile.conditions = input.conditions;
      profile.main_goal = input.main_goal;
      profile.consent_given = input.consent_given;
      profile.updated_at = nowIso;
    } else {
      profile = {
        id: `hp-${Date.now().toString(36)}`,
        member_id: member.id,
        conditions: input.conditions,
        main_goal: input.main_goal,
        consent_given: input.consent_given,
        created_at: nowIso,
        updated_at: nowIso,
      };
      db.health_profiles.push(profile);
    }

    writeDb(db);

    const routing = routeMember({
      conditions: input.conditions,
      goal: input.main_goal,
      experienceLevel: input.experience_level,
    });

    const activeMembership = this.getLatestMembership(member.id);
    const hasUsedTrial = db.bookings.some(
      (b) =>
        (b.member_id === member!.id || b.member_phone === member!.phone) &&
        b.booking_type === 'trial' &&
        b.status !== 'cancelled'
    );

    return {
      member,
      health_profile: profile,
      routing,
      active_membership: activeMembership,
      has_used_trial: hasUsedTrial,
    };
  },

  findMemberByPhone(phone: string) {
    const db = readDb();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const member = db.members.find((m) => m.phone === cleanPhone);
    if (!member) return null;

    const health_profile =
      db.health_profiles.find((hp) => hp.member_id === member.id) || null;
    const routing = health_profile
      ? routeMember({
          conditions: health_profile.conditions,
          goal: health_profile.main_goal,
          experienceLevel: member.experience_level,
        })
      : null;

    const latestMembership = this.getLatestMembership(member.id);
    const memberCheckins = db.checkins
      .filter((c) => c.member_id === member.id)
      .sort((a, b) => b.checkin_time.localeCompare(a.checkin_time));

    const memberBookings = db.bookings.filter(
      (b) => b.member_id === member.id && b.status === 'confirmed'
    );

    const hasUsedTrial = db.bookings.some(
      (b) =>
        (b.member_id === member.id || b.member_phone === member.phone) &&
        b.booking_type === 'trial' &&
        b.status !== 'cancelled'
    );

    return {
      member,
      health_profile,
      routing,
      membership: latestMembership,
      last_checkin: memberCheckins[0] || null,
      checkins_count: memberCheckins.length,
      bookings: memberBookings,
      has_used_trial: hasUsedTrial,
    };
  },

  getLatestMembership(memberId: string): Membership | null {
    const db = readDb();
    const list = db.memberships
      .filter((m) => m.member_id === memberId)
      .sort((a, b) => b.expiry_date.localeCompare(a.expiry_date));
    return list[0] || null;
  },

  createBooking(params: {
    member_id: string;
    batch_id: string;
    booking_type: 'trial' | 'member';
  }): {
    ok: boolean;
    status: number;
    error?: string;
    message: string;
    booking?: Booking;
    waitlist_available?: boolean;
  } {
    const db = readDb();
    const member = db.members.find((m) => m.id === params.member_id);
    if (!member) {
      return {
        ok: false,
        status: 404,
        error: 'MEMBER_NOT_FOUND',
        message: 'Member profile not found. Complete the health intake form first.',
      };
    }

    const batch = db.batches.find((b) => b.id === params.batch_id);
    if (!batch) {
      return {
        ok: false,
        status: 404,
        error: 'BATCH_NOT_FOUND',
        message: 'Selected batch was not found.',
      };
    }

    const profile = db.health_profiles.find((hp) => hp.member_id === member.id);
    if (profile) {
      const routing = routeMember({
        conditions: profile.conditions,
        goal: profile.main_goal,
        experienceLevel: member.experience_level,
      });

      // Rule R1 hard block
      if (routing.hardBlock) {
        return {
          ok: false,
          status: 403,
          error: 'PREGNANCY_HARD_BLOCK',
          message: 'Please speak to an instructor before joining.',
        };
      }

      // Check if programme is blocked by routing rules R2-R6
      if (routing.blocked.includes(batch.programme_type)) {
        return {
          ok: false,
          status: 403,
          error: 'PROGRAMME_BLOCKED',
          message: `This programme is not recommended for your health profile (${
            routing.blockReasons[batch.programme_type] || 'Safety Restriction'
          }). Please choose an available option.`,
        };
      }
    }

    // Check duplicate booking in same batch
    const existingSameBatch = db.bookings.find(
      (b) =>
        b.member_id === member.id &&
        b.batch_id === batch.id &&
        b.status === 'confirmed'
    );
    if (existingSameBatch) {
      return {
        ok: false,
        status: 409,
        error: 'ALREADY_BOOKED_IN_BATCH',
        message: 'You already hold a confirmed mat in this batch.',
      };
    }

    // Rule B2: Free trial uniqueness per phone number
    if (params.booking_type === 'trial') {
      const priorTrial = db.bookings.find(
        (b) =>
          (b.member_id === member.id || b.member_phone === member.phone) &&
          b.booking_type === 'trial' &&
          b.status !== 'cancelled'
      );
      if (priorTrial) {
        return {
          ok: false,
          status: 409,
          error: 'TRIAL_ALREADY_USED',
          message:
            'You have already used your free trial (Rule B2: 1 trial per mobile number). Please purchase a membership to continue.',
        };
      }
    }

    // Rule B4 / FR-2.3(4): If member booking, verify active non-expired membership
    if (params.booking_type === 'member') {
      const today = getTodayDateString();
      const latestMs = this.getLatestMembership(member.id);
      if (
        !latestMs ||
        latestMs.status !== 'active' ||
        latestMs.expiry_date < today
      ) {
        return {
          ok: false,
          status: 403,
          error: 'MEMBERSHIP_EXPIRED_OR_MISSING',
          message:
            'Your membership has expired or is not active. Please purchase or renew a membership plan to book as a member.',
        };
      }
    }

    // Rule B1: Batch cannot exceed capacity
    if (batch.booked_count >= batch.capacity) {
      return {
        ok: false,
        status: 409,
        error: 'BATCH_FULL',
        message: 'This batch is full. You can join the waitlist.',
        waitlist_available: true,
      };
    }

    // Atomic update
    batch.booked_count += 1;
    const newBooking: Booking = {
      id: `bk-${Date.now().toString(36)}`,
      member_id: member.id,
      member_name: member.name,
      member_phone: member.phone,
      batch_id: batch.id,
      programme_type: batch.programme_type,
      batch_date: batch.batch_date,
      time_slot: batch.time_slot,
      timing_label: batch.timing_label,
      booking_type: params.booking_type,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    db.bookings.unshift(newBooking);
    writeDb(db);

    return {
      ok: true,
      status: 201,
      message:
        params.booking_type === 'trial'
          ? `Complimentary 1-Day Trial Pass confirmed for ${batch.programme_name} (${batch.timing_label}).`
          : `Member mat reserved for ${batch.programme_name} (${batch.timing_label}).`,
      booking: newBooking,
    };
  },

  joinWaitlist(params: {member_id: string; batch_id: string}) {
    const db = readDb();
    const member = db.members.find((m) => m.id === params.member_id);
    const batch = db.batches.find((b) => b.id === params.batch_id);

    if (!member || !batch) {
      return {
        ok: false,
        status: 404,
        message: 'Member or batch not found.',
      };
    }

    const existing = db.waitlist.find(
      (w) =>
        w.member_id === member.id &&
        w.batch_id === batch.id &&
        !w.notified
    );
    if (existing) {
      return {
        ok: false,
        status: 409,
        message: `You are already on the waitlist for this batch at Position #${existing.position}.`,
      };
    }

    const activeWaitlistForBatch = db.waitlist.filter(
      (w) => w.batch_id === batch.id && !w.notified
    );
    const nextPosition =
      activeWaitlistForBatch.length > 0
        ? Math.max(...activeWaitlistForBatch.map((w) => w.position)) + 1
        : 1;

    const entry: WaitlistEntry = {
      id: `wl-${Date.now().toString(36)}`,
      member_id: member.id,
      member_name: member.name,
      member_phone: member.phone,
      batch_id: batch.id,
      programme_type: batch.programme_type,
      batch_date: batch.batch_date,
      timing_label: batch.timing_label,
      position: nextPosition,
      notified: false,
      created_at: new Date().toISOString(),
    };

    db.waitlist.push(entry);
    writeDb(db);

    return {
      ok: true,
      status: 201,
      entry,
      message: `Added to waitlist at Position #${nextPosition}. When a seat opens, Position #1 is automatically promoted.`,
    };
  },

  cancelBookingAndPromoteWaitlist(bookingId: string) {
    const db = readDb();
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status === 'cancelled') {
      return {
        ok: false,
        status: 404,
        message: 'Active booking not found.',
      };
    }

    const batch = db.batches.find((b) => b.id === booking.batch_id);
    booking.status = 'cancelled';

    if (batch && batch.booked_count > 0) {
      batch.booked_count -= 1;
    }

    // Level 3 FR-6.2: Check waitlist for earliest unnotified entry for this batch
    let promotedInfo: {
      promoted_member_name: string;
      promoted_member_phone: string;
      whatsapp_url: string;
      whatsapp_message: string;
      new_booking: Booking;
    } | null = null;

    if (batch) {
      const queue = db.waitlist
        .filter((w) => w.batch_id === batch.id && !w.notified)
        .sort((a, b) => a.position - b.position);

      const firstInLine = queue[0];
      if (firstInLine && batch.booked_count < batch.capacity) {
        firstInLine.notified = true;
        firstInLine.promoted_at = new Date().toISOString();

        // Re-index remaining positions
        queue.slice(1).forEach((w, idx) => {
          w.position = idx + 1;
        });

        batch.booked_count += 1;

        const promotedBooking: Booking = {
          id: `bk-prom-${Date.now().toString(36)}`,
          member_id: firstInLine.member_id,
          member_name: firstInLine.member_name,
          member_phone: firstInLine.member_phone,
          batch_id: batch.id,
          programme_type: batch.programme_type,
          batch_date: batch.batch_date,
          time_slot: batch.time_slot,
          timing_label: batch.timing_label,
          booking_type: 'member',
          status: 'confirmed',
          created_at: new Date().toISOString(),
        };

        db.bookings.unshift(promotedBooking);

        const wa = buildWaitlistPromotionWhatsApp({
          name: firstInLine.member_name,
          phone: firstInLine.member_phone,
          programmeName: batch.programme_name,
          batchDate: batch.batch_date,
          timingLabel: batch.timing_label,
        });

        promotedInfo = {
          promoted_member_name: firstInLine.member_name,
          promoted_member_phone: firstInLine.member_phone,
          whatsapp_url: wa.url,
          whatsapp_message: wa.message,
          new_booking: promotedBooking,
        };
      }
    }

    writeDb(db);

    return {
      ok: true,
      status: 200,
      cancelled_booking: booking,
      promoted: promotedInfo,
      message: promotedInfo
        ? `Booking cancelled. Waitlist #1 (${promotedInfo.promoted_member_name}) was automatically promoted to a confirmed seat!`
        : 'Booking cancelled and batch seat released.',
    };
  },

  createMembership(params: {
    member_id: string;
    plan_type: PlanType;
    apply_loyalty_cap?: boolean;
  }) {
    const db = readDb();
    const member = db.members.find((m) => m.id === params.member_id);
    if (!member) {
      return {
        ok: false,
        status: 404,
        message: 'Member not found.',
      };
    }

    const planSpec = PLAN_DETAILS[params.plan_type];
    const startDate = getTodayDateString();
    const expiryDate = addDays(startDate, planSpec.durationDays);

    // Mark prior memberships for this member as expired/replaced so active is clean
    db.memberships.forEach((ms) => {
      if (ms.member_id === member.id && ms.status === 'active') {
        ms.status = 'expired';
      }
    });

    const newMembership: Membership = {
      id: `ms-${Date.now().toString(36)}`,
      member_id: member.id,
      plan_type: params.plan_type,
      plan_label: planSpec.label,
      price: params.apply_loyalty_cap
        ? planSpec.cappedRenewalPrice
        : planSpec.price,
      start_date: startDate,
      expiry_date: expiryDate,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    db.memberships.unshift(newMembership);
    writeDb(db);

    return {
      ok: true,
      status: 201,
      membership: newMembership,
      member,
      message: `${planSpec.label} activated for ${member.name}. Valid until ${expiryDate}.`,
    };
  },

  performCheckin(params: {phone: string; batch_id?: string}) {
    const db = readDb();
    const cleanPhone = params.phone.replace(/\D/g, '').slice(-10);
    const lookup = this.findMemberByPhone(cleanPhone);

    if (!lookup) {
      return {
        ok: false,
        status: 404,
        allowed: false,
        outcome: 'NOT_FOUND' as const,
        message: 'Member not found. Please ask them to register via Health Intake.',
      };
    }

    const today = getTodayDateString();
    const {member, membership, routing, health_profile} = lookup;

    // Rule B4: Deny check-in if membership is missing or expired
    if (
      !membership ||
      membership.status !== 'active' ||
      membership.expiry_date < today
    ) {
      if (membership && membership.expiry_date < today) {
        membership.status = 'expired';
        writeDb(db);
      }
      return {
        ok: false,
        status: 403,
        allowed: false,
        outcome: 'EXPIRED' as const,
        member,
        membership,
        routing,
        health_profile,
        expiry_date: membership?.expiry_date || null,
        message: 'Membership expired. Please renew to continue.',
      };
    }

    const targetBatch =
      db.batches.find((b) => b.id === params.batch_id) ||
      db.batches.find(
        (b) => b.programme_type === (routing?.recommended || 'Traditional')
      ) ||
      db.batches[0];

    const newCheckin: Checkin = {
      id: `chk-${Date.now().toString(36)}`,
      member_id: member.id,
      member_name: member.name,
      member_phone: member.phone,
      batch_id: targetBatch.id,
      programme_type: targetBatch.programme_type,
      checkin_time: new Date().toISOString(),
    };

    db.checkins.unshift(newCheckin);
    writeDb(db);

    return {
      ok: true,
      status: 200,
      allowed: true,
      outcome: 'APPROVED' as const,
      member,
      membership,
      routing,
      health_profile,
      checkin: newCheckin,
      message: `Check-in approved for ${member.name}. Active plan valid through ${membership.expiry_date}.`,
    };
  },

  getRetentionRiskRegistry(useCrisisTemplate = true): RetentionRiskItem[] {
    const db = readDb();
    const today = getTodayDateString();
    const todayMs = new Date(today + 'T00:00:00Z').getTime();
    const items: RetentionRiskItem[] = [];

    for (const member of db.members) {
      const hp = db.health_profiles.find((h) => h.member_id === member.id);
      const conditions: Condition[] = hp?.conditions || ['none'];
      const goal: Goal = hp?.main_goal || 'fitness';
      const routing = routeMember({
        conditions,
        goal,
        experienceLevel: member.experience_level,
      });

      const activeMs = db.memberships
        .filter((m) => m.member_id === member.id && m.status === 'active')
        .sort((a, b) => b.expiry_date.localeCompare(a.expiry_date))[0];

      const memberCheckins = db.checkins
        .filter((c) => c.member_id === member.id)
        .sort((a, b) => b.checkin_time.localeCompare(a.checkin_time));

      const lastCheckin = memberCheckins[0]?.checkin_time || null;
      const daysInactive = lastCheckin
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - new Date(lastCheckin).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 999;

      const trialBooking = db.bookings.find(
        (b) => b.member_id === member.id && b.booking_type === 'trial'
      );

      let daysToExpiry: number | null = null;
      if (activeMs) {
        const expMs = new Date(activeMs.expiry_date + 'T00:00:00Z').getTime();
        daysToExpiry = Math.round((expMs - todayMs) / (1000 * 60 * 60 * 24));
      }

      const anyPaidMs = db.memberships.some((m) => m.member_id === member.id);

      // Signal 1: Expiring within 7 days (0..7)
      if (activeMs && daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 7) {
        const planSpec = PLAN_DETAILS[activeMs.plan_type];
        const wa = buildRenewalWhatsApp({
          name: member.name,
          phone: member.phone,
          expiryDate: activeMs.expiry_date,
          planType: activeMs.plan_type,
          useCrisisTemplate,
        });

        items.push({
          member_id: member.id,
          name: member.name,
          phone: member.phone,
          experience_level: member.experience_level,
          conditions,
          main_goal: goal,
          recommended_programme: routing.recommended,
          plan_type: activeMs.plan_type,
          plan_label: planSpec.label,
          original_price: planSpec.price,
          capped_renewal_price: planSpec.cappedRenewalPrice,
          expiry_date: activeMs.expiry_date,
          days_to_expiry: daysToExpiry,
          last_checkin: lastCheckin,
          days_inactive: daysInactive,
          trial_date: trialBooking?.batch_date || null,
          risk_category: 'EXPIRING_SOON',
          triage_priority: 1,
          whatsapp_url: wa.url,
          whatsapp_message: wa.message,
        });
        continue;
      }

      // Signal 2: Active membership but no check-in for 7+ days
      if (activeMs && daysToExpiry !== null && daysToExpiry > 0 && daysInactive >= 7) {
        const planSpec = PLAN_DETAILS[activeMs.plan_type];
        const wa = buildInactivityWhatsApp({
          name: member.name,
          phone: member.phone,
          daysInactive: daysInactive === 999 ? 14 : daysInactive,
          useCrisisTemplate,
        });

        items.push({
          member_id: member.id,
          name: member.name,
          phone: member.phone,
          experience_level: member.experience_level,
          conditions,
          main_goal: goal,
          recommended_programme: routing.recommended,
          plan_type: activeMs.plan_type,
          plan_label: planSpec.label,
          original_price: planSpec.price,
          capped_renewal_price: planSpec.cappedRenewalPrice,
          expiry_date: activeMs.expiry_date,
          days_to_expiry: daysToExpiry,
          last_checkin: lastCheckin,
          days_inactive: daysInactive,
          trial_date: trialBooking?.batch_date || null,
          risk_category: 'INACTIVE_ACTIVE_MEMBER',
          triage_priority: 2,
          whatsapp_url: wa.url,
          whatsapp_message: wa.message,
        });
        continue;
      }

      // Signal 3: Unconverted Trial (took trial, never bought paid membership)
      if (!anyPaidMs && trialBooking) {
        const wa = buildUnconvertedTrialWhatsApp({
          name: member.name,
          phone: member.phone,
          conditions,
          recommendedProgramme: routing.recommended,
        });

        items.push({
          member_id: member.id,
          name: member.name,
          phone: member.phone,
          experience_level: member.experience_level,
          conditions,
          main_goal: goal,
          recommended_programme: routing.recommended,
          plan_type: null,
          plan_label: null,
          original_price: null,
          capped_renewal_price: null,
          expiry_date: null,
          days_to_expiry: null,
          last_checkin: lastCheckin,
          days_inactive: daysInactive,
          trial_date: trialBooking.batch_date,
          risk_category: 'UNCONVERTED_TRIAL',
          triage_priority: 3,
          whatsapp_url: wa.url,
          whatsapp_message: wa.message,
        });
      }
    }

    return items.sort((a, b) => {
      if (a.triage_priority !== b.triage_priority) {
        return a.triage_priority - b.triage_priority;
      }
      return (a.days_to_expiry ?? 99) - (b.days_to_expiry ?? 99);
    });
  },

  getConversionStats(): ConversionStats {
    const db = readDb();
    const trialMemberIds = new Set(
      db.bookings
        .filter((b) => b.booking_type === 'trial' && b.status !== 'cancelled')
        .map((b) => b.member_id)
    );

    const paidMemberIds = new Set(db.memberships.map((m) => m.member_id));

    let convertedCount = 0;
    trialMemberIds.forEach((id) => {
      if (paidMemberIds.has(id)) {
        convertedCount += 1;
      }
    });

    const totalTrials = trialMemberIds.size;
    const unconvertedTrials = Math.max(0, totalTrials - convertedCount);
    const conversionRate =
      totalTrials > 0 ? Math.round((convertedCount / totalTrials) * 100) : 0;

    const triage = this.getRetentionRiskRegistry(true);
    const expiringSoonCount = triage.filter(
      (t) => t.risk_category === 'EXPIRING_SOON'
    ).length;
    const inactive7dCount = triage.filter(
      (t) => t.risk_category === 'INACTIVE_ACTIVE_MEMBER'
    ).length;

    const today = getTodayDateString();
    const activeMembershipsCount = db.memberships.filter(
      (m) => m.status === 'active' && m.expiry_date >= today
    ).length;

    const waitlistActiveCount = db.waitlist.filter((w) => !w.notified).length;

    return {
      total_trials: totalTrials,
      converted_members: convertedCount,
      unconverted_trials: unconvertedTrials,
      conversion_rate: conversionRate,
      active_memberships_count: activeMembershipsCount,
      expiring_soon_count: expiringSoonCount,
      inactive_7d_count: inactive7dCount,
      waitlist_active_count: waitlistActiveCount,
    };
  },
};
