import {z} from 'zod';

export const ConditionEnum = z.enum([
  'back_pain',
  'knee_pain',
  'high_bp',
  'pcod',
  'pregnancy',
  'none',
]);

export const GoalEnum = z.enum([
  'weight_loss',
  'flexibility',
  'stress_relief',
  'fitness',
]);

export const ExperienceLevelEnum = z.enum([
  'beginner',
  'intermediate',
  'advanced',
]);

export const ProgrammeTypeEnum = z.enum([
  'Traditional',
  'Advanced',
  'Iyengar',
  'Power',
  'Weight Loss',
  'PCOD',
  'Yoga Therapy',
]);

export const PlanTypeEnum = z.enum(['1month', '3months', '6months']);

export const HealthIntakeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.'),
  phone: z
    .string()
    .trim()
    .regex(
      /^[6-9]\d{9}$/,
      'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
    ),
  age: z.coerce
    .number()
    .int()
    .min(10, 'Age must be between 10 and 80.')
    .max(80, 'Age must be between 10 and 80.'),
  experience_level: ExperienceLevelEnum,
  main_goal: GoalEnum,
  conditions: z
    .array(ConditionEnum)
    .min(1, 'Select at least one health condition option (or "None of the above").'),
  consent_given: z
    .boolean()
    .refine((val) => val === true, {
      message:
        'You must agree to share this information with NG Yoga Studio staff for safe class placement.',
    }),
});

export const CreateBookingSchema = z.object({
  member_id: z.string().min(1, 'Member ID is required.'),
  batch_id: z.string().min(1, 'Batch ID is required.'),
  booking_type: z.enum(['trial', 'member']),
});

export const CreateMembershipSchema = z.object({
  member_id: z.string().min(1, 'Member ID is required.'),
  plan_type: PlanTypeEnum,
  apply_loyalty_cap: z.boolean().optional(),
});

export const CheckinSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  batch_id: z.string().optional(),
});

export const JoinWaitlistSchema = z.object({
  member_id: z.string().min(1, 'Member ID is required.'),
  batch_id: z.string().min(1, 'Batch ID is required.'),
});
