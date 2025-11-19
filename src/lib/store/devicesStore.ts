import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

interface DevicesState {
  devices: Device[];
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  removeDevice: (id: string) => void;
}

export const useDevicesStore = create<DevicesState>()(
  persist(
    (set) => ({
      devices: [],
      addDevice: (device) => set((state) => ({
        devices: [...state.devices, device]
      })),
      updateDevice: (id, updates) => set((state) => ({
        devices: state.devices.map((d) => d.id === id ? { ...d, ...updates } : d)
      })),
      removeDevice: (id) => set((state) => ({
        devices: state.devices.filter((d) => d.id !== id)
      })),
    }),
    {
      name: 'devices-storage',
    }
  )
);

