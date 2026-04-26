import { blobRead, blobWrite } from './blob-store';

export interface AttendanceRecord {
  id: string;
  meetingType: 'vcm' | 'weekend';
  date: string;
  weekStart?: string;
  weekEndDate?: string;
  inPerson: number;
  online: number;
  total: number;
  initiator?: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceStore {
  records: AttendanceRecord[];
}

const ATTENDANCE_BLOB_PATH = 'data/attendance.json';
const ATTENDANCE_LOCAL_PATH = (() => {
  try {
    const path = require('path');
    return path.join(process.cwd(), 'data', 'attendance.json');
  } catch {
    return 'data/attendance.json';
  }
})();

export async function readAttendanceRecords(): Promise<AttendanceRecord[]> {
  try {
    const content = await blobRead(ATTENDANCE_BLOB_PATH, ATTENDANCE_LOCAL_PATH);
    if (!content) return [];
    const data = JSON.parse(content) as AttendanceStore;
    return data.records ?? [];
  } catch {
    return [];
  }
}

export async function writeAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
  const data: AttendanceStore = { records };
  await blobWrite(ATTENDANCE_BLOB_PATH, ATTENDANCE_LOCAL_PATH, JSON.stringify(data, null, 2));
}

export async function addAttendanceRecord(record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AttendanceRecord> {
  const records = await readAttendanceRecords();
  
  const now = new Date().toISOString();
  const newRecord: AttendanceRecord = {
    ...record,
    id: `att-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  
  // Check if record for same week/meeting already exists, update if so
  const weekKey = record.meetingType === 'vcm' ? record.weekStart : record.weekEndDate;
  const existingIndex = records.findIndex(
    r => r.meetingType === record.meetingType && 
    (r.meetingType === 'vcm' ? r.weekStart === weekKey : r.weekEndDate === weekKey)
  );
  
  if (existingIndex >= 0) {
    records[existingIndex] = {
      ...records[existingIndex],
      ...record,
      updatedAt: now,
    };
  } else {
    records.push(newRecord);
  }
  
  await writeAttendanceRecords(records);
  return existingIndex >= 0 ? records[existingIndex] : newRecord;
}

export async function getAttendanceForMonth(year: number, month: number): Promise<AttendanceRecord[]> {
  const records = await readAttendanceRecords();
  
  return records.filter(record => {
    const date = new Date(record.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
}
