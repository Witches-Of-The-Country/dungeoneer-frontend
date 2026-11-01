import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { apiFetch } from './client';

export interface CursorPageResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
  pageSize: number;
}

export interface Spell {
  id: string;
  ruleset: string;
  slug: string;
  nameEn: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  rangeArea: string;
  components: string;
  duration: string;
  description: string;
  source: string;
}

export interface Feat {
  id: string;
  ruleset: string;
  slug: string;
  nameEn: string;
  name: string;
  prerequisites?: string;
  description: string;
  featType?: 'GENERAL' | 'ORIGIN' | 'CLASS' | 'SUBCLASS' | 'LINEAGE' | string;
  mechanicalEffects?: any;
  source: string;
}

export interface Item {
  id: string;
  ruleset: string;
  slug: string;
  nameEn: string;
  name: string;
  itemCategory: string;
  itemType: string;
  rarity: string;
  attunement: boolean;
  cost: string;
  weight: string;
  description: string;
  mechanicalProperties?: any;
  source: string;
}

export interface ArchetypeSummary {
  id: string;
  name: string;
  hitDice: string;
  primaryAbility: string;
  savingThrowProficiencies?: string[];
  armorProficiencies?: string[];
  weaponProficiencies?: string[];
  spellcastingType?: string;
  spellcastingAbility?: string;
  subclassLevel?: number;
  ruleset: string;
  source: string;
}

export interface LineageSummary {
  id: string;
  name: string;
  speed: number;
  size: string;
  description?: string;
  abilityBonuses?: Record<string, number>;
  traitsSummary?: string[];
  ruleset: string;
  source: string;
}

export interface CommonFilters {
  cursor?: string | null;
  limit?: number;
  q?: string;
  ruleset?: string;
}

export interface SpellFilters extends CommonFilters {
  level?: number;
  school?: string;
}

export interface ItemFilters extends CommonFilters {
  category?: string;
  rarity?: string;
}

export interface FeatFilters extends CommonFilters {
  featTypes?: string[];
}

function buildQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      if (Array.isArray(v)) {
        v.forEach((val) => {
          if (val !== undefined && val !== null && val !== '') {
            q.append(k, String(val));
          }
        });
      } else {
        q.append(k, String(v));
      }
    }
  });
  const res = q.toString();
  return res ? `?${res}` : '';
}

export async function fetchSpells(filters: SpellFilters = {}): Promise<CursorPageResponse<Spell>> {
  return apiFetch<CursorPageResponse<Spell>>(`/api/reference/spells${buildQuery(filters)}`);
}

export async function fetchFeats(filters: FeatFilters = {}): Promise<CursorPageResponse<Feat>> {
  return apiFetch<CursorPageResponse<Feat>>(`/api/reference/feats${buildQuery(filters)}`);
}

export async function fetchItems(filters: ItemFilters = {}): Promise<CursorPageResponse<Item>> {
  return apiFetch<CursorPageResponse<Item>>(`/api/reference/items${buildQuery(filters)}`);
}

export async function fetchClassesPaginated(filters: CommonFilters = {}): Promise<CursorPageResponse<ArchetypeSummary>> {
  return apiFetch<CursorPageResponse<ArchetypeSummary>>(`/api/reference/classes/paginated${buildQuery(filters)}`);
}

export async function fetchLineagesPaginated(filters: CommonFilters = {}): Promise<CursorPageResponse<LineageSummary>> {
  return apiFetch<CursorPageResponse<LineageSummary>>(`/api/reference/lineages/paginated${buildQuery(filters)}`);
}

export function useInfiniteSpells(filters: Omit<SpellFilters, 'cursor'>) {
  return useInfiniteQuery<CursorPageResponse<Spell>, Error, InfiniteData<CursorPageResponse<Spell>>, [string, string, typeof filters], string | null>({
    queryKey: ['encyclopedia', 'spells', filters],
    queryFn: ({ pageParam }) => fetchSpells({ ...filters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });
}

export function useInfiniteFeats(filters: Omit<FeatFilters, 'cursor'>) {
  return useInfiniteQuery<CursorPageResponse<Feat>, Error, InfiniteData<CursorPageResponse<Feat>>, [string, string, typeof filters], string | null>({
    queryKey: ['encyclopedia', 'feats', filters],
    queryFn: ({ pageParam }) => fetchFeats({ ...filters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });
}

export function useInfiniteItems(filters: Omit<ItemFilters, 'cursor'>) {
  return useInfiniteQuery<CursorPageResponse<Item>, Error, InfiniteData<CursorPageResponse<Item>>, [string, string, typeof filters], string | null>({
    queryKey: ['encyclopedia', 'items', filters],
    queryFn: ({ pageParam }) => fetchItems({ ...filters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });
}

export function useInfiniteClasses(filters: Omit<CommonFilters, 'cursor'>) {
  return useInfiniteQuery<CursorPageResponse<ArchetypeSummary>, Error, InfiniteData<CursorPageResponse<ArchetypeSummary>>, [string, string, typeof filters], string | null>({
    queryKey: ['encyclopedia', 'classes', filters],
    queryFn: ({ pageParam }) => fetchClassesPaginated({ ...filters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });
}

export interface Subclass {
  id: string;
  archetypeId: string;
  ruleset: string;
  slug: string;
  nameEn: string;
  name: string;
  description: string;
  source: string;
}

export async function fetchSubclasses(archetypeId: string, ruleset?: string): Promise<Subclass[]> {
  const params = new URLSearchParams({ archetypeId });
  if (ruleset) params.append('ruleset', ruleset);
  return apiFetch<Subclass[]>(`/api/reference/subclasses?${params.toString()}`);
}

export async function fetchProgressionFeats(archetypeId: string, level: number): Promise<Feat[]> {
  return apiFetch<Feat[]>(`/api/reference/progression-feats?archetypeId=${archetypeId}&level=${level}`);
}

export async function fetchSubclassProgressionFeats(subclassId: string, level: number): Promise<Feat[]> {
  return apiFetch<Feat[]>(`/api/reference/subclass-progression-feats?subclassId=${subclassId}&level=${level}`);
}

export function useInfiniteLineages(filters: Omit<CommonFilters, 'cursor'>) {
  return useInfiniteQuery<CursorPageResponse<LineageSummary>, Error, InfiniteData<CursorPageResponse<LineageSummary>>, [string, string, typeof filters], string | null>({
    queryKey: ['encyclopedia', 'lineages', filters],
    queryFn: ({ pageParam }) => fetchLineagesPaginated({ ...filters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });
}
