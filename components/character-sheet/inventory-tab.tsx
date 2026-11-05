'use client';

import React, { useState } from 'react';
import {
  CharacterResponse,
  CharacterItem,
  EquipmentSlot,
  useManageInventory,
} from '@/lib/api/characters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles, Trash2, Heart, Plus, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { CurrencyPouchCard } from './currency-pouch-card';
import { ItemCatalogModal } from './item-catalog-modal';
import { ItemDetailModal } from '@/components/encyclopedia/item-detail-modal';
import type { Item } from '@/lib/api/encyclopedia';

export const EQUIPMENT_SLOTS: { slot: EquipmentSlot; label: string }[] = [
  { slot: 'HELMET', label: 'Capacete' },
  { slot: 'CLOAK', label: 'Capa' },
  { slot: 'NECKLACE', label: 'Colar' },
  { slot: 'CHEST', label: 'Peito' },
  { slot: 'GLOVES', label: 'Luvas' },
  { slot: 'PANTS', label: 'Calças' },
  { slot: 'BOOTS', label: 'Botas' },
  { slot: 'TRINKET', label: 'Acessório / Cinto' },
  { slot: 'RIGHT_HAND', label: 'Mão Direita' },
  { slot: 'LEFT_HAND', label: 'Mão Esquerda' },
  { slot: 'RING_1', label: 'Anel 1' },
  { slot: 'RING_2', label: 'Anel 2' },
];

export function getSlotLabel(slot?: string | null): string {
  switch (slot) {
    case 'CHEST': return 'Peito';
    case 'GLOVES': return 'Luvas';
    case 'BOOTS': return 'Botas';
    case 'HELMET': return 'Capacete';
    case 'PANTS': return 'Calças';
    case 'LEFT_HAND': return 'Mão Esquerda';
    case 'RIGHT_HAND': return 'Mão Direita';
    case 'CLOAK': return 'Capa';
    case 'RING_1': return 'Anel 1';
    case 'RING_2': return 'Anel 2';
    case 'NECKLACE': return 'Colar';
    case 'TRINKET': return 'Acessório / Cinto';
    default: return 'Equipamento';
  }
}

