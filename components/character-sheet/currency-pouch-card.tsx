'use client';

import React, { useState } from 'react';
import { CharacterResponse, useManageInventory } from '@/lib/api/characters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, ArrowRightLeft, Edit3, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface CurrencyPouchCardProps {
  character: CharacterResponse;
}

export function CurrencyPouchCard({ character }: CurrencyPouchCardProps) {
  const { updateCurrency } = useManageInventory(character.id);
  const pouch = character.currency || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, totalCopper: 0, totalGold: 0 };

  const [isEditing, setIsEditing] = useState(false);
  const [draftCp, setDraftCp] = useState(pouch.cp);
  const [draftSp, setDraftSp] = useState(pouch.sp);
  const [draftEp, setDraftEp] = useState(pouch.ep);
  const [draftGp, setDraftGp] = useState(pouch.gp);
  const [draftPp, setDraftPp] = useState(pouch.pp);

  const startEditing = () => {
    setDraftCp(pouch.cp);
    setDraftSp(pouch.sp);
    setDraftEp(pouch.ep);
    setDraftGp(pouch.gp);
    setDraftPp(pouch.pp);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateCurrency.mutate(
      {
        cp: Math.max(0, draftCp),
        sp: Math.max(0, draftSp),
        ep: Math.max(0, draftEp),
        gp: Math.max(0, draftGp),
        pp: Math.max(0, draftPp),
      },
      {
        onSuccess: () => {
          toast.success('Bolsa de moedas atualizada com sucesso!');
          setIsEditing(false);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Erro ao atualizar moedas.');
        },
      }
    );
  };

  const handleConsolidate = () => {
    updateCurrency.mutate(
      { consolidate: true },
      {
        onSuccess: () => {
          toast.success('Moedas consolidadas em PO e PL!');
        },
        onError: (err: any) => {
          toast.error(err.message || 'Erro ao consolidar moedas.');
        },
      }
    );
  };

  const coins = [
    { label: 'PC', name: 'Cobre', val: pouch.cp, draftVal: draftCp, setVal: setDraftCp, color: 'text-amber-600 border-amber-600/30 bg-amber-950/20' },
    { label: 'PP', name: 'Prata', val: pouch.sp, draftVal: draftSp, setVal: setDraftSp, color: 'text-slate-300 border-slate-400/30 bg-slate-900/30' },
    { label: 'PE', name: 'Electro', val: pouch.ep, draftVal: draftEp, setVal: setDraftEp, color: 'text-cyan-400 border-cyan-400/30 bg-cyan-950/20' },
    { label: 'PO', name: 'Ouro', val: pouch.gp, draftVal: draftGp, setVal: setDraftGp, color: 'text-amber-400 border-amber-400/30 bg-amber-950/30 font-bold' },
    { label: 'PL', name: 'Platina', val: pouch.pp, draftVal: draftPp, setVal: setDraftPp, color: 'text-violet-300 border-violet-400/30 bg-violet-950/20 font-bold' },
  ];

  return (
    <Card className="bg-surface/70 border-primary/30 shadow-md">
      <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <CardTitle className="text-sm font-bold text-foreground">
            Bolsa de Moedas (Currency Pouch)
          </CardTitle>
        </div>
        <div className="flex items-center gap-1.5">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConsolidate}
                className="h-7 text-xs border-primary/30 hover:border-primary/60 text-muted-foreground hover:text-foreground"
                title="Converte moedas menores em ouro e platina sem perder valor"
              >
                <ArrowRightLeft className="w-3 h-3 mr-1 text-primary" />
                Consolidar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={startEditing}
                className="h-7 text-xs border-primary/30 hover:border-primary/60 text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Editar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateCurrency.isPending}
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Salvar
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3.5 pt-1 space-y-3">
        <div className="grid grid-cols-5 gap-2">
          {coins.map((coin) => (
            <div
              key={coin.label}
              className={`p-2 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${coin.color}`}
            >
              <span className="text-[10px] tracking-wider font-mono opacity-80">{coin.label}</span>
              <span className="text-[9px] text-muted-foreground leading-none mb-1">{coin.name}</span>
              {!isEditing ? (
                <span className="text-sm font-mono font-bold">{coin.val}</span>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={coin.draftVal === 0 ? '' : coin.draftVal}
                  placeholder="0"
                  onChange={(e) => coin.setVal(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full text-center bg-background/80 border border-primary/40 rounded px-1 py-0.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-primary/10 pt-2 px-1">
          <span>
            Patrimônio total equivalente:{' '}
            <strong className="text-amber-400 font-mono">{pouch.totalGold ?? 0} PO</strong>
          </span>
          <span className="font-mono text-[10px]">
            ({pouch.totalCopper ?? 0} PC)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
