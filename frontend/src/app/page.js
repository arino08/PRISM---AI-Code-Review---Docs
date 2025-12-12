import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="main-content">
        <Dashboard />
      </main>
    </>
  );
}
