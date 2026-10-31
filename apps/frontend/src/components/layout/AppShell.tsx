import { NavBar } from './NavBar';
import { Sidebar } from './Sidebar';

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className="flex h-screen flex-col bg-surface-900 overflow-hidden">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
