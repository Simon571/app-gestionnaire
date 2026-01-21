/**
 * Script pour extraire les familles et groupes de prédication existants
 * à partir des données publisher-users.json et les sauvegarder dans des fichiers JSON dédiés.
 * 
 * Usage: node scripts/extract-groups-families.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'publisher-users.json');
const FAMILIES_FILE = path.join(DATA_DIR, 'families.json');
const GROUPS_FILE = path.join(DATA_DIR, 'preaching-groups.json');

function main() {
  // Lire le fichier des utilisateurs
  if (!fs.existsSync(USERS_FILE)) {
    console.error('Fichier publisher-users.json non trouvé');
    process.exit(1);
  }

  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  console.log(`Lu ${users.length} utilisateurs`);

  // Extraire les familles uniques
  const familiesMap = new Map();
  users.forEach(user => {
    if (user.familyId) {
      // Utiliser le nom de famille comme nom de la famille (lastName de chef de famille préféré)
      if (!familiesMap.has(user.familyId)) {
        const familyName = user.isHeadOfFamily 
          ? `Famille ${user.lastName}` 
          : `Famille ${user.familyId.replace('fam-', '')}`;
        familiesMap.set(user.familyId, { id: user.familyId, name: familyName });
      } else if (user.isHeadOfFamily) {
        // Mettre à jour le nom si c'est le chef de famille
        familiesMap.set(user.familyId, { id: user.familyId, name: `Famille ${user.lastName}` });
      }
    }
  });

  const families = Array.from(familiesMap.values());
  console.log(`Extrait ${families.length} familles`);

  // Extraire les groupes de prédication uniques
  const groupsMap = new Map();
  users.forEach(user => {
    if (user.spiritual && user.spiritual.group) {
      const groupId = user.spiritual.group;
      const groupName = user.spiritual.groupName || `Groupe ${groupId.replace('group-', '')}`;
      
      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, { id: groupId, name: groupName });
      } else if (user.spiritual.groupName && !groupsMap.get(groupId).name.includes(user.spiritual.groupName)) {
        // Préférer un nom explicite
        if (user.spiritual.groupName && user.spiritual.groupName.trim()) {
          groupsMap.set(groupId, { id: groupId, name: user.spiritual.groupName });
        }
      }
    }
  });

  const groups = Array.from(groupsMap.values());
  console.log(`Extrait ${groups.length} groupes de prédication`);

  // Sauvegarder les fichiers
  fs.writeFileSync(FAMILIES_FILE, JSON.stringify(families, null, 2));
  console.log(`Familles sauvegardées dans ${FAMILIES_FILE}`);

  fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2));
  console.log(`Groupes sauvegardés dans ${GROUPS_FILE}`);

  // Afficher le résumé
  console.log('\n=== Résumé ===');
  console.log('Familles:');
  families.forEach(f => console.log(`  - ${f.name} (${f.id})`));
  console.log('\nGroupes de prédication:');
  groups.forEach(g => console.log(`  - ${g.name} (${g.id})`));
}

main();
