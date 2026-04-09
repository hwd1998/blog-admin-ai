import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Root layout already offsets content by navbar height (pt-14),
    // so admin area should start below the top navbar.
    <div className="min-h-[calc(100vh-56px)] bg-[#111111]">
      <AdminSidebar />
      <div className="ml-[220px] min-h-[calc(100vh-56px)] bg-[#F5F5F3]">
        {children}
      </div>
    </div>
  )
}
