"use client"

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react"

interface BlenderUploadProps {
  onFileSelect: (file: File, dataUrl: string) => void
  onError?: (message: string) => void
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
}

/**
 * idle: fruit beside an open jar. drop: fruit falls in, lid goes on.
 * blend: motor on, the rig shakes, blade spins, chunks swirl and mince.
 * settle: motor off, one last wobble. done: the smoothie glass.
 */
type Phase = "idle" | "drop" | "blend" | "settle" | "done"

const DROP_MS = 450
const BLEND_MS = 1700
const SETTLE_MS = 450

// Fruit pieces that swirl in the jar, in the colours of the fruit that went in.
const CHUNKS = [
  { cy: 150, r: 6, fill: "#F97316", x: 1100, y: 700, delay: -200 },
  { cy: 168, r: 5, fill: "#DC2626", x: 900, y: 560, delay: -650 },
  { cy: 184, r: 4.5, fill: "#3B82F6", x: 1250, y: 820, delay: -400 },
  { cy: 158, r: 4, fill: "#FB923C", x: 800, y: 500, delay: -900 },
  { cy: 176, r: 5.5, fill: "#EF4444", x: 1000, y: 640, delay: -100 },
  { cy: 192, r: 3.5, fill: "#2563EB", x: 700, y: 450, delay: -550 },
]

const JAR = "M55 85 L50 195 Q50 210, 70 210 L130 210 Q150 210, 150 195 L145 85 Z"

