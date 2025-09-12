import { useSession, signOut } from "next-auth/react";
import { Button } from "../ui/Button";
import { User, LogOut, Moon, Sun } from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { data: session } = useSession();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, you'd persist this to localStorage and apply the theme
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className={`h-screen flex flex-col ${darkMode ? "dark" : ""}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Career Counseling Chat
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {session && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
};