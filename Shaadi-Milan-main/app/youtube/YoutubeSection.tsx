'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface ChatMessage {
  id: number
  username: string
  message: string
  timestamp: Date
}

// Complete quality list
const ALL_QUALITIES = [
  { key: 'highres', label: '2160p', resolution: 2160, icon: '🎬' },
  { key: 'hd1080', label: '1080p', resolution: 1080, icon: '🎬' },
  { key: 'hd720', label: '720p', resolution: 720, icon: '📺' },
  { key: 'large', label: '480p', resolution: 480, icon: '📱' },
  { key: 'medium', label: '360p', resolution: 360, icon: '📱' },
  { key: 'small', label: '240p', resolution: 240, icon: '📡' },
  { key: 'tiny', label: '144p', resolution: 144, icon: '📡' },
]

export default function YoutubeSection({ videoId }: { videoId: string }) {
  const targetRef = useRef<HTMLDivElement>(null)
  const playerWrapRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)
  const qualityMenuRef = useRef<HTMLDivElement>(null)
  const settingsBtnRef = useRef<HTMLButtonElement>(null)

  const [isPlayerApiReady, setIsPlayerApiReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [availableQualities, setAvailableQualities] = useState<string[]>([])
  const [currentQuality, setCurrentQuality] = useState('auto')
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [videoQuality, setVideoQuality] = useState('auto')
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, username: 'Alex', message: 'Great content! 🔥', timestamp: new Date(Date.now() - 300000) },
    { id: 2, username: 'Sarah', message: 'This is really helpful, thanks!', timestamp: new Date(Date.now() - 240000) },
    { id: 3, username: 'Mike', message: 'Can you explain more about the CSS overlay?', timestamp: new Date(Date.now() - 180000) },
    { id: 4, username: 'Emma', message: 'Loving the custom controls!', timestamp: new Date(Date.now() - 120000) },
    { id: 5, username: 'James', message: 'When will the next part be released?', timestamp: new Date(Date.now() - 60000) },
  ])
  const [newMessage, setNewMessage] = useState('')
  const [username] = useState(() => `User_${Math.floor(Math.random() * 1000)}`)

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showQualityMenu && qualityMenuRef.current && !qualityMenuRef.current.contains(event.target as Node) &&
          settingsBtnRef.current && !settingsBtnRef.current.contains(event.target as Node)) {
        setShowQualityMenu(false)
      }
      if (showSpeedMenu) {
        const speedMenu = document.querySelector('.speed-menu-container')
        if (speedMenu && !speedMenu.contains(event.target as Node)) {
          setShowSpeedMenu(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showQualityMenu, showSpeedMenu])

  // Initialize Player
  useEffect(() => {
    const initPlayer = () => {
      if (!targetRef.current) return

      const player = new window.YT.Player(targetRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          controls: 0,
          fs: 0,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError,
        },
      })
      playerRef.current = player
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.body.appendChild(tag)
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy()
    }
  }, [videoId])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isPlayerApiReady && playerRef.current && !isLoading) {
      interval = setInterval(() => {
        const player = playerRef.current
        if (!player) return
        try {
          if (typeof player.getCurrentTime === 'function') {
            const time = player.getCurrentTime()
            setCurrentTime(time || 0)
          }
          if (typeof player.getVideoLoadedFraction === 'function') {
            setBuffered(player.getVideoLoadedFraction() * 100)
          }
        } catch (e) {
          console.log('Progress error:', e)
        }
      }, 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isPlayerApiReady, isLoading])

  useEffect(() => {
    const handleFS = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFS)
    return () => document.removeEventListener('fullscreenchange', handleFS)
  }, [])

  const onPlayerReady = (event: any) => {
    const player = event.target
    playerRef.current = player

    try {
      setDuration(player.getDuration() || 0)
      player.setVolume(volume)
      player.playVideo()
    } catch (e) {
      console.log('onPlayerReady error:', e)
    }
  }

  const onPlayerStateChange = (event: any) => {
    const player = playerRef.current
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true)

      setTimeout(() => {
        setIsPlayerApiReady(true)
        
        if (player?.getAvailableQualityLevels) {
          const quals = player.getAvailableQualityLevels()
          console.log('Available qualities from YouTube:', quals)
          setAvailableQualities(quals)
        }
        
        if (player?.getPlaybackQuality) {
          const current = player.getPlaybackQuality()
          setCurrentQuality(current || 'auto')
          console.log('Current quality:', current)
        }
        
        if (player?.getPlaybackRate) {
          setPlaybackRate(player.getPlaybackRate())
        }
      }, 600)
    } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false)
    }
  }

  const onPlayerError = (error: any) => console.error('YouTube Error:', error)

  const safePlayerCall = (method: string, ...args: any[]) => {
    const player = playerRef.current
    if (!isPlayerApiReady || !player || typeof player[method] !== 'function') {
      console.warn(`Method ${method} not ready yet`)
      return false
    }
    try {
      player[method](...args)
      return true
    } catch (e) {
      console.error(`Error in ${method}:`, e)
      return false
    }
  }

  const togglePlayPause = () => {
    if (isPlaying) safePlayerCall('pauseVideo')
    else safePlayerCall('playVideo')
  }

  const seekForward20 = () => {
    if (!isPlayerApiReady || !duration) return
    const newTime = Math.min(duration, currentTime + 20)
    safePlayerCall('seekTo', newTime, true)
    setCurrentTime(newTime)
  }

  const seekBackward20 = () => {
    if (!isPlayerApiReady) return
    const newTime = Math.max(0, currentTime - 20)
    safePlayerCall('seekTo', newTime, true)
    setCurrentTime(newTime)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlayerApiReady || !duration || isLoading) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percentage = (e.clientX - rect.left) / rect.width
    const newTime = percentage * duration
    safePlayerCall('seekTo', newTime, true)
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value)
    setVolume(newVol)
    setIsMuted(newVol === 0)
    safePlayerCall('setVolume', newVol)
  }

  const toggleMute = () => {
    if (isMuted) {
      safePlayerCall('unMute')
      safePlayerCall('setVolume', volume || 50)
      setIsMuted(false)
    } else {
      safePlayerCall('mute')
      setIsMuted(true)
    }
  }

  const changeSpeed = (speed: number) => {
    const player = playerRef.current
    if (!player || !isPlayerApiReady || isLoading) return

    try {
      const rate = Number(speed)
      if (!isPlaying) {
        safePlayerCall('playVideo')
      }
      player.setPlaybackRate(rate)
      setPlaybackRate(rate)
      console.log(`Speed changed to ${rate}x`)
    } catch (e) {
      console.error('Speed change failed:', e)
    }
    setShowSpeedMenu(false)
  }

  const changeQuality = async (quality: string) => {
    const player = playerRef.current
    if (!player || !isPlayerApiReady || isLoading) return
    setVideoQuality(quality) // Update state to reflect selected quality
// console.log("quality console",quality)
    if (quality !== 'auto' && availableQualities.length > 0 && !availableQualities.includes(quality)) {
      console.log(`Quality ${quality} not available for this video`)
      return
    }

    // Get quality label for display
    const qualityLabel = getQualityLabel(quality)
    
    // Show loading indicator
    setIsLoading(true)
    setLoadingText(`Changing to ${qualityLabel}...`)

    try {
      const wasPlaying = isPlaying
      const currentTimeState = currentTime
      
      // Pause video during quality change
      if (wasPlaying) {
        safePlayerCall('pauseVideo')
      }
      
      // Change quality
      player.setPlaybackQuality(quality)
      setCurrentQuality(quality)
      
      // Wait for 2 seconds to simulate loading and allow quality to take effect
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Seek back to the same position
      if (player && typeof player.getCurrentTime === 'function') {
        player.seekTo(currentTimeState, true)
        setCurrentTime(currentTimeState)
      }
      
      // Resume playback if it was playing before
      if (wasPlaying) {
        safePlayerCall('playVideo')
      }
      
      console.log(`Quality changed to ${quality}`)
    } catch (e) {
      console.error('Quality change failed:', e)
      setLoadingText('Quality change failed')
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setIsLoading(false)
      setLoadingText('')
    }
    
    setShowQualityMenu(false)
  }

  const toggleFullscreen = () => {
    if (!playerWrapRef.current) return
    if (!isFullscreen) {
      playerWrapRef.current.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen().catch(console.error)
    }
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now(),
        username,
        message: newMessage.trim(),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, message])
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isPlayerApiReady || isLoading) return
      if (e.code === 'Space') { e.preventDefault(); togglePlayPause() }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); seekBackward20() }
      else if (e.code === 'ArrowRight') { e.preventDefault(); seekForward20() }
      else if (e.code === 'ArrowUp') {
        e.preventDefault()
        const newVol = Math.min(100, volume + 10)
        setVolume(newVol)
        safePlayerCall('setVolume', newVol)
      }
      else if (e.code === 'ArrowDown') {
        e.preventDefault()
        const newVol = Math.max(0, volume - 10)
        setVolume(newVol)
        safePlayerCall('setVolume', newVol)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlayerApiReady, isPlaying, currentTime, duration, volume, isLoading])

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  const getQualityLabel = (q: string) => {
    const labels: Record<string, string> = {
      auto: 'Auto',
      highres: '2160p',
      hd1080: '1080p',
      hd720: '720p',
      large: '480p',
      medium: '360p',
      small: '240p',
      tiny: '144p',
    }
    return labels[q] || q.toUpperCase()
  }

  const getCurrentDisplayQuality = () => {
    if (currentQuality === 'auto') return 'Auto'
    const found = ALL_QUALITIES.find(q => q.key === currentQuality)
    return found ? found.label : currentQuality.toUpperCase()
  }

  const isQualityAvailable = (qualityKey: string) => {
    if (qualityKey === 'auto') return true
    if (availableQualities.length === 0) return true
    return availableQualities.includes(qualityKey)
  }

  return (
    <div className="flex gap-6 flex-wrap">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
          <div className="bg-[#1a1a1a] rounded-xl p-6 flex flex-col items-center gap-4 min-w-[280px] shadow-2xl border border-white/20">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-white/20 border-t-red-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl">⚙️</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium">{loadingText || 'Changing quality...'}</p>
              <p className="text-gray-400 text-xs mt-1">Please wait</p>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
              <div className="bg-red-600 h-full rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-[2] min-w-[300px]">
        <div className="bg-[#1a1a1a] rounded-xl overflow-hidden mb-4">
          <div className="relative pb-[56.25%] h-0 bg-black group" ref={playerWrapRef}>
            <div ref={targetRef} className="absolute inset-0 w-full h-full border-none z-[1]" />

            <div className="absolute top-0 left-0 right-0 h-[30px] bg-black z-[2] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-black z-[2] pointer-events-none" />
            <div className="absolute inset-0 z-[3] pointer-events-auto" />

            {/* Center Play Button */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black/75 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer z-10 transition-all duration-300 border-2 border-white/30 opacity-0 group-hover:opacity-100 hover:bg-black/95 hover:scale-110 hover:border-white/80"
              onClick={(e) => { e.stopPropagation(); togglePlayPause() }}>
              {isPlaying ? (
                <span className="text-4xl text-white">⏸</span>
              ) : (
                <span className="text-4xl text-white ml-1">▶</span>
              )}
            </div>

            {/* Custom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-5 pb-4 z-10 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
              <div className="flex flex-col gap-3">
                {/* Progress Bar */}
                <div className="w-full flex items-center gap-3">
                  <div className={`flex-1 relative h-1 bg-white/20 rounded-sm transition-all hover:h-1.5 group/progress ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`} onClick={handleProgressClick}>
                    <div className="absolute left-0 top-0 h-full bg-white/40 rounded-sm" style={{ width: `${buffered}%` }} />
                    <div className="absolute left-0 top-0 h-full bg-red-600 rounded-sm transition-all" style={{ width: `${progressPercentage}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 transition-opacity pointer-events-none group-hover/progress:opacity-100" style={{ left: `${progressPercentage}%` }} />
                  </div>
                  <span className="text-white text-[13px] font-mono min-w-[100px] text-right">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button className="bg-transparent border-none text-white text-lg cursor-pointer p-2 rounded transition-all hover:bg-white/20 hover:scale-105 flex items-center gap-2 z-10 disabled:opacity-50 disabled:cursor-not-allowed" onClick={(e) => { e.stopPropagation(); togglePlayPause() }} disabled={isLoading}>
                      {isPlaying ? '⏸' : '▶'}
                    </button>

                    <button className="bg-transparent border-none text-white text-sm font-medium cursor-pointer p-2 rounded transition-all hover:bg-white/20 hover:scale-105 flex items-center gap-1 z-10 disabled:opacity-50 disabled:cursor-not-allowed" onClick={(e) => { e.stopPropagation(); seekBackward20() }} title="Back 20 seconds" disabled={isLoading}>
                      ⏪ -20s
                    </button>

                    <button className="bg-transparent border-none text-white text-sm font-medium cursor-pointer p-2 rounded transition-all hover:bg-white/20 hover:scale-105 flex items-center gap-1 z-10 disabled:opacity-50 disabled:cursor-not-allowed" onClick={(e) => { e.stopPropagation(); seekForward20() }} title="Forward 20 seconds" disabled={isLoading}>
                      +20s ⏩
                    </button>

                    <div className="flex items-center gap-2.5 relative group/volume">
                      <button className="bg-transparent border-none text-white text-lg cursor-pointer p-2 rounded transition-all hover:bg-white/20 hover:scale-105 flex items-center gap-2 z-10 disabled:opacity-50 disabled:cursor-not-allowed" onClick={(e) => { e.stopPropagation(); toggleMute() }} disabled={isLoading}>
                        {isMuted || volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}
                      </button>
                      <div className="w-0 overflow-hidden transition-all duration-300 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100">
                        <input type="range" min="0" max="100" value={isMuted ? 0 : volume}
                          className="w-full h-1 bg-white/20 rounded-sm outline-none cursor-pointer accent-red-600"
                          onChange={handleVolumeChange} onClick={(e) => e.stopPropagation()} disabled={isLoading} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Speed Control */}
                    <div className="relative">
                      <button className="bg-transparent border-none text-white text-lg cursor-pointer p-2 rounded transition-all hover:bg-white/20 hover:scale-105 flex items-center gap-2 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false) }} disabled={isLoading}>
                        {playbackRate}x
                      </button>
                      {showSpeedMenu && !isLoading && (
                        <div className="absolute bottom-full right-0 mb-2 bg-[#2a2a2a] rounded-lg py-1 min-w-[80px] z-50 shadow-xl border border-white/10">
                          {speedOptions.map((speed) => (
                            <button key={speed}
                              className={`w-full px-4 py-2 text-white text-sm text-left hover:bg-white/10 transition-colors ${playbackRate === speed ? 'text-red-500 font-bold' : ''}`}
                              onClick={(e) => { e.stopPropagation(); changeSpeed(speed) }}>
                              {speed}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quality Control - Settings Icon with Popup */}
                    <div className="relative">
                      <button 
                        ref={settingsBtnRef}
                        className="bg-black/60 border border-white/20 rounded-md px-2.5 py-1.5 text-white cursor-pointer flex items-center gap-1.5 text-xs transition-all hover:bg-white/15 hover:border-white/40 backdrop-blur-sm z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false) }}
                        title="Video Quality Settings"
                        disabled={isLoading}
                      >
                        <span className="text-sm">⚙️</span>
                        {/* Display current quality from state */}
                        {/* <span className="font-medium">{getCurrentDisplayQuality()}</span> */}
<span className="font-medium">
  {ALL_QUALITIES.find(q => q.key === videoQuality)?.label || videoQuality}
</span>                        <span className="text-[8px] opacity-70">▼</span>
                      </button>
                      
                      {/* Quality Popup Menu */}
                      {showQualityMenu && !isLoading && (
                        <div 
                          ref={qualityMenuRef}
                          className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] rounded-lg min-w-[200px] z-[100] shadow-2xl border border-white/20 overflow-hidden"
                          style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '8px' }}
                        >
                          {/* Header */}
                          <div className="px-3 py-2 border-b border-white/10 bg-black/50">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-gray-300">📺 Quality</span>
                              {availableQualities.length > 0 && (
                                <span className="text-[9px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                                  {availableQualities.length} available
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Quality List */}
                          <div className="max-h-[320px] overflow-y-auto">
                            {/* Auto Option */}
                            <button 
                              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-white/10 transition-colors ${currentQuality === 'auto' ? 'bg-red-600/10' : ''}`}
                              onClick={(e) => { e.stopPropagation(); changeQuality('auto') }}
                            >
                              <div className="flex items-center gap-2">
                                <span>🔄</span>
                                <span className={currentQuality === 'auto' ? 'text-red-500 font-medium' : 'text-white'}>Auto</span>
                              </div>
                              {currentQuality === 'auto' && <span className="text-red-500 text-sm">✓</span>}
                            </button>
                            
                            <div className="h-px bg-white/5 my-1"></div>
                            
                            {/* Quality Options */}
                           {ALL_QUALITIES.map((quality) => {
  const isAvailable = isQualityAvailable(quality.key)
  const isCurrent = videoQuality === quality.key

  return (
    <button 
      key={quality.key}
      className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${
        isAvailable ? 'hover:bg-white/10 cursor-pointer' : 'opacity-40 cursor-not-allowed'
      } ${isCurrent ? 'bg-red-600/10' : ''}`}
      onClick={(e) => { 
        e.stopPropagation(); 
        if (isAvailable) changeQuality(quality.key);
      }}
      disabled={!isAvailable}
    >
      <div className="flex items-center gap-2">
        <span>{quality.icon}</span>
        <span className={isCurrent ? 'text-red-500 font-medium' : 'text-white'}>
          {quality.label}
        </span>
        <span className="text-[10px] text-gray-500">{quality.resolution}p</span>
      </div>

      {isCurrent && <span className="text-red-500 text-sm">✓</span>}

      {!isAvailable && availableQualities.length > 0 && (
        <span className="text-[9px] text-gray-500">unavailable</span>
      )}
    </button>
  )
})}
                          </div>
                          
                          {/* Footer */}
                          <div className="px-3 py-1.5 border-t border-white/10 text-[9px] text-gray-500 text-center bg-black/30">
                            Click to change quality
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fullscreen */}
                    <button className="bg-transparent border-none text-white text-lg cursor-pointer p-2 rounded transition-all hover:bg-white/20 hover:scale-105 flex items-center gap-2 z-10 disabled:opacity-50 disabled:cursor-not-allowed" onClick={(e) => { e.stopPropagation(); toggleFullscreen() }} disabled={isLoading}>
                      {isFullscreen ? '🗗' : '🗖'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h1 className="text-base text-white m-0">Introduction to Modern Web Development</h1>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="flex-1 min-w-[320px] bg-[#1a1a1a] rounded-xl overflow-hidden flex flex-col h-fit max-h-[calc(100vh-100px)] sticky top-4">
        <div className="flex gap-2 p-4 bg-[#222] border-b border-[#333]">
          <button 
            className={`flex-1 py-2.5 px-3 rounded-lg cursor-pointer text-sm font-medium transition-all ${showChat ? 'bg-red-600 text-white' : 'bg-[#2a2a2a] text-white hover:bg-[#333]'}`}
            onClick={() => setShowChat(!showChat)}
            disabled={isLoading}
          >
            💬 Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-180px)]" style={{ scrollbarWidth: 'thin' }}>
          {showChat && (
            <div className="flex flex-col h-[500px] p-4">
              <h3 className="text-base font-semibold mb-3 text-white">💬 Live Chat</h3>
              <div className="flex-1 overflow-y-auto mb-3 flex flex-col gap-2" style={{ scrollbarWidth: 'thin' }}>
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-[#222] p-2.5 rounded-lg">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-red-500 text-xs">{msg.username}</span>
                      <span className="text-[10px] text-gray-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-gray-300 text-xs leading-relaxed break-words">{msg.message}</div>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>
              <div className="flex gap-2 mt-auto">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 p-2 bg-[#222] border border-[#333] rounded-lg text-white text-xs outline-none focus:border-red-500 placeholder:text-gray-600 disabled:opacity-50"
                  disabled={isLoading}
                />
                <button onClick={sendMessage} className="px-4 py-2 bg-red-600 rounded-lg text-white text-xs font-semibold cursor-pointer transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            width: 30%;
          }
          50% {
            width: 70%;
          }
        }
      `}</style>
    </div>
  )
}