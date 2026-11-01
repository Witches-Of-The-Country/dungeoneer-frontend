'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CharacterResponse,
  useManageInventory,
} from '@/lib/api/characters';
import { fetchItems, Item } from '@/lib/api/encyclopedia';
import {
  Search,
  ShoppingBag,
  Coins,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
  Shield,
  Sword,
  FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';

interface ItemCatalogModalProps {
  character: CharacterResponse;
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'ALL', label: 'Todos' },
  { value: 'WEAPON', label: 'Armas', icon: Sword },
  { value: 'ARMOR', label: 'Armaduras', icon: Shield },
  { value: 'POTION', label: 'Poções', icon: FlaskConical },
  { value: 'WONDROUS', label: 'Maravilhosos', icon: Sparkles },
  { value: 'ADVENTURING_GEAR', label: 'Equipamento', icon: ShoppingBag },
];

function parseCostToCopper(item: Item): number {
  const itemAny = item as any;
  if (
    itemAny.costCp !== undefined ||
    itemAny.costSp !== undefined ||
    itemAny.costEp !== undefined ||
    itemAny.costGp !== undefined ||
    itemAny.costPp !== undefined
  ) {
    const cp = itemAny.costCp || 0;
    const sp = (itemAny.costSp || 0) * 10;
    const ep = (itemAny.costEp || 0) * 50;
    const gp = (itemAny.costGp || 0) * 100;
    const pp = (itemAny.costPp || 0) * 1000;
    return cp + sp + ep + gp + pp;
  }

  const raw = (item.cost || '').toLowerCase().trim();
  if (!raw) return 0;

  // Pattern matches e.g. "15 po", "50 pc", "2 pp", "10 pl", "5 pe"
  const match = raw.match(/^([\d.,]+)\s*(po|gp|pp|sp|pc|cp|pe|ep|pl)?/);
  if (!match) return 0;

  const value = parseFloat(match[1].replace(',', '.')) || 0;
  const unit = (match[2] || 'po').toLowerCase();

  switch (unit) {
    case 'pl':
    case 'pp': // in 5e english pp is platinum; in pt-BR pp is plata (prata)
      // Check if text says 'pl' (platina) or 'pp' (prata in pt-BR)
      if (unit === 'pl') return Math.round(value * 1000);
      return Math.round(value * 10);
    case 'po':
    case 'gp':
      return Math.round(value * 100);
    case 'pe':
    case 'ep':
      return Math.round(value * 50);
    case 'pc':
    case 'cp':
      return Math.round(value);
    default:
      return Math.round(value * 100);
  }
}

