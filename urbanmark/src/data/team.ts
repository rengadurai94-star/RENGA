export interface TeamMember {
  name: string;
  role: string;
  seed: string;
}

export const team: TeamMember[] = [
  { name: "Nora Lindqvist", role: "Founder & Principal Designer", seed: "team-nora" },
  { name: "Théo Marchand", role: "Head of Interior Architecture", seed: "team-theo" },
  { name: "Priya Nair", role: "Senior Designer", seed: "team-priya" },
  { name: "Sam Whitfield", role: "Materials & Sourcing Lead", seed: "team-sam" },
];
