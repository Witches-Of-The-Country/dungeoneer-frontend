/**
 * Dicionário de Traduções SRD (System Reference Document) para Português (pt-BR).
 * Mapeia identificadores, nomes em inglês e slugs para suas respectivas traduções canônicas de D&D 5e / 2024.
 */

export const ABILITY_NAMES_PT: Record<string, string> = {
  STRENGTH: "Força",
  Strength: "Força",
  STR: "Força",
  DEXTERITY: "Destreza",
  Dexterity: "Destreza",
  DEX: "Destreza",
  CONSTITUTION: "Constituição",
  Constitution: "Constituição",
  CON: "Constituição",
  INTELLIGENCE: "Inteligência",
  Intelligence: "Inteligência",
  INT: "Inteligência",
  WISDOM: "Sabedoria",
  Wisdom: "Sabedoria",
  WIS: "Sabedoria",
  CHARISMA: "Carisma",
  Charisma: "Carisma",
  CHA: "Carisma",
};

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
  Artificer: "Artífice",
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
  Acrobacia: "Acrobacia",
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
  Intimidação: "Intimidação",
  Intimidacao: "Intimidação",
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
  Alert: "Alerta",
  Crafter: "Artesão",
  Healer: "Curandeiro",
  Lucky: "Sortudo",
  "Magic Initiate": "Iniciado em Magia",
  "Magic Initiate (Cleric)": "Iniciado em Magia (Clérigo)",
  "Magic Initiate (Druid)": "Iniciado em Magia (Druida)",
  "Magic Initiate (Wizard)": "Iniciado em Magia (Mago)",
  Musician: "Músico",
  "Savage Attacker": "Atacante Selvagem",
  Skilled: "Perito",
  Tough: "Robusto",
};

export const TRAIT_NAMES_PT: Record<string, string> = {
  "Extra Language": "Idioma Adicional",
  Darkvision: "Visão no Escuro",
  "Keen Senses": "Sentidos Aguçados",
  "Fey Ancestry": "Ancestralidade Feérica",
  Trance: "Transe",
  "Dwarven Resilience": "Resiliência Anã",
  "Dwarven Combat Training": "Treinamento Anão em Combate",
  "Dwarven Toughness": "Robustez Anã",
  Stonecunning: "Conhecimento de Pedra",
  Lucky: "Sortudo",
  Luck: "Sorte",
  Brave: "Bravura",
  "Halfling Nimbleness": "Agilidade Halfling",
  "Naturally Stealthy": "Naturalmente Furtivo",
  "Gnome Cunning": "Esperteza Gnômica",
  "Gnomish Cunning": "Esperteza Gnômica",
  "Gnomish Lineage": "Linhagem Gnômica",
  "Skill Versatility": "Versatilidade em Perícias",
  Menacing: "Ameaçador",
  "Relentless Endurance": "Resistência Implacável",
  "Savage Attacks": "Ataques Selvagens",
  "Hellish Resistance": "Resistência Infernal",
  "Infernal Legacy": "Legado Infernal",
  "Fiendish Legacy": "Legado Demoníaco",
  "Otherworldly Presence": "Presença Sobrenatural",
  "Draconic Ancestry": "Ancestralidade Dracônica",
  "Breath Weapon": "Arma de Sopro",
  "Damage Resistance": "Resistência a Dano",
  "Draconic Flight": "Voo Dracônico",
  Resourceful: "Engenhoso",
  Skillful: "Habilidoso",
  Versatile: "Versátil",
  "Elven Lineage": "Linhagem Élfica",
  "Versatile Lineage": "Linhagem Versátil",
};

