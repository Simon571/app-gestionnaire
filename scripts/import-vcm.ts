
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import 'dotenv/config'; // Charge les variables d'environnement depuis .env

const log = (...a: any[]) => console.log("[VCM-Import]", ...a);

const argv = process.argv.slice(2);
const getArg = (k: string, d?: string) => {
    const a = argv.find(x => x.startsWith(`--${k}`));
    if (!a) return d;
    const [, v] = a.split("=");
    return (v || d) as string | undefined;
};
const LANG = (getArg("lang") || process.env.VCM_LANG || "fr").toLowerCase();

// On importe le fichier normalisé par langue depuis public/vcm/<lang>/...
let NORMALIZED_FILE = resolve(process.cwd(), "public", "vcm", LANG, "vcm-program.normalized.json");
if (!existsSync(NORMALIZED_FILE)) {
    // Fallback: legacy FR
    const legacy = resolve(process.cwd(), "public", "vcm", "vcm-program.normalized.json");
    if (existsSync(legacy)) NORMALIZED_FILE = legacy;
}

// Récupère la configuration depuis les variables d'environnement
const API_URL = process.env.VCM_API_URL || 'http://localhost:3000';
const API_SECRET = process.env.VCM_IMPORT_SECRET;

async function importData() {
    log("Lancement de l'importation des données normalisées...");

    if (!API_SECRET) {
        log("Erreur: La variable d'environnement VCM_IMPORT_SECRET n'est pas définie. Veuillez l'ajouter à votre fichier .env");
        process.exit(1);
    }

    let normalizedData;
    try {
        normalizedData = JSON.parse(readFileSync(NORMALIZED_FILE, "utf-8"));
        log(`Fichier normalisé lu avec succès: ${NORMALIZED_FILE}`);
    } catch (e) {
        log(`Erreur: Impossible de lire le fichier de données normalisées ${NORMALIZED_FILE}. Avez-vous lancé la normalisation pour la langue '${LANG}' ?`);
        process.exit(1);
    }

    try {
        const endpoint = `${API_URL}/api/vcm/import`;
        log(`Envoi des données vers l'endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Secret': API_SECRET,
            },
            body: JSON.stringify(normalizedData),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`L'API a retourné une erreur ${response.status}: ${errorBody}`);
        }

        const result = await response.json();
        log("Réponse de l'API:", result.message);
        log("Importation terminée avec succès ✅");

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        log(`Erreur lors de l'envoi des données à l'API: ${errorMessage}`);
        process.exit(1);
    }
}

importData();
