/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Participant } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { isFirebaseConfigured } from '../firebase';

interface PanelParticipantsProps {
  participants: Record<string, Participant>;
  currentUserId: string;
  reveal: boolean;
  activeTaskId: string | null;
}

export default function PanelParticipants({ participants, currentUserId, reveal, activeTaskId }: PanelParticipantsProps) {
  const pList = Object.values(participants || {}).sort((a, b) => b.joinedAt - a.joinedAt);
  const totalCount = pList.length;
  const hasActiveTask = activeTaskId !== null;
  const votedCount = hasActiveTask ? pList.filter(p => p.vote !== null).length : 0;

  return (
    <div id="panel-participants-root" className="flex h-full flex-col bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white leading-none">
              Participantes
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {votedCount} de {totalCount} han votado
            </p>
          </div>
        </div>
        <span id="pcount-badge" className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {totalCount}
        </span>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[245px] lg:max-h-none">
        {totalCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
            <p className="text-sm font-medium text-slate-400">Sin usuarios conectados</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {pList.map((p) => {
                const isMe = p.id === currentUserId;
                const hasVoted = hasActiveTask && p.vote !== null;

                return (
                  <motion.div
                     key={p.id}
                     layoutId={`participant-${p.id}`}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ duration: 0.2 }}
                     className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-150 ${
                       isMe 
                         ? 'border-indigo-100 dark:border-indigo-950/50 bg-indigo-50/20 dark:bg-indigo-950/10' 
                         : 'border-slate-50 dark:border-slate-900/60 bg-slate-50/40 dark:bg-slate-900/40'
                     }`}
                  >
                     <div className="flex items-center gap-3 overflow-hidden">
                       {/* Avatar Bubble */}
                       <div className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm tracking-tight transition-color duration-200 ${
                         hasVoted 
                           ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                           : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                       }`}>
                         {p.name.charAt(0).toUpperCase()}
                       </div>

                       {/* Name Details */}
                       <div className="overflow-hidden">
                         <div className="flex items-center gap-1.5">
                           <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate block">
                             {p.name}
                           </span>
                           {isMe && (
                             <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 flex-shrink-0">
                               Tú
                             </span>
                           )}
                         </div>
                         <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block truncate">
                           {hasActiveTask ? (hasVoted ? 'Voto cargado' : 'Falta votar') : 'Sin tarea activa'}
                         </span>
                       </div>
                     </div>

                     {/* Voting State Visual */}
                     <div className="flex items-center gap-2">
                       {reveal ? (
                         /* Vote value is revealed */
                         <motion.div
                           initial={{ scale: 0, rotateY: -180 }}
                           animate={{ scale: 1, rotateY: 0 }}
                           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                           className={`flex h-8.5 w-8.5 items-center justify-center rounded-lg font-bold text-sm border shadow-sm ${
                             hasVoted
                               ? 'bg-indigo-600 border-indigo-600 text-white dark:border-indigo-400'
                               : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-dashed border-slate-205 dark:border-slate-700'
                           }`}
                         >
                           {hasVoted ? p.vote : '-'}
                         </motion.div>
                       ) : (
                         /* Vote is hidden or pending */
                         hasVoted ? (
                           <motion.div
                             initial={{ scale: 0.8, opacity: 0 }}
                             animate={{ scale: 1, opacity: 1 }}
                             className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-100/55 dark:border-emerald-900/20 text-xs font-semibold"
                           >
                             <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                             Listo
                           </motion.div>
                         ) : (
                           <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                             hasActiveTask
                               ? 'bg-amber-50/70 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400/90 border-amber-100/30'
                               : 'bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border-transparent'
                           }`}>
                             {hasActiveTask && <span className="w-1.5 h-1.5 rounded-full bg-amber-550 dark:bg-amber-400 animate-pulse" />}
                             {hasActiveTask ? 'Falta votar' : 'Sin tarea'}
                           </span>
                         )
                       )}
                     </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Online indicator footer */}
      <div className="p-4 bg-slate-50/50 dark:bg-[#080d1a] border-t border-slate-200 dark:border-slate-800 text-center flex items-center justify-center gap-1.5 animate-fade-in">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Sincronización{isFirebaseConfigured ? ' Firebase' : ' Local'} lista
        </span>
      </div>
    </div>
  );
}
