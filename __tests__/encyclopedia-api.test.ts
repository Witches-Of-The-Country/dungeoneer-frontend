import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from '@/lib/api/client';
import {
  fetchSpells,
  fetchFeats,
  fetchItems,
  fetchClassesPaginated,
  fetchLineagesPaginated,
} from '@/lib/api/encyclopedia';

describe('Encyclopedia API Fetchers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchSpells builds correct query URL with filters', async () => {
    const spy = vi.spyOn(client, 'apiFetch').mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNext: false,
      pageSize: 0,
    } as any);

    await fetchSpells({ q: 'fogo', level: 3, school: 'Evocação', ruleset: 'SRD_2024', limit: 15 });

    expect(spy).toHaveBeenCalledWith(
      '/api/reference/spells?q=fogo&level=3&school=Evoca%C3%A7%C3%A3o&ruleset=SRD_2024&limit=15'
    );
  });

  it('fetchItems builds correct query URL with category and rarity', async () => {
    const spy = vi.spyOn(client, 'apiFetch').mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNext: false,
      pageSize: 0,
    } as any);

    await fetchItems({ category: 'WEAPON', rarity: 'NONE', limit: 20 });

    expect(spy).toHaveBeenCalledWith('/api/reference/items?category=WEAPON&rarity=NONE&limit=20');
  });

  it('fetchFeats appends cursor token when paginating', async () => {
    const spy = vi.spyOn(client, 'apiFetch').mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNext: false,
      pageSize: 0,
    } as any);

    await fetchFeats({ cursor: 'token-abc', limit: 10 });

    expect(spy).toHaveBeenCalledWith('/api/reference/feats?cursor=token-abc&limit=10');
  });
});
