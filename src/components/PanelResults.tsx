/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart2, Lock, Eye, AlertTriangle, Check,
  HelpCircle, Sparkles, Star, Users, CheckSquare 
} from 'lucide-react';
import { Participant, VoteValue, FIBONACCI_SCALE } from '../types';
import { motion } from 'motion/react';

interface PanelResultsProps {
  participants: Record<string, Participant>;
  reveal: boolean;
  onReveal: () => void;
  activeTaskId: string | null;
}

export default function PanelResults({ participants = {}, reveal, onReveal, activeTaskId }: PanelResultsProps) {
  const pList = Object.values(participants || {});
  const totalParticipants = pList.length;
  const hasActiveTask = activeTaskId !== null;
  const votes = hasActiveTask 
    ? pList.filter(p => p.vote !== null).map(p => p.vote as VoteValue)
    : [];
  const votedCount = votes.length;

  // Filter numeric votes for average calculations
  const numericVotes = votes
    .filter((v): v is VoteValue => v !== '?')
    .map(v => parseInt(v, 10))
    .filter(v => !isNaN(v));

  // 1. Average Calculation
  const hasNumericVotes = numericVotes.length > 0;
  const average = hasNumericVotes 
    ? parseFloat((numericVotes.reduce((sum, v) => sum + v, 0) / numericVotes.length).toFixed(1))
    : 0;

  // 2. Mode (Most voted value) Calculation
  const frequencies: Record<string, number> = {};
  votes.forEach((v) => {
    frequencies[v] = (frequencies[v] || 0) + 1;
  });

  let modeVal: string = '-';
  let maxFreq = 0;
  Object.entries(frequencies).forEach(([v, freq]) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      modeVal = v;
    }
  });

  // 3. Dispersion/Consensus Check
  let hasDispersion = false;
  if (numericVotes.length >= 2) {
    const minNumeric = Math.min(...numericVotes);
    const maxNumeric = Math.max(...numericVotes);

    // Compute hops on standard Fibonacci list (ignoring '?')
    const fibOnly = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    const minIdx = fibOnly.indexOf(minNumeric);
    const maxIdx = fibOnly.indexOf(maxNumeric);
    
    // If the estimate gap is 3 or more indices wide (e.g. 3 to 13, or 5 to 21)
    if (minIdx !== -1 && maxIdx !== -1 && (maxIdx - minIdx) >= 3) {
      hasDispersion = true;
    }
  }

  return (
    <div id="panel-results-root" className="flex h-full flex-col bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white leading-none">
              Resultados
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Métricas y análisis de consenso
            </p>
          </div>
        </div>
      </div>

      {/* Main Results Board wrapper */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {!reveal ? (
          /* 1. STATE: RESULTS HIDDEN */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            {/* Pulsing Lock Graphics */}
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500">
              <Lock className="w-6 h-6 animate-pulse text-indigo-505" />
              <div className="absolute inset-0 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 animate-spin-slow" />
            </div>

            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white tracking-tight">
              Votos Ocultos
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Los participantes están emitiendo sus votos. Los valores se revelarán colectivamente.
            </p>

            {/* Micro details */}
            <div className="mt-6 w-full max-w-xs rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/20 p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Participantes:</span>
                <span className="font-bold text-slate-900 dark:text-white">{totalParticipants}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Votos emitidos:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{votedCount}</span>
              </div>
            </div>

            <button
              id="btn-reveal-results-panel"
              onClick={onReveal}
              disabled={!hasActiveTask || votedCount < totalParticipants || totalParticipants === 0}
              title={
                !hasActiveTask
                  ? 'No hay ninguna tarea activa para revelar'
                  : totalParticipants === 0 
                    ? 'No hay participantes activos en la sesión' 
                    : votedCount < totalParticipants 
                      ? `Falta que voten algunos participantes (${votedCount}/${totalParticipants})` 
                      : '¡Revelar ahora!'
              }
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 font-semibold text-xs py-3.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Eye className="w-3.5 h-3.5" />
              Revelar ahora
            </button>
          </div>
        ) : (
          /* 2. STATE: RESULTS REVEALED */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Simple numeric KPI Cards */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Mean value */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/15 p-4 text-center pb-5">
                <span className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
                  Promedio
                </span>
                <span className="mt-1.5 text-3xl font-sans font-extrabold text-indigo-600 dark:text-indigo-400 block tracking-tight">
                  {hasNumericVotes ? average : '-'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                  (Se ignora "?")
                </span>
              </div>

              {/* Mode value */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/15 p-4 text-center pb-5">
                <span className="text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider block">
                  Moda
                </span>
                <span className="mt-1.5 text-3xl font-sans font-extrabold text-slate-900 dark:text-white block tracking-tight truncate">
                  {modeVal}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                  {votedCount > 0 ? `(${maxFreq} votos)` : 'Sin votos'}
                </span>
              </div>
            </div>

            {/* Consolidated dispersion check alert */}
            {hasDispersion && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-amber-200 bg-amber-50/35 dark:border-amber-950/65 dark:bg-amber-950/15 p-4 flex gap-3 text-amber-700 dark:text-amber-400 shadow-sm"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block">Alta Dispersión detectada</span>
                  <p className="mt-1 leading-relaxed text-amber-600/90 dark:text-amber-400/90">
                    Existe una diferencia importante entre las estimaciones. Se recomienda discutir antes de volver a votar.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Vote details bar summaries */}
            <div className="space-y-3.5 md:space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Distribución de Votos
              </h4>

              {votedCount === 0 ? (
                <p className="text-xs italic text-slate-400">Nadie votó en esta ronda.</p>
              ) : (
                <div className="space-y-2.5 pt-0.5">
                  {FIBONACCI_SCALE.map((fib) => {
                    const count = frequencies[fib] || 0;
                    const percent = votedCount > 0 ? (count / votedCount) * 100 : 0;
                    
                    if (count === 0) return null; // Only show voted values to keep list dense and pretty

                    return (
                      <div key={fib} className="flex items-center gap-3">
                        {/* Vote Label Card indicator */}
                        <div className="w-12 flex-shrink-0 font-bold text-right text-xs text-slate-900 dark:text-slate-200">
                          Carta {fib}
                        </div>
                        {/* Progress Bar container */}
                        <div className="flex-1 h-5 bg-slate-50 dark:bg-slate-950 rounded-lg overflow-hidden position-relative border border-slate-100 dark:border-slate-850">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-indigo-500/80 to-indigo-600 rounded-lg"
                          />
                        </div>
                        {/* Dynamic Count */}
                        <div className="w-16 flex-shrink-0 text-left text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <strong>{count}</strong> {count === 1 ? 'voto' : 'votos'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Participants stats summary row */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-900 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Participantes activos: <strong className="text-slate-950 dark:text-white">{totalParticipants}</strong>
              </div>
              <div>
                Votos recibidos: <strong className="text-slate-950 dark:text-white">{votedCount}</strong>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
