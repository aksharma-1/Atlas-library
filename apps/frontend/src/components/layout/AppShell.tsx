import { NavBar } from './NavBar';
import { Sidebar } from './Sidebar';

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
