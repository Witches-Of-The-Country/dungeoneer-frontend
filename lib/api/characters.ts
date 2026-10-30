import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';

export type Ruleset = 'SRD_2014' | 'SRD_2024';
export type AbilityScoreMethod = 'STANDARD_ARRAY' | 'POINT_BUY' | 'ROLLED';
export type HpCalculationMethod = 'MAX' | 'AVERAGE' | 'ROLLED';

export type AbilityKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export interface ReferenceClass {
  id: string;
  name: string;
  hitDice: string;
  primaryAbility: string;
  savingThrowProficiencies: string[];
  armorProficiencies?: string[];
  weaponProficiencies?: string[];
  spellcastingType: 'NONE' | 'HALF' | 'FULL' | 'PACT' | string;
  spellcastingAbility?: string | null;
  ruleset: Ruleset;
  source?: string;
}

export interface ReferenceLineage {
  id: string;
  name: string;
  description: string;
  speed: number;
  size: string;
  abilityBonuses: Record<string, number>;
  traitsSummary: string[];
  ruleset: Ruleset;
  source?: string;
}

export interface ReferenceBackground {
  id: string;
  name: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies?: string[];
  languages?: string[];
  allowedAbilityBonuses: string[];
  originFeatName?: string | null;
  originFeatDescription?: string | null;
  ruleset: Ruleset;
  source?: string;
}

export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  ruleset: Ruleset;
  className: string;
  lineageName: string;
  backgroundName?: string;
  hitPointsCurrent: number;
  hitPointsMax: number;
  armorClass?: number;
  updatedAt: string;
}

export interface CharacterAbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  strengthModifier?: number;
  dexterityModifier?: number;
  constitutionModifier?: number;
  intelligenceModifier?: number;
  wisdomModifier?: number;
  charismaModifier?: number;
}

export interface ClassProgression {
  id?: string;
  characterId?: string;
  archetypeId: string;
  subclassId?: string | null;
  classLevel: number;
}

