/**
 * scripts/hash-password.ts
 *
 * Genere la valeur de SUPER_ADMIN_PASSWORD_HASH.
 *
 *   npx tsx scripts/hash-password.ts
 *
 * Le mot de passe est demande en entree interactive et n'apparait ni dans les
 * arguments de la commande ni dans l'historique du shell.
 */
import { createInterface } from 'readline';
import { hashSecret, serializeSecret } from '../src/lib/tenants/credentials';

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main(): Promise<void> {
  const password = (await ask('Mot de passe super admin : ')).trim();

  if (password.length < 12) {
    console.error('Mot de passe trop court : 12 caracteres minimum.');
    process.exit(1);
  }

  const serialized = serializeSecret(await hashSecret(password));
  console.log('\nAjouter ces deux lignes a .env.local et aux variables Vercel :\n');
  console.log('SUPER_ADMIN_EMAIL=votre@email');
  console.log(`SUPER_ADMIN_PASSWORD_HASH=${serialized}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
