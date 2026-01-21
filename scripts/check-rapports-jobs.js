const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'publisher-sync', 'state.db');

try {
  const db = new Database(dbPath, { readonly: true });
  
  console.log('=== Jobs RAPPORTS par statut ===\n');
  
  const stats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count,
      MAX(created_at) as last_created
    FROM publisher_sync_jobs
    WHERE type = 'rapports' AND direction = 'mobile_to_desktop'
    GROUP BY status
    ORDER BY status
  `).all();
  
  console.table(stats);
  
  console.log('\n=== 5 derniers jobs RAPPORTS ===\n');
  
  const recent = db.prepare(`
    SELECT id, status, initiator, created_at, updated_at, payload
    FROM publisher_sync_jobs 
    WHERE type = 'rapports' AND direction = 'mobile_to_desktop'
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();
  
  recent.forEach((job, index) => {
    console.log(`${index + 1}. Créé: ${job.created_at}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Mis à jour: ${job.updated_at}`);
    console.log(`   Initiateur: ${job.initiator}`);
    const payload = JSON.parse(job.payload);
    console.log(`   User: ${payload.userName}, Month: ${payload.month}`);
    console.log('');
  });
  
  db.close();
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
