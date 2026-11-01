import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { XpProgressBar } from '@/components/character-sheet/xp-progress-bar';
import { getXpProgress } from '@/lib/api/characters';

describe('XP Progress Bar & Level Up UI logic', () => {
  it('correctly calculates XP progression and level up readiness', () => {
    // Level 1: floor 0, target 300
    const progressLevel1 = getXpProgress(300, 1);
    expect(progressLevel1.canLevelUp).toBe(true);
    expect(progressLevel1.percentage).toBe(100);

    const progressLevel1Partial = getXpProgress(150, 1);
    expect(progressLevel1Partial.canLevelUp).toBe(false);
    expect(progressLevel1Partial.percentage).toBe(50);

    // Max Level (20)
    const progressMax = getXpProgress(355000, 20);
    expect(progressMax.canLevelUp).toBe(false);
    expect(progressMax.percentage).toBe(100);
  });

  it('renders XpProgressBar and displays Subir de Nível button when eligible', () => {
    const handleAddXp = vi.fn();
    const handleLevelUp = vi.fn();

    const { rerender } = render(
      <XpProgressBar
        currentXp={100}
        currentLevel={1}
        onOpenAddXp={handleAddXp}
        onOpenLevelUp={handleLevelUp}
      />
    );

    expect(screen.getByText('Experiência (XP)')).toBeInTheDocument();
    expect(screen.getByText('Nível 1')).toBeInTheDocument();
    expect(screen.queryByText('Subir de Nível!')).not.toBeInTheDocument();

    // Re-render with enough XP
    rerender(
      <XpProgressBar
        currentXp={300}
        currentLevel={1}
        onOpenAddXp={handleAddXp}
        onOpenLevelUp={handleLevelUp}
      />
    );

    const levelUpBtn = screen.getByText('Subir de Nível!');
    expect(levelUpBtn).toBeInTheDocument();

    fireEvent.click(levelUpBtn);
    expect(handleLevelUp).toHaveBeenCalledTimes(1);
  });
});