// Bundled team-strength prior for national teams (2026 World Cup pool + majors).
//
// Each team carries a multiplicative attack and defense rating (league avg = 1.0):
//   att  > 1  -> scores more than average
//   def  < 1  -> concedes fewer than average (lower = better defense)
// These are transparent priors derived from recent international form / rankings.
// They ship in-repo so Sharp answers instantly with no external key; they are
// meant to be recalibrated from live xG data (see docs/METHODOLOGY.md).

export interface TeamRating {
  name: string;
  att: number;
  def: number;
  aliases?: string[];
}

export const TEAMS: TeamRating[] = [
  // Elite
  { name: "Argentina", att: 1.38, def: 0.74 },
  { name: "France", att: 1.4, def: 0.76 },
  { name: "Spain", att: 1.36, def: 0.78 },
  { name: "England", att: 1.32, def: 0.75 },
  { name: "Brazil", att: 1.37, def: 0.79 },
  { name: "Portugal", att: 1.3, def: 0.82 },
  { name: "Netherlands", att: 1.26, def: 0.82 },
  { name: "Germany", att: 1.28, def: 0.85 },
  // Strong
  { name: "Italy", att: 1.15, def: 0.8 },
  { name: "Belgium", att: 1.18, def: 0.9 },
  { name: "Croatia", att: 1.1, def: 0.88 },
  { name: "Uruguay", att: 1.14, def: 0.86 },
  { name: "Colombia", att: 1.12, def: 0.88 },
  { name: "Morocco", att: 1.08, def: 0.82 },
  { name: "Denmark", att: 1.08, def: 0.9 },
  { name: "Switzerland", att: 1.02, def: 0.88 },
  { name: "USA", att: 1.05, def: 0.95, aliases: ["United States", "United States of America", "USMNT"] },
  { name: "Mexico", att: 1.06, def: 0.94 },
  { name: "Japan", att: 1.08, def: 0.9 },
  { name: "Senegal", att: 1.05, def: 0.9 },
  // Mid
  { name: "Poland", att: 1.0, def: 1.0 },
  { name: "Serbia", att: 1.04, def: 1.0 },
  { name: "Ecuador", att: 0.98, def: 0.92 },
  { name: "Ivory Coast", att: 1.0, def: 0.98, aliases: ["Côte d'Ivoire", "Cote d'Ivoire"] },
  { name: "Nigeria", att: 1.04, def: 0.98 },
  { name: "South Korea", att: 1.02, def: 0.98, aliases: ["Korea Republic", "Korea"] },
  { name: "Australia", att: 0.95, def: 0.98, aliases: ["Socceroos"] },
  { name: "Ukraine", att: 1.0, def: 0.96 },
  { name: "Sweden", att: 1.0, def: 0.95 },
  { name: "Austria", att: 1.02, def: 0.95 },
  { name: "Canada", att: 1.0, def: 0.98 },
  { name: "Ghana", att: 0.98, def: 1.02 },
  { name: "Cameroon", att: 0.98, def: 1.0 },
  { name: "Peru", att: 0.9, def: 1.0 },
  { name: "Chile", att: 0.95, def: 0.98 },
  { name: "Egypt", att: 0.98, def: 0.95 },
  { name: "Tunisia", att: 0.9, def: 0.98 },
  { name: "Turkey", att: 1.05, def: 0.98, aliases: ["Türkiye"] },
  { name: "Norway", att: 1.1, def: 0.95 },
  // Lower
  { name: "Qatar", att: 0.85, def: 1.1 },
  { name: "Saudi Arabia", att: 0.85, def: 1.08 },
  { name: "Iran", att: 0.92, def: 0.98 },
  { name: "Costa Rica", att: 0.85, def: 1.05 },
  { name: "Panama", att: 0.85, def: 1.08 },
  { name: "Jamaica", att: 0.88, def: 1.08 },
  { name: "New Zealand", att: 0.82, def: 1.1 },
  { name: "South Africa", att: 0.9, def: 1.02 },
  { name: "Algeria", att: 0.98, def: 0.98 },
  { name: "Paraguay", att: 0.88, def: 1.0 },
  { name: "Scotland", att: 0.95, def: 1.0 },
  { name: "Wales", att: 0.92, def: 1.0 },
  { name: "Greece", att: 0.95, def: 0.95 },
  { name: "Uzbekistan", att: 0.85, def: 1.05 },
  { name: "Jordan", att: 0.82, def: 1.08 },
  { name: "Cape Verde", att: 0.85, def: 1.05 },
  { name: "Curaçao", att: 0.82, def: 1.1 },
];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const INDEX = new Map<string, TeamRating>();
for (const t of TEAMS) {
  INDEX.set(normalize(t.name), t);
  for (const a of t.aliases ?? []) INDEX.set(normalize(a), t);
}

export interface ResolvedTeam {
  rating: TeamRating;
  matched: boolean;
  displayName: string;
}

/** Resolve a free-text team name to a rating; unknown teams get a neutral prior. */
export function resolveTeam(name: string): ResolvedTeam {
  const hit = INDEX.get(normalize(name));
  if (hit) return { rating: hit, matched: true, displayName: hit.name };
  return { rating: { name, att: 1.0, def: 1.0 }, matched: false, displayName: name };
}
