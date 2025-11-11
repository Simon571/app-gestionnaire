// Types pour les données du cahier VCM
export interface VcmWeekData {
  weekPeriod: string; // "15-21 septembre"
  book: string; // "PROVERBES 31"
  sections: {
    joyaux: VcmJoyauxSection;
    ministry: VcmMinistrySection;
    life: VcmLifeSection;
  };
}

export interface VcmJoyauxSection {
  title: "JOYAUX DE LA PAROLE DE DIEU";
  parts: VcmPart[];
}

export interface VcmMinistrySection {
  title: "APPLIQUE-TOI AU MINISTÈRE";
  parts: VcmPart[];
}

export interface VcmLifeSection {
  title: "VIE CHRÉTIENNE";
  parts: VcmPart[];
}

export interface VcmPart {
  id: string;
  number: number; // 1, 2, 3...
  title: string;
  duration: number; // en minutes
  type: VcmPartType;
  description?: string;
  reference?: string; // Ex: "Pr 31:10-31"
  lesson?: string; // Ex: "(th leçon 10)"
  category?: string; // "TÉMOIGNAGE INFORMEL", "DE MAISON EN MAISON"
}

export type VcmPartType = 
  | "discours_principal"      // Des leçons tirées...
  | "perles_spirituelles"     // Perles spirituelles
  | "lecture_bible"           // Lecture de la Bible
  | "engage_conversation"     // Engage la conversation
  | "entretiens_interet"      // Entretiens l'intérêt
  | "premiere_visite"         // Première visite
  | "nouvelle_visite"         // Nouvelle visite
  | "cours_biblique"          // Cours biblique
  | "partie_vie_chretienne"   // Parties vie chrétienne génériques
  | "besoins_assemblee"       // Besoins de l'assemblée
  | "etude_biblique"          // Étude biblique de l'assemblée
  | "discussion";             // Discussion

// Service d'importation automatique
export class VcmImportService {
  private static instance: VcmImportService;
  
  static getInstance(): VcmImportService {
    if (!this.instance) {
      this.instance = new VcmImportService();
    }
    return this.instance;
  }

  // Parser le texte brut du cahier VCM
  parseVcmText(rawText: string): VcmWeekData {
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extraire la période et le livre
    const firstLine = lines[0];
    const secondLine = lines[1];
    
    const weekPeriod = firstLine.replace('SEMAINE DU ', '');
    const book = secondLine;

    const sections = {
      joyaux: this.parseJoyauxSection(lines),
      ministry: this.parseMinistrySection(lines),
      life: this.parseLifeSection(lines)
    };

    return {
      weekPeriod,
      book,
      sections
    };
  }

  private parseJoyauxSection(lines: string[]): VcmJoyauxSection {
    const startIndex = lines.findIndex(line => line.includes("JOYAUX DE LA PAROLE"));
    const endIndex = lines.findIndex(line => line.includes("APPLIQUE-TOI AU MINISTÈRE"));
    
    const sectionLines = lines.slice(startIndex + 1, endIndex);
    const parts: VcmPart[] = [];

    sectionLines.forEach((line, index) => {
      if (line.match(/^\d+\./)) {
        const match = line.match(/^(\d+)\.\s*(.+?)\s*\((\d+)\s*min\)/);
        if (match) {
          const [, number, title, duration] = match;
          
          let type: VcmPartType = "partie_vie_chretienne";
          if (title.toLowerCase().includes("leçons tirées")) {
            type = "discours_principal";
          } else if (title.toLowerCase().includes("perles spirituelles")) {
            type = "perles_spirituelles";
          } else if (title.toLowerCase().includes("lecture de la bible")) {
            type = "lecture_bible";
          }

          parts.push({
            id: `joyaux_${number}`,
            number: parseInt(number),
            title: title.trim(),
            duration: parseInt(duration),
            type,
            reference: this.extractReference(line),
            lesson: this.extractLesson(line)
          });
        }
      }
    });

    return {
      title: "JOYAUX DE LA PAROLE DE DIEU",
      parts
    };
  }

  private parseMinistrySection(lines: string[]): VcmMinistrySection {
    const startIndex = lines.findIndex(line => line.includes("APPLIQUE-TOI AU MINISTÈRE"));
    const endIndex = lines.findIndex(line => line.includes("VIE CHRÉTIENNE"));
    
    const sectionLines = lines.slice(startIndex + 1, endIndex);
    const parts: VcmPart[] = [];

    let currentPart: Partial<VcmPart> | null = null;

    sectionLines.forEach((line) => {
      if (line.match(/^\d+\./)) {
        // Nouvelle partie
        const match = line.match(/^(\d+)\.\s*(.+?)\s*\((\d+)\s*min\)/);
        if (match) {
          const [, number, title, duration] = match;
          
          let type: VcmPartType = "partie_vie_chretienne";
          if (title.toLowerCase().includes("engage la conversation")) {
            type = "engage_conversation";
          } else if (title.toLowerCase().includes("entretiens l'intérêt")) {
            type = "entretiens_interet";
          }

          currentPart = {
            id: `ministry_${number}`,
            number: parseInt(number),
            title: title.trim(),
            duration: parseInt(duration),
            type
          };
        }
      } else if (currentPart && line.length > 0) {
        // Description ou catégorie
        if (line.includes("TÉMOIGNAGE INFORMEL") || line.includes("DE MAISON EN MAISON")) {
          currentPart.category = line;
        } else {
          currentPart.description = (currentPart.description || '') + ' ' + line;
        }
      }

      // Si on a une partie complète, l'ajouter
      if (currentPart && (line.match(/^\d+\./) && parts.length > 0)) {
        parts.push(currentPart as VcmPart);
        currentPart = null;
      }
    });

    // Ajouter la dernière partie
    if (currentPart) {
      parts.push(currentPart as VcmPart);
    }

    return {
      title: "APPLIQUE-TOI AU MINISTÈRE",
      parts
    };
  }

