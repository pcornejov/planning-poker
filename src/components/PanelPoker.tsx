/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Check, Eye, RotateCcw, 
  HelpCircle, ChevronRight, PlayCircle, Layers 
} from 'lucide-react';
import { Task, VoteValue, FIBONACCI_SCALE } from '../types';

interface PanelPokerProps {
  activeTask: Task | null;
  currentVote: VoteValue | null;
  reveal: boolean;
  totalParticipants: number;
  votedCount: number;
  onVote: (vote: VoteValue | null) => void;
  onReveal: () => void;
  onReset: () => void;
  addToast: (text: string, type: 'success' | 'warning' | 'info') => void;
}

export default function PanelPoker({
  activeTask,
  currentVote,
  reveal,
  totalParticipants,
  votedCount,
  onVote,
  onReveal,
  onReset,
  addToast,
}: PanelPokerProps) {

  const handleCardClick = (val: VoteValue) => {
    if (!activeTask) {
      addToast('Primero debes seleccionar o crear una tarea activa para votar.', 'warning');
      return;
    }
    if (reveal) {
      addToast('La votación está cerrada en esta ronda. Reinicia la ronda para volver a votar.', 'warning');
      return;
    }

    if (currentVote === val) {
      // Toggle off / clear vote
      onVote(null);
      addToast('Voto removido.', 'info');
    } else {
      onVote(val);
      addToast(`¡Has votado ${val}!`, 'success');
    }
  };

  return (
    <div id="panel-poker-root" className="flex flex-col gap-6 h-full justify-between">
      {/* 1. Active Task Details header */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        {activeTask ? (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-indigo-500/25" />
              Tarea bajo estimación
            </div>
            <h1 className="font-sans font-bold text-xl md:text-2xl text-slate-900 dark:text-white tracking-tight leading-tight">
              {activeTask.title}
            </h1>
            {activeTask.description ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 border-l-2 border-slate-200 dark:border-slate-800 pl-3 leading-relaxed">
                {activeTask.description}
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 italic">
                Sin descripción detallada.
              </p>
            )}

            {/* Quick status dots */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-4">
                <div>
                  Participantes: <strong className="text-slate-900 dark:text-white">{totalParticipants}</strong>
                </div>
                <div>
                  Votaron: <strong className="text-emerald-500 dark:text-emerald-400">{votedCount}</strong>
                </div>
              </div>

              {/* Direct game control trigger */}
              <div className="flex gap-2">
                {!reveal ? (
                  <button
                    id="btn-reveal-voting"
                    onClick={onReveal}
                    disabled={votedCount < totalParticipants || totalParticipants === 0}
                    title={
                      totalParticipants === 0 
                        ? 'No hay participantes activos en la sesión' 
                        : votedCount < totalParticipants 
                          ? `Falta que voten algunos participantes (${votedCount}/${totalParticipants})` 
                          : '¡Revelar estimaciones!'
                    }
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white transition-all shadow shadow-indigo-500/10 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Revelar votos
                  </button>
                ) : (
                  <button
                    id="btn-reset-voting"
                    onClick={onReset}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080d1a] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Nueva ronda
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 mb-3 border border-slate-100 dark:border-slate-800">
              <Layers className="w-5 h-5 text-indigo-500/80" />
            </div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">Ninguna tarea activa registrada</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Por favor selecciona o crea una tarea en el panel de **Tareas** para habilitar la votación del equipo.
            </p>
          </div>
        )}
      </div>

      {/* 2. Fibonacci Cards Deck selection */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-4 text-center mb-4">
          <h2 className="font-sans font-bold text-lg text-slate-900 dark:text-white tracking-tight">
            Tus cartas de estimación
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {activeTask 
              ? reveal 
                ? 'Votación concluida. Inicia una nueva ronda para habilitar el mazo.' 
                : currentVote 
                  ? 'Estimación seleccionada. Haz clic en la misma carta para anular tu voto.' 
                  : 'Selecciona una de las cartas Fibonacci basadas en esfuerzo u horas:'
              : 'Selecciona primero una tarea en el panel lateral para desbloquear las cartas.'
            }
          </p>
        </div>

        {/* The Grid Deck */}
        <div 
          id="fibonacci-deck-grid" 
          className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 p-1 ${
            !activeTask || reveal ? 'opacity-40 cursor-not-allowed select-none' : ''
          }`}
        >
          {FIBONACCI_SCALE.map((value, i) => {
            const isSelected = currentVote === value;
            return (
              <motion.button
                key={value}
                id={`card-fibonacci-${value}`}
                onClick={() => handleCardClick(value)}
                disabled={!activeTask || reveal}
                whileHover={{ scale: !activeTask || reveal ? 1 : 1.05 }}
                whileTap={{ scale: !activeTask || reveal ? 1 : 0.95 }}
                transition={{ duration: 0.15 }}
                className={`group relative aspect-[3/4.2] flex flex-col items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/45 ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/30 scale-105 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/[0.01]'
                }`}
              >
                {/* Micro corner indicators resembling official poker playing cards */}
                <div className="w-full flex justify-between text-[11px] font-bold opacity-60 leading-none">
                  <span>{value}</span>
                  {value === '?' ? <HelpCircle className="w-3 h-3" /> : <span>♠</span>}
                </div>

                {/* Big Center Display */}
                <span className={`text-3xl md:text-4xl font-sans font-extrabold tracking-tighter ${
                  isSelected ? 'scale-110 text-white' : 'text-slate-950 dark:text-white'
                }`}>
                  {value}
                </span>

                {/* Lower corner reflections card checkmarks */}
                <div className="w-full flex justify-between items-center text-[11px] font-semibold leading-none opacity-60">
                  {value === '?' ? <HelpCircle className="w-3 h-3" /> : <span>♠</span>}
                  
                  {isSelected ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-indigo-600 font-bold text-[9px]">
                      ✓
                    </span>
                  ) : (
                    <span>{value}</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
