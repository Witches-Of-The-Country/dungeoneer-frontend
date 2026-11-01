import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { Spell, Feat, Item, ArchetypeSummary, LineageSummary } from './encyclopedia';

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
}

export interface CreateHomebrewFeatPayload {
  name: string;
  nameEn?: string;
  prerequisites?: string;
  description: string;
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
}

export interface CreateHomebrewLineagePayload {
  name: string;
  description?: string;
  speed: number;
  size: string;
  abilityBonuses?: Record<string, number>;
  traitsSummary?: string[];
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

export async function createHomebrewLineage(payload: CreateHomebrewLineagePayload): Promise<LineageSummary> {
  return apiFetch<LineageSummary>('/api/reference/lineages', {
    method: 'POST',
    body: JSON.stringify(payload),
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
    },
  });
}

export interface CreateHomebrewSubclassPayload {
  archetypeId: string;
  name: string;
  nameEn?: string;
  description: string;
}

export async function createHomebrewSubclass(payload: CreateHomebrewSubclassPayload): Promise<any> {
  return apiFetch<any>('/api/reference/subclasses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function useCreateHomebrewLineage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHomebrewLineage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encyclopedia', 'lineages'] });
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
