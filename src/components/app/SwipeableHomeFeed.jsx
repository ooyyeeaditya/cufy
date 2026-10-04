import React, { useState } from 'react';
import { Heart, X, Star, Zap, Sliders, Bell, Home, MapPin, Compass, GraduationCap, Award, RefreshCw, Mic, Play, Pause, Volume2 } from 'lucide-react';
import { HOME_SWIPE_PROFILES } from '../../data/mockProfiles';

export default function SwipeableHomeFeed({ 
  onOpenChat, 
  onSelectProfile, 
  onOpenFilters, 
  onOpenNotifications, 
  onOpenSettings,
  onTriggerMatch 
}) {
  const [deck, setDeck] = useState(HOME_SWIPE_PROFILES);
  const [glideClass, setGlideClass] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const currentProfile = deck[0];

  const handleNextProfile = (actionType) => {
    let animClass = '';
    if (actionType === 'pass') animClass = 'card-glide-left';
    else if (actionType === 'like') animClass = 'card-glide-right';
    else if (actionType === 'superlike') animClass = 'card-glide-up';
    else if (actionType === 'boost') animClass = 'animate-pulse';

    setGlideClass(animClass);
    setIsPlayingVoice(false);

    setTimeout(() => {
      const active = deck[0];
      setDeck(prev => prev.slice(1));
      setGlideClass('');

      if ((actionType === 'like' || actionType === 'superlike') && active && onTriggerMatch) {
        onTriggerMatch(active);
      }
    }, 360);
  };

  const handleResetDeck = () => {
    setDeck(HOME_SWIPE_PROFILES);
  };

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#F5F3EF',
      overflow: 'hidden'
    }} className="animate-fade-in">

      {/* FIXED HAIKEI ORGANIC BACKGROUND GRAPHIC LAYER (Does NOT scroll!) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('/photos/haikei2 (1).png')`,
        backgroundSize: 'cover',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {/* TOP HEADER BAR */}
      <div style={{
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(245, 243, 239, 0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 50,
        position: 'relative'
      }}>
        {/* Left: Official Cufy Logo Photo Badge */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/photos/cufylogo.jpg" 
            alt="cufy logo" 
            style={{ 
              height: '34px', 
              borderRadius: '8px', 
              objectFit: 'contain',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }} 
            loading="eager"
          />
        </div>

        {/* Right: Action Buttons (Sliders + Bell + CIRCULAR DP!) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sliders / Filter Button */}
          <button 
            onClick={onOpenFilters}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#E4E4E7',
              color: '#09090B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s var(--ease-spring)'
            }} 
            aria-label="Filter preferences"
          >
            <Sliders size={18} />
          </button>

          {/* Bell Notification Button */}
          <button 
            onClick={onOpenNotifications}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#E4E4E7',
              color: '#09090B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'transform 0.2s var(--ease-spring)'
            }} 
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#FF3B30'
            }}></span>
          </button>

          {/* User Profile Avatar Thumbnail - Clicking opens Settings */}
          <button 
            onClick={onOpenSettings}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              padding: 0,
              cursor: 'pointer'
            }}
            aria-label="User Profile & Settings"
          >
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80" 
              alt="User profile DP" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {currentProfile ? (
        <div style={{ flex: 1, position: 'relative', overflowY: 'auto', padding: '0 16px 170px', zIndex: 10 }}>
          
          {/* PROFILE SCROLL CONTAINER WITH SILKY SMOOTH CARD GLIDE ANIMATION */}
          <div key={currentProfile.id} className={glideClass} style={{ display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* HERO PORTRAIT CARD */}
            <div style={{
              position: 'relative',
              height: '510px',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0,0,0,0.1)',
              background: '#09090B'
            }}>
              <img 
                src={currentProfile.photos[0]} 
                alt={currentProfile.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="eager"
              />

              {/* Active Today Badge */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(9, 9, 11, 0.65)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                <span>{currentProfile.activeStatus || 'Active today'}</span>
              </div>

              {/* Vignette Text Overlay at Bottom of Photo */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '60px 20px 20px',
                background: 'linear-gradient(to top, rgba(9, 9, 11, 0.88) 0%, rgba(9, 9, 11, 0.45) 60%, transparent 100%)',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <h2 style={{ fontSize: '2.3rem', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  {currentProfile.name}, {currentProfile.age}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', opacity: 0.95, fontWeight: 600 }}>
                  <Home size={16} />
                  <span>{currentProfile.city}</span>
                </div>

                {currentProfile.intents && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', opacity: 0.9, fontWeight: 600, marginTop: '2px' }}>
                    <Compass size={16} />
                    <span>{currentProfile.intents.join(' • ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Name Sticky Scroll Label */}
            <div style={{ textAlign: 'center', paddingTop: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#09090B' }}>
                {currentProfile.name}
              </span>
            </div>

            {/* VOICE INTRO NOTE CARD (Interactive Audio Player) */}
            {currentProfile.voiceNote && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '20px 24px',
                border: '1.5px solid #E4E4E7',
                boxShadow: '0 6px 20px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <button 
                    onClick={() => setIsPlayingVoice(!isPlayingVoice)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#FF3B30',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 6px 18px rgba(255, 59, 48, 0.3)',
                      flexShrink: 0,
                      transition: 'transform 0.2s var(--ease-spring)'
                    }}
                    aria-label={isPlayingVoice ? 'Pause voice note' : 'Play voice note'}
                  >
                    {isPlayingVoice ? <Pause size={22} fill="#FFFFFF" /> : <Play size={22} fill="#FFFFFF" style={{ marginLeft: '2px' }} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF3B30', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mic size={14} />
                      <span>{currentProfile.voiceNote.title || 'Voice Intro'}</span>
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#09090B', marginTop: '2px' }}>
                      "{currentProfile.voiceNote.prompt}"
                    </div>
                    {/* Simulated Waveform Bars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '8px' }}>
                      {[12, 20, 14, 28, 16, 22, 10, 26, 18, 14, 22, 12, 18, 8].map((height, i) => (
                        <span 
                          key={i} 
                          style={{
                            width: '3px',
                            height: `${height}px`,
                            background: isPlayingVoice ? '#FF3B30' : '#D4D4D8',
                            borderRadius: '2px',
                            transition: 'all 0.2s ease',
                            animation: isPlayingVoice ? `pulse 0.6s infinite alternate ${i * 0.05}s` : 'none'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#71717A' }}>
                  {currentProfile.voiceNote.duration || '0:14'}
                </div>
              </div>
            )}

            {/* Intent Badges Card */}
            {currentProfile.intents && (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {currentProfile.intents.map((intent, idx) => (
                  <div key={idx} style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #E4E4E7',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: '#09090B',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
                  }}>
                    {intent}
                  </div>
                ))}
              </div>
            )}

            {/* Metadata Info List Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '20px 24px',
              border: '1.5px solid #E4E4E7',
              boxShadow: '0 6px 20px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                <Home size={20} style={{ color: '#09090B' }} />
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                  {currentProfile.city}, {currentProfile.country || 'India'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                <MapPin size={20} style={{ color: '#09090B' }} />
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                  {currentProfile.distance || '0 mi away'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                <Award size={20} style={{ color: '#09090B' }} />
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                  {currentProfile.zodiac || 'Virgo'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#09090B', width: '20px', textAlign: 'center' }}>📏</span>
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                  {currentProfile.height || "162 cm (5'3\")"}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <GraduationCap size={20} style={{ color: '#09090B' }} />
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                  {currentProfile.education || 'Master'}
                </span>
              </div>
            </div>

            {/* SECOND PROFILE PHOTO CARD */}
            {currentProfile.photos[1] && (
              <div style={{
                height: '460px',
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                border: '1.5px solid #E4E4E7'
              }}>
                <img 
                  src={currentProfile.photos[1]} 
                  alt={`${currentProfile.name} secondary portrait`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* BIO & PROMPT CARD */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              border: '1.5px solid #E4E4E7',
              boxShadow: '0 6px 20px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF3B30', textTransform: 'uppercase', marginBottom: '6px' }}>
                {currentProfile.promptQuestion || 'Ideal Sunday Morning'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B', lineHeight: '1.3' }}>
                "{currentProfile.promptAnswer || currentProfile.bio}"
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Empty Deck State */
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 20px',
          zIndex: 10
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: '#FFF0F0',
            color: '#FF3B30',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Award size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '6px' }}>All Caught Up!</h2>
          <p style={{ color: '#52525B', fontSize: '0.94rem', marginBottom: '24px', maxWidth: '280px' }}>
            You have reviewed all curated daily connections.
          </p>
          <button onClick={handleResetDeck} className="btn-primary" style={{ width: 'auto', padding: '12px 28px' }}>
            <RefreshCw size={18} />
            Review Profiles Again
          </button>
        </div>
      )}

      {/* FLOATING BOTTOM ACTION DOCK */}
      {currentProfile && (
        <div style={{
          position: 'absolute',
          bottom: '88px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 70,
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          padding: '10px 16px',
          borderRadius: '32px',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.12)'
        }}>
          {/* 1. Boost Button */}
          <button 
            onClick={() => handleNextProfile('boost')}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              background: '#09090B',
              color: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
              transition: 'transform 0.2s var(--ease-spring)'
            }}
            aria-label="Boost profile"
          >
            <Zap size={26} fill="#FF3B30" stroke="#FF3B30" />
          </button>

          {/* 2. Pass / Cross Button */}
          <button 
            onClick={() => handleNextProfile('pass')}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '22px',
              background: '#09090B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
              transition: 'transform 0.2s var(--ease-spring)'
            }}
            aria-label="Reject profile"
          >
            <X size={32} strokeWidth={2.8} />
          </button>

          {/* 3. Like Button */}
          <button 
            onClick={() => handleNextProfile('like')}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '22px',
              background: '#09090B',
              color: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
              transition: 'transform 0.2s var(--ease-spring)'
            }}
            aria-label="Like profile"
          >
            <Heart size={32} fill="#FF3B30" stroke="#FF3B30" />
          </button>

          {/* 4. Superlike Button */}
          <button 
            onClick={() => handleNextProfile('superlike')}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              background: '#93C5FD',
              color: '#09090B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(147, 197, 253, 0.4)',
              transition: 'transform 0.2s var(--ease-spring)'
            }}
            aria-label="Superlike profile"
          >
            <Star size={26} fill="#09090B" stroke="#09090B" />
          </button>
        </div>
      )}

    </div>
  );
}