export const EQUIPMENT_PROFICIENCIES_PT: Record<string, string> = {
  LIGHT: "Armadura Leve",
  "Light armor": "Armaduras leves",
  "Light Armor": "Armaduras leves",
  MEDIUM: "Armadura Média",
  "Medium armor": "Armaduras médias",
  "Medium Armor": "Armaduras médias",
  HEAVY: "Armadura Pesada",
  "Heavy armor": "Armaduras pesadas",
  "Heavy Armor": "Armaduras pesadas",
  ALL_ARMOR: "Todas as Armaduras",
  "All armor": "Todas as armaduras",
  "All Armor": "Todas as armaduras",
  SHIELDS: "Escudos",
  Shields: "Escudos",
  Shield: "Escudos",
  SIMPLE: "Armas Simples",
  "Simple weapons": "Armas simples",
  "Simple Weapons": "Armas simples",
  MARTIAL: "Armas Marciais",
  "Martial weapons": "Armas marciais",
  "Martial Weapons": "Armas marciais",
  HAND_CROSSBOW: "Besta de Mão",
  LONGSWORD: "Espada Longa",
  RAPIER: "Rapieira",
  SHORTSWORD: "Espada Curta",
  CLUBS: "Clavas",
  DAGGERS: "Adagas",
  DARTS: "Dardos",
  JAVELINS: "Azagaias",
  MACES: "Maças",
  QUARTERSTAFFS: "Bordões",
  SCIMITARS: "Cimitarras",
  SICKLES: "Foices",
  SLINGS: "Fundas",
  SPEARS: "Lanças",
  LIGHT_CROSSBOWS: "Bestas Leves",
  THIEVES_TOOLS: "Ferramentas de Ladrão",
  GAMING_SET: "Kit de Jogos",
  ARTISANS_TOOLS: "Ferramentas de Artesão",
  VEHICLES_LAND: "Veículos Terrestres",
  CALLIGRAPHERS_SUPPLIES: "Suprimentos de Calígrafo",
};

