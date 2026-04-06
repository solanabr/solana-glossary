// Shared personality metadata — imported by hero-section + game-results-overlay

export interface PersonalityMeta {
  id: string;
  name: string;
  emoji: string;
  color: string;
  shadow: string;
  shortDesc: string;
  desc: string;
}

export const PERSONALITIES: PersonalityMeta[] = [
  {
    id: "maid",
    name: "Maid-chan",
    emoji: "\u{1F380}",
    color: "#00FFFF",
    shadow: "rgba(0,255,255,0.4)",
    shortDesc: "Kawaii",
    desc: "Cute anime-style explanations with uwu energy",
  },
  {
    id: "dm",
    name: "DnD Master",
    emoji: "\u{1F409}",
    color: "#BD00FF",
    shadow: "rgba(189,0,255,0.4)",
    shortDesc: "Epic",
    desc: "Fantasy RPG narrative like a dungeon master",
  },
  {
    id: "degen",
    name: "Degen Sensei",
    emoji: "\u{1F98D}",
    color: "#14F195",
    shadow: "rgba(20,241,149,0.4)",
    shortDesc: "Based",
    desc: "Crypto degen slang and meme-heavy vibes",
  },
  {
    id: "glados",
    name: "GLaDOS",
    emoji: "\u{1F916}",
    color: "#FF003F",
    shadow: "rgba(255,0,63,0.4)",
    shortDesc: "Savage",
    desc: "Cold, sarcastic AI with backhanded compliments",
  },
];
