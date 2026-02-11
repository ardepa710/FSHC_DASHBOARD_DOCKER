import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function TutorialModal({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Video URL - can be replaced with actual hosted video URL
  const videoUrl = '/tutorial/fshc-tutorial.mp4';

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        Math.max(0, videoRef.current.currentTime + seconds),
        duration
      );
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const chapters = [
    { time: 0, label: 'Intro' },
    { time: 15, label: 'Login' },
    { time: 45, label: 'Projects' },
    { time: 75, label: 'Dashboard' },
    { time: 120, label: 'Views' },
    { time: 210, label: 'Create Task' },
    { time: 270, label: 'Edit Task' },
    { time: 330, label: 'Subtasks' },
    { time: 360, label: 'Comments' },
    { time: 390, label: 'Search' },
    { time: 420, label: 'Filters' },
    { time: 450, label: 'Notifications' },
    { time: 480, label: 'Settings' },
    { time: 510, label: 'Summary' },
  ];

  const jumpToChapter = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-[#111827] rounded-xl overflow-hidden shadow-2xl border border-[#1e2640]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2640] bg-[#0a0e1a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6c8cff] flex items-center justify-center">
              <Play size={16} fill="white" className="text-white ml-0.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Tutorial Video</h2>
              <p className="text-[11px] text-[#8892a4]">Learn how to use FSHC Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1a2035] hover:bg-[#253050] text-[#8892a4] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video container */}
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
            poster="/tutorial/thumbnail.png"
          />

          {/* Play overlay (when paused) */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-20 h-20 rounded-full bg-[#6c8cff]/90 flex items-center justify-center hover:bg-[#6c8cff] transition-colors">
                <Play size={36} fill="white" className="text-white ml-1" />
              </div>
            </div>
          )}

          {/* Video controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress bar */}
            <div
              className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-[#6c8cff] rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => skip(-10)}
                className="text-white/80 hover:text-white transition-colors"
                title="Rewind 10s"
              >
                <SkipBack size={20} />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>

              <button
                onClick={() => skip(10)}
                className="text-white/80 hover:text-white transition-colors"
                title="Forward 10s"
              >
                <SkipForward size={20} />
              </button>

              <span className="text-[12px] text-white/80 font-mono ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              <button
                onClick={toggleMute}
                className="text-white/80 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <button
                onClick={handleFullscreen}
                className="text-white/80 hover:text-white transition-colors"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="p-4 border-t border-[#1e2640] bg-[#0a0e1a]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#556] mb-3">
            Chapters
          </p>
          <div className="flex flex-wrap gap-2">
            {chapters.map((chapter, i) => {
              const isActive = currentTime >= chapter.time &&
                (i === chapters.length - 1 || currentTime < chapters[i + 1].time);
              return (
                <button
                  key={chapter.time}
                  onClick={() => jumpToChapter(chapter.time)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#6c8cff] text-white'
                      : 'bg-[#1a2035] text-[#8892a4] hover:bg-[#253050] hover:text-white'
                  }`}
                >
                  {chapter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
