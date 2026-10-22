import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  Palette, X, RotateCw, RotateCcw, Check, Sparkles, Keyboard, 
  MousePointer, ChevronLeft, ChevronRight 
} from 'lucide-react'
import { THEMES, ThemeOption, CATEGORIES, isLightColor } from '../lib/themes'

// Web Audio Synthesizer Engine
let audioCtxSingleton: AudioContext | null = null
const getAudioCtx = () => {
  if (typeof window === 'undefined') return null
  if (!audioCtxSingleton) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (AudioCtx) {
      audioCtxSingleton = new AudioCtx()
    }
  }
  if (audioCtxSingleton && audioCtxSingleton.state === 'suspended') {
    audioCtxSingleton.resume()
  }
  return audioCtxSingleton
}

const playRotarySound = () => {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(240, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.05)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(450, ctx.currentTime)

    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.06)
  } catch (e) {}
}

const playConfirmSound = () => {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const freqs = [130.81, 164.81, 196.00, 246.94]
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(600, ctx.currentTime)

      const startTime = ctx.currentTime + idx * 0.025
      gain.gain.setValueAtTime(0.001, startTime)
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.42)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.43)
    })
  } catch (e) {}
}

interface ThemePickerModalProps {
  isOpen: boolean
  onClose: () => void
  currentTheme: string
  onSelectTheme: (themeId: string) => void
}

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(2) // Default Gradient (Index 2)
  const [planetThemeIndex, setPlanetThemeIndex] = useState<number>(0)
  const [rotationAngle, setRotationAngle] = useState(0)
  const [wheelCooldown, setWheelCooldown] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const activeCategory = CATEGORIES[activeCategoryIndex]
  const currentCategoryThemes = THEMES.filter(t => t.category === activeCategory)
  const activeThemeObj = currentCategoryThemes[planetThemeIndex] || currentCategoryThemes[0] || THEMES[0]

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Sync theme when opening modal
  useEffect(() => {
    if (isOpen && currentTheme) {
      const foundIdx = THEMES.findIndex(t => t.id === currentTheme)
      if (foundIdx !== -1) {
        const found = THEMES[foundIdx]
        const catIdx = CATEGORIES.indexOf(found.category)
        const inCat = THEMES.filter(t => t.category === found.category)
        const inCatIdx = inCat.findIndex(t => t.id === currentTheme)
        if (catIdx !== -1 && inCatIdx !== -1) {
          setActiveCategoryIndex(catIdx)
          setPlanetThemeIndex(inCatIdx)
          setRotationAngle(-inCatIdx * 36)
        }
      }
    }
  }, [isOpen, currentTheme])

  const selectThemeInPlanet = (inCatIdx: number, playSound = true) => {
    let diff = inCatIdx - planetThemeIndex
    const total = 10
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total

    const newAngle = rotationAngle - diff * 36
    setPlanetThemeIndex(inCatIdx)
    setRotationAngle(newAngle)

    if (playSound) playRotarySound()
  }

  const nextPlanetWheel = () => {
    const nextCat = (activeCategoryIndex + 1) % CATEGORIES.length
    setActiveCategoryIndex(nextCat)
    setPlanetThemeIndex(0)
    setRotationAngle(0)
    playRotarySound()
  }

  const prevPlanetWheel = () => {
    const prevCat = (activeCategoryIndex - 1 + CATEGORIES.length) % CATEGORIES.length
    setActiveCategoryIndex(prevCat)
    setPlanetThemeIndex(0)
    setRotationAngle(0)
    playRotarySound()
  }

  const rotateRight = () => {
    const nextIdx = (planetThemeIndex + 1) % 10
    selectThemeInPlanet(nextIdx)
  }

  const rotateLeft = () => {
    const prevIdx = (planetThemeIndex - 1 + 10) % 10
    selectThemeInPlanet(prevIdx)
  }

  const handleApplyTheme = () => {
    if (activeThemeObj) {
      onSelectTheme(activeThemeObj.id)
    }
    playConfirmSound()
    onClose()
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) prevPlanetWheel()
        else nextPlanetWheel()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        rotateRight()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        rotateLeft()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleApplyTheme()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeCategoryIndex, planetThemeIndex, rotationAngle])

  const handleWheel = (e: React.WheelEvent) => {
    if (wheelCooldown) return
    if (e.deltaY > 0 || e.deltaX > 0) rotateRight()
    else if (e.deltaY < 0 || e.deltaX < 0) rotateLeft()
    setWheelCooldown(true)
    setTimeout(() => setWheelCooldown(false), 160)
  }

  if (!isOpen) return null

  const radius = isMobile ? 125 : 205
  const isPreviewLight = isLightColor(activeThemeObj?.bg || '')

  return createPortal(
    <div
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(5, 7, 12, 0.94)',
        backdropFilter: 'blur(24px)',
        padding: '16px',
        overflow: 'hidden',
        userSelect: 'none',
        color: '#ffffff',
      }}
    >
      {/* Background Ambient Glow */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.35,
          transition: 'all 0.7s ease',
          filter: 'blur(72px)',
          background: `radial-gradient(circle at center, ${activeThemeObj.primary} 0%, ${activeThemeObj.secondary} 45%, transparent 75%)`
        }}
      />

      {/* Top Header */}
      <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Palette size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
              FTEL Theme Vault ({THEMES.length} Themes)
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              4 Cụm Hành Tinh: ☀️ Light • 🌙 Dark • 🌈 Gradient • 🏛️ Classic
            </p>
          </div>
        </div>

        {/* Category Switcher Pills */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategoryIndex(idx)
                setPlanetThemeIndex(0)
                setRotationAngle(0)
                playRotarySound()
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                background: activeCategoryIndex === idx ? 'var(--primary, #76fe28)' : 'transparent',
                color: activeCategoryIndex === idx ? '#090d16' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#e2e8f0',
            cursor: 'pointer'
          }}
          title="Đóng (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Wheel Area */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '1100px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        {/* Prev Category Button */}
        <button
          onClick={prevPlanetWheel}
          style={{
            width: isMobile ? '44px' : '60px',
            height: isMobile ? '44px' : '60px',
            borderRadius: '20px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            zIndex: 30
          }}
          title="Cụm Theme Trước (Shift+Tab)"
        >
          <ChevronLeft size={isMobile ? 24 : 34} />
        </button>

        {/* Wheel Container */}
        <div style={{ position: 'relative', flex: 1, height: isMobile ? '380px' : '520px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Rotate Left */}
          <button
            onClick={rotateLeft}
            style={{
              position: 'absolute',
              left: isMobile ? '4px' : '20px',
              zIndex: 30,
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#818cf8',
              cursor: 'pointer'
            }}
            title="Xoay Trái (←)"
          >
            <RotateCcw size={20} />
          </button>

          {/* Orbit Circles */}
          <div style={{
            position: 'absolute',
            width: isMobile ? '270px' : '440px',
            height: isMobile ? '270px' : '440px',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            width: isMobile ? '210px' : '350px',
            height: isMobile ? '210px' : '350px',
            borderRadius: '9999px',
            border: '1px dashed rgba(255, 255, 255, 0.06)',
            pointerEvents: 'none'
          }} />

          {/* Rotating Planet Wheel */}
          <div
            style={{
              position: 'relative',
              width: isMobile ? '270px' : '440px',
              height: isMobile ? '270px' : '440px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `rotate(${rotationAngle}deg)`,
              transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          >
            {currentCategoryThemes.map((t, i) => {
              const angle = (i * 36) * (Math.PI / 180)
              const x = radius * Math.cos(angle)
              const y = radius * Math.sin(angle)
              const isSelected = planetThemeIndex === i
              const offset = isMobile ? 18 : 24
              const isNodeLight = isLightColor(t.bg)

              return (
                <button
                  key={t.id}
                  onClick={() => selectThemeInPlanet(i, true)}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${x}px - ${offset}px)`,
                    top: `calc(50% + ${y}px - ${offset}px)`,
                    transform: `rotate(${-rotationAngle}deg) ${isSelected ? 'scale(1.25)' : 'scale(1)'}`,
                    transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    backgroundColor: t.bg,
                    borderRadius: '9999px',
                    width: isMobile ? '36px' : '48px',
                    height: isMobile ? '36px' : '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 20px ${t.primary}` : '0 4px 10px rgba(0,0,0,0.5)',
                    border: isSelected ? '3px solid #ffffff' : isNodeLight ? '1px solid rgba(0,0,0,0.3)' : '1px solid rgba(255,255,255,0.2)',
                    zIndex: isSelected ? 25 : 10
                  }}
                  title={t.name}
                >
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: t.primary, border: '1px solid rgba(0,0,0,0.2)' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: t.secondary, border: '1px solid rgba(0,0,0,0.2)' }} />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Center Hub Preview Card */}
          <div
            onClick={handleApplyTheme}
            style={{
              position: 'absolute',
              width: isMobile ? '190px' : '260px',
              height: isMobile ? '190px' : '260px',
              borderRadius: '9999px',
              backgroundColor: activeThemeObj?.bg || '#090d16',
              border: isPreviewLight ? '3px solid #0f172a' : '3px solid rgba(255,255,255,0.3)',
              color: isPreviewLight ? '#0f172a' : '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: `0 10px 40px rgba(0,0,0,0.6), 0 0 30px ${activeThemeObj.primary}44`,
              transition: 'all 0.3s ease'
            }}
            title="Bấm vào đây để Áp Dụng Theme này"
          >
            <span style={{
              fontSize: '10px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: isPreviewLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
              marginBottom: '4px'
            }}>
              {activeCategory} Planet
            </span>

            <h3 style={{ fontSize: isMobile ? '13px' : '17px', fontWeight: 900, margin: '2px 0 4px 0', maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeThemeObj?.name}
            </h3>

            <p style={{ fontSize: isMobile ? '9px' : '11px', opacity: 0.8, margin: '0 0 8px 0', lineHeight: 1.3, maxHeight: '32px', overflow: 'hidden' }}>
              {activeThemeObj?.desc}
            </p>

            {/* Color Swatches */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: '6px',
                background: isPreviewLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
                fontSize: '9px',
                fontFamily: 'monospace',
                fontWeight: 700
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: activeThemeObj?.primary }} />
                {activeThemeObj?.primary}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: '6px',
                background: isPreviewLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
                fontSize: '9px',
                fontFamily: 'monospace',
                fontWeight: 700
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: activeThemeObj?.secondary }} />
                {activeThemeObj?.secondary}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '9999px',
              background: isPreviewLight ? '#0f172a' : '#ffffff',
              color: isPreviewLight ? '#ffffff' : '#090d16',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <Check size={14} /> Áp Dụng Theme
            </div>
          </div>

          {/* Rotate Right */}
          <button
            onClick={rotateRight}
            style={{
              position: 'absolute',
              right: isMobile ? '4px' : '20px',
              zIndex: 30,
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#818cf8',
              cursor: 'pointer'
            }}
            title="Xoay Phải (→)"
          >
            <RotateCw size={20} />
          </button>
        </div>

        {/* Next Category Button */}
        <button
          onClick={nextPlanetWheel}
          style={{
            width: isMobile ? '44px' : '60px',
            height: isMobile ? '44px' : '60px',
            borderRadius: '20px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            zIndex: 30
          }}
          title="Cụm Theme Tiếp Theo (Tab)"
        >
          <ChevronRight size={isMobile ? 24 : 34} />
        </button>
      </div>

      {/* Bottom Shortcuts / Legend Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '6px 20px',
        borderRadius: '9999px',
        fontSize: '11px',
        color: '#94a3b8',
        zIndex: 20
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Keyboard size={14} color="#818cf8" /> [Tab / Shift+Tab]: Đổi cụm
        </span>
        <span>•</span>
        <span>[← / →]: Xoay theme</span>
        <span>•</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MousePointer size={14} color="#818cf8" /> Cuộn chuột: Xoay tròn
        </span>
        <span>•</span>
        <span>[Enter]: Áp dụng</span>
      </div>
    </div>,
    document.body
  )
}
