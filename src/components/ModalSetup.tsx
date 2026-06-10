/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';

interface ModalSetupProps {
  onJoin: (name: string) => void;
}

export default function ModalSetup({ onJoin }: ModalSetupProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Auto-focus the input name on mount
  useEffect(() => {
    const input = document.getElementById('username-input');
    if (input) input.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Por favor, ingresa tu nombre de participante.');
      return;
    }
    if (trimmed.length > 20) {
      setError('El nombre debe tener menos de 20 caracteres.');
      return;
    }
    onJoin(trimmed);
  };

  return (
    <div 
      id="setup-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/70 dark:bg-black/80 backdrop-blur-md px-4"
    >
      <motion.div
        id="setup-modal-card"
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          {/* Logo element resembling a poker card */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-500/25 font-bold text-2xl tracking-tighter">
            P♠
          </div>
          <h2 className="font-sans font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
            Planning Poker
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Estima tus tareas ágiles con tu equipo en tiempo real.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label 
              htmlFor="username-input" 
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              ¿Cómo te llamas?
            </label>
            <input
              id="username-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ingresa tu nombre o apodo..."
              maxLength={25}
              className="block w-full rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 px-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-605 focus:border-indigo-500 focus:bg-white dark:focus:bg-[#0f172a]/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
            />
            {error && (
              <p id="setup-error-msg" className="mt-1.5 text-xs text-red-500 font-medium font-sans">
                {error}
              </p>
            )}
          </div>

          <button
            id="join-button"
            type="submit"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3.5 font-semibold text-white transition duration-200 shadow-md shadow-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Entrar a la sesión
            <Play className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform fill-none" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
