const path = require('path');
const fs = require('fs');

const argv = process.argv.slice(2);
const getArg = (k, d) => {
    const a = argv.find(x => x.startsWith(`--${k}`));
    if (!a) return d;
    const [, v] = a.split('=');
    return v || d;
};
const LANG = (getArg('lang') || process.env.VCM_LANG || 'fr').toLowerCase();

try {
    let filePath = path.resolve(process.cwd(), 'public', 'vcm', LANG, 'vcm-program.normalized.json');
    if (!fs.existsSync(filePath)) {
        // Fallback legacy FR
        const legacy = path.resolve(process.cwd(), 'public', 'vcm', 'vcm-program.normalized.json');
        if (fs.existsSync(legacy)) filePath = legacy;
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier non trouvé: ${filePath}`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!data.weeks || !Array.isArray(data.weeks)) {
        throw new Error("Le fichier JSON ne contient pas de tableau 'weeks'.");
    }
    const output = data.weeks.map(w => `${w.weekTitle} -> ${w.startDate}..${w.endDate}`).join('\n');
    console.log("--- Dates extraites du fichier normalisé ---");
    console.log(output);
    console.log("-------------------------------------------");
} catch (e) {
    console.error("ERREUR:", e.message);
}

