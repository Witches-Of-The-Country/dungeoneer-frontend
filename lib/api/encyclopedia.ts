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
  source: string;
}

export interface ArchetypeSummary {
  id: string;
  name: string;
  hitDice: string;
  primaryAbility: string;
  ruleset: string;
  source: string;
}

export interface LineageSummary {
  id: string;
  name: string;
  speed: number;
  size: string;
  description?: string;
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

function buildQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      q.append(k, String(v));
    }
  });
  const res = q.toString();
  return res ? `?${res}` : '';
}

export async function fetchSpells(filters: SpellFilters = {}): Promise<CursorPageResponse<Spell>> {
  return apiFetch<CursorPageResponse<Spell>>(`/api/reference/spells${buildQuery(filters)}`);
}

export async function fetchFeats(filters: CommonFilters = {}): Promise<CursorPageResponse<Feat>> {
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
  return useInfiniteQuery<CursorPageResponse<Spell>, Error, InfiniteData<CursorPageResponse<Spell>>, [string, typeof filters], string | null>({
    queryKey: ['encyclopedia', 'spells', filters],
    queryFn: ({ pageParam }) => fetchSpells({ ...filters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });
}

export function useInfiniteFeats(filters: Omit<CommonFilters, 'cursor'>) {
  return useInfiniteQuery<CursorPageResponse<Feat>, Error, InfiniteData<CursorPageResponse<Feat>>, [string, typeof filters], string | null>({
    queryKey: ['encyclopedia', 'feats', filters],
    queryFn: ({ pageParam }) => fetchFeats({ ...filters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });
}

export function useInfiniteItems(filters: Omit<ItemFilters, 'cursor'>) {
  return useInfiniteQuery<CursorPageResponse<Item>, Error, InfiniteData<CursorPageResponse<Item>>, [string, typeof filters], string | null>({
    queryKey: ['encyclopedia', 'items', filters],
    queryFn: ({ pageParam }) => fetchItems({ ...filters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });
}

export function useInfiniteClasses(filters: Omit<CommonFilters, 'cursor'>) {
  return useInfiniteQuery<CursorPageResponse<ArchetypeSummary>, Error, InfiniteData<CursorPageResponse<ArchetypeSummary>>, [string, typeof filters], string | null>({
    queryKey: ['encyclopedia', 'classes', filters],
    queryFn: ({ pageParam }) => fetchClassesPaginated({ ...filters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });
}

export function useInfiniteLineages(filters: Omit<CommonFilters, 'cursor'>) {
  return useInfiniteQuery<CursorPageResponse<LineageSummary>, Error, InfiniteData<CursorPageResponse<LineageSummary>>, [string, typeof filters], string | null>({
    queryKey: ['encyclopedia', 'lineages', filters],
    queryFn: ({ pageParam }) => fetchLineagesPaginated({ ...filters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  });
}
