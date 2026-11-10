import { NavBar } from './NavBar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      <NavBar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 pb-20 md:pb-8 transition-colors duration-200">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
