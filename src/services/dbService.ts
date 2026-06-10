/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase';
import { RoomState, Participant, Task, VoteValue, RoomSystemState } from '../types';

let firebaseRef: any = null;
let firebaseOnValueUnsubscribe: (() => void) | null = null;

// Only import firebase/database functions if firebase is available
const getFirebaseDBFunctions = async () => {
  if (!isFirebaseConfigured || !db) return null;
  const { ref, onValue, set, update, remove, onDisconnect, child, get, push } = await import('firebase/database');
  return { ref, onValue, set, update, remove, onDisconnect, child, get, push };
};

// Set up Local Simulation fallback using BroadcastChannel & localStorage
const BROADCAST_NAME = 'planning_poker_shared_room';
const LOCAL_STORAGE_KEY = 'planning_poker_offline_state';

const initialRoomState: RoomState = {
  system: {
    activeTaskId: null,
    reveal: false,
  },
  participants: {},
  tasks: {},
};

class DbService {
  private activeUserId: string | null = null;
  private activeUserName: string | null = null;
  private lastSubscribedCallback: ((state: RoomState) => void) | null = null;
  private localState: RoomState = { ...initialRoomState };
  private channel: BroadcastChannel | null = null;
  private heartbeatInterval: any = null;

  constructor() {
    if (!isFirebaseConfigured) {
      // Local demo mode: initialize BroadcastChannel
      try {
        this.channel = new BroadcastChannel(BROADCAST_NAME);
        this.channel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (e) {
        console.error('BroadcastChannel is not supported in this environment:', e);
      }
      this.loadLocalState();
    }
  }

  // --- Local Database Helpers ---
  private loadLocalState() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        this.localState = JSON.parse(stored);
      } else {
        this.localState = { ...initialRoomState };
        this.saveLocalState();
      }
    } catch (e) {
      this.localState = { ...initialRoomState };
    }
  }

  private saveLocalState() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.localState));
    } catch (e) {
      console.error('Error saving local state:', e);
    }
  }

  private broadcastState() {
    this.saveLocalState();
    if (this.channel) {
      this.channel.postMessage({ type: 'STATE_UPDATED', state: this.localState });
    }
    if (this.lastSubscribedCallback) {
      this.lastSubscribedCallback(this.cleanState(this.localState));
    }
  }

  private handleBroadcastMessage(msg: any) {
    if (!msg) return;
    if (msg.type === 'STATE_UPDATED') {
      this.localState = msg.state;
      if (this.lastSubscribedCallback) {
        this.lastSubscribedCallback(this.cleanState(this.localState));
      }
    } else if (msg.type === 'PING_REQUEST' && this.activeUserId) {
      // Reply with presence to keep ourselves alive
      this.sendLocalHeartbeat();
    }
  }

  // Filters out inactive participants (more than 12 seconds with no heartbeat) in local mode
  private cleanState(state: RoomState): RoomState {
    if (isFirebaseConfigured) return state;

    const now = Date.now();
    const cleanParticipants: Record<string, Participant> = {};
    let changed = false;

    Object.entries(state.participants || {}).forEach(([id, p]) => {
      // In local fallback, we check if they are active of join timestamp + 12s
      // We will allow 15 seconds of inactivity before cleaning them up
      const joinedAt = (p as any).joinedAt || now;
      const lastActive = (p as any).lastActive || joinedAt;
      if (now - lastActive < 15000 || id === this.activeUserId) {
        cleanParticipants[id] = p;
      } else {
        changed = true;
      }
    });

    if (changed) {
      const updatedState = { ...state, participants: cleanParticipants };
      this.localState = updatedState;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedState));
      } catch (e) {}
      return updatedState;
    }

    return state;
  }

  private sendLocalHeartbeat() {
    if (!this.activeUserId || !this.activeUserName) return;
    const now = Date.now();
    
    this.loadLocalState();
    if (!this.localState.participants) this.localState.participants = {};
    
    const existing = (this.localState.participants[this.activeUserId] || {}) as any;
    this.localState.participants[this.activeUserId] = {
      id: this.activeUserId,
      name: this.activeUserName,
      vote: existing.vote !== undefined ? existing.vote : null,
      joinedAt: existing.joinedAt || now,
      lastActive: now, // simulated heartbeat
    } as any;

    this.broadcastState();
  }

  private startLocalHeartbeats() {
    this.stopLocalHeartbeats();
    // Immediate heartbeat
    this.sendLocalHeartbeat();
    // Let others know we are requesting their presence
    if (this.channel) {
      this.channel.postMessage({ type: 'PING_REQUEST' });
    }
    // Repeat every 5 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendLocalHeartbeat();
    }, 5000);
  }

  private stopLocalHeartbeats() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // --- Unified Service Interface ---
  public async connectParticipant(
    userId: string,
    userName: string,
    onStateUpdate: (state: RoomState) => void
  ) {
    this.activeUserId = userId;
    this.activeUserName = userName;
    this.lastSubscribedCallback = onStateUpdate;

    if (isFirebaseConfigured && db) {
      const fns = await getFirebaseDBFunctions();
      if (!fns) return;

      const { ref: fRef, onValue, set, onDisconnect, get } = fns;

      // 1. Listen for connection state and join RTDB
      const connectedRef = fRef(db, '.info/connected');
      const userRef = fRef(db, `participants/${userId}`);
      const rootRef = fRef(db, '/');

      // Sync active presence
      onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          // Remove participant when disconnecting
          onDisconnect(userRef).remove().catch(err => {
            console.error('Error setting onDisconnect handler:', err);
          });

          // Join active session with a cleared vote (fresh estimation round)
          set(userRef, {
            id: userId,
            name: userName,
            vote: null,
            joinedAt: Date.now(),
          });
        }
      });

      // 2. Subscribe to general database changes
      if (firebaseOnValueUnsubscribe) firebaseOnValueUnsubscribe();

      firebaseOnValueUnsubscribe = onValue(rootRef, (snapshot) => {
        const val = snapshot.val() || {};
        const safeState: RoomState = {
          system: {
            activeTaskId: val.system?.activeTaskId || null,
            reveal: val.system?.reveal || false,
          },
          participants: val.participants || {},
          tasks: val.tasks || {},
        };
        onStateUpdate(safeState);
      }, (error) => {
        console.error('Error loading real-time data from Firebse:', error);
      });

    } else {
      // Local fallback mode
      this.loadLocalState();
      if (!this.localState.participants) this.localState.participants = {};
      if (this.localState.participants[userId]) {
        this.localState.participants[userId].vote = null;
      }
      this.broadcastState();

      this.startLocalHeartbeats();
      onStateUpdate(this.cleanState(this.localState));

      // Listen to unload event to gracefully sign out
      window.addEventListener('beforeunload', this.handleUnloadEvent);
    }
  }

  private handleUnloadEvent = () => {
    if (this.activeUserId) {
      this.disconnectParticipant(this.activeUserId);
    }
  };

  public async disconnectParticipant(userId: string) {
    this.stopLocalHeartbeats();
    window.removeEventListener('beforeunload', this.handleUnloadEvent);

    if (isFirebaseConfigured && db) {
      const fns = await getFirebaseDBFunctions();
      if (!fns) return;
      const { ref: fRef, remove } = fns;
      
      const userRef = fRef(db, `participants/${userId}`);
      await remove(userRef).catch(e => console.error('Error removing user reference:', e));
    } else {
      this.loadLocalState();
      if (this.localState.participants && this.localState.participants[userId]) {
        delete this.localState.participants[userId];
      }
      this.broadcastState();
    }

    this.activeUserId = null;
    this.activeUserName = null;
  }

  public async submitVote(userId: string, vote: VoteValue | null) {
    if (isFirebaseConfigured && db) {
      const fns = await getFirebaseDBFunctions();
      if (!fns) return;
      const { ref: fRef, set } = fns;

      const userVoteRef = fRef(db, `participants/${userId}/vote`);
      await set(userVoteRef, vote);
    } else {
      this.loadLocalState();
      if (this.localState.participants && this.localState.participants[userId]) {
        this.localState.participants[userId].vote = vote;
      }
      this.broadcastState();
    }
  }

  public async revealVotes() {
    if (isFirebaseConfigured && db) {
      const fns = await getFirebaseDBFunctions();
      if (!fns) return;
      const { ref: fRef, set } = fns;

      const revealRef = fRef(db, `system/reveal`);
      await set(revealRef, true);
    } else {
      this.loadLocalState();
      this.localState.system.reveal = true;
      this.broadcastState();
    }
  }

  public async resetVotes() {
    if (isFirebaseConfigured && db) {
      const fns = await getFirebaseDBFunctions();
      if (!fns) return;
      const { ref: fRef, set, update, get } = fns;

      // 1. Collect all users to reset their votes cleanly in an update map
      const updateMap: Record<string, any> = {};
      updateMap[`system/reveal`] = false;

      // We read first to see existing participants
      const participantsRef = fRef(db, 'participants');
      const snap = await get(participantsRef);
      if (snap.exists()) {
        const users = snap.val();
        Object.keys(users).forEach(uId => {
          updateMap[`participants/${uId}/vote`] = null;
        });
      }

      await update(fRef(db, '/'), updateMap);
    } else {
      this.loadLocalState();
      this.localState.system.reveal = false;
      Object.keys(this.localState.participants || {}).forEach(uId => {
        this.localState.participants[uId].vote = null;
      });
      this.broadcastState();
    }
  }

  public async createTask(title: string, description: string = '') {
    const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newTask: Task = {
      id: taskId,
      title,
      description,
      createdAt: Date.now(),
    };

    if (isFirebaseConfigured && db) {
      const fns = await getFirebaseDBFunctions();
      if (!fns) return;
      const { ref: fRef, set, get } = fns;

      await set(fRef(db, `tasks/${taskId}`), newTask);
      // Auto select newly created task as active if there is none
      const activeRef = fRef(db, `system/activeTaskId`);
      const activeSnap = await get(activeRef);
      if (!activeSnap.exists() || !activeSnap.val()) {
        await set(activeRef, taskId);
      }
    } else {
      this.loadLocalState();
      if (!this.localState.tasks) this.localState.tasks = {};
      this.localState.tasks[taskId] = newTask;
      
      if (!this.localState.system.activeTaskId) {
        this.localState.system.activeTaskId = taskId;
      }
      this.broadcastState();
    }
  }

  public async updateTask(taskId: string, title: string, description: string = '') {
    if (isFirebaseConfigured && db) {
      const fns = await getFirebaseDBFunctions();
      if (!fns) return;
      const { ref: fRef, update } = fns;

      await update(fRef(db, `tasks/${taskId}`), { title, description });
    } else {
      this.loadLocalState();
      if (this.localState.tasks && this.localState.tasks[taskId]) {
        this.localState.tasks[taskId].title = title;
        this.localState.tasks[taskId].description = description;
      }
      this.broadcastState();
    }
  }

  public async deleteTask(taskId: string) {
    if (isFirebaseConfigured && db) {
      const fns = await getFirebaseDBFunctions();
      if (!fns) return;
      const { ref: fRef, remove, set, get } = fns;

      await remove(fRef(db, `tasks/${taskId}`));
      
      // If we deleted the active task, unset it
      const activeRef = fRef(db, `system/activeTaskId`);
      const activeSnap = await get(activeRef);
      if (activeSnap.exists() && activeSnap.val() === taskId) {
        await set(activeRef, null);
      }
    } else {
      this.loadLocalState();
      if (this.localState.tasks) {
        delete this.localState.tasks[taskId];
      }
      if (this.localState.system.activeTaskId === taskId) {
        this.localState.system.activeTaskId = null;
      }
      this.broadcastState();
    }
  }

  public async selectTask(taskId: string | null) {
    if (isFirebaseConfigured && db) {
      const fns = await getFirebaseDBFunctions();
      if (!fns) return;
      const { ref: fRef, update, get } = fns;

      // 1. Collect update map to transition to new task and reset reveal state
      const updateMap: Record<string, any> = {};
      updateMap[`system/activeTaskId`] = taskId;
      updateMap[`system/reveal`] = false;

      // 2. Clear all participants' votes for the new task
      const participantsRef = fRef(db, 'participants');
      const snap = await get(participantsRef);
      if (snap.exists()) {
        const users = snap.val();
        Object.keys(users).forEach(uId => {
          updateMap[`participants/${uId}/vote`] = null;
        });
      }

      await update(fRef(db, '/'), updateMap);
    } else {
      this.loadLocalState();
      this.localState.system.activeTaskId = taskId;
      this.localState.system.reveal = false;
      Object.keys(this.localState.participants || {}).forEach(uId => {
        this.localState.participants[uId].vote = null;
      });
      this.broadcastState();
    }
  }
}

export const dbService = new DbService();
