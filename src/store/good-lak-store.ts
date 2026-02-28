import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string | number;
  name: string;
  phone: string;
  telegramId: string | number;
  birthDate?: string;
  about?: string;
}

export interface Master {
  id: string | number;
  name: string;
  photo?: string;
  telegramId?: string | number;
  login?: string;
  // Параметры редактирования фото
  photoScale?: number;
  photoTranslateX?: number;
  photoTranslateY?: number;
}

export interface Service {
  id: string | number;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string | number;
  masterId?: string | number;
  masterName: string;
  serviceId?: string | number;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  status: string;
  comment?: string;
  clientName?: string;
  clientPhone?: string;
  userId?: string | number;
  duration?: number;
}

export interface ScheduleDay {
  date: string;
  status: string;
  start?: string;
  end?: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface FinanceRecord {
  id: string | number;
  type: 'Доход' | 'Расход';
  amount: number;
  category: string;
  date: string;
  description?: string;
}

export interface Client {
  id: string | number;
  name: string;
  phone: string;
  totalVisits: number;
  notes?: string;
}

type AppScreen =
  | 'login'
  | 'register'
  | 'home'
  | 'select-master'
  | 'select-service'
  | 'select-datetime'
  | 'confirm-booking'
  | 'booking-success'
  | 'my-appointments'
  | 'appointment-details'
  | 'comment'
  | 'reschedule'
  | 'profile';

export type MasterScreen =
  | 'home'
  | 'appointments'
  | 'clients'
  | 'finances'
  | 'schedule'
  | 'profile';

export interface Developer {
  id: string | number;
  login: string;
  name?: string;
}

interface BookingState {
  selectedMaster: Master | null;
  selectedService: Service | null;
  selectedDate: string | null;
  selectedTime: string | null;
}

interface GoodLakState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Master state (для приложения мастера)
  master: Master | null;
  isMasterAuthenticated: boolean;
  masterScreen: MasterScreen;
  
  // Developer state (для разработчика)
  developer: Developer | null;
  isDeveloperAuthenticated: boolean;
  
  // UI state
  currentScreen: AppScreen;
  previousScreen: AppScreen | null;
  
  // Booking state
  booking: BookingState;
  editingAppointmentId: string | number | null;
  
  // Data
  masters: Master[];
  services: Service[];
  availableSlots: TimeSlot[];
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  schedule: ScheduleDay[];
  
  // Master app state
  masterAppointments: Appointment[];
  masterClients: Client[];
  masterFinances: {
    records: FinanceRecord[];
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setScreen: (screen: AppScreen) => void;
  goBack: () => void;
  
  // Master actions
  setMaster: (master: Master | null) => void;
  setMasterAuthenticated: (value: boolean) => void;
  setMasterScreen: (screen: MasterScreen) => void;
  masterLogout: () => void;
  
  // Developer actions
  setDeveloper: (developer: Developer | null) => void;
  setDeveloperAuthenticated: (value: boolean) => void;
  developerLogout: () => void;
  
  // Booking actions
  selectMaster: (master: Master) => void;
  selectService: (service: Service) => void;
  selectDate: (date: string) => void;
  selectTime: (time: string) => void;
  setBooking: (booking: BookingState) => void;
  resetBooking: () => void;
  setEditingAppointment: (id: string | number | null) => void;
  
  // Data actions
  setMasters: (masters: Master[]) => void;
  setServices: (services: Service[]) => void;
  setAvailableSlots: (slots: TimeSlot[]) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  setSchedule: (schedule: ScheduleDay[]) => void;
  
  // Master app actions
  setMasterAppointments: (appointments: Appointment[]) => void;
  setMasterClients: (clients: Client[]) => void;
  setMasterFinances: (finances: GoodLakState['masterFinances']) => void;
  
  // Common actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

const initialBookingState: BookingState = {
  selectedMaster: null,
  selectedService: null,
  selectedDate: null,
  selectedTime: null,
};

export const useGoodLakStore = create<GoodLakState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      master: null,
      isMasterAuthenticated: false,
      masterScreen: 'home',
      developer: null,
      isDeveloperAuthenticated: false,
      currentScreen: 'login',
      previousScreen: null,
      booking: initialBookingState,
      editingAppointmentId: null,
      masters: [],
      services: [],
      availableSlots: [],
      appointments: [],
      selectedAppointment: null,
      schedule: [],
      masterAppointments: [],
      masterClients: [],
      masterFinances: {
        records: [],
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
      },
      isLoading: false,
      error: null,
      
      // User actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      
      // Navigation actions
      setScreen: (screen) => set((state) => ({ 
        previousScreen: state.currentScreen, 
        currentScreen: screen 
      })),
      goBack: () => set((state) => ({ 
        currentScreen: state.previousScreen || 'home',
        previousScreen: null 
      })),
      
      // Master actions
      setMaster: (master) => set({ master, isMasterAuthenticated: !!master }),
      setMasterAuthenticated: (value) => set({ isMasterAuthenticated: value }),
      setMasterScreen: (screen) => set({ masterScreen: screen }),
      masterLogout: () => set({ 
        master: null, 
        isMasterAuthenticated: false, 
        masterScreen: 'home',
        masterAppointments: [],
        masterClients: [],
        masterFinances: {
          records: [],
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
        },
      }),
      
      // Developer actions
      setDeveloper: (developer) => set({ developer, isDeveloperAuthenticated: !!developer }),
      setDeveloperAuthenticated: (value) => set({ isDeveloperAuthenticated: value }),
      developerLogout: () => set({
        developer: null,
        isDeveloperAuthenticated: false,
      }),
      
      // Booking actions
      selectMaster: (master) => set((state) => ({ 
        booking: { ...state.booking, selectedMaster: master } 
      })),
      selectService: (service) => set((state) => ({ 
        booking: { ...state.booking, selectedService: service } 
      })),
      selectDate: (date) => set((state) => ({ 
        booking: { ...state.booking, selectedDate: date } 
      })),
      selectTime: (time) => set((state) => ({ 
        booking: { ...state.booking, selectedTime: time } 
      })),
      setBooking: (booking) => set({ booking }),
      resetBooking: () => set({ booking: initialBookingState, editingAppointmentId: null }),
      setEditingAppointment: (id) => set({ editingAppointmentId: id }),
      
      // Data actions
      setMasters: (masters) => set({ masters }),
      setServices: (services) => set({ services }),
      setAvailableSlots: (slots) => set({ availableSlots: slots }),
      setAppointments: (appointments) => set({ appointments }),
      setSelectedAppointment: (appointment) => set({ selectedAppointment: appointment }),
      setSchedule: (schedule) => set({ schedule }),
      
      // Master app actions
      setMasterAppointments: (appointments) => set({ masterAppointments: appointments }),
      setMasterClients: (clients) => set({ masterClients: clients }),
      setMasterFinances: (finances) => set({ masterFinances: finances }),
      
      // Common actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        currentScreen: 'login',
        booking: initialBookingState,
        appointments: [],
      }),
    }),
    {
      name: 'good-lak-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        master: state.master,
        isMasterAuthenticated: state.isMasterAuthenticated,
        developer: state.developer,
        isDeveloperAuthenticated: state.isDeveloperAuthenticated,
      }),
    }
  )
);
