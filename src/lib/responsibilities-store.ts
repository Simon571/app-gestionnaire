import fs from 'fs';
import path from 'path';

export interface ResponsibilityAssignment {
  id: string;
  title: string;
  category: string;
  titulaire?: string;
  adjoint1?: string;
  adjoint2?: string;
}

export interface ResponsibilitiesData {
  assignments: ResponsibilityAssignment[];
  customResponsibilities: ResponsibilityAssignment[];
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const RESPONSIBILITIES_FILE = path.join(DATA_DIR, 'responsibilities.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function readResponsibilities(): Promise<ResponsibilitiesData> {
  ensureDataDir();
  try {
    if (!fs.existsSync(RESPONSIBILITIES_FILE)) {
      return { 
        assignments: [], 
        customResponsibilities: [],
        updatedAt: new Date().toISOString()
      };
    }
    const data = fs.readFileSync(RESPONSIBILITIES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading responsibilities:', error);
    return { 
      assignments: [], 
      customResponsibilities: [],
      updatedAt: new Date().toISOString()
    };
  }
}

export async function writeResponsibilities(data: ResponsibilitiesData): Promise<void> {
  ensureDataDir();
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(RESPONSIBILITIES_FILE, JSON.stringify(data, null, 2));
}
