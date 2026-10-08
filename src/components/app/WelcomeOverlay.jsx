import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield } from 'lucide-react';

export default function WelcomeOverlay({ userProfile, onClose }) {
  const [phase, setPhase] = useState(1); // 1: Haikei Splash ("cufy."), 2: Guidelines Interstitial
  const [isExiting, setIsExiting] = useState(false);

  // Auto-advance from Phase 1 (Splash) to Phase 2 after 2.5s (Slow & smooth transition)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase(2);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleFinish = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100%', height: '100%',
      zIndex: 2000,
      background: '#F5F3EF',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      opacity: isExiting ? 0 : 1,
      transition: 'opacity 0.45s ease-in-out'
    }}>

      {/* ========================================================================= */}
      {/* PHASE 1: ORGANIC HAIKEI SPLASH - "Welcome to Cufy." IN CENTER */}
      {/* ========================================================================= */}
      {phase === 1 && (
        <div 
          onClick={() => setPhase(2)}
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'pointer',
            overflow: 'hidden'
          }}
          className="animate-fade-in"
        >
          {/* Organic Haikei Background Coverage */}
          <img 
            src="/photos/haikei2 (1).png" 
            alt="Haikei background graphic"
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: 0.18,
              mixBlendMode: 'multiply',
              pointerEvents: 'none'
            }}
          />

          {/* Central Smooth Typography */}
          <div style={{ textAlign: 'center', zIndex: 10 }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#71717A',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              marginBottom: '10px'
            }} className="animate-slide-up-1">
              Welcome to
            </div>

            <h1 style={{
              fontSize: '3.8rem',
              fontWeight: 900,
              fontFamily: 'serif',
              fontStyle: 'italic',
              color: '#09090B',
              letterSpacing: '-2px',
              margin: 0,
              lineHeight: 1
            }} className="animate-slide-up-2">
              cufy<span style={{ color: '#FF3B30', fontStyle: 'normal' }}>.</span>
            </h1>

            <div style={{
              fontSize: '0.88rem',
              color: '#52525B',
              fontWeight: 600,
              marginTop: '16px',
              letterSpacing: '0.2px'
            }} className="animate-slide-up-3">
              Intentional & authentic connections
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 2: COMMUNITY VALUES INTERSTITIAL (MATCHES ONBOARDING SLIDES) */}
      {/* ========================================================================= */}
      {phase === 2 && (
        <div className="full-screen-interstitial animate-fade-in" style={{ position: 'relative', flex: 1, height: '100%' }}>
          
          {/* Edge-to-Edge Full Screen Image (Ananya Sharma photo /front1.jpg) */}
          <img 
            src="/photos/front1.jpg" 
            alt="Authentic connection portrait" 
            className="interstitial-bg-img" 
            loading="eager"
          />

          {/* Top Header Bar with Skip Button */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 30
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#09090B'
            }}>
              <Shield size={14} color="#FF3B30" />
              <span>Community Guidelines</span>
            </div>

            <button 
              onClick={handleFinish}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                color: '#09090B',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              Skip <ArrowRight size={14} />
            </button>
          </div>

          {/* Bottom Vignette Overlay Anchored at Bottom of Viewport */}
          <div className="interstitial-vignette-overlay">
            <h2 className="editorial-title animate-slide-up-1" style={{ fontSize: '2.1rem', fontWeight: 900, color: '#09090B', marginBottom: '8px' }}>
              Treat Everyone with Kindness & Respect.
            </h2>

            <p className="editorial-subtitle animate-slide-up-2" style={{ fontSize: '0.96rem', color: '#3F3F46', fontWeight: 500, maxWidth: '320px', marginBottom: '24px', lineHeight: '1.45' }}>
              Cufy is built on authentic connections. Be kind, keep conversations warm, and help us maintain a safe, welcoming environment for everyone.
            </p>

            {/* Black Rounded Pill CTA Button */}
            <button 
              onClick={handleFinish} 
              className="btn-black-pill animate-slide-up-3"
              style={{ width: '100%', padding: '16px', fontSize: '0.95rem', fontWeight: 900 }}
            >
              I Agree & Enter Cufy →
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
