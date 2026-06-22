
export function StreamingBar() {
  return (
    <div className="px-4 pb-2">
      <div className="h-0.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full animate-pulse"
          style={{
            width: "40%",
            animation: "stream-slide 1.4s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes stream-slide {
          0%   { transform: translateX(-100%); opacity: 0.7; }
          50%  { opacity: 1; }
          100% { transform: translateX(350%); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
