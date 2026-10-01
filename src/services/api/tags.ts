export const TAG_TYPES = [
  'Applications',
  'Profile',
  'Slots',
  'Scheduled',
  'ReminderLogs',
  'Metrics',
  'Applicants',
  'Jobs',
  'AuditLogs',
  'ApplicantDetails',
  'ApplicantSlots',
] as const;

export type TagType = typeof TAG_TYPES[number];
