export default function AdminLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="h-8 w-32 bg-stone-200 mb-2" />
      <div className="h-4 w-48 bg-stone-100 mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[100px] bg-stone-100 border border-stone-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-64 bg-stone-100 border border-stone-200" />
        <div className="h-64 bg-stone-100 border border-stone-200" />
      </div>
    </div>
  )
}
