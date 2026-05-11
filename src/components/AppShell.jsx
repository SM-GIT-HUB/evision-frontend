import Sidebar from "./Sidebar"

/**
 * AppShell — wraps all authenticated pages with the sidebar layout.
 * Usage: <AppShell><YourPage /></AppShell>
 */
export default function AppShell({ children }) {
    return (
        <div className="app-shell">
            <Sidebar />
            <main className="app-main">
                {children}
            </main>
        </div>
    )
}