export const DESCRIPTIONS_PT: Record<string, string> = {
  // Background descriptions
  "You have spent your life in the service of a temple to a specific god or pantheon of gods.":
    "Você passou sua vida a serviço de um templo dedicado a um deus específico ou a um panteão de deuses.",
  "Devoted to service in a holy sanctuary, skilled in divine rites and rituals.":
    "Dedicado ao serviço em um santuário sagrado, perito em ritos e rituais divinos.",
  "You are an experienced criminal with a history of breaking the law and surviving in the shadows.":
    "Você é um criminoso experiente com histórico de quebrar a lei e sobreviver nas sombras.",
  "Surviving on illicit deeds, lockpicking, and connections in the criminal underworld.":
    "Sobrevivendo através de atos ilícitos, arrombamento de fechaduras e conexões no submundo do crime.",
  "You come from a humble social rank, but you are destined for so much more.":
    "Você vem de uma classe social humilde, mas está destinado a muito mais.",
  "A champion of commoners who stood against tyranny, gifted with rugged grit.":
    "Um campeão do povo que resistiu à tirania, dotado de determinação rústica.",
  "You understand wealth, power, and privilege. You carry a noble title, and your family owns land.":
    "Você compreende riqueza, poder e privilégio. Possui um título de nobreza e sua família possui terras.",
  "Heir to high station and politics, tutored in leadership and fine etiquette.":
    "Herdeiro de alta posição e diplomacia, instruído em liderança e etiqueta refinada.",
  "You spent years learning the lore of the multiverse, scouring manuscripts and studying scrolls.":
    "Você dedicou anos aprendendo o conhecimento do multiverso, vasculhando manuscritos e estudando pergaminhos.",
  "Dedicated to archival research, deciphering arcane secrets, and ancient history.":
    "Dedicado à pesquisa de arquivos, decifrando segredos arcanos e história antiga.",
  "War has been your life for as long as you can remember. You trained as a youth in military tactics.":
    "A guerra tem sido sua vida desde que você se lembra. Treinou desde jovem em táticas militares.",
  "Trained soldier hardened in battle formations, physical conditioning, and tactical prowess.":
    "Soldado treinado e endurecido em formações de batalha, condicionamento físico e proeza tática.",

  // Lineage descriptions
  "Adaptable and ambitious, humans are innovators and achievers.":
    "Adaptáveis e ambiciosos, humanos são inovadores e realizadores.",
  "Found throughout the multiverse, humans display extraordinary adaptability and resilience.":
    "Presentes em todo o multiverso, os humanos exibem extraordinária adaptabilidade e resiliência.",
  "Magical people of otherworldly grace, living in the world but not entirely part of it.":
    "Povo mágico de graça sobrenatural, vivendo no mundo mas não sendo inteiramente parte dele.",
  "Tracing ancestry to the Feywild, elves possess magical grace and centuries-long lifespan.":
    "Traçando sua ancestralidade à Agrestia das Fadas, os elfos possuem graça mágica e séculos de vida.",
  "Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal.":
    "Corajosos e robustos, anões são guerreiros habilidosos, mineradores e artífices da pedra e metal.",
  "Raised from bedrock and forge fire, dwarves embody endurance and mastery of stone and metal.":
    "Forjados na rocha viva e fogo da forja, os anões encarnam a resistência e a maestria da pedra e metal.",
  "The comforts of home are the goals of most halflings: a place to settle in peace and quiet.":
    "O conforto do lar é o objetivo da maioria dos halflings: um lugar tranquilo para viver em paz.",
  "Small in stature and quick of wit, halflings survive adversity through fellowship and resourcefulness.":
    "Pequenos em estatura e perspicazes de raciocínio, halflings superam adversidades pela união e engenho.",
  "A constant hum of busy activity pervades the warrens and neighborhoods where gnomes form their close-knit communities.":
    "Um constante zumbido de atividade preenche os refúgios onde gnomos formam suas comunidades unidas.",
  "Filled with unbounded enthusiasm, gnomes express curiosity through invention and wonder.":
    "Cheios de entusiasmo infinito, gnomos expressam curiosidade através da invenção e maravilhamento.",
  "Walking in two worlds but truly belonging to neither, half-elves combine what some say are the best qualities of their elf and human parents.":
    "Caminhando em dois mundos sem pertencer plenamente a nenhum, meio-elfos combinam as melhores qualidades de seus pais elfos e humanos.",
  "Versatile lineage blending human ambition with elven heritage.":
    "Linhagem versátil combinando a ambição humana com a herança élfica.",
  "Half-orcs gray coloration, sloping foreheads, jutting jaws, and prominent canine teeth immediately identify them as other.":
    "Com pele acinzentada, queixos proeminentes e presas marcantes, meio-orcs são guerreiros de presença imponente.",
  "Resilient warriors enduring through sheer will, possessing unwavering determination.":
    "Guerreiros resilientes que resistem pela pura força de vontade, com determinação inabalável.",
  "To be greeted with stares and whispers, to suffer violence and insult on the street, to see mistrust and fear in every eye: this is the lot of the tiefling.":
    "Recebidos com olhares e sussurros, desconfiança e mistério: este é o fardo e a distinção dos tieflings.",
  "Touched by otherworldly fiendish planes, tieflings wield fiery resilience and darkvision.":
    "Tocados por planos infernais sobrenaturais, os tieflings empunham resiliência ígnea e visão no escuro.",
  "Born of dragons, as their name proclaims, the dragonborn walk proudly through a world that greets them with fearful incomprehension.":
    "Nascidos de dragões, como proclama seu nome, os draconatos caminham altivos pelo mundo.",
  "Carrying the legacy of ancient dragons, dragonborn exhale elemental power and take to the skies.":
    "Carregando o legado de dragões ancestrais, os draconatos exalam poder elemental e dominam os céus.",

  // Feat descriptions
  "Gain two cleric cantrips and one 1st-level cleric spell.":
    "Recebe dois truques de clérigo e uma magia de 1º nível de clérigo.",
  "Gain initiative proficiency bonus and swap initiative rolls.":
    "Recebe bônus de proficiência na iniciativa e pode trocar rolagens de iniciativa.",
  "Hit point maximum increases by 2 per level.":
    "O máximo de pontos de vida aumenta em 2 por nível.",
  "Gain proficiency in any combination of three skills or tools.":
    "Ganha proficiência em qualquer combinação de três perícias ou ferramentas.",
  "Gain two wizard cantrips and one 1st-level wizard spell.":
    "Recebe dois truques de mago e uma magia de 1º nível de mago.",
  "Roll weapon damage twice and use higher result once per turn.":
    "Rola o dano da arma duas vezes e usa o resultado maior uma vez por turno.",
};

