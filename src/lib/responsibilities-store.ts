import { blobRead, blobWrite } from './blob-store';

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

const RESP_BLOB_PATH = 'data/responsibilities.json';
const RESP_LOCAL_PATH = (() => {
  try {
    const path = require('path');
    return path.join(process.cwd(), 'data', 'responsibilities.json');
  } catch {
    return 'data/responsibilities.json';
  }
})();

export async function readResponsibilities(): Promise<ResponsibilitiesData> {
  try {
    const content = await blobRead(RESP_BLOB_PATH, RESP_LOCAL_PATH);
    if (!content) {
      return { 
        assignments: [], 
        customResponsibilities: [],
        updatedAt: new Date().toISOString()
      };
    }
    return JSON.parse(content);
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
  data.updatedAt = new Date().toISOString();
  await blobWrite(RESP_BLOB_PATH, RESP_LOCAL_PATH, JSON.stringify(data, null, 2));
}
