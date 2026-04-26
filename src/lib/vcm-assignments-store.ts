import { blobRead, blobWrite } from './blob-store';

const ASSIGNMENTS_BLOB_PATH = 'data/vcm-assignments.json';
const ASSIGNMENTS_LOCAL_PATH = (() => {
  try {
    const path = require('path');
    return path.join(process.cwd(), 'data', 'vcm-assignments.json');
  } catch {
    return 'data/vcm-assignments.json';
  }
})();

export async function readVcmAssignments(): Promise<any> {
  try {
    const content = await blobRead(ASSIGNMENTS_BLOB_PATH, ASSIGNMENTS_LOCAL_PATH);
    if (!content) return {};
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading VCM assignments:', error);
    return {};
  }
}

export async function writeVcmAssignments(data: any): Promise<void> {
  await blobWrite(ASSIGNMENTS_BLOB_PATH, ASSIGNMENTS_LOCAL_PATH, JSON.stringify(data, null, 2));
}
