const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_INPUT = path.join(process.cwd(), 'people-export.json');
const DEFAULT_OUTPUT = path.join(process.cwd(), 'flutter_app', 'config', 'local_users.json');

const normalizePerson = (person) => {
  const pin = person.pin ? String(person.pin).trim() : '';
  return {
    id: person.id ?? '',
    firstName: person.firstName ?? '',
    middleName: person.middleName ?? '',
    lastName: person.lastName ?? '',
    displayName: person.displayName ?? [person.firstName, person.lastName].filter(Boolean).join(' '),
    pin,
    email1: person.email1 ?? '',
    email2: person.email2 ?? '',
    mobilePhone: person.mobilePhone ?? '',
    gender: person.gender ?? '',
    activity: person.activity ?? [],
    assignments: person.assignments ?? { services: {}, ministry: {}, gems: {}, christianLife: {}, weekendMeeting: {} },
    spiritual: person.spiritual ?? { function: null, active: false, regular: false, group: null },
    meetingParticipation: person.meetingParticipation ?? {},
  };
};

function main() {
  const input = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;
  const output = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_OUTPUT;

  if (!fs.existsSync(input)) {
    console.error(`Fichier source introuvable: ${input}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(input, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('JSON invalide:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('Le fichier doit contenir un tableau de personnes.');
    process.exit(1);
  }

  const people = data.map(normalizePerson);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(people, null, 2), 'utf8');
  console.log(`✔ Synchronisé ${people.length} personnes vers ${output}`);
}

if (require.main === module) {
  main();
}