export interface CharacterResponse {
  id: string;
  userId?: string;
  name: string;
  level: number;
  hitPointsCurrent: number;
  hitPointsMax: number;
  hitPointsTemp: number;
  armorClass: number;
  initiativeBonus: number;
  speed: number;
  proficiencyBonus: number;
  ruleset: Ruleset;
  abilityScoreMethod?: AbilityScoreMethod;
  hpCalculationMethod?: HpCalculationMethod;
  hasPendingLevelChoices?: boolean;
  notes?: string | null;
  abilityScores: CharacterAbilityScores;
  lineage: ReferenceLineage;
  background: ReferenceBackground;
  archetype: ReferenceClass;
  classProgressions?: ClassProgression[];
  savingThrows?: Record<string, number>;
  skills?: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCharacterPayload {
  name: string;
  level: number;
  ruleset: Ruleset;
  lineageId: string;
  backgroundId: string;
  archetypeId: string;
  subclassId?: string | null;
  abilityScoreMethod: AbilityScoreMethod;
  abilityScores: Record<AbilityKey, number>;
  abilityScoreBonuses?: Record<string, number>;
  abilityRollId?: string | null;
  hpCalculationMethod?: HpCalculationMethod;
  hpRollId?: string | null;
  notes?: string;
}

export interface UpdateCharacterPayload {
  name?: string;
  hitPointsCurrent?: number;
  hitPointsTemp?: number;
  notes?: string;
}

export interface AbilityRollResponse {
  rollId: string;
  userId?: string;
  rolledScores: number[];
  diceBreakdown?: string;
  isNew?: boolean;
  createdAt?: string;
}

export interface HpRollPayload {
  archetypeId: string;
  level: number;
}

export interface HpRollResponse {
  rollId: string;
  userId?: string;
  archetypeId: string;
  targetLevel: number;
  rolledHpPerLevel: number[];
  isNew?: boolean;
  createdAt?: string;
}

export async function getCharacters(): Promise<CharacterSummary[]> {
  return apiFetch<CharacterSummary[]>('/api/characters');
}

export async function getCharacter(id: string): Promise<CharacterResponse> {
  return apiFetch<CharacterResponse>(`/api/characters/${id}`);
}

export async function createCharacter(
  payload: CreateCharacterPayload
): Promise<CharacterResponse> {
  return apiFetch<CharacterResponse>('/api/characters', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCharacter({
  id,
  payload,
}: {
  id: string;
  payload: UpdateCharacterPayload;
}): Promise<CharacterResponse> {
  return apiFetch<CharacterResponse>(`/api/characters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCharacter(id: string): Promise<void> {
  return apiFetch<void>(`/api/characters/${id}`, {
    method: 'DELETE',
  });
}

export async function rollAbilityScores(): Promise<AbilityRollResponse> {
  return apiFetch<AbilityRollResponse>('/api/characters/ability-rolls', {
    method: 'POST',
  });
}

export async function rollHitPoints(
  payload: HpRollPayload
): Promise<HpRollResponse> {
  return apiFetch<HpRollResponse>('/api/characters/hp-rolls', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getReferenceClasses(
  ruleset: Ruleset
): Promise<ReferenceClass[]> {
  return apiFetch<ReferenceClass[]>(`/api/reference/classes?ruleset=${ruleset}`);
}

export async function getReferenceLineages(
  ruleset: Ruleset
): Promise<ReferenceLineage[]> {
  return apiFetch<ReferenceLineage[]>(
    `/api/reference/lineages?ruleset=${ruleset}`
  );
}

export async function getReferenceBackgrounds(
  ruleset: Ruleset
): Promise<ReferenceBackground[]> {
  return apiFetch<ReferenceBackground[]>(
    `/api/reference/backgrounds?ruleset=${ruleset}`
  );
}

// TanStack Query Hooks
export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: () => getCharacters(),
    staleTime: 1000 * 30,
  });
}

export function useCharacter(id: string) {
  return useQuery({
    queryKey: ['characters', id],
    queryFn: () => getCharacter(id),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCharacterPayload) => createCharacter(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      if (created?.id) {
        queryClient.setQueryData(['characters', created.id], created);
      }
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string; payload: UpdateCharacterPayload }) =>
      updateCharacter(variables),
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.id] });
      if (updated?.id) {
        queryClient.setQueryData(['characters', updated.id], updated);
      }
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCharacter(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.removeQueries({ queryKey: ['characters', id] });
    },
  });
}

export function useRollAbilityScores() {
  return useMutation({
    mutationFn: () => rollAbilityScores(),
  });
}

export function useRollHitPoints() {
  return useMutation({
    mutationFn: (payload: HpRollPayload) => rollHitPoints(payload),
  });
}

export function useReferenceClasses(ruleset: Ruleset) {
  return useQuery({
    queryKey: ['reference', 'classes', ruleset],
    queryFn: () => getReferenceClasses(ruleset),
    staleTime: 1000 * 60 * 5,
  });
}

export function useReferenceLineages(ruleset: Ruleset) {
  return useQuery({
    queryKey: ['reference', 'lineages', ruleset],
    queryFn: () => getReferenceLineages(ruleset),
    staleTime: 1000 * 60 * 5,
  });
}

export function useReferenceBackgrounds(ruleset: Ruleset) {
  return useQuery({
    queryKey: ['reference', 'backgrounds', ruleset],
    queryFn: () => getReferenceBackgrounds(ruleset),
    staleTime: 1000 * 60 * 5,
  });
}

// Helper utilities for Ability Scores and D&D 5e/2024 rules
export const ABILITY_KEYS: AbilityKey[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

export const ABILITY_LABELS: Record<
  AbilityKey,
  { short: string; full: string; code: string }
> = {
  strength: { short: 'FOR', full: 'Força', code: 'STR' },
  dexterity: { short: 'DES', full: 'Destreza', code: 'DEX' },
  constitution: { short: 'CON', full: 'Constituição', code: 'CON' },
  intelligence: { short: 'INT', full: 'Inteligência', code: 'INT' },
  wisdom: { short: 'SAB', full: 'Sabedoria', code: 'WIS' },
  charisma: { short: 'CAR', full: 'Carisma', code: 'CHA' },
};

export function normalizeAbilityKey(raw: string): AbilityKey | null {
  const upper = raw.trim().toUpperCase();
  switch (upper) {
    case 'STR':
    case 'STRENGTH':
    case 'FOR':
      return 'strength';
    case 'DEX':
    case 'DEXTERITY':
    case 'DES':
      return 'dexterity';
    case 'CON':
    case 'CONSTITUTION':
      return 'constitution';
    case 'INT':
    case 'INTELLIGENCE':
      return 'intelligence';
    case 'WIS':
    case 'WISDOM':
    case 'SAB':
      return 'wisdom';
    case 'CHA':
    case 'CHARISMA':
    case 'CAR':
      return 'charisma';
    default:
      return null;
  }
}

export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export function calculatePointBuyTotal(
  scores: Record<AbilityKey, number>
): number {
  return ABILITY_KEYS.reduce((acc, key) => {
    const val = scores[key] ?? 8;
    return acc + (POINT_BUY_COSTS[val] ?? 0);
  }, 0);
}

export interface DndSkillDefinition {
  id: string;
  enName: string;
  ptName: string;
  ability: AbilityKey;
}

export const DND_SKILLS: DndSkillDefinition[] = [
  { id: 'acrobatics', enName: 'Acrobatics', ptName: 'Acrobacia', ability: 'dexterity' },
  { id: 'animal_handling', enName: 'Animal Handling', ptName: 'Adestramento', ability: 'wisdom' },
  { id: 'arcana', enName: 'Arcana', ptName: 'Arcanismo', ability: 'intelligence' },
  { id: 'athletics', enName: 'Athletics', ptName: 'Atletismo', ability: 'strength' },
  { id: 'deception', enName: 'Deception', ptName: 'Enganação', ability: 'charisma' },
  { id: 'history', enName: 'History', ptName: 'História', ability: 'intelligence' },
  { id: 'insight', enName: 'Insight', ptName: 'Intuição', ability: 'wisdom' },
  { id: 'intimidation', enName: 'Intimidation', ptName: 'Intimidação', ability: 'charisma' },
  { id: 'investigation', enName: 'Investigation', ptName: 'Investigação', ability: 'intelligence' },
  { id: 'medicine', enName: 'Medicine', ptName: 'Medicina', ability: 'wisdom' },
  { id: 'nature', enName: 'Nature', ptName: 'Natureza', ability: 'intelligence' },
  { id: 'perception', enName: 'Perception', ptName: 'Percepção', ability: 'wisdom' },
  { id: 'performance', enName: 'Performance', ptName: 'Atuação', ability: 'charisma' },
  { id: 'persuasion', enName: 'Persuasion', ptName: 'Persuasão', ability: 'charisma' },
  { id: 'religion', enName: 'Religion', ptName: 'Religião', ability: 'intelligence' },
  { id: 'sleight_of_hand', enName: 'Sleight of Hand', ptName: 'Prestidigitação', ability: 'dexterity' },
  { id: 'stealth', enName: 'Stealth', ptName: 'Furtividade', ability: 'dexterity' },
  { id: 'survival', enName: 'Survival', ptName: 'Sobrevivência', ability: 'wisdom' },
];
