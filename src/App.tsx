/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LogOut, BarChart2, Users, Layers,
  Sparkles, Check, Info, InfoIcon, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents
import ModalSetup from './components/ModalSetup';
import ThemeToggle from './components/ThemeToggle';
import PanelParticipants from './components/PanelParticipants';
import PanelPoker from './components/PanelPoker';
import PanelResults from './components/PanelResults';

// Services and config
import { dbService } from './services/dbService';
import { isFirebaseConfigured } from './firebase';
import { RoomState, ToastMessage, VoteValue, Task } from './types';

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState>({
    system: { activeTaskId: null, reveal: false },
    participants: {},
    tasks: {},
  });

  // Mobile navigation tabs 'vote' | 'results'
  const [activeMobileTab, setActiveMobileTab] = useState<'vote' | 'results'>('vote');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 1. Initial configuration check and auto-join
  useEffect(() => {
    try {
      const storedName = localStorage.getItem('poker_username');
      let storedId = localStorage.getItem('poker_userid');

      if (storedName) {
        if (!storedId) {
          storedId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          localStorage.setItem('poker_userid', storedId);
        }
        setUserId(storedId);
        setUserName(storedName);
        
        // Connect automatically
        dbService.connectParticipant(storedId, storedName, (updatedState) => {
          setRoomState(updatedState);
        });
      }
    } catch (e) {
      console.error('Error loading initial session cache:', e);
    }
  }, []);

  const handleJoin = (name: string) => {
    const newId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    try {
      localStorage.setItem('poker_username', name);
      localStorage.setItem('poker_userid', newId);
    } catch (e) {}

    setUserId(newId);
    setUserName(name);

    dbService.connectParticipant(newId, name, (updatedState) => {
      setRoomState(updatedState);
    });

    addToast(`¡Bienvenido, ${name}! Te has unido a la sesión.`, 'success');
  };

  const handleLeave = () => {
    if (userId) {
      dbService.disconnectParticipant(userId);
    }
    try {
      localStorage.removeItem('poker_username');
      localStorage.removeItem('poker_userid');
    } catch (e) {}
    setUserId(null);
    setUserName(null);
    setRoomState({
      system: { activeTaskId: null, reveal: false },
      participants: {},
      tasks: {},
    });
    addToast('Has salido de la sesión.', 'info');
  };

  // Toast Helper
  const addToast = (text: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, text, type }]);
    
    // Auto remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const handleVote = (vote: VoteValue | null) => {
    if (userId) {
      dbService.submitVote(userId, vote);
    }
  };

  const handleReveal = () => {
    dbService.revealVotes();
    addToast('¡Estimaciones reveladas!', 'success');
  };

  const handleReset = () => {
    dbService.resetVotes();
    addToast('Nueva ronda de votación iniciada.', 'info');
  };

  const handleStartNewTask = (title: string, description: string) => {
    dbService.startNewActiveTask(title, description);
  };

  const handleUpdateActiveTask = (id: string, title: string, description: string) => {
    dbService.updateTask(id, title, description);
  };

  const handleClearActiveTask = () => {
    dbService.clearActiveTask();
  };

  // Derived attributes
  const activeTask = roomState.system.activeTaskId && roomState.tasks 
    ? roomState.tasks[roomState.system.activeTaskId] || null 
    : null;

  const myParticipantRecord = userId && roomState.participants 
    ? roomState.participants[userId] || null 
    : null;

  const currentVote = myParticipantRecord ? myParticipantRecord.vote : null;

  const totalParticipants = Object.keys(roomState.participants || {}).length;
  const hasActiveTask = roomState.system.activeTaskId !== null;
  const votedCount = hasActiveTask
    ? Object.values(roomState.participants || {}).filter((p: any) => p.vote !== null && p.vote !== undefined).length
    : 0;

  return (
    <div id="app-container" className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-200 flex flex-col font-sans antialiased transition-colors duration-200">
      
      {/* 1. Modal Setup: Request name on entry */}
      {!userName && <ModalSetup onJoin={handleJoin} />}

      {/* 2. Top Header Navigation Bar */}
      <header id="app-header" className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0f172a]/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-extrabold text-white tracking-tighter text-lg shadow-md shadow-indigo-500/10">
              P♠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-extrabold text-base tracking-tight text-slate-950 dark:text-white block">
                  Team Planning Poker
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-400/20">
                  LIVE SESSION
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Estimaciones ágiles
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userName && (
              <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {userName}
                </span>
                <button
                  id="btn-logout-header"
                  onClick={handleLeave}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Cambiar Nombre / Salir"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Dark Mode Switcher */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 3. Online/Offline Diagnostic banners */}
      {!isFirebaseConfigured && (
        <div id="demo-fallback-banner" className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-xs px-4 py-3 flex items-center justify-center gap-2 text-center shadow-lg shadow-indigo-500/10">
          <InfoIcon className="w-4 h-4 text-white flex-shrink-0 animate-pulse" />
          <p className="font-medium">
            <strong>Modo Demo Local Activado:</strong> Firebase no está configurado. ¡Abre este mismo enlace en otra pestaña para simular la sincronización en tiempo real perfectamente!
          </p>
        </div>
      )}

      {/* 4. Main Body Workspace Layout */}
      <main className="flex-1 mx-auto w-full max-w-7xl p-4 md:p-6 flex flex-col gap-6">
        
        {/* Responsive Mobile Layout Navigation tabs */}
        <div className="flex lg:hidden bg-white dark:bg-[#0f172a] border border-slate-200/50 dark:border-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveMobileTab('vote')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeMobileTab === 'vote'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tablero
          </button>
          <button
            onClick={() => setActiveMobileTab('results')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeMobileTab === 'results'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Resultados
          </button>
        </div>

        {/* Triple Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
          
          {/* Panel A (Left sidebar): Participants (Visible on large screen, or on "vote" mobile tab) */}
          <div className={`lg:col-span-3 ${activeMobileTab === 'vote' ? 'block' : 'hidden lg:block'}`}>
            <PanelParticipants
              participants={roomState.participants}
              currentUserId={userId || ''}
              reveal={roomState.system.reveal}
              activeTaskId={roomState.system.activeTaskId}
            />
          </div>

          {/* Panel B (Center content): Estimates cards and detail */}
          <div className={`lg:col-span-6 ${activeMobileTab === 'vote' ? 'block' : 'hidden lg:block'}`}>
            <PanelPoker
              activeTask={activeTask}
              currentVote={currentVote}
              reveal={roomState.system.reveal}
              totalParticipants={totalParticipants}
              votedCount={votedCount}
              onVote={handleVote}
              onReveal={handleReveal}
              onReset={handleReset}
              onStartNewTask={handleStartNewTask}
              onUpdateActiveTask={handleUpdateActiveTask}
              onClearActiveTask={handleClearActiveTask}
              addToast={addToast}
            />
          </div>

          {/* Panel C (Right sidebar): Results / Statistics */}
          <div className={`lg:col-span-3 h-full ${
            activeMobileTab === 'results' ? 'block' : 'hidden lg:block'
          }`}>
            <PanelResults
              participants={roomState.participants}
              reveal={roomState.system.reveal}
              onReveal={handleReveal}
              activeTaskId={roomState.system.activeTaskId}
            />
          </div>

        </div>

        {/* Small floating signout trigger for mobile users */}
        {userName && (
          <div className="sm:hidden flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-900 text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Conectado como: <strong className="text-gray-800 dark:text-white">{userName}</strong>
            </span>
            <button
              onClick={handleLeave}
              className="flex items-center gap-1.5 text-red-500 font-bold uppercase tracking-wider"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        )}

      </main>

      {/* 5. Clean, self-dismissing floating notifications */}
      <div id="toast-wrapper" className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, y: -5 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto w-full overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 p-4 shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-5.5 w-5.5 items-center justify-center rounded-full flex-shrink-0 ${
                  toast.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500' 
                    : toast.type === 'warning' 
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500' 
                      : toast.type === 'error' 
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-500' 
                        : 'bg-blue-50 dark:bg-blue-950/50 text-blue-500'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex-1 text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {toast.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
