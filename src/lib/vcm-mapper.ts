

// src/lib/vcm-mapper.ts

/**
 * Ce fichier contient la logique pour transformer les données brutes scrapées
 * en une structure de données propre et utilisable par l'application.
 */

const log = (...a: any[]) => console.log("[VCM-Mapper]", ...a);

// --- TYPES DE DONNÉES STRUCTURÉES ---
export interface ProgramItem {
  key: string; // ex: gems-talk-1
  type: 'discours' | 'lecture' | 'demonstration' | 'priere' | 'cantique' | 'autre';
  title: string; // ex: "Discours"
  theme: string; // ex: "Sois courageux et fort, et agis !"
  duration: number | null;
  songNumber?: number;
  scriptures?: string;
}

export interface MappedSection {
  key: 'joyaux' | 'ministere' | 'vie_chretienne' | 'autre';
  title: string;
  items: ProgramItem[];
}

/**
 * Analyse une ligne de texte brut et tente de la convertir en un ProgramItem structuré.
 * C'est le cœur de l'intelligence du système.
 */
function parseRawTextToItem(rawText: string, sectionKey: MappedSection['key'], index: number): ProgramItem | null {
    if (!rawText) return null;

    let type: ProgramItem['type'] = 'autre';
    let title = rawText;
    let theme = '';
    let duration: number | null = null;
    let songNumber: number | undefined;
    let scriptures: string | undefined;

    const durationMatch = rawText.match(/\((\d+)\s+min\)/);
    if (durationMatch) {
        duration = parseInt(durationMatch[1], 10);
    }

    // Détection par mots-clés
    const lowerText = rawText.toLowerCase();
    if (lowerText.startsWith('cantique')) {
        type = 'cantique';
        const songMatch = lowerText.match(/(\d+)/);
        if (songMatch) songNumber = parseInt(songMatch[1], 10);
        title = `Cantique ${songNumber || ''}`.trim();
    } else if (lowerText.includes('prière')) {
        type = 'priere';
        title = 'Prière';
        theme = lowerText.includes('début') ? 'Prière d\'ouverture' : 'Prière de conclusion';
    } else if (lowerText.includes('lecture de la bible')) {
        type = 'lecture';
        title = 'Lecture de la Bible';
        theme = rawText.split(':').slice(1).join(':').trim();
    } else if (lowerText.includes('discours')) {
        type = 'discours';
        title = 'Discours';
        theme = rawText.split(':').slice(1).join(':').trim();
    } else if (sectionKey === 'ministere') {
        type = 'demonstration';
        title = `Démonstration ${index + 1}`;
        theme = rawText;
    } else {
        const parts = rawText.split(':');
        if (parts.length > 1) {
            title = parts[0].trim();
            theme = parts.slice(1).join(':').trim();
        } else {
            title = rawText;
        }
    }

    return {
        key: `${sectionKey}-${type}-${index}`,
        type,
        title,
        theme,
        duration,
        songNumber,
        scriptures,
    };
}

/**
 * Prend les sections brutes du JSON scrapé et les transforme.
 */
export function mapScrapedSectionsToProgram(sections: any[]): MappedSection[] {
    log("Début du mapping des sections brutes.");

    const categorizedSections: MappedSection[] = [
        { key: 'joyaux', title: 'Joyaux de la Parole de Dieu', items: [] },
        { key: 'ministere', title: 'Applique-toi au ministère', items: [] },
        { key: 'vie_chretienne', title: 'Vie chrétienne', items: [] },
        { key: 'autre', title: 'Autres', items: [] },
    ];

    const sectionKeyMap: { [key: string]: MappedSection['key'] } = {
        'joyaux': 'joyaux',
        'applique-toi': 'ministere',
        'vie chrétienne': 'vie_chretienne',
    };

    for (const rawSection of sections) {
        const lowerTitle = (rawSection.title || '').toLowerCase();
        let targetKey: MappedSection['key'] = 'autre';

        for (const key in sectionKeyMap) {
            if (lowerTitle.includes(key)) {
                targetKey = sectionKeyMap[key];
                break;
            }
        }

        const targetSection = categorizedSections.find(s => s.key === targetKey);
        if (targetSection && rawSection.items) {
            rawSection.items.forEach((rawItem: string, index: number) => {
                const parsedItem = parseRawTextToItem(rawItem, targetKey, index);
                if (parsedItem) {
                    targetSection.items.push(parsedItem);
                }
            });
        }
    }

    log("Mapping terminé.");
    return categorizedSections.filter(s => s.items.length > 0);
}
