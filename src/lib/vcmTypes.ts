export type VcmItemType =
  | "discours"
  | "demonstration"
  | "lecture"
  | "priere"
  | "cantique"
  | "autre";

export interface VcmItem {
  id?: string;
  type: VcmItemType;
  title: string;
  theme?: string;
  duration?: number;
  songNumber?: number;
  scriptures?: string;
  notes?: string[];
  number?: number | null;
  category?: string;
  description?: string;
  // Champ pour stocker l'assignation d'une personne à cet item
  personId?: string | null;
}

export interface VcmSection {
  key: "joyaux" | "ministere" | "vie_chretienne" | "cantiques" | "autre" | string;
  title: string;
  items: VcmItem[];
}

export interface VcmWeek {
  weekTitle: string;
  startDate: string | null;
  endDate: string | null;
  sourceUrl: string;
  sections: VcmSection[];
}

export interface VcmFile {
  weeks: VcmWeek[];
}