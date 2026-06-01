import { create } from "zustand";

// Bridges Lenis scroll → R3F. Components read this in useFrame to drive shaders.
type ScrollStore = {
  velocity: number;
  progress: number;
  setScroll: (progress: number, velocity: number) => void;
};

export const useScrollStore = create<ScrollStore>((set) => ({
  velocity: 0,
  progress: 0,
  setScroll: (progress, velocity) => set({ progress, velocity }),
}));
