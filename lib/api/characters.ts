import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { translateReferenceName } from '@/lib/srd-translations';
import { ChargeType, ChargeRecoveryType } from './encyclopedia';

export type Ruleset = 'SRD_2014' | 'SRD_2024' | 'HOMEBREW';
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
  subclassLevel?: number;
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

export interface CharacterClassSummary {
  classProgressionId?: string;
  className: string;
  subclassName?: string | null;
  classLevel: number;
  hitDie?: string;
  hitDiceSpent?: number;
  availableHitDice?: number;
}

export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  ruleset: Ruleset;
  className: string;
  subclassName?: string | null;
  lineageName: string;
  backgroundName?: string;
  hitPointsCurrent: number;
  hitPointsMax: number;
  armorClass?: number;
  avatarUrl?: string | null;
  classes?: CharacterClassSummary[];
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

export interface ClassProgressionPayload {
  archetypeId: string;
  subclassId?: string | null;
  classLevel: number;
}

export type EquipmentSlot =
  | 'CHEST'
  | 'GLOVES'
  | 'BOOTS'
  | 'HELMET'
  | 'PANTS'
  | 'LEFT_HAND'
  | 'RIGHT_HAND'
  | 'CLOAK'
  | 'RING_1'
  | 'RING_2'
  | 'NECKLACE'
  | 'TRINKET';

export interface CharacterItem {
  id: string;
  characterId: string;
  itemId: string;
  name?: string;
  itemName?: string;
  itemCategory: string;
  itemType: string;
  rarity: string;
  requiresAttunement?: boolean;
  attunement: boolean;
  cost?: string;
  weight?: string;
  description?: string;
  slug?: string;
  ruleset?: string;
  quantity: number;
  equipped: boolean;
  equippedSlot?: EquipmentSlot | string | null;
  attuned: boolean;
  mechanicalProperties?: any;
}

export interface CharacterFeat {
  id: string;
  characterId: string;
  featId: string;
  name: string;
  description: string;
  featType: string;
  unlockedAtLevel: number;
  currentCharges?: number | null;
  maxCharges?: number | null;
  maxChargesType?: ChargeType | null;
  chargeAbility?: string | null;
  shortRestRecoveryType?: ChargeRecoveryType | null;
  shortRestRecoveryFixed?: number | null;
  longRestRecoveryType?: ChargeRecoveryType | null;
  longRestRecoveryFixed?: number | null;
  source: string;
  mechanicalEffects?: any;
}

export interface DamageRollItem {
  diceCount?: number;
  diceType?: number;
  diceFormula?: string;
  damageType: string;
  bonusModifier?: number;
  conditional?: boolean;
  conditionNote?: string | null;
}

export interface CharacterAction {
  id?: string;
  name: string;
  actionType: 'ACTION' | 'BONUS_ACTION' | 'REACTION' | 'FREE' | 'SPECIAL' | string;
  category?: 'WEAPON' | 'SPELL' | 'FEAT' | 'FEATURE' | 'CUSTOM' | string;
  sourceType?: 'WEAPON' | 'SPELL' | 'FEAT' | 'FEATURE' | 'CUSTOM' | string;
  attackBonus?: number | null;
  damageRolls?: DamageRollItem[];
  versatileDice?: string | null;
  description?: string | null;
  usesRemaining?: number | null;
  maxUses?: number | null;
  currentCharges?: number | null;
  maxCharges?: number | null;
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
  avatarUrl?: string | null;
  currency?: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
    totalCopper: number;
    totalGold: number;
  };
  abilityScores: CharacterAbilityScores;
  lineage: ReferenceLineage;
  background: ReferenceBackground;
  archetype: ReferenceClass;
  classProgressions?: ClassProgression[];
  classes?: CharacterClassSummary[];
  skillProficiencies?: string[];
  savingThrows?: Record<string, number>;
  skills?: Record<string, number>;
  experiencePoints?: number;
  campaignId?: string | null;
  inventory?: CharacterItem[];
  feats?: CharacterFeat[];
  actions?: CharacterAction[];
  exhaustion?: number;
  allowAbilityReroll?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CharacterSheet = CharacterResponse;

export type RestType = 'SHORT' | 'LONG';

export interface HitDiceSpendItem {
  classProgressionId: string;
  count: number;
}

export interface RestPayload {
  restType: RestType;
  hpHealed?: number;
  hitDiceSpends?: HitDiceSpendItem[];
}

