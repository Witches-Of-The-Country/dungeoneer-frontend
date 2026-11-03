import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { XpProgressBar } from '@/components/character-sheet/xp-progress-bar';
import { LevelUpWizardModal } from '@/components/character-sheet/level-up-wizard-modal';
import { getXpProgress, CharacterResponse } from '@/lib/api/characters';

const mockLevelUpMutate = vi.fn();
const mockRollHpMutateAsync = vi.fn();

vi.mock('@/lib/api/characters', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/characters')>();
  return {
    ...actual,
    useLevelUp: () => ({
      mutate: mockLevelUpMutate,
      isPending: false,
    }),
    useRollHitPoints: () => ({
      mutateAsync: mockRollHpMutateAsync,
      isPending: false,
    }),
    useReferenceClasses: (ruleset: string) => ({
      data:
        ruleset === 'HOMEBREW'
          ? []
          : [
              {
                id: 'arch-fighter',
                name: 'Guerreiro',
                hitDice: 'd10',
                primaryAbility: 'STRENGTH',
                savingThrowProficiencies: ['STRENGTH', 'CONSTITUTION'],
                spellcastingType: 'NONE',
                subclassLevel: 3,
                ruleset: 'SRD_2024',
              },
              {
                id: 'arch-rogue',
                name: 'Ladino',
                hitDice: 'd8',
                primaryAbility: 'DEXTERITY',
                savingThrowProficiencies: ['DEXTERITY', 'INTELLIGENCE'],
                spellcastingType: 'NONE',
                subclassLevel: 3,
                ruleset: 'SRD_2024',
              },
            ],
    }),
  };
});

vi.mock('@/lib/api/encyclopedia', () => ({
  fetchSubclasses: vi.fn().mockResolvedValue([
    {
      id: 'sub-champion',
      archetypeId: 'arch-fighter',
      name: 'Campeão',
      nameEn: 'Champion',
      description: 'Mestre crítico marcial.',
      ruleset: 'SRD_2024',
      source: 'SRD',
    },
  ]),
  fetchProgressionFeats: vi.fn().mockResolvedValue([]),
  fetchSubclassProgressionFeats: vi.fn().mockResolvedValue([]),
  fetchFeats: vi.fn().mockResolvedValue({
    items: [
      {
        id: 'feat-tough',
        name: 'Durão',
        nameEn: 'Tough',
        featType: 'ORIGIN',
        prerequisites: '',
        description: 'Seu máximo de PV aumenta em 2 por nível.',
        ruleset: 'SRD_2024',
        source: 'SRD',
      },
      {
        id: 'feat-gwm',
        name: 'Mestre de Armas Grandes',
        nameEn: 'Great Weapon Master',
        featType: 'GENERAL',
        prerequisites: 'Nível 4+, Força 13+',
        description: 'Golpes pesados devastadores.',
        ruleset: 'SRD_2024',
        source: 'SRD',
      },
      {
        id: 'feat-athlete',
        name: 'Atleta',
        nameEn: 'Athlete',
        featType: 'GENERAL',
        prerequisites: 'Nível 4+, Força ou Destreza 13+',
        description: 'Aumente Força ou Destreza em 1.',
        ruleset: 'SRD_2024',
        source: 'SRD',
        mechanicalEffects: {
          abilityBonusChoice: {
            chooseCount: 1,
            allowedAbilities: ['STR', 'DEX'],
            bonusAmount: 1,
          },
        },
      },
    ],
  }),
}));

