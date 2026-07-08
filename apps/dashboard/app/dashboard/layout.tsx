export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <nav>TaskForge Dashboard</nav>
      {children}
    </section>
  );
}
