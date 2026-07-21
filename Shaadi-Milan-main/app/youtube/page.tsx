// app/youtube/page.tsx
import YoutubeSection from './YoutubeSection'

const VIDEO_ID = process.env.NEXT_PUBLIC_YT_VIDEO_ID ?? 'dQw4w9WgXcQ'

export default function VideoPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto p-4">
        <header className="flex justify-between items-center p-4 bg-[#1a1a1a] rounded-xl mb-6 text-white">
          <div className="text-2xl font-bold flex items-center gap-2">
            <span className="text-red-600">▶</span> StreamKit
          </div>
          <div className="flex gap-4 items-center">
            <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-semibold">Private</span>
          </div>
        </header>

        <YoutubeSection videoId={VIDEO_ID} />
      </div>
    </div>
  )
}