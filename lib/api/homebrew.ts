import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { Spell, Feat, Item, ArchetypeSummary, LineageSummary, Subclass } from './encyclopedia';

export interface CreateHomebrewSpellPayload {
  name: string;
  nameEn?: string;
  level: number;
  school: string;
  castingTime?: string;
  rangeArea?: string;
  components?: string;
  duration?: string;
  description: string;
  mechanicalProperties?: ItemMechanicalPropertiesPayload | Record<string, unknown>;
}

export interface AbilityBonusChoicePayload {
  chooseCount: number;
  allowedAbilities: string[];
  bonusAmount: number;
}

export interface FeatPrerequisitePayload {
  type: 'ABILITY_SCORE' | 'CLASS' | 'LINEAGE' | 'FEAT' | 'LEVEL' | 'SPELLCASTING' | string;
  targetKey: string;
  minValue?: number;
  displayLabel: string;
}

export interface MechanicalEffectsPayload {
  abilityBonuses?: Record<string, number>;
  abilityBonusChoice?: AbilityBonusChoicePayload;
  acBonus?: number;
  initiativeBonus?: number;
  speedBonus?: number;
  hpPerLevelBonus?: number;
  savingThrowBonus?: number;
  grantsAction?: boolean;
  actionType?: 'ACTION' | 'BONUS_ACTION' | 'REACTION' | 'FREE' | string;
  actionName?: string;
  actionDescription?: string;
  maxUses?: number;
  rechargeOn?: 'SHORT_REST' | 'LONG_REST' | 'NONE' | string;
  conditional?: boolean;
  conditionDescription?: string;
  prerequisiteRules?: FeatPrerequisitePayload[];
}

export interface CreateHomebrewFeatPayload {
  name: string;
  nameEn?: string;
  prerequisites?: string;
  description: string;
  featType?: 'GENERAL' | 'ORIGIN' | 'CLASS' | 'SUBCLASS' | 'LINEAGE' | string;
  mechanicalEffects?: MechanicalEffectsPayload;
}

export interface ItemDamageRollPayload {
  diceCount: number;
  diceType: number;
  damageType: string;
  bonusModifier?: number;
  conditional?: boolean;
  conditionNote?: string;
}

export interface ItemMechanicalPropertiesPayload {
  damageRolls?: ItemDamageRollPayload[];
  weaponProperties?: string[];
  versatileDice?: string;
  magicBonus?: number;
  armorCategory?: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'ROBE' | 'SHIELD' | string;
  baseAc?: number;
  stealthDisadvantage?: boolean;
  strengthRequirement?: number;
  effectType?: 'HEAL' | 'BUFF' | 'DAMAGE' | 'UTILITY' | string;
  diceFormula?: string;
}

export interface CreateHomebrewItemPayload {
  name: string;
  nameEn?: string;
  itemCategory: string;
  itemType: string;
  rarity?: string;
  attunement?: boolean;
  cost?: string;
  weight?: string;
  description: string;
  mechanicalProperties?: ItemMechanicalPropertiesPayload;
}

export interface HomebrewProgressionFeatPayload {
  unlockLevel: number;
  featId?: string | null;
  name?: string;
  nameEn?: string;
  description?: string;
  mechanicalEffects?: MechanicalEffectsPayload;
}

export interface CreateHomebrewClassPayload {
  name: string;
  hitDice: string;
  primaryAbility: string;
  savingThrowProficiencies: string[];
  armorProficiencies?: string[];
  weaponProficiencies?: string[];
  spellcastingType: string;
  spellcastingAbility?: string;
  subclassLevel?: number;
  progressionFeats?: HomebrewProgressionFeatPayload[];
  spellPreparationType?: 'PREPARED' | 'KNOWN' | 'NONE' | string;
}

export interface CreateHomebrewSubclassPayload {
  archetypeId: string;
  name: string;
  nameEn?: string;
  description: string;
  progressionFeats?: HomebrewProgressionFeatPayload[];
}

export interface CreateHomebrewLineagePayload {
  name: string;
  description?: string;
  speed: number;
  size: string;
  abilityBonuses?: Record<string, number>;
  traitsSummary?: string[];
  inlineFeats?: HomebrewProgressionFeatPayload[];
}

export async function createHomebrewSpell(payload: CreateHomebrewSpellPayload): Promise<Spell> {
  return apiFetch<Spell>('/api/reference/spells', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createHomebrewFeat(payload: CreateHomebrewFeatPayload): Promise<Feat> {
  return apiFetch<Feat>('/api/reference/feats', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createHomebrewItem(payload: CreateHomebrewItemPayload): Promise<Item> {
  return apiFetch<Item>('/api/reference/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createHomebrewClass(payload: CreateHomebrewClassPayload): Promise<ArchetypeSummary> {
  return apiFetch<ArchetypeSummary>('/api/reference/classes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createHomebrewSubclass(payload: CreateHomebrewSubclassPayload): Promise<Subclass> {
  return apiFetch<Subclass>('/api/reference/subclasses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createHomebrewLineage(payload: CreateHomebrewLineagePayload): Promise<LineageSummary> {
  return apiFetch<LineageSummary>('/api/reference/lineages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateHomebrewSpell({ id, data }: { id: string; data: CreateHomebrewSpellPayload }): Promise<Spell> {
  return apiFetch<Spell>(`/api/reference/spells/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateHomebrewFeat({ id, data }: { id: string; data: CreateHomebrewFeatPayload }): Promise<Feat> {
  return apiFetch<Feat>(`/api/reference/feats/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateHomebrewItem({ id, data }: { id: string; data: CreateHomebrewItemPayload }): Promise<Item> {
  return apiFetch<Item>(`/api/reference/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateHomebrewClass({ id, data }: { id: string; data: CreateHomebrewClassPayload }): Promise<ArchetypeSummary> {
  return apiFetch<ArchetypeSummary>(`/api/reference/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateHomebrewSubclass({ id, data }: { id: string; data: CreateHomebrewSubclassPayload }): Promise<Subclass> {
  return apiFetch<Subclass>(`/api/reference/subclasses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateHomebrewLineage({ id, data }: { id: string; data: CreateHomebrewLineagePayload }): Promise<LineageSummary> {
  return apiFetch<LineageSummary>(`/api/reference/lineages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function useUpdateHomebrewSpell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHomebrewSpell,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'spells'] });
    },
  });
}

export function useUpdateHomebrewFeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHomebrewFeat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'feats'] });
    },
  });
}

export function useUpdateHomebrewItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHomebrewItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'items'] });
    },
  });
}

export function useUpdateHomebrewClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHomebrewClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'classes'] });
    },
  });
}

export function useUpdateHomebrewSubclass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHomebrewSubclass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'subclasses'] });
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'classes'] });
    },
  });
}

export function useUpdateHomebrewLineage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHomebrewLineage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'lineages'] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'lineages'] });
    },
  });
}

export function useCreateHomebrewSpell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHomebrewSpell,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'spells'] });
    },
  });
}

export function useCreateHomebrewFeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHomebrewFeat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'feats'] });
    },
  });
}

export function useCreateHomebrewItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHomebrewItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'items'] });
    },
  });
}

export function useCreateHomebrewClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHomebrewClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'classes'] });
    },
  });
}

export function useCreateHomebrewSubclass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHomebrewSubclass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'subclasses'] });
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'classes'] });
    },
  });
}

export function useCreateHomebrewLineage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHomebrewLineage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'lineages'] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'lineages'] });
    },
  });
}
