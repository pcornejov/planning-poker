/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VoteValue = '0' | '1' | '2' | '3' | '5' | '8' | '13' | '21' | '34' | '55' | '89' | '☕' | '?';

export const FIBONACCI_SCALE: VoteValue[] = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '☕', '?'];

export interface Participant {
  id: string;
  name: string;
  vote: VoteValue | null;
  isSpectator?: boolean;
  joinedAt: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
}

export interface RoomSystemState {
  activeTaskId: string | null;
  reveal: boolean;
}

export interface RoomState {
  system: RoomSystemState;
  participants: Record<string, Participant>;
  tasks: Record<string, Task>;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error' | 'warning';
}
