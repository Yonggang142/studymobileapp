import { create } from "zustand";


interface AuthState {
    userId: string | null;
    userName: string;
    loading: boolean;
    


    setUserId: (id: string) => void;
    setUserName: (name: string) => void;
}


export const useAuthStore = create<AuthState>((set, get) => ({


    userId: null,
    userName: "Anonymous",
    loading: true,
    

    setUserId: (userId) => set({ userId }),
    setUserName: (userName) => set({ userName })


}));