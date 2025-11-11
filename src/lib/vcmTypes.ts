export type VcmItemType =
  | "discours"
  | "demonstration"
  | "lecture"
  | "priere"
  | "cantique"
  | "autre";

export interface VcmItem {
  type: VcmItemType;
  title: string;
  theme?: string;
  duration?: number;
  songNumber?: number;
  scriptures?: string;
  notes?: string[];
}

export interface VcmSection {
  key: "joyaux" | "ministere" | "vie_chretienne" | "cantiques" | "autre" | string;
  title: string;
  items: VcmItem[];
}

export interface VcmWeek {
  weekTitle: string;
  startDate: string;
  endDate: string;
  sourceUrl: string;
  sections: VcmSection[];
}

export interface VcmFile {
  weeks: VcmWeek[];
}