import Navbar from '@/components/layout/Navbar'

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen">
        {children}
      </main>
    </>
  )
}
