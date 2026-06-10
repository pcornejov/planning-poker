/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ClipboardList, Plus, Trash2, Edit3, Check, X,
  PlayCircle, AlertTriangle, Eye 
} from 'lucide-react';
import { Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PanelTasksProps {
  tasks: Record<string, Task>;
  activeTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onCreateTask: (title: string, description: string) => void;
  onUpdateTask: (taskId: string, title: string, description: string) => void;
  onDeleteTask: (taskId: string) => void;
  addToast: (text: string, type: 'success' | 'warning' | 'info') => void;
}

export default function PanelTasks({
  tasks = {},
  activeTaskId,
  onSelectTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  addToast,
}: PanelTasksProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  // Edit task states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const tList = Object.values(tasks || {}).sort((a, b) => b.createdAt - a.createdAt);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Por favor, ingresa el título de la tarea.', 'warning');
      return;
    }
    onCreateTask(title.trim(), desc.trim());
    setTitle('');
    setDesc('');
    setIsAdding(false);
    addToast('¡Tarea creada con éxito!', 'success');
  };

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
  };

  const handleSaveEdit = (taskId: string) => {
    if (!editTitle.trim()) {
      addToast('El título de la tarea es requerido.', 'warning');
      return;
    }
    onUpdateTask(taskId, editTitle.trim(), editDesc.trim());
    setEditingId(null);
    addToast('Tarea actualizada', 'success');
  };

  const handleDeleteConfirm = (taskId: string) => {
    onDeleteTask(taskId);
    setDeletingId(null);
    addToast('Tarea eliminada con éxito', 'info');
  };

  return (
    <div id="panel-tasks-root" className="flex h-full flex-col bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white leading-none">
              Tareas del Sprint
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Administra y selecciona para votar
            </p>
          </div>
        </div>
        <button
          id="btn-toggle-add-task"
          onClick={() => setIsAdding(!isAdding)}
          className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center focus:outline-none ${
            isAdding 
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-950 text-red-600 dark:text-red-400 hover:bg-red-100'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow shadow-indigo-500/10'
          }`}
          title="Añadir tarea"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
        </button>
      </div>

      {/* Primary content list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Toggleable Adding Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              id="form-add-task"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleCreate}
              className="overflow-hidden border border-indigo-100 dark:border-indigo-950/30 rounded-xl bg-indigo-50/10 dark:bg-indigo-950/5 p-4 space-y-3"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Título de la Tarea</label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  placeholder="Ej: Integrar pasarela de pagos"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-medium bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-205 dark:border-slate-800 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Descripción (Opcional)</label>
                <textarea
                  id="task-desc-input"
                  placeholder="Detalles, enlaces, criterios de aceptación..."
                  value={desc}
                  rows={2}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900/60 text-slate-950 dark:text-white border border-slate-205 dark:border-slate-800 rounded-lg px-3 py-2 resize-none focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                   type="button"
                   onClick={() => setIsAdding(false)}
                   className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 text-slate-600 dark:text-slate-300 transition duration-200"
                >
                  Cancelar
                </button>
                <button
                  id="submit-create-task"
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition duration-200"
                >
                  Crear Tarea
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Task List */}
        {tList.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
            <p className="text-xs font-medium text-slate-400">No hay tareas creadas todavía</p>
            <p className="text-[11px] text-slate-400 mt-1">Haz clic en el botón "+" superior para añadir tu primer tarea.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tList.map((task) => {
              const isActive = task.id === activeTaskId;
              const isEditing = task.id === editingId;
              const isDeleting = task.id === deletingId;

              return (
                <div
                  key={task.id}
                  className={`relative overflow-hidden rounded-xl border transition-all duration-150 p-4 ${
                    isActive
                      ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-500/[0.02]/30 bg-indigo-550/[0.02] dark:bg-indigo-500/[0.01]'
                      : 'border-slate-150 dark:border-slate-900 hover:border-slate-250 dark:hover:border-slate-800 bg-white dark:bg-slate-900/40'
                  }`}
                >
                  {/* Active highlight bar */}
                  {isActive && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" />
                  )}

                  {isEditing ? (
                    /* EDIT TASK LAYOUT */
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded px-2 py-1 focus:border-indigo-500 focus:outline-none"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded px-2 py-1 resize-none focus:border-indigo-500 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 px-2.5 rounded bg-slate-150 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-200"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(task.id)}
                          className="p-1 px-2.5 rounded bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    /* DELETE CONFIRMATION LAYOUT */
                    <div className="space-y-2.5 text-center">
                      <div className="flex items-center gap-1.5 justify-center text-rose-500">
                        <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                        <span className="text-xs font-bold">¿Eliminar tarea?</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Esta acción no se puede deshacer.</p>
                      <div className="flex justify-center gap-1.5 text-xs">
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-150 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 hover:bg-slate-200"
                        >
                          No, cancelar
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(task.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg"
                        >
                          Sí, eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* NORMAL TASK LIST ITEM LAYOUT */
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-sans font-bold text-sm text-slate-900 dark:text-white tracking-tight break-words flex-1 leading-tight">
                            {task.title}
                          </h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex-shrink-0 animate-pulse">
                              Votando
                            </span>
                          )}
                        </div>

                        {/* Optional Description */}
                        {task.description && (
                          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 break-words line-clamp-3">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Action trigger row */}
                      <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-900/50 pt-2.5">
                        {/* Action select/activate */}
                        <button
                          onClick={() => onSelectTask(isActive ? null : task.id)}
                          className={`flex items-center gap-1 text-xs font-semibold transition ${
                            isActive
                              ? 'text-slate-400 dark:text-slate-600 hover:text-slate-500'
                              : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-500'
                          }`}
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          {isActive ? 'Desactivar' : 'Activar voto'}
                        </button>

                        {/* Secondary utility edits */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-500/80 transition"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(task.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
