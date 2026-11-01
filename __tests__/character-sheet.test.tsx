import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CharacterSheetPage from '@/app/characters/[id]/page';
import * as apiClient from '@/lib/api/client';
import type { CharacterResponse, CharacterNote } from '@/lib/api/characters';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'char-101' }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCharacter: CharacterResponse = {
  id: 'char-101',
  name: 'Legolas Folha Verde',
  level: 3,
  hitPointsCurrent: 24,
  hitPointsMax: 28,
  hitPointsTemp: 2,
  armorClass: 16,
  initiativeBonus: 4,
  speed: 35,
  proficiencyBonus: 2,
  ruleset: 'SRD_2024',
  hasPendingLevelChoices: true,
  notes: 'Arqueiro élfico da Floresta das Trevas.',
  abilityScores: {
    strength: 12,
    dexterity: 18,
    constitution: 14,
    intelligence: 12,
    wisdom: 14,
    charisma: 10,
  },
  lineage: {
    id: 'lin-elf',
    name: 'Elfo',
    description: 'Povo gracioso.',
    speed: 35,
    size: 'MEDIUM',
    abilityBonuses: {},
    traitsSummary: ['Visão no Escuro'],
    ruleset: 'SRD_2024',
  },
  background: {
    id: 'bg-soldier',
    name: 'Soldado',
    description: 'Guardião élfico.',
    skillProficiencies: ['Athletics', 'Perception'],
    allowedAbilityBonuses: ['STR', 'DEX', 'CON'],
    originFeatName: 'Alerta',
    originFeatDescription: 'Bônus na iniciativa.',
    ruleset: 'SRD_2024',
  },
  archetype: {
    id: 'cls-ranger',
    name: 'Patrulheiro',
    hitDice: 'd10',
    primaryAbility: 'DEXTERITY',
    savingThrowProficiencies: ['STRENGTH', 'DEXTERITY'],
    spellcastingType: 'HALF',
    ruleset: 'SRD_2024',
  },
};

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('TP-02: 8-Tab Character Sheet View (/characters/[id])', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all 8 tabs, displays live data in Resumo, Atributos, Perícias, and Notas, and shows Em breve in placeholder tabs', async () => {
    const initialNotes: CharacterNote[] = [
      {
        id: 'note-1',
        characterId: 'char-101',
        title: 'Origem Élfica',
        body: 'Arqueiro élfico da Floresta das Trevas.',
        createdAt: '2026-10-30T10:00:00Z',
      },
    ];
    let currentNotes = [...initialNotes];

    const apiFetchSpy = vi
      .spyOn(apiClient, 'apiFetch')
      .mockImplementation(async (endpoint: string, options?: apiClient.ApiRequestOptions) => {
        if (endpoint === '/api/characters/char-101' && (!options?.method || options.method === 'GET')) {
          return mockCharacter;
        }
        if (endpoint === '/api/characters/char-101' && options?.method === 'PUT') {
          const body = JSON.parse(String(options.body));
          return { ...mockCharacter, ...body };
        }
        if (endpoint === '/api/characters/char-101/notes' && (!options?.method || options.method === 'GET')) {
          return currentNotes;
        }
        if (endpoint === '/api/characters/char-101/notes' && options?.method === 'POST') {
          const body = JSON.parse(String(options.body));
          const created: CharacterNote = {
            id: 'note-2',
            characterId: 'char-101',
            title: body.title,
            body: body.body,
            createdAt: '2026-10-30T11:00:00Z',
          };
          currentNotes = [created, ...currentNotes];
          return created;
        }
        return undefined;
      });

    renderWithQuery(<CharacterSheetPage />);

    // Wait for character to load
    expect(
      await screen.findByText('Legolas Folha Verde')
    ).toBeInTheDocument();

    // Verify all 8 tabs are rendered
    const expectedTabs = [
      'Resumo',
      'Atributos',
      'Perícias',
      'Ações',
      'Magias',
      'Inventário',
      'Talentos',
      'Notas',
    ];
    for (const tabName of expectedTabs) {
      expect(screen.getByRole('tab', { name: tabName })).toBeInTheDocument();
    }

    // Tab 1: Resumo (active by default)
    expect(screen.getByTestId('sheet-hp-current')).toHaveTextContent('24');
    expect(screen.getByTestId('sheet-ac')).toHaveTextContent('16');
    expect(screen.getByTestId('sheet-initiative')).toHaveTextContent('+4');

    // Quick HP controls: Linha 1 (-1 PV, +1 PV)
    const minusOneBtn = screen.getByRole('button', { name: /Reduzir PV/i });
    const plusOneBtn = screen.getByRole('button', { name: /Aumentar PV/i });
    expect(minusOneBtn).toBeInTheDocument();
    expect(plusOneBtn).toBeInTheDocument();

    // Numeric HP controls: Linha 2 (Dano & Cura with auto-reset)
    const damageInput = screen.getByPlaceholderText('Dano');
    const applyDamageBtn = screen.getByRole('button', { name: /Aplicar Dano/i });
    fireEvent.change(damageInput, { target: { value: '5' } });
    fireEvent.click(applyDamageBtn);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/char-101',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"hitPointsCurrent":19'),
        })
      );
    });
    // Auto-reset verified
    expect(damageInput).toHaveValue(null);

    const healInput = screen.getByPlaceholderText('Cura');
    fireEvent.change(healInput, { target: { value: '3' } });
    fireEvent.keyDown(healInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/char-101',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"hitPointsCurrent":27'),
        })
      );
    });
    // Auto-reset verified
    expect(healInput).toHaveValue(null);

    // Tab 2: Atributos
    fireEvent.click(screen.getByRole('tab', { name: 'Atributos' }));
    expect(
      screen.getByTestId('sheet-ability-card-dexterity')
    ).toHaveTextContent('+4');
    expect(
      screen.getByTestId('sheet-ability-card-dexterity')
    ).toHaveTextContent('Valor: 18');

    // Tab 3: Perícias (18 skills in pt-BR)
    fireEvent.click(screen.getByRole('tab', { name: 'Perícias' }));
    expect(screen.getByText('Acrobacia')).toBeInTheDocument();
    expect(screen.getByText('Atletismo')).toBeInTheDocument();
    expect(screen.getByText('Furtividade')).toBeInTheDocument();
    expect(screen.getByText('Percepção')).toBeInTheDocument();
    const skillRows = screen.getAllByTestId(/^skill-row-/);
    expect(skillRows).toHaveLength(18);

    // Tab 4: Notas (incremental notes list & add note)
    fireEvent.click(screen.getByRole('tab', { name: 'Notas' }));
    expect(await screen.findByText('Origem Élfica')).toBeInTheDocument();
    expect(
      screen.getByText('Arqueiro élfico da Floresta das Trevas.')
    ).toBeInTheDocument();

    // Add a new incremental note via AddNoteForm
    fireEvent.change(screen.getByLabelText(/Título da Nota/i), {
      target: { value: 'Nova anotação da campanha' },
    });
    fireEvent.change(screen.getByLabelText(/Conteúdo/i), {
      target: { value: 'Encontramos rastros no rio.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar Nota/i }));

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/char-101/notes',
        expect.objectContaining({ method: 'POST' })
      );
    });

    expect(await screen.findByText('Nova anotação da campanha')).toBeInTheDocument();
    expect(screen.getByText('Encontramos rastros no rio.')).toBeInTheDocument();

    // Active & Placeholder Tabs
    // Magias continues to be placeholder
    fireEvent.click(screen.getByRole('tab', { name: 'Magias' }));
    expect(screen.getByText('Em breve')).toBeInTheDocument();

    // Ações tab is active
    fireEvent.click(screen.getByRole('tab', { name: 'Ações' }));
    expect(screen.getByText('Nenhuma ação ofensiva ou de combate disponível.')).toBeInTheDocument();

    // Inventário tab is active
    fireEvent.click(screen.getByRole('tab', { name: 'Inventário' }));
    expect(screen.getByText('Nenhum item presente no inventário deste personagem.')).toBeInTheDocument();

    // Talentos tab is active
    fireEvent.click(screen.getByRole('tab', { name: 'Talentos' }));
    expect(screen.getByText('Nenhum talento ou habilidade de classe registrado.')).toBeInTheDocument();
  });
});