describe('XP Progress Bar & Level Up Wizard Modal logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly calculates XP progression and level up readiness', () => {
    const progressLevel1 = getXpProgress(300, 1);
    expect(progressLevel1.canLevelUp).toBe(true);
    expect(progressLevel1.percentage).toBe(100);

    const progressLevel1Partial = getXpProgress(150, 1);
    expect(progressLevel1Partial.canLevelUp).toBe(false);
    expect(progressLevel1Partial.percentage).toBe(50);

    const progressMax = getXpProgress(355000, 20);
    expect(progressMax.canLevelUp).toBe(false);
    expect(progressMax.percentage).toBe(100);
  });

  it('renders XpProgressBar and displays Subir de Nível button when eligible by XP or hasPendingLevelChoices', () => {
    const handleAddXp = vi.fn();
    const handleLevelUp = vi.fn();

    const { rerender } = render(
      <XpProgressBar
        currentXp={100}
        currentLevel={1}
        hasPendingLevelChoices={false}
        onOpenAddXp={handleAddXp}
        onOpenLevelUp={handleLevelUp}
      />
    );

    expect(screen.getByText('Experiência (XP)')).toBeInTheDocument();
    expect(screen.getByText('Nível 1')).toBeInTheDocument();
    expect(screen.queryByText('Subir de Nível!')).not.toBeInTheDocument();

    // Re-render with hasPendingLevelChoices = true
    rerender(
      <XpProgressBar
        currentXp={100}
        currentLevel={1}
        hasPendingLevelChoices={true}
        onOpenAddXp={handleAddXp}
        onOpenLevelUp={handleLevelUp}
      />
    );

    const levelUpBtn = screen.getByText('Subir de Nível!');
    expect(levelUpBtn).toBeInTheDocument();

    fireEvent.click(levelUpBtn);
    expect(handleLevelUp).toHaveBeenCalledTimes(1);
  });

  it('allows unrestricted multiclassing, locks HP method to character.hpCalculationMethod, and supports ASI vs Feat choice at ASI levels', async () => {
    const mockChar: CharacterResponse = {
      id: 'char-1',
      name: 'Thorin',
      level: 3,
      hitPointsCurrent: 28,
      hitPointsMax: 28,
      hitPointsTemp: 0,
      armorClass: 16,
      initiativeBonus: 2,
      speed: 30,
      proficiencyBonus: 2,
      ruleset: 'SRD_2024',
      hpCalculationMethod: 'AVERAGE',
      experiencePoints: 2700,
      abilityScores: {
        strength: 16,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
      },
      lineage: {
        id: 'lin-1',
        name: 'Anão',
        description: '',
        speed: 30,
        size: 'MEDIUM',
        abilityBonuses: {},
        traitsSummary: [],
        ruleset: 'SRD_2024',
      },
      background: {
        id: 'bg-1',
        name: 'Soldado',
        description: '',
        skillProficiencies: [],
        allowedAbilityBonuses: [],
        ruleset: 'SRD_2024',
      },
      archetype: {
        id: 'arch-fighter',
        name: 'Guerreiro',
        hitDice: 'd10',
        primaryAbility: 'STRENGTH',
        savingThrowProficiencies: ['STRENGTH', 'CONSTITUTION'],
        spellcastingType: 'NONE',
        subclassLevel: 3,
        ruleset: 'SRD_2024',
      },
      classProgressions: [
        {
          archetypeId: 'arch-fighter',
          subclassId: 'sub-champion',
          classLevel: 3,
        },
      ],
    };

    render(
      <LevelUpWizardModal
        isOpen={true}
        onClose={vi.fn()}
        character={mockChar}
      />
    );

    // Step 1 shows both existing Guerreiro (Nv. 3 -> 4) and multiclass option Ladino (+ Multiclasse Nv. 1)
    expect(screen.getByTestId('levelup-class-option-arch-fighter')).toBeInTheDocument();
    expect(screen.getByTestId('levelup-class-option-arch-rogue')).toBeInTheDocument();

    // Advance with Guerreiro (reaching Level 4, which is an ASI/Feat level)
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Step 2: HP Method is locked to AVERAGE (Média Fixa: d10 -> 6 + CON(+2) = +8 HP)
    expect(screen.getByText(/Método de PV da Carreira/i)).toBeInTheDocument();
    expect(screen.getByText('+8 HP')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Step 3: ASI vs Feat toggle appears for Level 4 Fighter
    const featChoiceBtn = screen.getByTestId('choice-feat-button');
    fireEvent.click(featChoiceBtn);

    const featSelect = await screen.findByTestId('levelup-feat-select');
    fireEvent.change(featSelect, { target: { value: 'feat-gwm' } });

    // Advance to Summary (Step 4)
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Confirm Level Up
    fireEvent.click(screen.getByTestId('levelup-confirm-button'));

    await waitFor(() => {
      expect(mockLevelUpMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          archetypeId: 'arch-fighter',
          subclassId: null,
          hpCalculationMethod: 'AVERAGE',
          hpIncrease: 8,
          selectedFeatId: 'feat-gwm',
        }),
        expect.anything()
      );
    });
  });

  it('renders rich feat selector with search, category filter, and card selection', async () => {
    const mockChar: CharacterResponse = {
      id: 'char-2',
      name: 'Gimli',
      level: 3,
      hitPointsCurrent: 30,
      hitPointsMax: 30,
      ruleset: 'SRD_2024',
      className: 'Guerreiro',
      lineageName: 'Anão',
      updatedAt: '2026-11-01T00:00:00Z',
      archetype: {
        id: 'arch-fighter',
        name: 'Guerreiro',
        hitDice: 'd10',
        ruleset: 'SRD_2024',
      },
      classProgressions: [
        {
          id: 'prog-1',
          characterId: 'char-2',
          archetypeId: 'arch-fighter',
          classLevel: 3,
        },
      ],
      classes: [{ className: 'Guerreiro', classLevel: 3 }],
      abilityScores: {
        strength: 16,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
      },
    };

    render(
      <LevelUpWizardModal
        isOpen={true}
        onClose={vi.fn()}
        character={mockChar}
      />
    );

    // Step 1: Advance class choice
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Step 2: Advance HP step
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Step 3: Choose Feat
    const featChoiceBtn = screen.getByTestId('choice-feat-button');
    fireEvent.click(featChoiceBtn);

    // Search bar is displayed
    const searchInput = await screen.findByPlaceholderText(/Buscar talento por nome/i);
    expect(searchInput).toBeInTheDocument();

    // Feat cards are rendered
    const gwmCard = await screen.findByTestId('feat-card-feat-gwm');
    expect(gwmCard).toBeInTheDocument();
    expect(within(gwmCard).getByText('Mestre de Armas Grandes')).toBeInTheDocument();

    // Select the feat via card click
    fireEvent.click(gwmCard);

    // Verify selection confirmation banner
    expect(screen.getByText(/Talento Selecionado:/i)).toBeInTheDocument();

    // Advance to Summary (Step 4)
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Summary displays selected feat
    expect(screen.getByText('Talento: Mestre de Armas Grandes')).toBeInTheDocument();
  });

  it('renders half-feat ability score selector, enforces selection before advancing, and submits chosen ability increase in mutation payload', async () => {
    const mockChar: CharacterResponse = {
      id: 'char-half-feat',
      name: 'Conan',
      level: 3,
      hitPointsCurrent: 32,
      hitPointsMax: 32,
      ruleset: 'SRD_2024',
      className: 'Guerreiro',
      lineageName: 'Humano',
      updatedAt: '2026-11-01T00:00:00Z',
      archetype: {
        id: 'arch-fighter',
        name: 'Guerreiro',
        hitDice: 'd10',
        ruleset: 'SRD_2024',
      },
      classProgressions: [
        {
          id: 'prog-1',
          characterId: 'char-half-feat',
          archetypeId: 'arch-fighter',
          classLevel: 3,
        },
      ],
      classes: [{ className: 'Guerreiro', classLevel: 3 }],
      abilityScores: {
        strength: 15,
        dexterity: 13,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
      },
    };

    render(
      <LevelUpWizardModal
        isOpen={true}
        onClose={vi.fn()}
        character={mockChar}
      />
    );

    // Step 1: Advance class choice
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Step 2: Advance HP step
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Step 3: Choose Feat
    const featChoiceBtn = screen.getByTestId('choice-feat-button');
    fireEvent.click(featChoiceBtn);

    // Select the half-feat "Atleta"
    const athleteCard = await screen.findByTestId('feat-card-feat-athlete');
    expect(athleteCard).toBeInTheDocument();
    fireEvent.click(athleteCard);

    // Verify Half-Feat sub-panel renders with FOR and DES options
    expect(screen.getByText(/Bônus de Atributo do Talento \(\+1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Escolha 1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /FOR/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DES/i })).toBeInTheDocument();

    // Attempt to advance WITHOUT selecting an ability -> blocked
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));
    // Step remains at 3 (summary heading is not displayed)
    expect(screen.queryByText(/Novo Nível Total:/i)).not.toBeInTheDocument();

    // Select FOR (+1 Força: 15 -> 16)
    const forBtn = screen.getByRole('button', { name: /FOR/i });
    fireEvent.click(forBtn);

    // Advance to Step 4 (Summary)
    fireEvent.click(screen.getByRole('button', { name: /Avançar/i }));

    // Verify Step 4 summary shows chosen half-feat with ability boost
    expect(screen.getByText(/Novo Nível Total:/i)).toBeInTheDocument();
    expect(screen.getByText(/Talento: Atleta \(\+1 em Força\)/i)).toBeInTheDocument();

    // Confirm Level Up
    fireEvent.click(screen.getByTestId('levelup-confirm-button'));

    await waitFor(() => {
      expect(mockLevelUpMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedFeatId: 'feat-athlete',
          abilityScoreIncreases: {
            STR: 1,
          },
        }),
        expect.anything()
      );
    });
  });
});