export function ItemCatalogModal({ character, open, onClose }: ItemCatalogModalProps) {
  const { addItem } = useManageInventory(character.id);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchaseMode, setPurchaseMode] = useState<'FREE' | 'BUY'>('FREE');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchItems({ ruleset: character.ruleset, limit: 100 })
      .then((res) => {
        setItems(res.items || []);
        if (res.items && res.items.length > 0) {
          setSelectedItem(res.items[0]);
        }
      })
      .catch(() => {
        toast.error('Erro ao carregar o catálogo de itens.');
      })
      .finally(() => setLoading(false));
  }, [open, character.ruleset]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(search.toLowerCase()));

      const matchCategory =
        selectedCategory === 'ALL' ||
        item.itemCategory === selectedCategory ||
        (selectedCategory === 'ARMOR' && item.itemCategory === 'ARMOR') ||
        (selectedCategory === 'ADVENTURING_GEAR' && (item.itemCategory === 'ADVENTURING_GEAR' || item.itemCategory === 'TOOL'));

      return matchSearch && matchCategory;
    });
  }, [items, search, selectedCategory]);

  const currency = character.currency;
  const totalCopper = currency?.totalCopper ?? 0;

  const itemCopper = selectedItem ? parseCostToCopper(selectedItem) : 0;
  const totalTransactionCopper = itemCopper * quantity;
  const canAfford = totalCopper >= totalTransactionCopper;

  const handleConfirm = () => {
    if (!selectedItem) {
      toast.error('Selecione um item do catálogo.');
      return;
    }

    const isBuying = purchaseMode === 'BUY';
    if (isBuying && !canAfford) {
      toast.error('Saldo de moedas insuficiente para concluir a compra.');
      return;
    }

    addItem.mutate(
      {
        itemId: selectedItem.id,
        quantity: Math.max(1, quantity),
        purchaseWithCurrency: isBuying,
      },
      {
        onSuccess: () => {
          toast.success(
            isBuying
              ? `${quantity}x ${selectedItem.name} comprado(s) com sucesso!`
              : `${quantity}x ${selectedItem.name} adicionado(s) ao inventário!`
          );
          setQuantity(1);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Erro ao adicionar item.');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl bg-slate-950 border-amber-900/50 text-slate-100 max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-amber-950/60 bg-slate-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-serif text-amber-200 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                Catálogo de Itens &amp; Loja
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Consulte itens do compêndio para adicionar diretamente ou comprar deduzindo moedas do personagem.
              </p>
            </div>

            {/* Character Currency Balance */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-amber-950/80 text-xs">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> Saldo:
              </span>
              <span className="text-amber-300 font-bold font-mono">{currency?.gp ?? 0} po</span>
              <span className="text-slate-400 font-mono">{currency?.sp ?? 0} pp</span>
              <span className="text-amber-600 font-mono">{currency?.cp ?? 0} pc</span>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="mt-3 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar item por nome ou propriedades..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    selectedCategory === cat.value
                      ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Content Body: Split view (Item list on left, checkout details on right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
          {/* Left: Scrollable Catalog List */}
          <div className="md:col-span-7 border-r border-slate-800/80 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs">Carregando catálogo...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum item encontrado no catálogo com os filtros aplicados.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={`${item.ruleset}-${item.id}`}
                    onClick={() => setSelectedItem(item)}
                    role="button"
                    tabIndex={0}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-600/70 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-slate-100">
                          {item.name}
                        </span>
                        {item.nameEn && item.nameEn !== item.name && (
                          <span className="text-[11px] text-slate-400 italic">
                            ({item.nameEn})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <Badge variant="outline" className="text-[10px] py-0 px-1 border-slate-700 text-slate-300">
                          {item.itemType || item.itemCategory}
                        </Badge>
                        {item.rarity && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 border-amber-500/40 text-amber-300">
                            {item.rarity}
                          </Badge>
                        )}
                        {item.attunement && (
                          <Badge className="bg-purple-950/60 text-purple-300 border-purple-700/40 text-[9px] py-0 px-1">
                            Sintonia
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-amber-300 text-xs font-mono block">
                        {item.cost || 'Grátis'}
                      </span>
                      {item.weight && (
                        <span className="text-[10px] text-slate-400 block">
                          {item.weight}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Checkout & Action Panel */}
          <div className="md:col-span-5 bg-slate-950/60 p-5 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 border-slate-800">
            {selectedItem ? (
              <div className="space-y-4">
                {/* Item Details Card */}
                <div className="space-y-2 border-b border-slate-800 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-serif font-bold text-lg text-amber-200">
                        {selectedItem.name}
                      </h4>
                      {selectedItem.nameEn && (
                        <p className="text-xs text-slate-400 italic">{selectedItem.nameEn}</p>
                      )}
                    </div>
                    <span className="font-mono text-sm font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {selectedItem.cost || 'Sem custo'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedItem.description || 'Sem descrição cadastrada.'}
                  </p>
                </div>

                {/* Mode Selector: Add Direct vs Buy */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Modo de Adição
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPurchaseMode('FREE')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                        purchaseMode === 'FREE'
                          ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 mx-auto mb-1" />
                      Adicionar Direto
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Sem deduzir moedas
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPurchaseMode('BUY')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                        purchaseMode === 'BUY'
                          ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
                      Comprar na Loja
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Deduz moedas
                      </span>
                    </button>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs text-slate-400">Quantidade</label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="h-8 w-8 p-0 border-slate-800 bg-slate-900 text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span className="font-mono text-sm font-bold text-slate-100 min-w-8 text-center">
                        {quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="h-8 w-8 p-0 border-slate-800 bg-slate-900 text-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Purchase Summary */}
                  {purchaseMode === 'BUY' && (
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Custo unitário:</span>
                        <span className="font-mono text-slate-200">{selectedItem.cost || '0'}</span>
                      </div>
                      <div className="flex justify-between text-slate-200 font-bold pt-1 border-t border-slate-800">
                        <span>Custo Total:</span>
                        <span className="font-mono text-amber-300">
                          {itemCopper > 0 ? `${(totalTransactionCopper / 100).toFixed(2)} PO` : '0 PO'}
                        </span>
                      </div>
                      {!canAfford && (
                        <div className="pt-2 flex items-center gap-1.5 text-red-400 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Você não possui moedas suficientes no porta-moedas.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Final Action Button */}
                <Button
                  onClick={handleConfirm}
                  disabled={addItem.isPending || (purchaseMode === 'BUY' && !canAfford)}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-serif font-bold shadow-sm tracking-wide gap-2 py-2 mt-2"
                >
                  {addItem.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : purchaseMode === 'BUY' ? (
                    <>
                      <Coins className="w-4 h-4" />
                      Comprar por {(totalTransactionCopper / 100).toFixed(2)} PO
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Adicionar ao Inventário
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center py-12">
                <ShoppingBag className="w-8 h-8 text-slate-700 mb-2" />
                Selecione um item do catálogo para ver detalhes e adicionar ao inventário.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
