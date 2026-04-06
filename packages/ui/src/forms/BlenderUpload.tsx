import { useCallback, useState, useRef } from "react"

interface BlenderUploadProps {
  onFileSelect: (file: File, dataUrl: string) => void
  onError?: (message: string) => void
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
}

export function BlenderUpload({
  onFileSelect,
  onError,
  accept = ".jpg,.jpeg,.png",
  maxSizeMB = 1,
  disabled = false,
}: BlenderUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isBlending, setIsBlending] = useState(false)
  const [blendComplete, setBlendComplete] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")

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

      setIsBlending(true)
      setBlendComplete(false)
      setPreviewUrl("")

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setTimeout(() => {
          setIsBlending(false)
          setBlendComplete(true)
          setPreviewUrl(dataUrl)
          onFileSelect(file, dataUrl)
        }, 2000)
      }
      reader.onerror = () => {
        setIsBlending(false)
        onError?.("Failed to read file")
      }
      reader.readAsDataURL(file)
    },
    [disabled, maxSizeMB, onError, onFileSelect]
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

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      e.target.value = ""
    },
    [processFile]
  )

  const resetUpload = useCallback(() => {
    setBlendComplete(false)
    setPreviewUrl("")
  }, [])

  return (
    <div
      className={`relative overflow-hidden rounded-xl transition-all duration-300 ${isDragging ? "scale-[1.02]" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : blendComplete ? "cursor-default" : "cursor-pointer"}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
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

      <div
        className={`relative p-6 m-3 border-2 border-dashed rounded-lg transition-colors ${
          isDragging ? "border-[#92A086] bg-[#92A086]/5" : blendComplete ? "border-[#92A086]" : "border-gray-300"
        }`}
        style={{ background: "#FFFFFF" }}
      >
        <div className="flex flex-col items-center justify-center">

          {/* Blender SVG (hidden when complete) */}
          {!blendComplete && (
            <svg viewBox="0 0 200 260" className="w-44 h-56">
              {!isBlending && (
                <>
                  {/* Left fruits */}
                  <g>
                    <g className={isDragging ? "animate-bounce" : ""} style={{ animationDelay: "0s" }}>
                      <circle cx="25" cy="35" r="14" fill="#F97316" />
                      <ellipse cx="21" cy="31" rx="4" ry="5" fill="#FDBA74" opacity="0.5" />
                      <circle cx="25" cy="24" r="3" fill="#92A086" />
                    </g>
                    <g className={isDragging ? "animate-bounce" : ""} style={{ animationDelay: "0.1s" }}>
                      <circle cx="18" cy="58" r="11" fill="#FB923C" />
                      <ellipse cx="15" cy="55" rx="3" ry="4" fill="#FED7AA" opacity="0.5" />
                    </g>
                    <g className={isDragging ? "animate-bounce" : ""} style={{ animationDelay: "0.2s" }}>
                      <circle cx="35" cy="70" r="9" fill="#F97316" />
                      <ellipse cx="32" cy="67" rx="2.5" ry="3" fill="#FDBA74" opacity="0.4" />
                    </g>
                  </g>
                  {/* Right fruits */}
                  <g>
                    <g className={isDragging ? "animate-bounce" : ""} style={{ animationDelay: "0.15s" }}>
                      <path d="M160 28 Q173 32, 177 48 Q179 64, 169 72 Q160 76, 151 72 Q141 64, 143 48 Q147 32, 160 28" fill="#DC2626" />
                      <ellipse cx="151" cy="49" rx="5" ry="8" fill="#FCA5A5" opacity="0.4" />
                      <ellipse cx="150" cy="46" rx="1.5" ry="2.5" fill="#FDE047" />
                      <ellipse cx="157" cy="54" rx="1.5" ry="2.5" fill="#FDE047" />
                      <ellipse cx="167" cy="52" rx="1.5" ry="2.5" fill="#FDE047" />
                      <ellipse cx="161" cy="64" rx="1.5" ry="2.5" fill="#FDE047" />
                      <ellipse cx="151" cy="59" rx="1.5" ry="2.5" fill="#FDE047" />
                      <path d="M160 28 Q160 18, 168 14 Q165 22, 160 28" fill="#92A086" />
                    </g>
                    <g className={isDragging ? "animate-bounce" : ""} style={{ animationDelay: "0.3s" }}>
                      <circle cx="175" cy="45" r="8" fill="#3B82F6" />
                      <circle cx="172" cy="42" r="2" fill="#93C5FD" opacity="0.6" />
                      <circle cx="167" cy="56" r="6" fill="#2563EB" />
                      <circle cx="165" cy="54" r="1.5" fill="#93C5FD" opacity="0.5" />
                      <circle cx="180" cy="58" r="5" fill="#3B82F6" />
                    </g>
                  </g>
                </>
              )}

              {/* Blender jar */}
              <g>
                <path d="M55 85 L50 195 Q50 210, 70 210 L130 210 Q150 210, 150 195 L145 85 Z" fill="#FFFFFF" stroke="#92A086" strokeWidth="2" />
                <path d="M60 90 L57 190" stroke="rgba(146,160,134,0.2)" strokeWidth="3" strokeLinecap="round" />
                {isBlending && (
                  <g>
                    <path d="M54 130 L52 195 Q52 205, 70 205 L130 205 Q148 205, 148 195 L146 130 Z" fill="#92A086" opacity="0.7" />
                    <circle cx="75" cy="155" r="4" fill="#B8C4AC" opacity="0.8" style={{ animation: "blender-bubble1 1s ease-in-out infinite" }} />
                    <circle cx="100" cy="170" r="5" fill="#A8B89C" opacity="0.7" style={{ animation: "blender-bubble2 1.3s ease-in-out infinite" }} />
                    <circle cx="125" cy="150" r="3" fill="#C8D4BC" opacity="0.8" style={{ animation: "blender-bubble3 0.9s ease-in-out infinite" }} />
                    <circle cx="85" cy="180" r="3.5" fill="#B8C4AC" opacity="0.6" style={{ animation: "blender-bubble1 1.1s ease-in-out infinite" }} />
                    <circle cx="115" cy="163" r="4" fill="#A8B89C" opacity="0.7" style={{ animation: "blender-bubble2 1.4s ease-in-out infinite" }} />
                  </g>
                )}
                <path d="M50 105 Q20 105, 20 135 L20 165 Q20 185, 40 185 L50 185" fill="none" stroke="#92A086" strokeWidth="10" strokeLinecap="round" />
                <path d="M50 105 Q25 105, 25 135 L25 165 Q25 180, 40 180 L50 180" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
                <rect x="60" y="210" width="80" height="20" rx="4" fill="#92A086" />
                <rect x="65" y="214" width="70" height="12" rx="3" fill="#7A8A70" />
              </g>
            </svg>
          )}

          {/* Smoothie glass (shown when complete) */}
          {blendComplete && (
            <svg viewBox="0 0 160 200" className="w-40 h-52" style={{ animation: "glass-appear 0.5s ease-out forwards" }}>
              <rect x="95" y="10" width="6" height="120" rx="3" fill="#92A086" />
              <rect x="96.5" y="10" width="2" height="120" fill="#A8B89C" opacity="0.5" />
              <path d="M35 50 L30 160 Q30 175, 50 175 L110 175 Q130 175, 130 160 L125 50 Z" fill="url(#smoothieGradient)" stroke="#92A086" strokeWidth="2" />
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
                <linearGradient id="smoothieGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#B8C4AC" />
                  <stop offset="50%" stopColor="#92A086" />
                  <stop offset="100%" stopColor="#7A8A70" />
                </linearGradient>
              </defs>
            </svg>
          )}

          {/* Text */}
          <div className="mt-4 text-center">
            <h3 className={`text-xl font-bold transition-colors ${isBlending ? "text-[#7A8A70]" : blendComplete ? "text-[#92A086]" : "text-gray-800"}`}>
              {isBlending ? "Uploading..." : blendComplete ? "🍹 Smoothie Served!" : "Drop files to upload"}
            </h3>
            <p className="mt-2 text-gray-500">
              {isBlending ? (
                "Wait a moment, it's almost ready"
              ) : blendComplete ? (
                "Your image is ready to use!"
              ) : (
                <>or <span className="text-[#92A086] font-semibold hover:underline">browse</span> to choose a file</>
              )}
            </p>
          </div>

          {/* Preview */}
          {blendComplete && previewUrl && (
            <div className="mt-5 p-3 bg-white rounded-lg shadow-md border border-[#92A086]/30">
              <p className="text-xs text-[#92A086] font-medium mb-2 text-center">📸 Your Image</p>
              <img src={previewUrl} alt="Uploaded preview" className="max-w-40 max-h-[100px] rounded-md object-cover mx-auto" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); resetUpload() }}
                className="mt-2 w-full py-1.5 px-3 text-xs font-medium text-[#7A8A70] bg-[#92A086]/10 hover:bg-[#92A086]/20 rounded-md transition-colors"
              >
                Change image
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blender-bubble1 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-6px) scale(1.1); opacity: 0.5; }
        }
        @keyframes blender-bubble2 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-10px) scale(0.9); opacity: 0.4; }
        }
        @keyframes blender-bubble3 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-5px) scale(1.15); opacity: 0.5; }
        }
        @keyframes glass-appear {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
