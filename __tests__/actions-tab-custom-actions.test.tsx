import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActionsTab } from '@/components/character-sheet/actions-tab';
import type { CharacterResponse } from '@/lib/api/characters';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockCharacter: CharacterResponse = {
  id: 'char-custom-actions-test',
  name: 'Keth Combat Master',
  level: 4,
  hitPointsCurrent: 30,
  hitPointsMax: 30,
  hitPointsTemp: 0,
  armorClass: 16,
  initiativeBonus: 2,
  speed: 30,
  proficiencyBonus: 2,
  ruleset: 'SRD_2024',
  hasPendingLevelChoices: false,
  abilityScores: {
    strength: 16,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 8,
  },
  lineage: {
    id: 'lin-human',
    name: 'Humano',
    description: 'Versátil.',
    speed: 30,
    size: 'MEDIUM',
    abilityBonuses: {},
    traitsSummary: [],
    ruleset: 'SRD_2024',
  },
  background: {
    id: 'bg-soldier',
    name: 'Soldado',
    description: 'Veterano.',
    skillProficiencies: ['Athletics'],
    allowedAbilityBonuses: ['STR', 'CON'],
    originFeatName: 'Alerta',
    originFeatDescription: 'Iniciativa.',
    ruleset: 'SRD_2024',
  },
  actions: [],
};

describe('ActionsTab — Custom Actions CRUD', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('TR-03: creates, edits, and deletes a custom action', async () => {
    renderWithQuery(<ActionsTab character={mockCharacter} />);

    // 1. Create a custom action
    const openCreateBtn = screen.getByRole('button', { name: /Criar Ação Personalizada/i });
    fireEvent.click(openCreateBtn);

    const nameInput = screen.getByPlaceholderText(/Ex: Ataque Especial, Rajada Arcana/i);
    const bonusInput = screen.getByPlaceholderText(/Ex: 5 \(\+5\)/i);
    const damageInput = screen.getByPlaceholderText(/Ex: 1d8\+3/i);
    const descInput = screen.getByPlaceholderText(/Descreva detalhes mecânicos ou ativação/i);

    fireEvent.change(nameInput, { target: { value: 'Golpe Devastador' } });
    fireEvent.change(bonusInput, { target: { value: '5' } });
    fireEvent.change(damageInput, { target: { value: '2d6+3' } });
    fireEvent.change(descInput, { target: { value: 'Golpe pesado que derruba o alvo.' } });

    const saveBtn = screen.getByRole('button', { name: /Salvar Ação/i });
    fireEvent.click(saveBtn);

    // Verify it renders
    expect(await screen.findByText('Golpe Devastador')).toBeInTheDocument();
    expect(screen.getByText('Golpe pesado que derruba o alvo.')).toBeInTheDocument();

    // 2. Edit the custom action
    const editBtn = screen.getByLabelText('Editar Golpe Devastador');
    fireEvent.click(editBtn);

    // Edit modal should open with prefilled values
    const editTitle = screen.getByText('Editar Ação Personalizada');
    expect(editTitle).toBeInTheDocument();

    const editNameInput = await screen.findByDisplayValue('Golpe Devastador');
    fireEvent.change(editNameInput, { target: { value: 'Golpe Devastador Aprimorado' } });

    const saveChangesBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(saveChangesBtn);

    // Verify edited title appears
    expect(await screen.findByText('Golpe Devastador Aprimorado')).toBeInTheDocument();
    expect(screen.queryByText('Golpe Devastador')).not.toBeInTheDocument();

    // 3. Delete the custom action
    const deleteBtn = screen.getByLabelText('Excluir Golpe Devastador Aprimorado');
    fireEvent.click(deleteBtn);

    // Action should be removed
    await waitFor(() => {
      expect(screen.queryByText('Golpe Devastador Aprimorado')).not.toBeInTheDocument();
    });
  });
});
