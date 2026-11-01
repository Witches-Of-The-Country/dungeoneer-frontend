'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddExperience } from '@/lib/api/characters';

interface AddXpModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
}

export function AddXpModal({ isOpen, onClose, characterId }: AddXpModalProps) {
  const [xpAmount, setXpAmount] = useState<number>(100);
  const addXpMutation = useAddExperience(characterId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (xpAmount <= 0) return;
    addXpMutation.mutate(
      { amount: xpAmount },
      {
        onSuccess: () => {
          onClose();
          setXpAmount(100);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-surface border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-primary font-bold">Adicionar Experiência (XP)</DialogTitle>
          <DialogDescription>
            Insira os pontos de experiência ganhos pelo personagem em combate ou missões.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="xp">Quantidade de XP</Label>
            <Input
              id="xp"
              type="number"
              min={1}
              value={xpAmount}
              onChange={(e) => setXpAmount(parseInt(e.target.value, 10) || 0)}
              className="bg-background border-primary/20 text-foreground"
              required
            />
          </div>

          <div className="flex gap-2">
            {[100, 250, 500, 1000].map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs border-primary/20"
                onClick={() => setXpAmount((prev) => prev + preset)}
              >
                +{preset}
              </Button>
            ))}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={xpAmount <= 0 || addXpMutation.isPending}
              className="bg-primary text-primary-foreground font-semibold"
            >
              {addXpMutation.isPending ? 'Salvando...' : 'Confirmar XP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}