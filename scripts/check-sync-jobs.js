const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'publisher-sync', 'state.db');

try {
  const db = new Database(dbPath, { readonly: true });
  
  console.log('=== Jobs dans la base de données ===\n');
  
  const jobs = db.prepare(`
    SELECT id, type, direction, status, initiator, created_at, updated_at, payload
    FROM publisher_sync_jobs 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all();
  
  if (jobs.length === 0) {
    console.log('❌ AUCUN JOB TROUVÉ dans la base de données');
  } else {
    console.log(`✅ ${jobs.length} jobs trouvés:\n`);
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ID: ${job.id}`);
      console.log(`   Type: ${job.type}`);
      console.log(`   Direction: ${job.direction}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Initiateur: ${job.initiator || 'N/A'}`);
      console.log(`   Créé: ${job.created_at}`);
      console.log(`   Payload: ${job.payload.substring(0, 100)}...`);
      console.log('');
    });
  }
  
  console.log('\n=== Statistiques ===');
  const stats = db.prepare(`
    SELECT 
      direction,
      type,
      status,
      COUNT(*) as count
    FROM publisher_sync_jobs
    GROUP BY direction, type, status
    ORDER BY direction, type
  `).all();
  
  if (stats.length > 0) {
    console.table(stats);
  }
  
  db.close();
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
