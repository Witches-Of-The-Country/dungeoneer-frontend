'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ReferenceCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
  ruleset?: string;
  description?: string;
  metaFields?: Array<{ label: string; value: string | number | undefined | null }>;
  extraBadges?: string[];
  onClick?: () => void;
}

export function ReferenceCard({
  title,
  subtitle,
  badge,
  badgeVariant = 'secondary',
  ruleset,
  description,
  metaFields = [],
  extraBadges = [],
  onClick,
}: ReferenceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const cleanDescription = description?.trim();
  const hasLongDescription = (cleanDescription?.length ?? 0) > 180;
  const displayedDescription =
    !hasLongDescription || expanded
      ? cleanDescription
      : `${cleanDescription?.slice(0, 180)}...`;

  const rulesetBadgeColor =
    ruleset === 'SRD_2024'
      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
      : ruleset === 'HOMEBREW'
      ? 'border-purple-500/40 text-purple-400 bg-purple-950/20'
      : 'border-amber-500/40 text-amber-400 bg-amber-950/20';

  return (
    <Card
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`flex flex-col justify-between border-border/60 bg-card hover:border-accent/40 transition-all shadow-sm ${
        onClick ? 'cursor-pointer hover:ring-1 hover:ring-amber-500/40 hover:bg-card/90' : ''
      }`}
    >
      <CardHeader className="p-5 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-serif font-bold text-foreground leading-snug">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-xs italic text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            {ruleset && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${rulesetBadgeColor}`}>
                {ruleset === 'SRD_2024' ? '2024' : ruleset === 'HOMEBREW' ? 'Homebrew' : '2014'}
              </Badge>
            )}
            {badge && (
              <Badge variant={badgeVariant} className="text-[11px] px-2 py-0">
                {badge}
              </Badge>
            )}
          </div>
        </div>

        {extraBadges.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {extraBadges.map((b) => (
              <span
                key={b}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-3">
        {cleanDescription && (
          <div className="text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-line">
            {displayedDescription}
            {hasLongDescription && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="ml-1 inline-flex items-center text-[11px] font-medium text-accent hover:underline focus:outline-none"
              >
                {expanded ? (
                  <>
                    Menos <ChevronUp className="w-3 h-3 ml-0.5" />
                  </>
                ) : (
                  <>
                    Mais <ChevronDown className="w-3 h-3 ml-0.5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {metaFields.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2 border-t border-border/40 text-[11px]">
            {metaFields
              .filter((f) => f.value !== undefined && f.value !== null && f.value !== '')
              .map((f) => (
                <div key={f.label} className="truncate">
                  <span className="font-medium text-foreground/80">{f.label}: </span>
                  <span className="text-muted-foreground">{f.value}</span>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