export interface CreateCharacterPayload {
  name: string;
  level: number;
  ruleset: Ruleset;
  lineageId: string;
  backgroundId: string;
  archetypeId: string;
  subclassId?: string | null;
  originFeatId?: string | null;
  abilityScoreMethod: AbilityScoreMethod;
  abilityScores: Record<AbilityKey, number>;
  abilityScoreBonuses?: Record<string, number>;
  abilityRollId?: string | null;
  hpCalculationMethod?: HpCalculationMethod;
  hpRollId?: string | null;
  hpRollIds?: string[];
  notes?: string;
  classProgressions?: ClassProgressionPayload[];
  skillProficiencies?: string[];
  avatarUrl?: string | null;
}

export interface UpdateCharacterPayload {
  name?: string;
  hitPointsCurrent?: number;
  hitPointsTemp?: number;
  notes?: string;
  avatarUrl?: string | null;
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
  isSecondaryClass?: boolean;
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

export interface CharacterNote {
  id: string;
  characterId: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface CreateCharacterNotePayload {
  title: string;
  body: string;
}

export interface UpdateCharacterNotePayload {
  title: string;
  body: string;
}

export async function getCharacters(): Promise<CharacterSummary[]> {
  const characters = await apiFetch<CharacterSummary[]>('/api/characters');
  return characters.map((c) => ({
    ...c,
    className: translateReferenceName(c.className),
    lineageName: translateReferenceName(c.lineageName),
    backgroundName: c.backgroundName
      ? translateReferenceName(c.backgroundName)
      : c.backgroundName,
  }));
}

export async function getCharacter(id: string): Promise<CharacterResponse> {
  const character = await apiFetch<CharacterResponse>(`/api/characters/${id}`);
  return {
    ...character,
    archetype: character.archetype
      ? {
          ...character.archetype,
          name: translateReferenceName(character.archetype.name),
          armorProficiencies: (character.archetype.armorProficiencies ?? []).map(translateReferenceName),
          weaponProficiencies: (character.archetype.weaponProficiencies ?? []).map(translateReferenceName),
        }
      : character.archetype,
    lineage: character.lineage
      ? {
          ...character.lineage,
          name: translateReferenceName(character.lineage.name),
          description: translateReferenceName(character.lineage.description),
          traitsSummary: (character.lineage.traitsSummary ?? []).map(translateReferenceName),
        }
      : character.lineage,
    background: character.background
      ? {
          ...character.background,
          name: translateReferenceName(character.background.name),
          description: translateReferenceName(character.background.description),
          originFeatName: character.background.originFeatName
            ? translateReferenceName(character.background.originFeatName)
            : character.background.originFeatName,
          originFeatDescription: character.background.originFeatDescription
            ? translateReferenceName(character.background.originFeatDescription)
            : character.background.originFeatDescription,
          skillProficiencies: (
            character.background.skillProficiencies ?? []
          ).map(translateReferenceName),
        }
      : character.background,
  };
}

export async function getCharacterNotes(
  characterId: string
): Promise<CharacterNote[]> {
  return apiFetch<CharacterNote[]>(`/api/characters/${characterId}/notes`);
}

export async function addCharacterNote({
  characterId,
  payload,
}: {
  characterId: string;
  payload: CreateCharacterNotePayload;
}): Promise<CharacterNote> {
  return apiFetch<CharacterNote>(`/api/characters/${characterId}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCharacterNote({
  characterId,
  noteId,
  payload,
}: {
  characterId: string;
  noteId: string;
  payload: UpdateCharacterNotePayload;
}): Promise<CharacterNote> {
  return apiFetch<CharacterNote>(`/api/characters/${characterId}/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
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

export async function rollAbilityScores(forceNew = false): Promise<AbilityRollResponse> {
  const query = forceNew ? '?forceNew=true' : '';
  return apiFetch<AbilityRollResponse>(`/api/characters/ability-rolls${query}`, {
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
  const classes = await apiFetch<ReferenceClass[]>(
    `/api/reference/classes?ruleset=${ruleset}`
  );
  return classes.map((c) => ({
    ...c,
    name: translateReferenceName(c.name),
    armorProficiencies: (c.armorProficiencies ?? []).map(translateReferenceName),
    weaponProficiencies: (c.weaponProficiencies ?? []).map(translateReferenceName),
  }));
}

export async function getReferenceLineages(
  ruleset: Ruleset
): Promise<ReferenceLineage[]> {
  const lineages = await apiFetch<ReferenceLineage[]>(
    `/api/reference/lineages?ruleset=${ruleset}`
  );
  return lineages.map((l) => ({
    ...l,
    name: translateReferenceName(l.name),
    description: translateReferenceName(l.description),
    traitsSummary: (l.traitsSummary ?? []).map(translateReferenceName),
  }));
}

export async function getReferenceBackgrounds(
  ruleset: Ruleset
): Promise<ReferenceBackground[]> {
  const backgrounds = await apiFetch<ReferenceBackground[]>(
    `/api/reference/backgrounds?ruleset=${ruleset}`
  );
  return backgrounds.map((b) => ({
    ...b,
    name: translateReferenceName(b.name),
    description: translateReferenceName(b.description),
    originFeatName: b.originFeatName
      ? translateReferenceName(b.originFeatName)
      : b.originFeatName,
    originFeatDescription: b.originFeatDescription
      ? translateReferenceName(b.originFeatDescription)
      : b.originFeatDescription,
    skillProficiencies: (b.skillProficiencies ?? []).map(translateReferenceName),
  }));
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

export function useCharacterNotes(characterId: string) {
  return useQuery({
    queryKey: ['characters', characterId, 'notes'],
    queryFn: () => getCharacterNotes(characterId),
    enabled: Boolean(characterId),
    staleTime: 1000 * 30,
  });
}

export function useAddCharacterNote(characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCharacterNotePayload) =>
      addCharacterNote({ characterId, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['characters', characterId, 'notes'],
      });
    },
  });
}

export function useUpdateCharacterNote(characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      noteId,
      payload,
    }: {
      noteId: string;
      payload: UpdateCharacterNotePayload;
    }) => updateCharacterNote({ characterId, noteId, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['characters', characterId, 'notes'],
      });
    },
  });
}

