import { create } from "zustand";


interface AuthState {
    userId: string | null;
    userName: string;
    loading: boolean;
    toastMessage: string | null;
    


    setUserId: (id: string | null) => void;
    setUserName: (name: string) => void;
    setLoading: (loading: boolean) => void;
    showToast: (message: string) => void;
}


export const useUserStore = create<AuthState>((set) => ({


    userId: null,
    userName: "Anonymous",
    loading: true,
    toastMessage: null,
    

    setUserId: (userId) => set({ userId }),
    setUserName: (userName) => set({ userName }),
    setLoading: (loading) => set({ loading }),
    showToast: (message) => {
        set({ toastMessage: message })
        setTimeout(() => set({ toastMessage: null }), 2000)
    },


}));
