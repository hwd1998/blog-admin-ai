import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#111111]">
      <AdminSidebar />
      <div className="ml-[220px] min-h-screen bg-[#F5F5F3]">
        {children}
      </div>
    </div>
  )
}
