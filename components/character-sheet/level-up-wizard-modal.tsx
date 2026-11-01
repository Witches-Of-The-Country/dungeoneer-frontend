'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CharacterResponse, useLevelUp, HpCalculationMethod } from '@/lib/api/characters';
import { fetchSubclasses, fetchProgressionFeats, Subclass, Feat } from '@/lib/api/encyclopedia';
import { Sparkles, Heart, Shield, Award, Wand2, ChevronRight, Check } from 'lucide-react';

interface LevelUpWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterResponse;
}

export function LevelUpWizardModal({ isOpen, onClose, character }: LevelUpWizardModalProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>(character.archetype?.id || '');
  const [subclasses, setSubclasses] = useState<Subclass[]>([]);
  const [selectedSubclassId, setSelectedSubclassId] = useState<string>('');
  const [progressionFeats, setProgressionFeats] = useState<Feat[]>([]);

  // HP Step
  const [hpMethod, setHpMethod] = useState<HpCalculationMethod>('AVERAGE');
  const [rolledHp, setRolledHp] = useState<number>(0);

  // ASI vs Feat Step
  const [asiOrFeatChoice, setAsiOrFeatChoice] = useState<'ASI' | 'FEAT'>('ASI');
  const [primaryStat, setPrimaryStat] = useState<string>('STRENGTH');
  const [secondaryStat, setSecondaryStat] = useState<string>('CONSTITUTION');
  const [asiPlusTwo, setAsiPlusTwo] = useState<boolean>(true);

  const levelUpMutation = useLevelUp(character.id);
  const nextLevel = character.level + 1;

  // Determine if subclass selection is needed
  const primaryArchetype = character.archetype;
  const requiresSubclass = primaryArchetype && nextLevel >= 3 && !character.classProgressions?.some(cp => cp.subclassId);

  // Determine if ASI level (4, 8, 12, 16, 19)
  const isAsiLevel = [4, 8, 12, 16, 19].includes(nextLevel);

  useEffect(() => {
    if (selectedArchetypeId) {
      fetchSubclasses(selectedArchetypeId, character.ruleset).then((data) => {
        setSubclasses(data || []);
      });
      fetchProgressionFeats(selectedArchetypeId, nextLevel).then((data) => {
        setProgressionFeats(data || []);
      });
    }
  }, [selectedArchetypeId, nextLevel, character.ruleset]);

  const handleRollHp = () => {
    const hitDieValue = parseInt(character.archetype?.hitDice?.replace(/\D/g, '') || '8', 10);
    const rolled = Math.floor(Math.random() * hitDieValue) + 1;
    setRolledHp(rolled);
  };

  const getCalculatedHpIncrease = () => {
    const hitDieValue = parseInt(character.archetype?.hitDice?.replace(/\D/g, '') || '8', 10);
    const conMod = character.abilityScores ? Math.floor((character.abilityScores.constitution - 10) / 2) : 0;
    let base = Math.floor(hitDieValue / 2) + 1;
    if (hpMethod === 'ROLLED') {
      base = rolledHp > 0 ? rolledHp : base;
    } else if (hpMethod === 'MAX') {
      base = hitDieValue;
    }
    return Math.max(1, base + conMod);
  };

  const handleFinish = () => {
    const hpGain = getCalculatedHpIncrease();
    const abilityIncreases: Record<string, number> = {};

    if (isAsiLevel && asiOrFeatChoice === 'ASI') {
      if (asiPlusTwo) {
        abilityIncreases[primaryStat] = 2;
      } else {
        abilityIncreases[primaryStat] = 1;
        abilityIncreases[secondaryStat] = (abilityIncreases[secondaryStat] || 0) + 1;
      }
    }

    levelUpMutation.mutate(
      {
        archetypeId: selectedArchetypeId,
        subclassId: selectedSubclassId || null,
        hpCalculationMethod: hpMethod,
        hpIncrease: hpGain,
        abilityScoreIncreases: Object.keys(abilityIncreases).length > 0 ? abilityIncreases : undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setStep(1);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-surface border-primary/30 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <DialogTitle className="text-xl font-bold text-primary">
              Evolução de Personagem: Nível {nextLevel}
            </DialogTitle>
          </div>
          <DialogDescription>
            Configure os aprimoramentos de classe, vida e habilidades adquiridos ao subir de nível.
          </DialogDescription>
        </DialogHeader>

        {/* Wizard Steps Tracker */}
        <div className="flex items-center justify-between border-b border-primary/10 pb-3 my-2 text-xs font-semibold">
          <span className={step === 1 ? 'text-primary' : 'text-muted-foreground'}>1. Classe & Subclasse</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={step === 2 ? 'text-primary' : 'text-muted-foreground'}>2. Pontos de Vida (HP)</span>
          {isAsiLevel && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className={step === 3 ? 'text-primary' : 'text-muted-foreground'}>3. Atributos / Feats</span>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={(isAsiLevel ? step === 4 : step === 3) ? 'text-primary' : 'text-muted-foreground'}>
            Resumo
          </span>
        </div>

        {/* STEP 1: Class & Subclass */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Classe para Evoluir</Label>
              <div className="p-3 rounded-lg border border-primary/20 bg-background/50 flex justify-between items-center">
                <div>
                  <span className="font-bold text-foreground">{character.archetype?.name}</span>
                  <p className="text-xs text-muted-foreground">Dado de Vida: {character.archetype?.hitDice}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-primary/20 text-primary-foreground font-mono">
                  Nível atual: {character.level}
                </span>
              </div>
            </div>

            {requiresSubclass && subclasses.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4" /> Escolha sua Subclasse (Especialização)
                </Label>
                <select
                  value={selectedSubclassId}
                  onChange={(e) => setSelectedSubclassId(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-md border border-amber-500/40 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione um Arquétipo / Subclasse</option>
                  {subclasses.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.nameEn})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {progressionFeats.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Habilidades Desbloqueadas no Nível {nextLevel}
                </Label>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {progressionFeats.map((feat) => (
                    <div key={feat.id} className="p-2.5 rounded bg-background/40 border border-primary/10 text-xs">
                      <div className="font-semibold text-primary">{feat.name}</div>
                      <div className="text-muted-foreground line-clamp-2">{feat.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Hit Points */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Método de Ganho de Pontos de Vida (HP)</Label>
              <div className="space-y-2">
                <div
                  className={`flex items-center space-x-2 p-3 rounded border cursor-pointer ${
                    hpMethod === 'AVERAGE' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-background/40'
                  }`}
                  onClick={() => setHpMethod('AVERAGE')}
                >
                  <input
                    type="radio"
                    name="hp-method"
                    id="hp-avg"
                    checked={hpMethod === 'AVERAGE'}
                    onChange={() => setHpMethod('AVERAGE')}
                    className="accent-primary"
                  />
                  <Label htmlFor="hp-avg" className="cursor-pointer flex-1">
                    <span className="font-bold">Média Segura</span>
                    <p className="text-xs text-muted-foreground">
                      Garante valor estável: {Math.floor(parseInt(character.archetype?.hitDice?.replace(/\D/g, '') || '8', 10) / 2) + 1} + Mod. Constituição
                    </p>
                  </Label>
                </div>

                <div
                  className={`flex items-center space-x-2 p-3 rounded border cursor-pointer ${
                    hpMethod === 'ROLLED' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-background/40'
                  }`}
                  onClick={() => setHpMethod('ROLLED')}
                >
                  <input
                    type="radio"
                    name="hp-method"
                    id="hp-roll"
                    checked={hpMethod === 'ROLLED'}
                    onChange={() => setHpMethod('ROLLED')}
                    className="accent-primary"
                  />
                  <Label htmlFor="hp-roll" className="cursor-pointer flex-1">
                    <span className="font-bold">Rolar Dado ({character.archetype?.hitDice})</span>
                    <p className="text-xs text-muted-foreground">Teste sua sorte rolando o dado de vida da classe.</p>
                  </Label>
                </div>
              </div>
            </div>

            {hpMethod === 'ROLLED' && (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Resultado da Rolagem:</span>
                  <div className="text-2xl font-bold font-mono text-primary">
                    {rolledHp > 0 ? `${rolledHp} no ${character.archetype?.hitDice}` : 'Não rolado'}
                  </div>
                </div>
                <Button size="sm" onClick={handleRollHp} className="bg-primary/20 hover:bg-primary/30 border border-primary/40 text-foreground">
                  Rolar Dado
                </Button>
              </div>
            )}

            <div className="p-3 rounded-lg border border-primary/20 bg-background flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500 fill-red-500/20" /> Total Ganho de Vida:
              </span>
              <span className="text-lg font-bold font-mono text-green-400">+{getCalculatedHpIncrease()} HP</span>
            </div>
          </div>
        )}

        {/* STEP 3: ASI or Feat (if ASI Level) */}
        {step === 3 && isAsiLevel && (
          <div className="space-y-4 py-2">
            <Label className="text-amber-400 font-bold flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Aumento no Valor de Atributo (ASI)
            </Label>
            <div className="space-y-3">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={asiPlusTwo ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAsiPlusTwo(true)}
                  className="flex-1"
                >
                  +2 em 1 Atributo
                </Button>
                <Button
                  type="button"
                  variant={!asiPlusTwo ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAsiPlusTwo(false)}
                  className="flex-1"
                >
                  +1 em 2 Atributos
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Atributo Principal (+{asiPlusTwo ? '2' : '1'})</Label>
                <select
                  value={primaryStat}
                  onChange={(e) => setPrimaryStat(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-md border border-primary/20 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'].map((stat) => (
                    <option key={stat} value={stat}>
                      {stat}
                    </option>
                  ))}
                </select>
              </div>

              {!asiPlusTwo && (
                <div className="space-y-2">
                  <Label>Segundo Atributo (+1)</Label>
                  <select
                    value={secondaryStat}
                    onChange={(e) => setSecondaryStat(e.target.value)}
                    className="w-full h-10 px-3 py-2 rounded-md border border-primary/20 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA']
                      .filter((s) => s !== primaryStat)
                      .map((stat) => (
                        <option key={stat} value={stat}>
                          {stat}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FINAL STEP: Summary */}
        {((isAsiLevel && step === 4) || (!isAsiLevel && step === 3)) && (
          <div className="space-y-3 py-2 text-sm">
            <div className="p-3 rounded-lg border border-primary/20 bg-background/50 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Novo Nível:</span>
                <span className="font-bold text-foreground">{nextLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Classe:</span>
                <span className="font-bold text-foreground">{character.archetype?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aumento de HP:</span>
                <span className="font-bold text-green-400">+{getCalculatedHpIncrease()} HP</span>
              </div>
              {isAsiLevel && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Melhoria de Atributo:</span>
                  <span className="font-bold text-amber-400">
                    {asiPlusTwo ? `+2 em ${primaryStat}` : `+1 em ${primaryStat} e +1 em ${secondaryStat}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 flex justify-between sm:justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 1}
            onClick={() => setStep((prev) => prev - 1)}
          >
            Voltar
          </Button>

          {((isAsiLevel && step < 4) || (!isAsiLevel && step < 3)) ? (
            <Button
              type="button"
              className="bg-primary text-primary-foreground font-semibold gap-1.5"
              onClick={() => setStep((prev) => prev + 1)}
            >
              Avançar <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold gap-1.5"
              disabled={levelUpMutation.isPending}
              onClick={handleFinish}
            >
              <Check className="w-4 h-4" />
              {levelUpMutation.isPending ? 'Confirmando...' : 'Concluir Subida de Nível'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}