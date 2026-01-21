import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_INPUT = path.join(process.cwd(), 'LISTE DES PROCLAMATEURS.txt');
const DEFAULT_OUTPUT = path.join(process.cwd(), 'flutter_app', 'config', 'local_users.json');

const readLines = (filePath: string): string[] => {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^liste\s+des\s+proclameurs/i.test(line));
};

const makePin = (index: number): string => {
  // Deterministic 4-digit PIN from index; avoids collisions for small lists.
  const pin = 1000 + ((index * 37) % 9000);
  return pin.toString().padStart(4, '0');
};

const mapLineToPerson = (line: string, index: number) => {
  const tokens = line.split(/\s+/).filter(Boolean);
  const firstName = tokens[0] ?? '';
  const lastName = tokens.length > 1 ? tokens[tokens.length - 1] : '';
  const middleName = tokens.length > 2 ? tokens.slice(1, -1).join(' ') : '';

  return {
    id: `P-${(index + 1).toString().padStart(4, '0')}`,
    firstName,
    middleName,
    lastName,
    displayName: line,
    pin: makePin(index),
    email1: '',
    email2: '',
    mobilePhone: '',
    gender: '',
    activity: [],
    assignments: {
      services: {},
      ministry: {},
      gems: {},
      christianLife: {},
      weekendMeeting: {},
    },
    spiritual: {
      function: null,
      active: false,
      regular: false,
      group: null,
    },
    meetingParticipation: {},
  };
};

function main() {
  const input = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;
  const output = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_OUTPUT;

  if (!fs.existsSync(input)) {
    console.error(`Input file not found: ${input}`);
    process.exit(1);
  }

  const lines = readLines(input);
  const people = lines.map(mapLineToPerson);

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(people, null, 2), 'utf8');

  console.log(`✔ Exporté ${people.length} utilisateurs vers ${output}`);
}

if (require.main === module) {
  main();
}
