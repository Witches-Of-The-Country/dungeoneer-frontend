import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NoteCard } from '@/components/note-card';
import { AddNoteForm } from '@/components/add-note-form';
import {
  translateReferenceName,
  CLASS_NAMES_PT,
  RACE_NAMES_PT,
  BACKGROUND_NAMES_PT,
  SKILL_NAMES_PT,
} from '@/lib/srd-translations';
import * as apiClient from '@/lib/api/client';
import type { CharacterNote } from '@/lib/api/characters';

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

describe('Bug 2 & 3: Incremental Notes & SRD Translations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('SRD Translations (translateReferenceName)', () => {
    it('translates English SRD terms into PT-BR correctly', () => {
      expect(translateReferenceName('Fighter')).toBe('Guerreiro');
      expect(translateReferenceName('Wizard')).toBe('Mago');
      expect(translateReferenceName('Elf')).toBe('Elfo');
      expect(translateReferenceName('Acolyte')).toBe('Acólito');
      expect(translateReferenceName('Stealth')).toBe('Furtividade');
      expect(translateReferenceName('Fireball')).toBe('Bola de Fogo');
      expect(translateReferenceName('Magic Initiate')).toBe('Iniciado em Magia');
      // Expanded translations: traits and equipment
      expect(translateReferenceName('Darkvision')).toBe('Visão no Escuro');
      expect(translateReferenceName('Fey Ancestry')).toBe('Ancestralidade Feérica');
      expect(translateReferenceName('Light armor')).toBe('Armaduras leves');
      expect(translateReferenceName('Martial weapons')).toBe('Armas marciais');
    });

    it('falls back to the original text when no translation is defined', () => {
      expect(translateReferenceName('Custom Homebrew Class')).toBe(
        'Custom Homebrew Class'
      );
      expect(translateReferenceName('')).toBe('');
      expect(translateReferenceName(null as unknown as string)).toBe('');
    });
  });

  describe('NoteCard Component', () => {
    it('renders note title, formatted PT-BR date, and note content', () => {
      const mockNote: CharacterNote = {
        id: 'note-xyz',
        characterId: 'char-101',
        title: 'Pacto Secreto',
        body: 'Encontro à meia-noite sob a ponte dos corvos.',
        createdAt: '2026-10-30T20:30:00Z',
      };

      renderWithQuery(<NoteCard note={mockNote} />);

      expect(screen.getByText('Pacto Secreto')).toBeInTheDocument();
      expect(
        screen.getByText('Encontro à meia-noite sob a ponte dos corvos.')
      ).toBeInTheDocument();
      // Date should be rendered in pt-BR
      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it('toggles edit mode, updates note title and body via PUT, and returns to view mode', async () => {
      const mockNote: CharacterNote = {
        id: 'note-xyz',
        characterId: 'char-101',
        title: 'Pacto Secreto',
        body: 'Encontro à meia-noite sob a ponte dos corvos.',
        createdAt: '2026-10-30T20:30:00Z',
      };

      const apiFetchSpy = vi
        .spyOn(apiClient, 'apiFetch')
        .mockResolvedValueOnce({
          ...mockNote,
          title: 'Pacto Revelado',
          body: 'O traidor foi desmascarado ao amanhecer.',
        });

      renderWithQuery(<NoteCard note={mockNote} />);

      // Click pencil edit button
      const editButton = screen.getByRole('button', { name: /Editar nota/i });
      fireEvent.click(editButton);

      // Verify inline inputs appear
      const titleInput = screen.getByLabelText(/Título da nota editável/i);
      const bodyInput = screen.getByLabelText(/Conteúdo da nota editável/i);
      expect(titleInput).toHaveValue('Pacto Secreto');
      expect(bodyInput).toHaveValue('Encontro à meia-noite sob a ponte dos corvos.');

      // Change content and save
      fireEvent.change(titleInput, { target: { value: 'Pacto Revelado' } });
      fireEvent.change(bodyInput, { target: { value: 'O traidor foi desmascarado ao amanhecer.' } });

      const saveButton = screen.getByRole('button', { name: /Salvar/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiFetchSpy).toHaveBeenCalledWith(
          '/api/characters/char-101/notes/note-xyz',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({
              title: 'Pacto Revelado',
              body: 'O traidor foi desmascarado ao amanhecer.',
            }),
          })
        );
      });
    });

    it('cancels edit mode on cancel button click without saving changes', () => {
      const mockNote: CharacterNote = {
        id: 'note-xyz',
        characterId: 'char-101',
        title: 'Pacto Secreto',
        body: 'Encontro à meia-noite sob a ponte dos corvos.',
        createdAt: '2026-10-30T20:30:00Z',
      };

      const apiFetchSpy = vi.spyOn(apiClient, 'apiFetch');

      renderWithQuery(<NoteCard note={mockNote} />);

      fireEvent.click(screen.getByRole('button', { name: /Editar nota/i }));

      const titleInput = screen.getByLabelText(/Título da nota editável/i);
      fireEvent.change(titleInput, { target: { value: 'Título Provisório' } });

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(screen.getByText('Pacto Secreto')).toBeInTheDocument();
      expect(apiFetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('AddNoteForm Component', () => {
    it('validates required fields and rejects empty submission', async () => {
      renderWithQuery(<AddNoteForm characterId="char-101" />);

      fireEvent.click(screen.getByRole('button', { name: /Adicionar Nota/i }));

      expect(
        await screen.findByText(/O título da nota é obrigatório/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/O corpo da nota é obrigatório/i)
      ).toBeInTheDocument();
    });

    it('submits valid note payload to POST /api/characters/{id}/notes and clears inputs', async () => {
      const apiFetchSpy = vi
        .spyOn(apiClient, 'apiFetch')
        .mockResolvedValueOnce({
          id: 'note-new',
          characterId: 'char-101',
          title: 'Mapa do Tesouro',
          body: 'Marcado com um X vermelho nas colinas.',
          createdAt: '2026-10-30T22:00:00Z',
        });

      renderWithQuery(<AddNoteForm characterId="char-101" />);

      const titleInput = screen.getByLabelText(/Título da Nota/i);
      const bodyInput = screen.getByLabelText(/Conteúdo/i);

      fireEvent.change(titleInput, { target: { value: 'Mapa do Tesouro' } });
      fireEvent.change(bodyInput, {
        target: { value: 'Marcado com um X vermelho nas colinas.' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Adicionar Nota/i }));

      await waitFor(() => {
        expect(apiFetchSpy).toHaveBeenCalledWith(
          '/api/characters/char-101/notes',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              title: 'Mapa do Tesouro',
              body: 'Marcado com um X vermelho nas colinas.',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(titleInput).toHaveValue('');
        expect(bodyInput).toHaveValue('');
      });
    });
  });
});