export function useRollAbilityScores() {
  return useMutation({
    mutationFn: (forceNew?: boolean) => rollAbilityScores(forceNew),
  });
}

export function useRollHitPoints() {
  return useMutation({
    mutationFn: (payload: HpRollPayload) => rollHitPoints(payload),
  });
}

export async function takeRest(
  characterId: string,
  payload: RestPayload
): Promise<CharacterResponse> {
  return apiFetch<CharacterResponse>(`/api/characters/${characterId}/rest`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function useTakeRest(characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RestPayload) => takeRest(characterId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['characters', characterId], data);
      queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
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

export const DND_XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
];

export function getXpProgress(totalXp: number, currentLevel: number): { current: number; max: number; percentage: number; canLevelUp: boolean } {
  if (currentLevel >= 20) {
    return { current: totalXp, max: DND_XP_THRESHOLDS[19], percentage: 100, canLevelUp: false };
  }
  const currentFloor = DND_XP_THRESHOLDS[currentLevel - 1];
  const nextTarget = DND_XP_THRESHOLDS[currentLevel];
  const progressInLevel = Math.max(0, totalXp - currentFloor);
  const totalLevelSpan = nextTarget - currentFloor;
  const percentage = Math.min(100, Math.floor((progressInLevel / totalLevelSpan) * 100));
  return {
    current: totalXp,
    max: nextTarget,
    percentage,
    canLevelUp: totalXp >= nextTarget,
  };
}

export interface AddExperiencePayload {
  amount: number;
}

export interface LevelUpPayload {
  archetypeId: string;
  subclassId?: string | null;
  hpCalculationMethod: HpCalculationMethod;
  hpRollId?: string | null;
  hpIncrease: number;
  milestone?: boolean;
  abilityScoreIncreases?: Record<string, number>;
  selectedFeatId?: string | null;
}

export interface RestPayload {
  restType: 'SHORT' | 'LONG';
  hpHealed?: number;
}

export interface AddCharacterItemPayload {
  itemId: string;
  quantity: number;
  purchaseWithCurrency?: boolean;
}

export interface UpdateCurrencyPayload {
  cp?: number;
  sp?: number;
  ep?: number;
  gp?: number;
  pp?: number;
  consolidate?: boolean;
}

export interface UpdateCharacterItemPayload {
  equipped?: boolean;
  equippedSlot?: EquipmentSlot | string | null;
  attuned?: boolean;
  quantity?: number;
}

export function useAddExperience(characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddExperiencePayload) =>
      apiFetch<CharacterResponse>(`/api/characters/${characterId}/xp`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['character', characterId], data);
      queryClient.setQueryData(['characters', characterId], data);
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
    },
  });
}

