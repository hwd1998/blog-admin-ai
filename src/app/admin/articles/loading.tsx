export default function ArticlesLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-28 bg-stone-200 mb-2" />
          <div className="h-4 w-20 bg-stone-100" />
        </div>
        <div className="h-9 w-24 bg-stone-200" />
      </div>
      <div className="bg-white border border-stone-200">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-stone-100">
            <div className="h-4 flex-1 bg-stone-100" />
            <div className="h-4 w-16 bg-stone-100" />
            <div className="h-4 w-12 bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
