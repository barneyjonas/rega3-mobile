import { create } from 'zustand'
import type { ApiUser } from '../api'

interface AuthState {
  user: ApiUser | null
  setUser: (user: ApiUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
