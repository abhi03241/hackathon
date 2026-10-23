export type Condition =
  | 'back_pain'
  | 'knee_pain'
  | 'high_bp'
  | 'pcod'
  | 'pregnancy'
  | 'none';

export type Goal =
  | 'weight_loss'
  | 'flexibility'
  | 'stress_relief'
  | 'fitness';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type ProgrammeType =
  | 'Traditional'
  | 'Advanced'
  | 'Iyengar'
  | 'Power'
  | 'Weight Loss'
  | 'PCOD'
  | 'Yoga Therapy';

export type PlanType = '1month' | '3months' | '6months';

export type MembershipStatus = 'active' | 'expired' | 'cancelled';

export type BookingType = 'trial' | 'member';

export type BookingStatus = 'confirmed' | 'cancelled' | 'waitlisted';

export interface RoutingInput {
  conditions: Condition[];
  goal: Goal;
  experienceLevel: ExperienceLevel;
}

export interface RoutingResult {
  recommended: ProgrammeType;
  allowed: ProgrammeType[];
  blocked: ProgrammeType[];
  blockReasons: Record<string, string>;
  hardBlock: boolean;
  message: string;
  clinicalNotes: string[];
}

export interface Programme {
  id: string;
  name: string;
  type: ProgrammeType;
  description: string;
  focusAreas: string;
  propsUsed: string;
  instructor: string;
  instructorCredentials: string;
  is_active: boolean;
}

export interface Member {
  id: string;
  tenant_id: string | null;
  name: string;
  phone: string;
  age: number;
  experience_level: ExperienceLevel;
  created_at: string;
  updated_at: string;
}

export interface HealthProfile {
  id: string;
  member_id: string;
  conditions: Condition[];
  main_goal: Goal;
  consent_given: boolean;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  programme_id: string;
  programme_type: ProgrammeType;
  programme_name: string;
  tenant_id: string | null;
  time_slot: 'morning' | 'evening';
  timing_label: string;
  batch_date: string;
  capacity: number;
  booked_count: number;
  instructor: string;
  is_micro_group?: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Membership {
  id: string;
  member_id: string;
  plan_type: PlanType;
  plan_label: string;
  price: number;
  start_date: string;
  expiry_date: string;
  status: MembershipStatus;
  created_at: string;
}

export interface Booking {
  id: string;
  member_id: string;
  member_name: string;
  member_phone: string;
  batch_id: string;
  programme_type: ProgrammeType;
  batch_date: string;
  time_slot: 'morning' | 'evening';
  timing_label: string;
  booking_type: BookingType;
  status: BookingStatus;
  created_at: string;
}

export interface Checkin {
  id: string;
  member_id: string;
  member_name: string;
  member_phone: string;
  batch_id: string;
  programme_type: ProgrammeType;
  checkin_time: string;
}

export interface WaitlistEntry {
  id: string;
  member_id: string;
  member_name: string;
  member_phone: string;
  batch_id: string;
  programme_type: ProgrammeType;
  batch_date: string;
  timing_label: string;
  position: number;
  notified: boolean;
  promoted_at?: string;
  created_at: string;
}

export type RiskCategory =
  | 'EXPIRING_SOON'
  | 'INACTIVE_ACTIVE_MEMBER'
  | 'UNCONVERTED_TRIAL'
  | 'LOW_RISK';

export interface RetentionRiskItem {
  member_id: string;
  name: string;
  phone: string;
  experience_level: ExperienceLevel;
  conditions: Condition[];
  main_goal: Goal;
  recommended_programme: ProgrammeType;
  plan_type: PlanType | null;
  plan_label: string | null;
  original_price: number | null;
  capped_renewal_price: number | null;
  expiry_date: string | null;
  days_to_expiry: number | null;
  last_checkin: string | null;
  days_inactive: number;
  trial_date: string | null;
  risk_category: RiskCategory;
  triage_priority: 1 | 2 | 3 | 4;
  whatsapp_url: string;
  whatsapp_message: string;
}

export interface ConversionStats {
  total_trials: number;
  converted_members: number;
  unconverted_trials: number;
  conversion_rate: number;
  active_memberships_count: number;
  expiring_soon_count: number;
  inactive_7d_count: number;
  waitlist_active_count: number;
}
