/**
 * Dicionário de Traduções SRD (System Reference Document) para Português (pt-BR).
 * Mapeia identificadores, nomes em inglês e slugs para suas respectivas traduções canônicas de D&D 5e / 2024.
 */

export const CLASS_NAMES_PT: Record<string, string> = {
  Barbarian: "Bárbaro",
  Bard: "Bardo",
  Cleric: "Clérigo",
  Druid: "Druida",
  Fighter: "Guerreiro",
  Monk: "Monge",
  Paladin: "Paladino",
  Ranger: "Guardião",
  Rogue: "Ladino",
  Sorcerer: "Feiticeiro",
  Warlock: "Bruxo",
  Wizard: "Mago",
};

export const RACE_NAMES_PT: Record<string, string> = {
  Human: "Humano",
  Elf: "Elfo",
  Dwarf: "Anão",
  Halfling: "Halfling",
  Dragonborn: "Draconato",
  Gnome: "Gnomo",
  "Half-Elf": "Meio-Elfo",
  "Half-Orc": "Meio-Orc",
  Tiefling: "Tiefling",
};

export const BACKGROUND_NAMES_PT: Record<string, string> = {
  Acolyte: "Acólito",
  Criminal: "Criminoso",
  "Folk Hero": "Herói do Povo",
  Noble: "Nobre",
  Sage: "Sábio",
  Soldier: "Soldado",
};

export const SKILL_NAMES_PT: Record<string, string> = {
  ATHLETICS: "Atletismo",
  Athletics: "Atletismo",
  ACROBATICS: "Acrobacia",
  Acrobatics: "Acrobacia",
  SLEIGHT_OF_HAND: "Prestidigitação",
  "Sleight of Hand": "Prestidigitação",
  STEALTH: "Furtividade",
  Stealth: "Furtividade",
  ARCANA: "Arcanismo",
  Arcana: "Arcanismo",
  HISTORY: "História",
  History: "História",
  INVESTIGATION: "Investigação",
  Investigation: "Investigação",
  NATURE: "Natureza",
  Nature: "Natureza",
  RELIGION: "Religião",
  Religion: "Religião",
  ANIMAL_HANDLING: "Adestramento",
  "Animal Handling": "Adestramento",
  INSIGHT: "Intuição",
  Insight: "Intuição",
  MEDICINE: "Medicina",
  Medicine: "Medicina",
  PERCEPTION: "Percepção",
  Perception: "Percepção",
  SURVIVAL: "Sobrevivência",
  Survival: "Sobrevivência",
  DECEPTION: "Enganação",
  Deception: "Enganação",
  INTIMIDATION: "Intimidação",
  Intimidation: "Intimidação",
  PERFORMANCE: "Atuação",
  Performance: "Atuação",
  PERSUASION: "Persuasão",
  Persuasion: "Persuasão",
};

export const SPELL_NAMES_PT: Record<string, string> = {
  "Cure Wounds": "Curar Ferimentos",
  "Healing Word": "Palavra de Cura",
  "Magic Missile": "Mísseis Mágicos",
  Shield: "Escudo Arcano",
  Fireball: "Bola de Fogo",
  MageArmor: "Armadura Arcana",
  "Mage Armor": "Armadura Arcana",
  Guidance: "Orientação",
  Light: "Luz",
  SacredFlame: "Chama Sagrada",
  "Sacred Flame": "Chama Sagrada",
  Thaumaturgy: "Taumaturgia",
};

export const ORIGIN_FEAT_NAMES_PT: Record<string, string> = {
  "Alert": "Alerta",
  "Crafter": "Artesão",
  "Healer": "Curandeiro",
  "Lucky": "Sortudo",
  "Magic Initiate": "Iniciado em Magia",
  "Magic Initiate (Cleric)": "Iniciado em Magia (Clérigo)",
  "Magic Initiate (Druid)": "Iniciado em Magia (Druida)",
  "Magic Initiate (Wizard)": "Iniciado em Magia (Mago)",
  "Musician": "Músico",
  "Savage Attacker": "Atacante Selvagem",
  "Skilled": "Perito",
  "Tough": "Robusto",
};

/**
 * Traduz uma chave/nome SRD com fallback transparente para o texto original se não houver mapeamento.
 */
export function translateSrd(key: string | null | undefined, dictionary: Record<string, string>): string {
  if (!key) return "";
  return dictionary[key] ?? key;
}

/**
 * Tradutor universal de entidade de referência.
 */
export function translateReferenceName(name: string | null | undefined): string {
  if (!name) return "";
  return (
    CLASS_NAMES_PT[name] ||
    RACE_NAMES_PT[name] ||
    BACKGROUND_NAMES_PT[name] ||
    SKILL_NAMES_PT[name] ||
    ORIGIN_FEAT_NAMES_PT[name] ||
    SPELL_NAMES_PT[name] ||
    name
  );
}