export function inferDefaultSlot(item: CharacterItem, inventory: CharacterItem[]): EquipmentSlot {
  if (item.equippedSlot) return item.equippedSlot as EquipmentSlot;

  const name = (item.name || item.itemName || '').toLowerCase();
  const cat = (item.itemCategory || '').toUpperCase();
  const type = (item.itemType || '').toLowerCase();

  const isShield = name.includes('escudo') || name.includes('shield') || type.includes('escudo');
  if (isShield) return 'LEFT_HAND';

  if (cat === 'ARMOR') return 'CHEST';
  if (cat === 'WEAPON') {
    const rightHandTaken = inventory.some((i) => i.equipped && i.equippedSlot === 'RIGHT_HAND');
    const leftHandTaken = inventory.some((i) => i.equipped && i.equippedSlot === 'LEFT_HAND');
    if (!rightHandTaken) return 'RIGHT_HAND';
    if (!leftHandTaken) return 'LEFT_HAND';
    return 'RIGHT_HAND';
  }
  if (cat === 'RING' || name.includes('anel') || name.includes('ring')) {
    const ring1Taken = inventory.some((i) => i.equipped && i.equippedSlot === 'RING_1');
    const ring2Taken = inventory.some((i) => i.equipped && i.equippedSlot === 'RING_2');
    if (!ring1Taken) return 'RING_1';
    if (!ring2Taken) return 'RING_2';
    return 'RING_1';
  }

  if (name.includes('bota') || name.includes('boot')) return 'BOOTS';
  if (name.includes('luva') || name.includes('manopla') || name.includes('gauntlet') || name.includes('bracer')) return 'GLOVES';
  if (name.includes('capacete') || name.includes('tiara') || name.includes('helm') || name.includes('diadema') || name.includes('headband')) return 'HELMET';
  if (name.includes('calça') || name.includes('calca') || name.includes('perneira')) return 'PANTS';
  if (name.includes('capa') || name.includes('manto') || name.includes('cloak') || name.includes('cape')) return 'CLOAK';
  if (name.includes('colar') || name.includes('amuleto') || name.includes('medalhão') || name.includes('medalhao') || name.includes('amulet') || name.includes('necklace') || name.includes('periapt')) return 'NECKLACE';
  if (name.includes('cinto') || name.includes('cinturão') || name.includes('cinturao') || name.includes('faixa') || name.includes('belt') || name.includes('girdle') || name.includes('charm') || name.includes('talismã') || name.includes('talisma') || name.includes('talisman') || name.includes('trinket') || name.includes('berloque')) return 'TRINKET';

  return 'CHEST';
}

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
      nameEn: (charItem as any).nameEn || charItem.name || charItem.itemName || 'Item',
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

  const handleToggleEquip = (item: CharacterItem, targetSlot?: EquipmentSlot) => {
    if (item.equipped) {
      updateItem.mutate(
        {
          itemId: item.id,
          payload: { equipped: false, equippedSlot: null },
        },
        {
          onSuccess: () => {
            toast.success('Item desequipado.');
          },
          onError: (err: any) => {
            toast.error(err.message || 'Erro ao alterar equipamento.');
          },
        }
      );
    } else {
      const slot = targetSlot || inferDefaultSlot(item, inventory);
      updateItem.mutate(
        {
          itemId: item.id,
          payload: { equipped: true, equippedSlot: slot },
        },
        {
          onSuccess: () => {
            toast.success(`Item equipado em ${getSlotLabel(slot)}.`);
          },
          onError: (err: any) => {
            toast.error(err.message || 'Erro ao alterar equipamento.');
          },
        }
      );
    }
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
    const targetId = item.id || (item as any).characterItemId || item.itemId;
    if (!targetId) {
      toast.error('Identificador do item inválido.');
      return;
    }
    removeItem.mutate(targetId, {
      onSuccess: () => {
        toast.success('Item removido do inventário.');
      },
      onError: (err: any) => {
        toast.error(err.message || 'Erro ao remover item.');
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

      {/* Equipment Slots Grid */}
      <Card className="bg-surface/50 border-primary/20">
        <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-serif font-bold text-amber-200 flex items-center gap-1.5 uppercase tracking-wide">
            <Shield className="w-4 h-4 text-amber-400" />
            Slots de Equipamento (12 Slots)
          </CardTitle>
          <span className="text-[11px] font-mono text-muted-foreground">
            {inventory.filter((i) => i.equipped).length} / 12 ocupados
          </span>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
            {EQUIPMENT_SLOTS.map(({ slot, label }) => {
              const equippedItem = inventory.find(
                (i) => i.equipped && (i.equippedSlot === slot || (!i.equippedSlot && inferDefaultSlot(i, inventory) === slot))
              );
              return (
                <div
                  key={slot}
                  data-testid={`equipment-slot-${slot.toLowerCase()}`}
                  className={`p-2 rounded-lg border transition-all ${
                    equippedItem
                      ? 'bg-amber-950/20 border-amber-600/40 text-foreground'
                      : 'bg-surface/20 border-dashed border-slate-700/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-[11px] text-amber-300/90">{label}</span>
                    {equippedItem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-950/40"
                        onClick={() => handleToggleEquip(equippedItem)}
                        title={`Desequipar de ${label}`}
                      >
                        <X className="w-3 h-3 mr-0.5" />
                        Tirar
                      </Button>
                    )}
                  </div>
                  {equippedItem ? (
                    <div
                      className="cursor-pointer hover:text-amber-300 truncate font-medium text-[11px]"
                      onClick={() => handleInspect(equippedItem)}
                      title={equippedItem.name || equippedItem.itemName || 'Item'}
                    >
                      {equippedItem.name || equippedItem.itemName || 'Item'}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Vazio</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
            const slot = item.equippedSlot || (item.equipped ? inferDefaultSlot(item, inventory) : null);
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
                          Equipado ({getSlotLabel(slot)})
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
