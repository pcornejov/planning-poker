/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Check, Eye, RotateCcw, 
  HelpCircle, Layers, Edit3, Trash2, Plus, Play, X,
  Coffee
} from 'lucide-react';
import { Task, VoteValue, FIBONACCI_SCALE } from '../types';

interface PanelPokerProps {
  activeTask: Task | null;
  currentVote: VoteValue | null;
  reveal: boolean;
  totalParticipants: number;
  votedCount: number;
  isSpectator?: boolean;
  onVote: (vote: VoteValue | null) => void;
  onReveal: () => void;
  onReset: () => void;
  onStartNewTask: (title: string, description: string) => void;
  onUpdateActiveTask: (taskId: string, title: string, description: string) => void;
  onClearActiveTask: () => void;
  addToast: (text: string, type: 'success' | 'warning' | 'info') => void;
}

export default function PanelPoker({
  activeTask,
  currentVote,
  reveal,
  totalParticipants,
  votedCount,
  isSpectator = false,
  onVote,
  onReveal,
  onReset,
  onStartNewTask,
  onUpdateActiveTask,
  onClearActiveTask,
  addToast,
}: PanelPokerProps) {
  // Input states for creating
  const [taskTitle, setTaskTitle] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  // Sync editing inputs when activeTask changes or we enter editing mode
  useEffect(() => {
    if (activeTask) {
      setEditTitle(activeTask.title);
    } else {
      setIsEditing(false);
    }
  }, [activeTask, isEditing]);

  const handleCardClick = (val: VoteValue) => {
    if (isSpectator) {
      addToast('Estás en modo espectador. Cambia a rol de votante arriba si deseas estimar.', 'warning');
      return;
    }
    if (!activeTask) {
      addToast('Primero debes definir una tarea para poder votar.', 'warning');
      return;
    }
    if (reveal) {
      addToast('La votación está cerrada. Inicia una nueva ronda o define otra tarea para votar.', 'warning');
      return;
    }

    if (currentVote === val) {
      onVote(null);
      addToast('Voto anulado.', 'info');
    } else {
      onVote(val);
      addToast(`¡Has votado ${val}!`, 'success');
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      addToast('Por favor, ingresa un título para la tarea.', 'warning');
      return;
    }
    onStartNewTask(taskTitle.trim(), '');
    setTaskTitle('');
    addToast('¡Tarea asignada! Estimación y votos inicializados.', 'success');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;
    if (!editTitle.trim()) {
      addToast('El título de la tarea no puede estar vacío.', 'warning');
      return;
    }
    onUpdateActiveTask(activeTask.id, editTitle.trim(), '');
    setIsEditing(false);
    addToast('Tarea modificada con éxito.', 'success');
  };

  return (
    <div id="panel-poker-root" className="flex flex-col gap-6 h-full justify-between">
      {/* 1. Active Task Details or Creation / Editing Area */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all">
        {isEditing && activeTask ? (
          /* EDITING CURRENT ACTIVE TASK FORM */
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-900/50">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Editar Tarea en Estimación
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Título de la Tarea</label>
              <input
                id="edit-task-title"
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  onClearActiveTask();
                  setIsEditing(false);
                  addToast('Tarea removida de estimación', 'info');
                }}
                className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-bold text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar Tarea
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-500/10 transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </form>
        ) : activeTask ? (
          /* ACTIVE TASK VIEW */
          <div>
            <div className="flex items-center justify-between gap-4 mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 fill-indigo-500/25 animate-pulse" />
                En Curso
              </div>

              {/* Action tools */}
              <div className="flex items-center gap-1">
                <button
                  id="btn-edit-active-task"
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                  title="Editar detalles de la tarea"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  id="btn-clear-active-task"
                  onClick={() => {
                    onClearActiveTask();
                    addToast('Se quitó la tarea actual. Votos reiniciados.', 'info');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                  title="Terminar estimación de esta tarea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h1 className="font-sans font-extrabold text-xl md:text-2xl text-slate-900 dark:text-white tracking-tight leading-tight">
              {activeTask.title}
            </h1>

            {/* Status Footer section */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-900/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-4">
                <div>
                  Participantes: <strong className="text-slate-900 dark:text-white">{totalParticipants}</strong>
                </div>
                <div>
                  Votaron: <strong className="text-emerald-505 font-bold text-emerald-600 dark:text-emerald-400">{votedCount}</strong>
                </div>
              </div>

              <div className="flex gap-2">
                {!reveal ? (
                  <button
                    id="btn-reveal-voting"
                    onClick={onReveal}
                    disabled={votedCount < totalParticipants || totalParticipants === 0}
                    title={
                      totalParticipants === 0 
                        ? 'No hay participantes activos' 
                        : votedCount < totalParticipants 
                          ? `Faltan votar participantes (${votedCount}/${totalParticipants})` 
                          : '¡Revelar votos!'
                    }
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow shadow-indigo-500/10 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Revelar votos
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      id="btn-new-task-round"
                      onClick={() => {
                        onClearActiveTask();
                        addToast('Prepara el título para tu siguiente tarea de estimación.', 'info');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080d1a] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nueva Tarea
                    </button>
                    <button
                      id="btn-reset-voting"
                      onClick={onReset}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                      title="Reiniciar estimación sobre la misma tarea"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Re-estimar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* CREATING A NEW TASK FORM (EMPTY STATE OVERLAY) */
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white leading-none">
                  Nueva Tarea para Estimar
                </h3>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Introduce el título para comenzar el voto automáticamente
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <input
                  id="new-task-title"
                  type="text"
                  required
                  placeholder="Ej: Diseñar Dashboard, Endpoint de pagos, Corregir bug..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 focus:border-indigo-540 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                id="btn-start-voting-submit"
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow shadow-indigo-500/10 hover:shadow-indigo-500/15 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Iniciar Estimación de Tarea
              </button>
            </form>
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
            {isSpectator
              ? 'Estás en modo espectador (no puedes votar). Cambia tu rol a votante arriba si deseas estimar.'
              : activeTask 
                ? reveal 
                  ? 'Votación concluida. Haz clic en "Nueva Tarea" o "Re-estimar" para continuar.' 
                  : currentVote 
                    ? 'Estimación seleccionada. Haz clic en la misma carta si deseas quitar tu voto.' 
                    : 'Selecciona una de las cartas Fibonacci basadas en esfuerzo o complejidad:'
                : 'Escribe y crea una tarea arriba para desbloquear y habilitar la votación.'
            }
          </p>
        </div>

        {/* The Grid Deck */}
        <div 
          id="fibonacci-deck-grid" 
          className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 p-1 transition-opacity ${
            !activeTask || reveal || isSpectator ? 'opacity-40 cursor-not-allowed select-none' : ''
          }`}
        >
          {FIBONACCI_SCALE.map((value) => {
            const isSelected = currentVote === value;
            return (
              <motion.button
                key={value}
                id={`card-fibonacci-${value}`}
                onClick={() => handleCardClick(value)}
                disabled={!activeTask || reveal || isSpectator}
                whileHover={{ scale: !activeTask || reveal || isSpectator ? 1 : 1.05 }}
                whileTap={{ scale: !activeTask || reveal || isSpectator ? 1 : 0.95 }}
                transition={{ duration: 0.15 }}
                className={`group relative aspect-[3/4.2] flex flex-col items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/45 ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/30 scale-105 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/[0.01]'
                }`}
              >
                {/* corner indicators */}
                <div className="w-full flex justify-between text-[11px] font-bold opacity-60 leading-none items-center">
                  {value === '☕' ? <Coffee className="w-3.5 h-3.5" /> : <span>{value}</span>}
                  {value === '?' ? <HelpCircle className="w-3" /> : <span>♠</span>}
                </div>

                {/* Big Center Display */}
                {value === '☕' ? (
                  <Coffee className={`w-8 h-8 md:w-10 md:h-10 transition-transform ${
                    isSelected ? 'scale-110 text-white' : 'text-slate-950 dark:text-white'
                  }`} />
                ) : (
                  <span className={`text-3xl md:text-4xl font-sans font-extrabold tracking-tighter ${
                    isSelected ? 'scale-110 text-white' : 'text-slate-950 dark:text-white'
                  }`}>
                    {value}
                  </span>
                )}

                {/* Lower checkmarks reflection */}
                <div className="w-full flex justify-between items-center text-[11px] font-semibold leading-none opacity-60">
                  {value === '?' ? <HelpCircle className="w-3" /> : <span>♠</span>}
                  
                  {isSelected ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-indigo-600 font-bold text-[9px]">
                      ✓
                    </span>
                  ) : value === '☕' ? (
                    <Coffee className="w-3.5 h-3.5" />
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
