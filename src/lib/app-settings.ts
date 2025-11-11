
export type AppSettings = {
  // General Program Settings
  language: 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt';
  theme: 'Original' | 'Royal' | 'Nature' | 'Marin' | 'Acier' | 'Radiant' | 'Bleu' | 'Mauve' | 'Vert' | 'Turquoise' | 'Charbon';
  initialView: 'Moi' | 'Programme' | 'Assemblée';
  // Displayed on printed sheets and headers
  congregationName: string;
  saveReminderFrequency: number; // in weeks
  showTipsOnStartup: boolean;
  passwordProtectApp: boolean;
  displayNameFormat: 'Nom Prénom' | 'Prénom Nom';
  dateFormat: 'aaaa/MM/jj' | 'jj/MM/aaaa' | 'MM/jj/aaaa';
  shortDateFormat: 'aaaa/MM/jj' | 'jj/MM/aaaa' | 'MM/jj/aaaa';
  dateRangeFormat: string; // e.g., "janvier 20–27"
  timeFormat: '12h' | '24h';

  // Program Specific Settings
  meetingMinTimeBetweenAssignments: number; // in weeks
  meetingMinTimeBetweenStudentDuties: number;
  meetingAvoidSameFamilySameDay: boolean;
  publicTalkMaxExternalSpeakersPerWeek: number;
  servicesMinTimeBetweenServices: number; // in weeks

  // Reports Settings
  paperSize: 'A4' | 'Letter';
};

export const defaultAppSettings: AppSettings = {
  language: 'fr',
  theme: 'Original',
  initialView: 'Moi',
  congregationName: '',
  saveReminderFrequency: 4,
  showTipsOnStartup: true,
  passwordProtectApp: false,
  displayNameFormat: 'Nom Prénom',
  dateFormat: 'jj/MM/aaaa',
  shortDateFormat: 'jj/MM/aaaa',
  dateRangeFormat: 'MMMM jj–jj',
  timeFormat: '24h',

  meetingMinTimeBetweenAssignments: 2,
  meetingMinTimeBetweenStudentDuties: 4,
  meetingAvoidSameFamilySameDay: true,
  publicTalkMaxExternalSpeakersPerWeek: 1,
  servicesMinTimeBetweenServices: 2,

  paperSize: 'A4',
};