export function useLevelUp(characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LevelUpPayload) =>
      apiFetch<CharacterResponse>(`/api/characters/${characterId}/level-up`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['character', characterId], data);
      queryClient.setQueryData(['characters', characterId], data);
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
    },
  });
}

export function useRest(characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RestPayload) =>
      apiFetch<CharacterResponse>(`/api/characters/${characterId}/rest`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['character', characterId], data);
      queryClient.setQueryData(['characters', characterId], data);
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
    },
  });
}

export function useUseFeat(characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (featId: string) =>
      apiFetch<CharacterResponse>(`/api/characters/${characterId}/feats/${featId}/use`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['character', characterId], data);
      queryClient.setQueryData(['characters', characterId], data);
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
    },
  });
}

export function useManageInventory(characterId: string) {
  const queryClient = useQueryClient();
  return {
    addItem: useMutation({
      mutationFn: (payload: AddCharacterItemPayload) =>
        apiFetch<CharacterResponse>(`/api/characters/${characterId}/items`, {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      onSuccess: (data) => {
        queryClient.setQueryData(['character', characterId], data);
        queryClient.setQueryData(['characters', characterId], data);
        queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
      },
    }),
    updateItem: useMutation({
      mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateCharacterItemPayload }) =>
        apiFetch<CharacterResponse>(`/api/characters/${characterId}/items/${itemId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }),
      onSuccess: (data) => {
        queryClient.setQueryData(['character', characterId], data);
        queryClient.setQueryData(['characters', characterId], data);
        queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
      },
    }),
    removeItem: useMutation({
      mutationFn: (itemId: string) =>
        apiFetch<CharacterResponse>(`/api/characters/${characterId}/items/${itemId}`, {
          method: 'DELETE',
        }),
      onSuccess: (data) => {
        queryClient.setQueryData(['character', characterId], data);
        queryClient.setQueryData(['characters', characterId], data);
        queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
      },
    }),
    useConsumable: useMutation({
      mutationFn: (itemId: string) =>
        apiFetch<any>(`/api/characters/${characterId}/items/${itemId}/use`, {
          method: 'POST',
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['character', characterId] });
        queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
      },
    }),
    updateCurrency: useMutation({
      mutationFn: (payload: UpdateCurrencyPayload) =>
        apiFetch<CharacterResponse>(`/api/characters/${characterId}/currency`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      onSuccess: (data) => {
        queryClient.setQueryData(['character', characterId], data);
        queryClient.setQueryData(['characters', characterId], data);
        queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
      },
    }),
    useFeat: useMutation({
      mutationFn: (featId: string) =>
        apiFetch<CharacterResponse>(`/api/characters/${characterId}/feats/${featId}/use`, {
          method: 'POST',
        }),
      onSuccess: (data) => {
        queryClient.setQueryData(['character', characterId], data);
        queryClient.setQueryData(['characters', characterId], data);
        queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
      },
    }),
  };
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

export async function rerollAbilityScores(
  id: string,
  abilityScores?: Partial<CharacterAbilityScores>
): Promise<CharacterResponse> {
  return apiFetch<CharacterResponse>(`/api/characters/${id}/reroll-ability-scores`, {
    method: 'POST',
    body: JSON.stringify({ abilityScores }),
  });
}

export async function updateRerollPermission(
  id: string,
  allowAbilityReroll: boolean
): Promise<CharacterResponse> {
  return apiFetch<CharacterResponse>(`/api/characters/${id}/reroll-permission`, {
    method: 'PATCH',
    body: JSON.stringify({ allowAbilityReroll }),
  });
}

export function useRerollAbilityScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      abilityScores,
    }: {
      id: string;
      abilityScores?: Partial<CharacterAbilityScores>;
    }) => rerollAbilityScores(id, abilityScores),
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.id] });
      if (updated?.id) {
        queryClient.setQueryData(['characters', updated.id], updated);
      }
    },
  });
}

export function useUpdateRerollPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      allowAbilityReroll,
    }: {
      id: string;
      allowAbilityReroll: boolean;
    }) => updateRerollPermission(id, allowAbilityReroll),
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.id] });
      if (updated?.id) {
        queryClient.setQueryData(['characters', updated.id], updated);
      }
    },
  });
}
