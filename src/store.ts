import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type IconType = 'plane' | 'car' | 'home' | 'building' | 'ticket' | 'map-pin';

export interface Event {
  id: string;
  time: string;
  title: string;
  location: string;
  icon: IconType;
}

export interface DaySchedule {
  id: string;
  date: string;
  events: Event[];
}

export interface TripCategory {
  id: string;
  name: string;
  schedules: DaySchedule[];
}

export interface Booking {
  id: string;
  category: string;
  icon: IconType;
  provider: string;
  reference: string;
  details: string;
  color: string;
  imageKey?: string;
  link?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  color: string;
}

export interface PackingItem {
  id: string;
  name: string;
  isPacked: boolean;
  category: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  isBought: boolean;
}

export interface Memory {
  id: string;
  imageKey: string;
  caption: string;
}

export interface Trip {
  id: string;
  tripName: string;
  tripDate: string | null;
  itineraryCategories: TripCategory[];
  bookings: Booking[];
  expenses: Expense[];
  packingList: PackingItem[];
  shoppingList: ShoppingItem[];
  memories: Memory[];
}

interface TravelStore {
  trips: Trip[];
  selectedTripId: string | null;
  selectTrip: (id: string | null) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'itineraryCategories' | 'bookings' | 'expenses' | 'packingList' | 'shoppingList' | 'memories'>) => void;
  updateTrip: (id: string, tripName: string, tripDate: string | null) => void;
  deleteTrip: (id: string) => void;
  // Methods below act on the selectedTripId
  addCategory: (category: Omit<TripCategory, 'id'>) => void;
  addEvent: (categoryId: string, dayId: string, event: Omit<Event, 'id'>) => void;
  deleteEvent: (categoryId: string, dayId: string, eventId: string) => void;
  addBooking: (booking: Omit<Booking, 'id'>) => void;
  deleteBooking: (bookingId: string) => void;
  updateBookingImage: (bookingId: string, imageKey: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (expenseId: string) => void;
  addPackingItem: (item: Omit<PackingItem, 'id' | 'isPacked'>) => void;
  togglePackingItem: (itemId: string) => void;
  deletePackingItem: (itemId: string) => void;
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'isBought'>) => void;
  toggleShoppingItem: (itemId: string) => void;
  deleteShoppingItem: (itemId: string) => void;
  addMemory: (memory: Omit<Memory, 'id'>) => void;
  deleteMemory: (memoryId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const sampleTrip1: Trip = {
  id: 'trip-1',
  tripName: '✈️ 【サンプル】2026 夏の北海道 家族旅行',
  tripDate: '2026-08-10T00:00:00Z',
  itineraryCategories: [
    {
      id: 'cat-1',
      name: '1️⃣ 札幌・小樽 観光編',
      schedules: [
        {
          id: 'day-1',
          date: '8月10日 (月) - 移動と小樽運河',
          events: [
            { id: generateId(), time: '09:00', title: 'ANA 051便 新千歳行き', location: '羽田空港 第2ターミナル', icon: 'plane' },
            { id: generateId(), time: '11:30', title: 'レンタカー借り出し', location: 'ニッポンレンタカー 新千歳', icon: 'car' },
            { id: generateId(), time: '13:00', title: '小樽運河散策 ＆ 海鮮丼', location: '小樽市', icon: 'map-pin' },
            { id: generateId(), time: '17:00', title: 'ホテル チェックイン', location: '小樽グランドホテル', icon: 'building' }
          ]
        }
      ]
    },
    {
      id: 'cat-2',
      name: '2️⃣ 富良野・美瑛 ドライブ編',
      schedules: [
        {
          id: 'day-2',
          date: '8月11日 (火) - ラベンダー畑',
          events: [
            { id: generateId(), time: '10:00', title: 'ファーム富田', location: '中富良野町', icon: 'map-pin' },
            { id: generateId(), time: '14:00', title: '青い池', location: '美瑛町', icon: 'map-pin' }
          ]
        }
      ]
    }
  ],
  bookings: [
    { id: generateId(), category: '飛行機', icon: 'plane', provider: 'ANA (全日空)', reference: 'HOK123', details: 'ANA051 - 羽田 発 / 新千歳 着', color: '#3b82f6' },
    { id: generateId(), category: 'レンタカー', icon: 'car', provider: 'ニッポンレンタカー', reference: 'NR-8888', details: 'ミニバン (家族用)', color: '#10b981' },
    { id: generateId(), category: 'ホテル', icon: 'building', provider: '小樽グランドホテル', reference: 'HTL-777', details: 'ファミリールーム - 1泊', color: '#8b5cf6' }
  ],
  expenses: [
    { id: generateId(), category: '飛行機代 (家族4人)', amount: 120000, color: '#3b82f6' },
    { id: generateId(), category: 'レンタカー代', amount: 35000, color: '#10b981' },
    { id: generateId(), category: 'ホテル宿泊費', amount: 40000, color: '#8b5cf6' }
  ],
  packingList: [
    { id: generateId(), name: '家族分のパスポート・航空券', isPacked: false, category: '重要' },
    { id: generateId(), name: 'モバイルバッテリー', isPacked: true, category: 'ガジェット' },
    { id: generateId(), name: '防寒着 (夜は冷えるため)', isPacked: false, category: '衣類' },
    { id: generateId(), name: '常備薬・酔い止め', isPacked: false, category: '日用品' }
  ],
  shoppingList: [
    { id: generateId(), name: '職場用の白い恋人 3箱', isBought: false },
    { id: generateId(), name: '両親へ海鮮セット', isBought: false }
  ],
  memories: []
};

export const useTravelStore = create<TravelStore>()(
  persist(
    (set) => ({
      trips: [sampleTrip1],
      selectedTripId: 'trip-1',

      selectTrip: (id) => set({ selectedTripId: id }),

      addTrip: (trip) => set((state) => ({
        trips: [...state.trips, { ...trip, id: generateId(), itineraryCategories: [], bookings: [], expenses: [], packingList: [], shoppingList: [], memories: [] }]
      })),

      updateTrip: (id, tripName, tripDate) => set((state) => ({
        trips: state.trips.map(t => t.id === id ? { ...t, tripName, tripDate } : t)
      })),

      deleteTrip: (id) => set((state) => {
        const newTrips = state.trips.filter(t => t.id !== id);
        return {
          trips: newTrips,
          selectedTripId: state.selectedTripId === id ? (newTrips[0]?.id || null) : state.selectedTripId
        };
      }),

      addCategory: (category) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, itineraryCategories: [...trip.itineraryCategories, { ...category, id: generateId(), schedules: [] }] }
              : trip
          )
        };
      }),

      addEvent: (categoryId, dayId, event) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => {
            if (trip.id !== state.selectedTripId) return trip;
            return {
              ...trip,
              itineraryCategories: trip.itineraryCategories.map(cat => {
                if (cat.id !== categoryId) return cat;
                return {
                  ...cat,
                  schedules: cat.schedules.map(day => 
                    day.id === dayId ? { ...day, events: [...day.events, { ...event, id: generateId() }] } : day
                  )
                };
              })
            };
          })
        };
      }),

      deleteEvent: (categoryId, dayId, eventId) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => {
            if (trip.id !== state.selectedTripId) return trip;
            return {
              ...trip,
              itineraryCategories: trip.itineraryCategories.map(cat => {
                if (cat.id !== categoryId) return cat;
                return {
                  ...cat,
                  schedules: cat.schedules.map(day => 
                    day.id === dayId ? { ...day, events: day.events.filter(e => e.id !== eventId) } : day
                  )
                };
              })
            };
          })
        };
      }),

      addBooking: (booking) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, bookings: [...trip.bookings, { ...booking, id: generateId() }] }
              : trip
          )
        };
      }),

      deleteBooking: (bookingId) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, bookings: trip.bookings.filter(b => b.id !== bookingId) }
              : trip
          )
        };
      }),

      updateBookingImage: (bookingId, imageKey) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => {
            if (trip.id !== state.selectedTripId) return trip;
            return {
              ...trip,
              bookings: trip.bookings.map(b => b.id === bookingId ? { ...b, imageKey } : b)
            };
          })
        };
      }),

      addExpense: (expense) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, expenses: [...trip.expenses, { ...expense, id: generateId() }] }
              : trip
          )
        };
      }),

      deleteExpense: (expenseId) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, expenses: trip.expenses.filter(e => e.id !== expenseId) }
              : trip
          )
        };
      }),

      addPackingItem: (item) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, packingList: [...(trip.packingList || []), { ...item, isPacked: false, id: generateId() }] }
              : trip
          )
        };
      }),

      togglePackingItem: (itemId) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, packingList: (trip.packingList || []).map(item => item.id === itemId ? { ...item, isPacked: !item.isPacked } : item) }
              : trip
          )
        };
      }),

      deletePackingItem: (itemId) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, packingList: (trip.packingList || []).filter(item => item.id !== itemId) }
              : trip
          )
        };
      }),

      addShoppingItem: (item) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, shoppingList: [...(trip.shoppingList || []), { ...item, isBought: false, id: generateId() }] }
              : trip
          )
        };
      }),

      toggleShoppingItem: (itemId) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, shoppingList: (trip.shoppingList || []).map(item => item.id === itemId ? { ...item, isBought: !item.isBought } : item) }
              : trip
          )
        };
      }),

      deleteShoppingItem: (itemId) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, shoppingList: (trip.shoppingList || []).filter(item => item.id !== itemId) }
              : trip
          )
        };
      }),

      addMemory: (memory) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, memories: [...(trip.memories || []), { ...memory, id: generateId() }] }
              : trip
          )
        };
      }),

      deleteMemory: (memoryId) => set((state) => {
        if (!state.selectedTripId) return state;
        return {
          trips: state.trips.map(trip => 
            trip.id === state.selectedTripId 
              ? { ...trip, memories: (trip.memories || []).filter(m => m.id !== memoryId) }
              : trip
          )
        };
      }),
      
    }),
    {
      name: 'hometown-trip-storage',
    }
  )
);
