'use client';

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useCreateHomebrewSpell,
  useCreateHomebrewFeat,
  useCreateHomebrewItem,
  useCreateHomebrewClass,
  useCreateHomebrewLineage,
} from '@/lib/api/homebrew';

export type HomebrewCategory = 'spells' | 'feats' | 'items' | 'classes' | 'lineages';

interface CreateHomebrewDialogProps {
  open: boolean;
  category: HomebrewCategory;
  onClose: () => void;
}

export function CreateHomebrewDialog({
  open,
  category,
  onClose,
}: CreateHomebrewDialogProps) {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(1);
  const [school, setSchool] = useState('Evocação');
  const [castingTime, setCastingTime] = useState('1 ação');
  const [rangeArea, setRangeArea] = useState('18 metros');
  const [components, setComponents] = useState('V, S');
  const [duration, setDuration] = useState('Instantânea');
  const [prerequisites, setPrerequisites] = useState('');
  const [itemCategory, setItemCategory] = useState('WEAPON');
  const [itemType, setItemType] = useState('Arma Simples');
  const [rarity, setRarity] = useState('COMMON');
  const [attunement, setAttunement] = useState(false);
  const [cost, setCost] = useState('');
  const [weight, setWeight] = useState('');
  const [hitDice, setHitDice] = useState('D8');
  const [primaryAbility, setPrimaryAbility] = useState('STRENGTH');
  const [savingThrows, setSavingThrows] = useState('STRENGTH, CONSTITUTION');
  const [spellcastingType, setSpellcastingType] = useState('NONE');
  const [speed, setSpeed] = useState(30);
  const [size, setSize] = useState('MEDIUM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const spellMutation = useCreateHomebrewSpell();
  const featMutation = useCreateHomebrewFeat();
  const itemMutation = useCreateHomebrewItem();
  const classMutation = useCreateHomebrewClass();
  const lineageMutation = useCreateHomebrewLineage();

  const isPending =
    spellMutation.isPending ||
    featMutation.isPending ||
    itemMutation.isPending ||
    classMutation.isPending ||
    lineageMutation.isPending;

  if (!open) return null;

  const categoryTitles: Record<HomebrewCategory, string> = {
    spells: 'Criar Nova Magia Homebrew',
    feats: 'Criar Novo Talento Homebrew',
    items: 'Criar Novo Item Homebrew',
    classes: 'Criar Nova Classe Homebrew',
    lineages: 'Criar Nova Linhagem Homebrew',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('O nome é obrigatório.');
      return;
    }
    if (!description.trim() && category !== 'classes') {
      setErrorMsg('A descrição é obrigatória.');
      return;
    }

    try {
      if (category === 'spells') {
        await spellMutation.mutateAsync({
          name: name.trim(),
          nameEn: nameEn.trim() || undefined,
          level,
          school,
          castingTime,
          rangeArea,
          components,
          duration,
          description: description.trim(),
        });
        toast.success('Magia Homebrew criada com sucesso!');
      } else if (category === 'feats') {
        await featMutation.mutateAsync({
          name: name.trim(),
          nameEn: nameEn.trim() || undefined,
          prerequisites: prerequisites.trim() || undefined,
          description: description.trim(),
        });
        toast.success('Talento Homebrew criado com sucesso!');
      } else if (category === 'items') {
        await itemMutation.mutateAsync({
          name: name.trim(),
          nameEn: nameEn.trim() || undefined,
          itemCategory,
          itemType,
          rarity,
          attunement,
          cost: cost.trim() || undefined,
          weight: weight.trim() || undefined,
          description: description.trim(),
        });
        toast.success('Item Homebrew criado com sucesso!');
      } else if (category === 'classes') {
        const savingList = savingThrows.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
        await classMutation.mutateAsync({
          name: name.trim(),
          hitDice,
          primaryAbility,
          savingThrowProficiencies: savingList.length ? savingList : ['STRENGTH', 'CONSTITUTION'],
          spellcastingType,
        });
        toast.success('Classe Homebrew criada com sucesso!');
      } else if (category === 'lineages') {
        await lineageMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          speed,
          size,
        });
        toast.success('Linhagem Homebrew criada com sucesso!');
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar conteúdo Homebrew.';
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop cobrindo 100% da viewport com blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <Card className="relative z-10 w-full max-w-xl bg-slate-950 border border-amber-900/40 shadow-2xl text-amber-50 my-auto">
        <CardHeader className="space-y-2 border-b border-amber-950/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <CardTitle className="text-xl font-serif tracking-wide text-amber-200">
                {categoryTitles[category]}
              </CardTitle>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-slate-400 hover:text-amber-100 transition-colors p-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Conteúdos criados recebem o selo <span className="text-amber-400 font-semibold">HOMEBREW</span> e ficam visíveis apenas para você.
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-2">
            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded flex items-center gap-2 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Nome (pt-BR) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Raio Purpúreo"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Nome em Inglês
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Ex: Purple Ray"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Categoria: Magias */}
            {category === 'spells' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Círculo (0-9) *
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value={0}>Truque (0)</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}º Círculo
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Escola *
                    </label>
                    <select
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      {['Abjuração', 'Adivinhação', 'Conjuração', 'Encantamento', 'Evocação', 'Ilusão', 'Necromancia', 'Transmutação'].map((sc) => (
                        <option key={sc} value={sc}>{sc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Tempo de Conjuração
                    </label>
                    <input
                      type="text"
                      value={castingTime}
                      onChange={(e) => setCastingTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Alcance / Área
                    </label>
                    <input
                      type="text"
                      value={rangeArea}
                      onChange={(e) => setRangeArea(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Componentes
                    </label>
                    <input
                      type="text"
                      value={components}
                      onChange={(e) => setComponents(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Duração
                    </label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Categoria: Talentos */}
            {category === 'feats' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Pré-requisitos
                </label>
                <input
                  type="text"
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  placeholder="Ex: Força 13+ ou Nível 4"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Categoria: Itens */}
            {category === 'items' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Categoria do Item *
                    </label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="WEAPON">Arma</option>
                      <option value="ARMOR">Armadura</option>
                      <option value="EQUIPMENT">Equipamento</option>
                      <option value="MAGIC">Item Mágico</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Tipo do Item *
                    </label>
                    <input
                      type="text"
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      placeholder="Ex: Arma Simples, Adaga"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Raridade
                    </label>
                    <select
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="NONE">Comum (Não mágica)</option>
                      <option value="COMMON">Comum</option>
                      <option value="UNCOMMON">Incomum</option>
                      <option value="RARE">Raro</option>
                      <option value="VERY_RARE">Muito Raro</option>
                      <option value="LEGENDARY">Lendário</option>
                      <option value="ARTIFACT">Artefato</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Custo
                    </label>
                    <input
                      type="text"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="Ex: 50 po"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Peso
                    </label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Ex: 1,5 kg"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="attunement-cb"
                    checked={attunement}
                    onChange={(e) => setAttunement(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="attunement-cb" className="text-sm text-slate-300 cursor-pointer">
                    Requer Sintonização
                  </label>
                </div>
              </>
            )}

            {/* Categoria: Classes */}
            {category === 'classes' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Dado de Vida *
                    </label>
                    <select
                      value={hitDice}
                      onChange={(e) => setHitDice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="D6">d6</option>
                      <option value="D8">d8</option>
                      <option value="D10">d10</option>
                      <option value="D12">d12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Atributo Primário *
                    </label>
                    <select
                      value={primaryAbility}
                      onChange={(e) => setPrimaryAbility(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="STRENGTH">Força</option>
                      <option value="DEXTERITY">Destreza</option>
                      <option value="CONSTITUTION">Constituição</option>
                      <option value="INTELLIGENCE">Inteligência</option>
                      <option value="WISDOM">Sabedoria</option>
                      <option value="CHARISMA">Carisma</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Resistências (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={savingThrows}
                    onChange={(e) => setSavingThrows(e.target.value)}
                    placeholder="Ex: STRENGTH, CONSTITUTION"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </>
            )}

            {/* Categoria: Linhagens */}
            {category === 'lineages' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Deslocamento (metros/pés)
                  </label>
                  <input
                    type="number"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Tamanho
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="SMALL">Pequeno</option>
                    <option value="MEDIUM">Médio</option>
                    <option value="LARGE">Grande</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Descrição detalhada {category !== 'classes' && '*'}
              </label>
              <textarea
                rows={4}
                required={category !== 'classes'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Insira detalhes e mecânicas..."
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-3 border-t border-amber-950/40 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-serif font-bold shadow-sm font-serif tracking-wide flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Salvar Homebrew
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
