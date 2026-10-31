import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/components/encyclopedia/search-bar';
import { ReferenceCard } from '@/components/encyclopedia/reference-card';
import { EmptySearchResults } from '@/components/encyclopedia/empty-search-results';

describe('Encyclopedia UI Components', () => {
  it('renders SearchBar and triggers debounced onChange', async () => {
    vi.useFakeTimers();
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} debounceMs={300} />);

    const input = screen.getByLabelText('Campo de busca da enciclopédia');
    fireEvent.change(input, { target: { value: 'Bola de Fogo' } });

    expect(handleChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(handleChange).toHaveBeenCalledWith('Bola de Fogo');
    vi.useRealTimers();
  });

  it('renders ReferenceCard with title, ruleset, badge and meta fields', () => {
    render(
      <ReferenceCard
        title="Bola de Fogo"
        subtitle="Fireball"
        badge="3º Círculo"
        ruleset="SRD_2024"
        description="Uma explosão brilhante de fogo surge do dedo do conjurador."
        metaFields={[
          { label: 'Tempo', value: '1 ação' },
          { label: 'Alcance', value: '45 metros' },
        ]}
      />
    );

    expect(screen.getByText('Bola de Fogo')).toBeInTheDocument();
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.getByText('3º Círculo')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText(/Tempo:/)).toBeInTheDocument();
    expect(screen.getByText('1 ação')).toBeInTheDocument();
  });

  it('renders EmptySearchResults with reset button action', () => {
    const handleReset = vi.fn();
    render(
      <EmptySearchResults
        message="Nenhuma magia encontrada."
        onReset={handleReset}
      />
    );

    expect(screen.getByText('Nada encontrado')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma magia encontrada.')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Limpar filtros' });
    fireEvent.click(button);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