  private parseLifeSection(lines: string[]): VcmLifeSection {
    const startIndex = lines.findIndex(line => line.includes("VIE CHRÉTIENNE"));
    
    const sectionLines = lines.slice(startIndex + 1);
    const parts: VcmPart[] = [];

    sectionLines.forEach((line) => {
      if (line.match(/^\d+\./)) {
        const match = line.match(/^(\d+)\.\s*(.+?)\s*\((\d+)\s*min\)/);
        if (match) {
          const [, number, title, duration] = match;
          
          let type: VcmPartType = "partie_vie_chretienne";
          if (title.toLowerCase().includes("besoins de l'assemblée")) {
            type = "besoins_assemblee";
          } else if (title.toLowerCase().includes("étude biblique")) {
            type = "etude_biblique";
          } else if (title.toLowerCase().includes("discussion")) {
            type = "discussion";
          }

          parts.push({
            id: `life_${number}`,
            number: parseInt(number),
            title: title.trim(),
            duration: parseInt(duration),
            type,
            description: this.extractDescription(line)
          });
        }
      }
    });

    return {
      title: "VIE CHRÉTIENNE",
      parts
    };
  }

  private extractReference(text: string): string | undefined {
    const match = text.match(/([A-Z][a-z]*\s+\d+:\d+-\d+)/);
    return match ? match[1] : undefined;
  }

  private extractLesson(text: string): string | undefined {
    const match = text.match(/\(([^)]+leçon[^)]+)\)/);
    return match ? match[1] : undefined;
  }

  private extractDescription(text: string): string | undefined {
    // Extraire le texte après le titre principal
    const parts = text.split('.');
    return parts.length > 1 ? parts.slice(1).join('.').trim() : undefined;
  }

  // Sauvegarder les données parsées
  saveVcmWeek(weekDate: Date, vcmData: VcmWeekData): void {
    const key = `vcm-${weekDate.toISOString().split('T')[0]}`;
    localStorage.setItem(key, JSON.stringify(vcmData));
  }

  // Charger les données sauvegardées
  loadVcmWeek(weekDate: Date): VcmWeekData | null {
    const key = `vcm-${weekDate.toISOString().split('T')[0]}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }

  // Importer depuis un fichier texte
  async importFromFile(file: File): Promise<VcmWeekData> {
    const text = await file.text();
    return this.parseVcmText(text);
  }

  // Mock: Simuler l'importation depuis jw.org
  async importFromJwOrg(year: number, month: number): Promise<VcmWeekData[]> {
    // TODO: Implémenter l'appel API réel vers jw.org
    // Pour l'instant, retourner des données de test
    
    console.log(`Importation depuis jw.org pour ${year}-${month}`);
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Retourner des données de test
    return [
      this.parseVcmText(`SEMAINE DU 15-21 septembre
PROVERBES 31

I. JOYAUX DE LA PAROLE DE DIEU

1. Des leçons tirées de conseils bienveillants d'une mère  (10 min)
2. Perles spirituelles   (10 min)
3. Lecture de la Bible  (4 min) 
Pr 31:10-31 (th leçon 10).

II. APPLIQUE-TOI AU MINISTÈRE

4. Engage la conversation  (3 min) 
TÉMOIGNAGE INFORMEL. Engage la conversation avec une personne qui vient de dire ou de faire quelque chose de gentil (lmd leçon 5 idée 3).
5. Engage la conversation (4 min) 
DE MAISON EN MAISON. Communique une des « Vérités bibliques toutes simples » listées dans l'appendice A de la brochure Aime les gens (lmd leçon 1 idée 4).
6. Entretiens l'intérêt  (5 min) 
DE MAISON EN MAISON. Invite une personne qui a accepté La Tour de Garde no 1 2025 à assister au discours spécial qui aura lieu prochainement (lmd leçon 7 idée 4).

III. VIE CHRÉTIENNE

7. Aidez vos enfants à utiliser les appareils mobiles avec sagesse (8 min). 
Discussion.
8. Besoins de l'assemblée  (7 min)
9. Étude biblique de l'assemblée  (30 min) 
lfb histoires 18-19.`)
    ];
  }
}

export default VcmImportService;