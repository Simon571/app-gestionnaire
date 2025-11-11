import { readFileSync } from "fs";
import * as path from "path";
import { z } from "zod";

const argv = process.argv.slice(2);
const getArg = (k: string, d?: string) => {
  const a = argv.find(x => x.startsWith(`--${k}`));
  if (!a) return d;
  const [, v] = a.split("=");
  return (v || d) as string | undefined;
};
const LANG = (getArg("lang") || process.env.VCM_LANG || "fr").toLowerCase();

// Schéma du fichier normalisé
const VcmItem = z.object({
  type: z.string(),
  title: z.string(),
  theme: z.string(),
  duration: z.number().int().nonnegative().optional(),
  songNumber: z.number().int().positive().max(200).optional(),
  scriptures: z.string().optional(),
});

const VcmSection = z.object({
  key: z.enum(["joyaux", "ministere", "vie_chretienne", "cantiques", "autre"]),
  title: z.string(),
  items: z.array(VcmItem),
});

const VcmWeek = z.object({
  weekTitle: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  sourceUrl: z.string().url().or(z.string()),
  sections: z.array(VcmSection),
});

const VcmProgram = z.object({ weeks: z.array(VcmWeek) });

function main() {
  const filePath = path.resolve(process.cwd(), "public", "vcm", LANG, "vcm-program.normalized.json");
  console.log("[VCM-Validate] Lecture:", filePath);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const res = VcmProgram.safeParse(raw);
  if (!res.success) {
    console.error("[VCM-Validate] Erreurs de validation:");
    console.error(JSON.stringify(res.error.format(), null, 2));
    process.exit(1);
  }
  console.log(`[VCM-Validate] OK: ${res.data.weeks.length} semaine(s) valides pour '${LANG}'.`);
}

main();
