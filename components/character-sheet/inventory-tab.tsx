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
import { fetchItems, Item } from '@/lib/api/encyclopedia';

interface InventoryTabProps {
  character: CharacterResponse;
}

export function InventoryTab({ character }: InventoryTabProps) {
  const inventory = character.inventory || [];
  const { addItem, updateItem, removeItem, useConsumable } = useManageInventory(character.id);

  const attunedCount = inventory.filter((i) => i.attuned).length;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [purchaseWithCurrency, setPurchaseWithCurrency] = useState<boolean>(false);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);

  useEffect(() => {
    if (isAddOpen && catalogItems.length === 0) {
      setLoadingItems(true);
      fetchItems({ ruleset: character.ruleset, limit: 50 })
        .then((res) => {
          setCatalogItems(res.items || []);
          if (res.items && res.items.length > 0) {
            setSelectedItemId(res.items[0].id);
          }
        })
        .catch(() => {
          // ignore or toast
        })
        .finally(() => setLoadingItems(false));
    }
  }, [isAddOpen, catalogItems.length, character.ruleset]);

  const selectedItem = catalogItems.find((i) => i.id === selectedItemId);

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

  const handleConfirmAddItem = () => {
    if (!selectedItemId) {
      toast.error('Selecione um item.');
      return;
    }

    addItem.mutate(
      {
        itemId: selectedItemId,
        quantity: Math.max(1, quantity),
        purchaseWithCurrency,
      },
      {
        onSuccess: () => {
          toast.success(
            purchaseWithCurrency
              ? 'Item comprado com moedas e adicionado ao inventário!'
              : 'Item adicionado ao inventário!'
          );
          setIsAddOpen(false);
          setQuantity(1);
          setPurchaseWithCurrency(false);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Erro ao adicionar item.');
        },
      }
    );
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
            className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddOpen && (
        <Card className="bg-surface border-primary/40 shadow-xl">
          <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-sm font-bold text-foreground">
                Adicionar ou Comprar Item
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddOpen(false)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-3.5 space-y-3">
            {loadingItems ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                Carregando catálogo de itens...
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      Item do Catálogo
                    </label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full bg-background border border-primary/30 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {catalogItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} {item.cost ? `(${item.cost})` : ''} — {item.itemCategory}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-background border border-primary/30 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {selectedItem && (
                  <div className="p-2.5 rounded bg-surface/80 border border-primary/20 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preço Unitário:</span>
                      <strong className="text-amber-400 font-mono">{selectedItem.cost || 'Grátis'}</strong>
                    </div>
                    {selectedItem.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 pt-1 border-t border-primary/10">
                        {selectedItem.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="purchaseWithCurrency"
                    checked={purchaseWithCurrency}
                    onChange={(e) => setPurchaseWithCurrency(e.target.checked)}
                    className="rounded border-primary/40 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="purchaseWithCurrency" className="text-xs text-foreground cursor-pointer select-none">
                    Comprar com Moedas (deduz automaticamente o valor da bolsa de moedas)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-primary/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    disabled={addItem.isPending}
                    onClick={handleConfirmAddItem}
                    className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    {purchaseWithCurrency ? 'Confirmar Compra' : 'Adicionar ao Inventário'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            return (
              <Card
                key={item.id}
                className="bg-surface/60 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      {item.itemName}
                      <span className="text-xs font-mono font-normal text-muted-foreground">
                        x{item.quantity}
                      </span>
                    </CardTitle>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30">
                        {item.itemCategory}
                      </Badge>
                      {item.attunement && (
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

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
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

                    {item.attunement && (
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
    </div>
  );
}
