import { useEffect } from "react"
import { getMe } from "./api/auth-api"
import { Toaster } from "react-hot-toast"
import AppRoutes from "./routes/AppRoutes"
import useAuthStore from "./store/auth-store"
import LoadingSpinner from "./components/LoadingSpinner"

function App() {
  const { user, loading, setUser } = useAuthStore();

  useEffect(() => {
      async function loadUser()
      {
          try {
            const response = await getMe();
            setUser(response.data);
          }
          catch(err) {
            setUser(null);
            console.log("Not authenticated: " + err.message);
          }
      }

      loadUser();
  }, [setUser])


  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <>
      <Toaster
          position="top-center"
          toastOptions={{
              style: {
                  background: "#18181b",
                  color: "#fff",
                  border: "1px solid #3f3f46"
              }
          }}
      />

      <AppRoutes />
    </>
  )
}

export default App