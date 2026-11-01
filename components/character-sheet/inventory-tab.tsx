'use client';

import React, { useState, useEffect } from 'react';
import {
  CharacterResponse,
  CharacterItem,
  useManageInventory,
} from '@/lib/api/characters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles, Trash2, Heart, Plus, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { CurrencyPouchCard } from './currency-pouch-card';
import { ItemCatalogModal } from './item-catalog-modal';
import { ItemDetailModal } from '@/components/encyclopedia/item-detail-modal';
import type { Item } from '@/lib/api/encyclopedia';
import { Info } from 'lucide-react';

interface InventoryTabProps {
  character: CharacterResponse;
}

export function InventoryTab({ character }: InventoryTabProps) {
  const inventory = character.inventory || [];
  const { updateItem, removeItem, useConsumable } = useManageInventory(character.id);

  const attunedCount = inventory.filter((i) => i.attuned).length;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [inspectItem, setInspectItem] = useState<Item | null>(null);

  const handleInspect = (charItem: CharacterItem) => {
    const itemModel: Item = {
      id: charItem.itemId || charItem.id,
      slug: charItem.slug || '',
      name: charItem.name || charItem.itemName || 'Item',
      itemCategory: charItem.itemCategory,
      itemType: charItem.itemType || charItem.itemCategory,
      rarity: charItem.rarity || 'Comum',
      attunement: !!(charItem.requiresAttunement ?? charItem.attunement),
      cost: charItem.cost || '',
      weight: charItem.weight || '',
      description: charItem.description || '',
      mechanicalProperties: charItem.mechanicalProperties,
      ruleset: (charItem.ruleset as any) || character.ruleset,
      source: (charItem as any).source || 'SRD',
    };
    setInspectItem(itemModel);
  };

  const handleToggleEquip = (item: CharacterItem) => {
    updateItem.mutate(
      {
        itemId: item.id,
        payload: { equipped: !item.equipped },
      },
      {
        onSuccess: () => {
          toast.success(item.equipped ? 'Item desequipado.' : 'Item equipado com sucesso.');
        },
        onError: (err: any) => {
          toast.error(err.message || 'Erro ao alterar equipamento.');
        },
      }
    );
  };

  const handleToggleAttune = (item: CharacterItem) => {
    if (!item.attuned && attunedCount >= 3) {
      toast.error('Limite máximo de 3 itens sintonizados atingido.');
      return;
    }
    updateItem.mutate(
      {
        itemId: item.id,
        payload: { attuned: !item.attuned },
      },
      {
        onSuccess: () => {
          toast.success(item.attuned ? 'Sintonia desfeita.' : 'Item sintonizado com sucesso.');
        },
        onError: (err: any) => {
          toast.error(err.message || 'Erro ao sintonizar item.');
        },
      }
    );
  };

  const handleUse = (item: CharacterItem) => {
    useConsumable.mutate(item.id, {
      onSuccess: (data: any) => {
        toast.success(`Consumível usado: ${data.itemName}. Rolagem: ${data.rollTotal}. Vida atual: ${data.currentHp}/${data.maxHp}`);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Erro ao usar consumível.');
      },
    });
  };

  const handleDelete = (item: CharacterItem) => {
    removeItem.mutate(item.id, {
      onSuccess: () => {
        toast.success('Item removido do inventário.');
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Currency Pouch */}
      <CurrencyPouchCard character={character} />

      {/* Attunement and Add Item Header */}
      <div className="flex items-center justify-between bg-surface/50 border border-primary/20 p-3 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-foreground">Slots de Sintonia:</span>
          <span className="font-mono text-primary font-bold">{attunedCount} / 3</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground mr-1">{inventory.length} itens carregados</span>
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-zinc-950 font-serif font-bold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Adicionar / Comprar Itens
          </Button>
        </div>
      </div>

      <ItemCatalogModal
        character={character}
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {inventory.length === 0 ? (
        <Card className="border-dashed border-primary/30 bg-surface/30">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Nenhum item presente no inventário deste personagem.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {inventory.map((item) => {
            const isConsumable = item.itemCategory?.toUpperCase() === 'CONSUMABLE';
            const displayName = item.name || item.itemName || 'Item';
            const reqAttune = item.requiresAttunement ?? item.attunement;
            return (
              <Card
                key={item.id}
                className="bg-surface/60 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div
                    onClick={() => handleInspect(item)}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer group select-none"
                  >
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 group-hover:text-amber-300 transition-colors">
                      {displayName}
                      <span className="text-xs font-mono font-normal text-muted-foreground">
                        x{item.quantity}
                      </span>
                    </CardTitle>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30">
                        {item.itemCategory}
                      </Badge>
                      {reqAttune && (
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${item.attuned ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : ''}`}
                        >
                          {item.attuned ? 'Sintonizado' : 'Requer Sintonia'}
                        </Badge>
                      )}
                      {item.equipped && (
                        <Badge className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/40">
                          Equipado
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-300"
                      onClick={() => handleInspect(item)}
                      title="Ver detalhes"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                      onClick={() => handleDelete(item)}
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  {item.description && (
                    <p
                      onClick={() => handleInspect(item)}
                      className="text-xs text-muted-foreground line-clamp-2 cursor-pointer hover:text-slate-300"
                    >
                      {item.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    {!isConsumable && (
                      <Button
                        size="sm"
                        variant={item.equipped ? 'default' : 'outline'}
                        className="h-7 text-xs flex-1"
                        onClick={() => handleToggleEquip(item)}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {item.equipped ? 'Desequipar' : 'Equipar'}
                      </Button>
                    )}

                    {reqAttune && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-7 text-xs flex-1 ${item.attuned ? 'border-amber-500/40 text-amber-400' : ''}`}
                        onClick={() => handleToggleAttune(item)}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {item.attuned ? 'Desfazer' : 'Sintonizar'}
                      </Button>
                    )}

                    {isConsumable && (
                      <Button
                        size="sm"
                        className="h-7 text-xs flex-1 bg-red-600/80 hover:bg-red-700 text-white font-bold"
                        onClick={() => handleUse(item)}
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Usar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ItemDetailModal
        item={inspectItem}
        open={!!inspectItem}
        onClose={() => setInspectItem(null)}
      />
    </div>
  );
}
