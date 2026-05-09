import { create } from "zustand"

const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    isAuthenticated: false,

    setUser: (userData) => set({
        user: userData,
        isAuthenticated: !!userData,
        loading: false
    }),

    logout: () => set({
        user: null,
        isAuthenticated: false
    })
}))

export default useAuthStore