export interface ClassSkillConfig {
  count: number;
  skills?: string[]; // se undefined, escolhe de todas
}

export const CLASS_SKILL_OPTIONS: Record<string, ClassSkillConfig> = {
  Barbarian: {
    count: 2,
    skills: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
  },
  Bard: {
    count: 3,
  },
  Cleric: {
    count: 2,
    skills: ["History", "Insight", "Medicine", "Persuasion", "Religion"],
  },
  Druid: {
    count: 2,
    skills: ["Animal Handling", "Arcana", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"],
  },
  Fighter: {
    count: 2,
    skills: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
  },
  Monk: {
    count: 2,
    skills: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"],
  },
  Paladin: {
    count: 2,
    skills: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"],
  },
  Ranger: {
    count: 3,
    skills: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"],
  },
  Rogue: {
    count: 4,
    skills: [
      "Acrobatics",
      "Athletics",
      "Deception",
      "Insight",
      "Intimidation",
      "Investigation",
      "Perception",
      "Performance",
      "Persuasion",
      "Sleight of Hand",
      "Stealth",
    ],
  },
  Sorcerer: {
    count: 2,
    skills: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"],
  },
  Warlock: {
    count: 2,
    skills: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"],
  },
  Wizard: {
    count: 2,
    skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
  },
  Artificer: {
    count: 2,
    skills: ["Arcana", "History", "Investigation", "Medicine", "Nature", "Perception", "Sleight of Hand"],
  },
  // Portuguese aliases
  Bárbaro: {
    count: 2,
    skills: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
  },
  Bardo: {
    count: 3,
  },
  Clérigo: {
    count: 2,
    skills: ["History", "Insight", "Medicine", "Persuasion", "Religion"],
  },
  Druida: {
    count: 2,
    skills: ["Animal Handling", "Arcana", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"],
  },
  Guerreiro: {
    count: 2,
    skills: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
  },
  Monge: {
    count: 2,
    skills: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"],
  },
  Paladino: {
    count: 2,
    skills: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"],
  },
  Patrulheiro: {
    count: 3,
    skills: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"],
  },
  Ladino: {
    count: 4,
    skills: [
      "Acrobatics",
      "Athletics",
      "Deception",
      "Insight",
      "Intimidation",
      "Investigation",
      "Perception",
      "Performance",
      "Persuasion",
      "Sleight of Hand",
      "Stealth",
    ],
  },
  Feiticeiro: {
    count: 2,
    skills: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"],
  },
  Bruxo: {
    count: 2,
    skills: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"],
  },
  Mago: {
    count: 2,
    skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
  },
  Artífice: {
    count: 2,
    skills: ["Arcana", "History", "Investigation", "Medicine", "Nature", "Perception", "Sleight of Hand"],
  },
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
    ABILITY_NAMES_PT[name] ||
    CLASS_NAMES_PT[name] ||
    RACE_NAMES_PT[name] ||
    BACKGROUND_NAMES_PT[name] ||
    SKILL_NAMES_PT[name] ||
    ORIGIN_FEAT_NAMES_PT[name] ||
    TRAIT_NAMES_PT[name] ||
    EQUIPMENT_PROFICIENCIES_PT[name] ||
    DESCRIPTIONS_PT[name] ||
    SPELL_NAMES_PT[name] ||
    name
  );
}