export function BlenderUpload({
  onFileSelect,
  onError,
  accept = ".jpg,.jpeg,.png",
  maxSizeMB = 1,
  disabled = false,
}: BlenderUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const uid = useId().replace(/:/g, "")
  const timers = useRef<number[]>([])
  const pending = useRef<{ file: File; dataUrl: string } | null>(null)
  const timelineDone = useRef(false)

  const isBlending = phase === "drop" || phase === "blend" || phase === "settle"
  const blendComplete = phase === "done"

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  // The file can finish reading before or after the animation; whichever is
  // last hands the result over, so the glass never appears half-poured.
  const finish = useCallback(() => {
    const result = pending.current
    if (!result || !timelineDone.current) return
    pending.current = null
    setPhase("done")
    setPreviewUrl(result.dataUrl)
    onFileSelect(result.file, result.dataUrl)
  }, [onFileSelect])

  const processFile = useCallback(
    async (file: File) => {
      if (disabled) return

      const validTypes = ["image/jpeg", "image/jpg", "image/png"]
      if (!validTypes.includes(file.type)) {
        const errorMsg = "Only .jpg, .jpeg, .png files are allowed"
        onError?.(errorMsg)
        return
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
        const errorMsg = `Image must be less than ${maxSizeMB} MB (selected: ${fileSizeMB} MB)`
        onError?.(errorMsg)
        return
      }

      clearTimers()
      pending.current = null
      timelineDone.current = false
      setPreviewUrl("")
      setPhase("drop")
      const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))
      at(DROP_MS, () => setPhase("blend"))
      at(DROP_MS + BLEND_MS, () => setPhase("settle"))
      at(DROP_MS + BLEND_MS + SETTLE_MS, () => {
        timelineDone.current = true
        finish()
      })

      const reader = new FileReader()
      reader.onload = (e) => {
        pending.current = { file, dataUrl: e.target?.result as string }
        finish()
      }
      reader.onerror = () => {
        clearTimers()
        setPhase("idle")
        onError?.("Failed to read file")
      }
      reader.readAsDataURL(file)
    },
    [disabled, maxSizeMB, onError, finish]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled || isBlending || blendComplete) return
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [disabled, isBlending, blendComplete, processFile]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled && !isBlending && !blendComplete) setIsDragging(true)
    },
    [disabled, isBlending, blendComplete]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = useCallback(() => {
    if (!disabled && !isBlending && !blendComplete) fileInputRef.current?.click()
  }, [disabled, isBlending, blendComplete])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return
      // Space would scroll the page if it reached the document.
      if (e.key === " ") e.preventDefault()
      handleClick()
    },
    [handleClick]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      e.target.value = ""
    },
    [processFile]
  )

  const resetUpload = useCallback(() => {
    clearTimers()
    pending.current = null
    setPhase("idle")
    setPreviewUrl("")
  }, [])

  const blending = phase === "blend"
  const lidOn = phase !== "idle"
  const dropping = phase !== "idle"
  const fruit = (dx: number, dy: number, delay: number): CSSProperties =>
    dropping
      ? ({ "--dx": `${dx}px`, "--dy": `${dy}px`, animation: `bz-bl-drop 420ms cubic-bezier(0.55, 0, 0.8, 0.4) ${delay}ms both` } as CSSProperties)
      : { animationDelay: `${delay / 1000}s` }

  return (
    <div
      className={`bz-bl relative overflow-hidden rounded-xl transition-transform duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22] ${isDragging ? "scale-[1.02]" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : blendComplete ? "cursor-default" : "cursor-pointer"}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-busy={isBlending}
      style={{ background: "#FFFFFF" }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <span className="sr-only" aria-live="polite">
        {isBlending ? "Blending your image" : blendComplete ? "Image ready" : ""}
      </span>

      <div
        className={`relative p-6 m-3 border-2 border-dashed rounded-lg transition-colors ${
          isDragging ? "border-[#92A086] bg-[#92A086]/5" : blendComplete ? "border-[#92A086]" : "border-gray-300"
        }`}
        style={{ background: "#FFFFFF" }}
      >
        <div className="flex flex-col items-center justify-center">

          {/* Blender (hidden when complete) */}
          {!blendComplete && (
            <svg viewBox="0 0 200 260" className="w-44 h-56" aria-hidden>
              <defs>
                <clipPath id={`bz-bl-jar-${uid}`}>
                  <path d={JAR} />
                </clipPath>
              </defs>

              {/* Fruit: waiting beside the jar, then thrown in */}
              {phase !== "blend" && phase !== "settle" && (
                <g>
                  <g className={isDragging ? "animate-bounce" : ""} style={fruit(75, 85, 0)}>
                    <circle cx="25" cy="35" r="14" fill="#F97316" />
                    <ellipse cx="21" cy="31" rx="4" ry="5" fill="#FDBA74" opacity="0.5" />
                    <circle cx="25" cy="24" r="3" fill="#92A086" />
                  </g>
                  <g className={isDragging ? "animate-bounce" : ""} style={fruit(82, 62, 60)}>
                    <circle cx="18" cy="58" r="11" fill="#FB923C" />
                    <ellipse cx="15" cy="55" rx="3" ry="4" fill="#FED7AA" opacity="0.5" />
                  </g>
                  <g className={isDragging ? "animate-bounce" : ""} style={fruit(65, 50, 120)}>
                    <circle cx="35" cy="70" r="9" fill="#F97316" />
                    <ellipse cx="32" cy="67" rx="2.5" ry="3" fill="#FDBA74" opacity="0.4" />
                  </g>
                  <g className={isDragging ? "animate-bounce" : ""} style={fruit(-60, 70, 30)}>
                    <path d="M160 28 Q173 32, 177 48 Q179 64, 169 72 Q160 76, 151 72 Q141 64, 143 48 Q147 32, 160 28" fill="#DC2626" />
                    <ellipse cx="151" cy="49" rx="5" ry="8" fill="#FCA5A5" opacity="0.4" />
                    <ellipse cx="150" cy="46" rx="1.5" ry="2.5" fill="#FDE047" />
                    <ellipse cx="157" cy="54" rx="1.5" ry="2.5" fill="#FDE047" />
                    <ellipse cx="167" cy="52" rx="1.5" ry="2.5" fill="#FDE047" />
                    <ellipse cx="161" cy="64" rx="1.5" ry="2.5" fill="#FDE047" />
                    <ellipse cx="151" cy="59" rx="1.5" ry="2.5" fill="#FDE047" />
                    <path d="M160 28 Q160 18, 168 14 Q165 22, 160 28" fill="#92A086" />
                  </g>
                  <g className={isDragging ? "animate-bounce" : ""} style={fruit(-72, 68, 90)}>
                    <circle cx="175" cy="45" r="8" fill="#3B82F6" />
                    <circle cx="172" cy="42" r="2" fill="#93C5FD" opacity="0.6" />
                    <circle cx="167" cy="56" r="6" fill="#2563EB" />
                    <circle cx="165" cy="54" r="1.5" fill="#93C5FD" opacity="0.5" />
                    <circle cx="180" cy="58" r="5" fill="#3B82F6" />
                  </g>
                </g>
              )}

              {/* Speed lines while the motor runs */}
              {blending && (
                <g className="bz-bl-fx" stroke="#92A086" strokeWidth="2" strokeLinecap="round" style={{ animation: "bz-bl-flicker 120ms steps(2) infinite" }}>
                  <path d="M12 128 L4 126" />
                  <path d="M10 150 L1 150" />
                  <path d="M12 172 L4 174" />
                  <path d="M188 128 L196 126" />
                  <path d="M190 150 L199 150" />
                  <path d="M188 172 L196 174" />
                </g>
              )}

              {/* The rig: jar, lid, handle and base shake together on the base */}
              <g
                style={{
                  transformOrigin: "100px 230px",
                  animation: blending
                    ? "bz-bl-shake 110ms linear infinite"
                    : phase === "settle"
                      ? "bz-bl-settle 420ms ease-out both"
                      : undefined,
                }}
              >
                <path d={JAR} fill="#FFFFFF" stroke="#92A086" strokeWidth="2" />

                <g clipPath={`url(#bz-bl-jar-${uid})`}>
                  {/* Blade, drawn edge-on: flipping its width reads as spin */}
                  <g transform="translate(100 198)">
                    <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: blending ? "bz-bl-blade 90ms linear infinite" : undefined }}>
                      <rect x="-24" y="-2.5" width="48" height="5" rx="2.5" fill="#5f6e55" />
                    </g>
                    <circle r="4.5" fill="#5f6e55" />
                  </g>

                  {/* Liquid rises from the blade up while the colours mix */}
                  {phase !== "idle" && (
                    <rect
                      x="40"
                      y="90"
                      width="120"
                      height="120"
                      style={{
                        transformBox: "fill-box",
                        transformOrigin: "bottom",
                        animation: `bz-bl-fill ${BLEND_MS + DROP_MS}ms cubic-bezier(0.3, 0, 0.3, 1) both, bz-bl-mix ${BLEND_MS}ms linear ${DROP_MS}ms both`,
                      }}
                      opacity="0.85"
                    />
                  )}

                  {/* Vortex: chunks orbit on two axes, shrink as they are minced */}
                  {blending &&
                    CHUNKS.map((c, i) => (
                      <g key={i} style={{ transformBox: "fill-box", transformOrigin: "center", animation: `bz-bl-mince ${BLEND_MS}ms ease-in both` }}>
                        <g style={{ animation: `bz-bl-orbit-x ${c.x / 4}ms ease-in-out ${c.delay}ms infinite alternate` }}>
                          <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: `bz-bl-orbit-y ${c.y / 4}ms ease-in-out ${c.delay}ms infinite alternate` }}>
                            <circle cx="100" cy={c.cy} r={c.r} fill={c.fill} />
                          </g>
                        </g>
                      </g>
                    ))}

                  {/* Swirl arcs across the vortex */}
                  {blending && (
                    <g className="bz-bl-fx" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.55">
                      <path d="M68 162 Q100 150, 132 162" style={{ transformBox: "fill-box", transformOrigin: "center", animation: "bz-bl-blade 240ms linear infinite" }} />
                      <path d="M74 184 Q100 174, 126 184" style={{ transformBox: "fill-box", transformOrigin: "center", animation: "bz-bl-blade 180ms linear infinite reverse" }} />
                    </g>
                  )}
                </g>

                <path d="M60 90 L57 190" stroke="rgba(146,160,134,0.2)" strokeWidth="3" strokeLinecap="round" />
                <path d="M50 105 Q20 105, 20 135 L20 165 Q20 185, 40 185 L50 185" fill="none" stroke="#92A086" strokeWidth="10" strokeLinecap="round" />
                <path d="M50 105 Q25 105, 25 135 L25 165 Q25 180, 40 180 L50 180" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />

                {/* Lid: tipped open while waiting, clapped shut once fruit is in */}
                <g
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "left bottom",
                    transform: lidOn ? "none" : "translate(-2px, -9px) rotate(-8deg)",
                    transition: `transform 180ms cubic-bezier(0.5, 0, 0.9, 0.3) ${lidOn ? 260 : 0}ms`,
                  }}
                >
                  <rect x="50" y="76" width="100" height="10" rx="4" fill="#92A086" />
                  <rect x="90" y="69" width="20" height="8" rx="3" fill="#7A8A70" />
                </g>

                <rect x="60" y="210" width="80" height="20" rx="4" fill="#92A086" />
                <rect x="65" y="214" width="70" height="12" rx="3" fill="#7A8A70" />
                <circle cx="100" cy="220" r="3" fill={blending ? "#FDE047" : "#B8C4AC"} />
              </g>
            </svg>
          )}

          {/* Smoothie glass (shown when complete) */}
          {blendComplete && (
            <svg viewBox="0 0 160 200" className="w-40 h-52" style={{ animation: "glass-appear 0.5s ease-out forwards" }} aria-hidden>
              <rect x="95" y="10" width="6" height="120" rx="3" fill="#92A086" />
              <rect x="96.5" y="10" width="2" height="120" fill="#A8B89C" opacity="0.5" />
              <path d="M35 50 L30 160 Q30 175, 50 175 L110 175 Q130 175, 130 160 L125 50 Z" fill={`url(#bz-bl-smoothie-${uid})`} stroke="#92A086" strokeWidth="2" />
              <path d="M40 55 L37 155" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeLinecap="round" />
              <ellipse cx="80" cy="55" rx="45" ry="8" fill="#A8B89C" />
              <circle cx="65" cy="53" r="4" fill="#F97316" />
              <circle cx="85" cy="55" r="3" fill="#3B82F6" />
              <circle cx="95" cy="52" r="3.5" fill="#DC2626" />
              <ellipse cx="80" cy="45" rx="30" ry="12" fill="white" />
              <ellipse cx="70" cy="42" rx="15" ry="8" fill="#FAFAFA" />
              <ellipse cx="90" cy="43" rx="12" ry="7" fill="#F5F5F5" />
              <circle cx="80" cy="32" r="10" fill="#DC2626" />
              <ellipse cx="76" cy="28" rx="3" ry="4" fill="#FCA5A5" opacity="0.6" />
              <path d="M80 22 Q82 15, 88 12" stroke="#92A086" strokeWidth="2" fill="none" />
              <ellipse cx="89" cy="11" rx="4" ry="2" fill="#92A086" />
              <defs>
                <linearGradient id={`bz-bl-smoothie-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#B8C4AC" />
                  <stop offset="50%" stopColor="#92A086" />
                  <stop offset="100%" stopColor="#7A8A70" />
                </linearGradient>
              </defs>
            </svg>
          )}

          {/* Text */}
          <div className="mt-4 text-center">
            <h3 className={`text-xl font-bold transition-colors ${isBlending ? "text-[#5f6e55]" : blendComplete ? "text-[#5f6e55]" : "text-gray-800"}`}>
              {isBlending ? "Blending…" : blendComplete ? "🍹 Smoothie Served!" : "Drop files to upload"}
            </h3>
            <p className="mt-2 text-gray-500">
              {isBlending ? (
                "Give it a second, it's almost smooth"
              ) : blendComplete ? (
                "Your image is ready to use!"
              ) : (
                <>or <span className="text-[#5f6e55] font-semibold hover:underline">browse</span> to choose a file</>
              )}
            </p>
          </div>

          {/* Preview */}
          {blendComplete && previewUrl && (
            <div className="mt-5 p-3 bg-white rounded-lg shadow-md border border-[#92A086]/30">
              <p className="text-xs text-[#5f6e55] font-medium mb-2 text-center">📸 Your Image</p>
              <img src={previewUrl} alt="Uploaded preview" className="max-w-40 max-h-[100px] rounded-md object-cover mx-auto" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); resetUpload() }}
                className="mt-2 w-full py-1.5 px-3 text-xs font-medium text-[#5f6e55] bg-[#92A086]/10 hover:bg-[#92A086]/20 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#912c22]"
              >
                Change image
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bz-bl-drop {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          45% { transform: translate(calc(var(--dx) * 0.5), -14px) scale(0.95); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.45); opacity: 0; }
        }
        @keyframes bz-bl-shake {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-1.6px, 0.4px) rotate(-0.7deg); }
          50% { transform: translate(1.3px, -0.5px) rotate(0.6deg); }
          75% { transform: translate(-1px, -0.3px) rotate(-0.4deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes bz-bl-settle {
          0% { transform: rotate(0.9deg); }
          35% { transform: rotate(-0.6deg); }
          65% { transform: rotate(0.3deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes bz-bl-blade {
          0% { transform: scaleX(1); }
          50% { transform: scaleX(-1); }
          100% { transform: scaleX(1); }
        }
        @keyframes bz-bl-fill {
          0% { transform: scaleY(0); }
          20% { transform: scaleY(0.12); }
          100% { transform: scaleY(0.72); }
        }
        @keyframes bz-bl-mix {
          0% { fill: #F97316; }
          35% { fill: #F4905F; }
          70% { fill: #C2B48E; }
          100% { fill: #92A086; }
        }
        @keyframes bz-bl-orbit-x {
          from { transform: translateX(-30px); }
          to { transform: translateX(30px); }
        }
        @keyframes bz-bl-orbit-y {
          from { transform: translateY(-7px) scale(0.8); }
          to { transform: translateY(7px) scale(1.1); }
        }
        @keyframes bz-bl-mince {
          0% { transform: scale(1); opacity: 1; }
          80% { opacity: 0.8; }
          100% { transform: scale(0.25); opacity: 0; }
        }
        @keyframes bz-bl-flicker {
          0% { opacity: 1; }
          100% { opacity: 0.25; }
        }
        @keyframes glass-appear {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        /* Reduced motion: every animation jumps to its end, so the jar shows
           filled and still, nothing shakes or spins, and the glass just appears. */
        @media (prefers-reduced-motion: reduce) {
          .bz-bl *, .bz-bl *::before, .bz-bl *::after {
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            animation-delay: 0ms !important;
            transition-duration: 1ms !important;
            transition-delay: 0ms !important;
          }
          /* Speed lines and swirl arcs only mean something while moving. */
          .bz-bl .bz-bl-fx { display: none; }
        }
      `}</style>
    </div>
  )
}
