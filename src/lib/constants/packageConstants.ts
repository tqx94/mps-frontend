// src/lib/constants/packageConstants.ts
// Package System Constants

export const PACKAGE_TYPES = {
  HALF_DAY: 'HALF_DAY',
  FULL_DAY: 'FULL_DAY',
  SEMESTER_BUNDLE: 'SEMESTER_BUNDLE'
} as const;

export const TARGET_ROLES = {
  MEMBER: 'MEMBER',
  TUTOR: 'TUTOR',
  STUDENT: 'STUDENT'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
} as const;

export const PASS_STATUS = {
  ACTIVE: 'ACTIVE',
  USED: 'USED',
  EXPIRED: 'EXPIRED'
} as const;

export const PACKAGE_TYPE_DISPLAY = {
  [PACKAGE_TYPES.HALF_DAY]: 'Half-Day',
  [PACKAGE_TYPES.FULL_DAY]: 'Full-Day',
  [PACKAGE_TYPES.SEMESTER_BUNDLE]: 'Semester Bundle'
} as const;

export const TARGET_ROLE_DISPLAY = {
  [TARGET_ROLES.MEMBER]: 'Member',
  [TARGET_ROLES.TUTOR]: 'Tutor',
  [TARGET_ROLES.STUDENT]: 'Student'
} as const;

export const PACKAGE_TYPE_BADGE_VARIANTS = {
  [PACKAGE_TYPES.HALF_DAY]: 'default',
  [PACKAGE_TYPES.FULL_DAY]: 'secondary',
  [PACKAGE_TYPES.SEMESTER_BUNDLE]: 'destructive'
} as const;

export const TARGET_ROLE_COLORS = {
  [TARGET_ROLES.MEMBER]: '#007bff',
  [TARGET_ROLES.TUTOR]: '#28a745',
  [TARGET_ROLES.STUDENT]: '#ffc107'
} as const;

export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUS.PENDING]: '#ffc107',
  [PAYMENT_STATUS.COMPLETED]: '#28a745',
  [PAYMENT_STATUS.FAILED]: '#dc3545',
  [PAYMENT_STATUS.CANCELLED]: '#6c757d'
} as const;

export const PASS_STATUS_COLORS = {
  [PASS_STATUS.ACTIVE]: '#28a745',
  [PASS_STATUS.USED]: '#6c757d',
  [PASS_STATUS.EXPIRED]: '#dc3545'
} as const;

export const DEFAULT_PACKAGE_SETTINGS = {
  DEFAULT_OUTLET_FEE: 5.00,
  DEFAULT_VALIDITY_DAYS: 30,
  DEFAULT_HALF_DAY_HOURS: 6,
  DEFAULT_FULL_DAY_HOURS: 12,
  MAX_QUANTITY: 10,
  MIN_QUANTITY: 1
} as const;

export const PACKAGE_FEATURES = {
  [PACKAGE_TYPES.HALF_DAY]: [
    '6 hours of productive workspace',
    'High-speed WiFi',
    'Ergonomic seating',
    'Quiet environment',
    'Access to common areas'
  ],
  [PACKAGE_TYPES.FULL_DAY]: [
    '12 hours of productive workspace',
    'High-speed WiFi',
    'Ergonomic seating',
    'Quiet environment',
    'Access to common areas',
    'Meeting room access',
    'Printing facilities'
  ],
  [PACKAGE_TYPES.SEMESTER_BUNDLE]: [
    '20 study-hour passes',
    '5 project-room credits',
    'High-speed WiFi',
    'Ergonomic seating',
    'Quiet environment',
    'Access to common areas',
    'Meeting room access',
    'Printing facilities',
    'Student community access'
  ]
} as const;

export const PACKAGE_BENEFITS = {
  [TARGET_ROLES.MEMBER]: [
    'Flexible workspace options',
    'Professional environment',
    'Networking opportunities',
    'Cost-effective solutions'
  ],
  [TARGET_ROLES.TUTOR]: [
    'Dedicated teaching spaces',
    'Multimedia equipment',
    'Student-friendly environment',
    'Flexible scheduling'
  ],
  [TARGET_ROLES.STUDENT]: [
    'Study-focused environment',
    'Peer learning opportunities',
    'Academic resources',
    'Student discounts'
  ]
} as const;

export const PACKAGE_FAQ = [
  {
    question: 'How do I activate my package?',
    answer: 'Your package will be automatically activated upon successful payment. You will receive a confirmation email with your package details.'
  },
  {
    question: 'Can I use my package at any location?',
    answer: 'Yes, your package can be used at all our locations. An additional outlet fee applies for each booking.'
  },
  {
    question: 'What happens if I don\'t use all my passes?',
    answer: 'Unused passes will expire after the validity period. We recommend planning your usage to maximize value.'
  },
  {
    question: 'Can I transfer my package to someone else?',
    answer: 'Packages are non-transferable and tied to your account. However, you can book spaces for others using your passes.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer refunds within 7 days of purchase if the package hasn\'t been used. Please contact our support team for assistance.'
  }
] as const;

export const PACKAGE_TERMS = {
  VALIDITY_PERIOD: 'Packages are valid for the specified number of days from activation date.',
  OUTLET_FEE: 'An additional outlet fee applies for each booking at any location.',
  STUDENT_VERIFICATION: 'Student packages require valid student verification for semester bundles.',
  REFUND_POLICY: 'Refunds are available within 7 days of purchase if package is unused.',
  TRANSFER_POLICY: 'Packages are non-transferable and tied to the purchasing account.',
  EXPIRY_POLICY: 'Unused passes expire after the validity period and cannot be extended.'
} as const;



