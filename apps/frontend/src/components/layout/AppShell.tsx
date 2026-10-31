import { NavBar } from './NavBar';

interface Props {
  children: React.ReactNode;
}

/**
 * AppShell — the authenticated layout frame.
 * Contains the top nav and a scrollable main content area.
 * All protected pages are rendered as children inside this shell.
 */
export function AppShell({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-900">
      <NavBar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
