import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Star, Zap, Sliders, Bell, Home, MapPin, Compass, GraduationCap, Award, RefreshCw, Mic, Play, Pause, Volume2, Camera, Check, Briefcase, Wine, Cigarette, Info } from 'lucide-react';
import { getProfilesForUser, HOME_SWIPE_PROFILES } from '../../data/mockProfiles';
import { fetchAllCloudUsers } from '../../lib/cloudSync';
import { fileToCompressedBase64 } from '../../utils/imageUpload';

export default function SwipeableHomeFeed({ 
  onOpenChat, 
  onSelectProfile, 
  onOpenFilters, 
  onOpenNotifications, 
  onOpenSettings,
  onTriggerMatch,
  onLikeProfile,
  userProfile,
  onUpdateProfile,
  activeFilters
}) {
  const [deck, setDeck] = useState(() => getProfilesForUser(userProfile, [], activeFilters));
  const [isLoadingDeck, setIsLoadingDeck] = useState(false);
  const [glideClass, setGlideClass] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef(null);

  const handleToggleVoice = (audioUrl) => {
    if (!audioUrl) return;
    if (isPlayingVoice) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingVoice(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingVoice(false);
      audio.onerror = (err) => {
        console.warn('Audio play error:', err);
        setIsPlayingVoice(false);
      };
      audio.play()
        .then(() => setIsPlayingVoice(true))
        .catch((err) => {
          console.warn('Audio play failed:', err);
          setIsPlayingVoice(false);
        });
    }
  };

  // Boost States & Flow
  const [showBoostConfirmModal, setShowBoostConfirmModal] = useState(false);
  const [showBoostPurchaseModal, setShowBoostPurchaseModal] = useState(false);
  const [boostToast, setBoostToast] = useState('');
  const [boostScreenshot, setBoostScreenshot] = useState(null);
  const [isUploadingBoostProof, setIsUploadingBoostProof] = useState(false);
  const [selectedBoostPack, setSelectedBoostPack] = useState({ title: '1 Boost', price: 149 });

  const isBoostLive = Boolean(userProfile?.boostActiveUntil && new Date(userProfile.boostActiveUntil) > new Date());
  const boostCredits = userProfile?.boostCredits || 0;

  // Cufy Like (1 per day limit + First time onboarding confirmation modal)
  const [showCufyLikeIntroModal, setShowCufyLikeIntroModal] = useState(false);
  const [showCufyLikeLimitModal, setShowCufyLikeLimitModal] = useState(false);
  const [cufyLikeHoursLeft, setCufyLikeHoursLeft] = useState(24);
  const [cufyLikeToast, setCufyLikeToast] = useState('');

  const handleStarClick = () => {
    if (!currentProfile) return;
    const userKey = (userProfile?.email || 'guest').toLowerCase().trim();
    const lastUsed = localStorage.getItem(`cufy_last_cufy_like_${userKey}`);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (lastUsed) {
      const diff = now - parseInt(lastUsed, 10);
      if (diff < oneDayMs) {
        const hoursRemaining = Math.max(1, Math.ceil((oneDayMs - diff) / (1000 * 60 * 60)));
        setCufyLikeHoursLeft(hoursRemaining);
        setShowCufyLikeLimitModal(true);
        return;
      }
    }

    const hasSeenIntro = localStorage.getItem(`cufy_seen_cufy_like_intro_${userKey}`);
    if (!hasSeenIntro) {
      setShowCufyLikeIntroModal(true);
      return;
    }

    executeCufyLike();
  };

  const executeCufyLike = () => {
    const userKey = (userProfile?.email || 'guest').toLowerCase().trim();
    localStorage.setItem(`cufy_last_cufy_like_${userKey}`, Date.now().toString());
    localStorage.setItem(`cufy_seen_cufy_like_intro_${userKey}`, 'true');
    setShowCufyLikeIntroModal(false);
    handleNextProfile('superlike');
    setCufyLikeToast(`⭐ Cufy Like sent! Pinned to top of their Likes.`);
    setTimeout(() => setCufyLikeToast(''), 3500);
  };

  const loadProfilesDeck = async () => {
    setIsLoadingDeck(true);
    try {
      const registeredUsers = await fetchAllCloudUsers();
      const profiles = getProfilesForUser(userProfile, registeredUsers, activeFilters);
      setDeck(profiles);
    } catch (err) {
      console.warn('Profile deck load error:', err);
      const fallback = getProfilesForUser(userProfile, [], activeFilters);
      setDeck(fallback);
    } finally {
      setIsLoadingDeck(false);
    }
  };

  useEffect(() => {
    loadProfilesDeck();
  }, [userProfile?.gender, userProfile?.interested_in, userProfile?.email, JSON.stringify(activeFilters)]);

  const handleZapClick = () => {
    if (isBoostLive) {
      const exp = new Date(userProfile.boostActiveUntil);
      const diffHours = Math.max(1, Math.round((exp - new Date()) / (1000 * 60 * 60)));
      setBoostToast(`⚡ Boost is currently Active! ~${diffHours}h left. Profile is at top of feed.`);
      setTimeout(() => setBoostToast(''), 3500);
      return;
    }

    if (boostCredits > 0) {
      setShowBoostConfirmModal(true);
    } else {
      setShowBoostPurchaseModal(true);
    }
  };

  const handleConfirmActivateBoost = () => {
    const activeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updated = {
      ...userProfile,
      boostActiveUntil: activeUntil,
      boostCredits: Math.max(0, boostCredits - 1)
    };
    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }
    setShowBoostConfirmModal(false);
    const targetText = userProfile?.gender === 'Woman' ? "guy's" : "girl's";
    setBoostToast(`⚡ Boost Activated! Your profile is at the top of every ${targetText} feed for 24 hours.`);
    setTimeout(() => setBoostToast(''), 4000);
  };

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

      if ((actionType === 'like' || actionType === 'superlike') && active) {
        if (onLikeProfile) {
          onLikeProfile(active, actionType === 'superlike');
        } else if (onTriggerMatch) {
          onTriggerMatch(active);
        }
      }
    }, 360);
  };

  const handleResetDeck = () => {
    loadProfilesDeck();
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
        {/* Left: Original Cufy Brand Typography Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '1.9rem', fontWeight: 900, fontFamily: 'serif', fontStyle: 'italic', color: '#09090B', letterSpacing: '-1.2px' }}>
            cufy<span style={{ color: '#FF3B30', fontStyle: 'normal' }}>.</span>
          </span>
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
              border: isBoostLive ? '2px solid #FF3B30' : '2px solid #FFFFFF',
              boxShadow: isBoostLive ? '0 0 12px rgba(255,59,48,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
              padding: 0,
              cursor: 'pointer',
              position: 'relative'
            }}
            aria-label="User Profile & Settings"
            title={userProfile?.name ? `${userProfile.name}'s Profile` : 'Settings'}
          >
            {userProfile?.photos?.[0] || userProfile?.photo ? (
              <img 
                src={userProfile?.photos?.[0] || userProfile?.photo} 
                alt={userProfile?.name || "User profile DP"} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' }}>
                {(userProfile?.name || 'C').charAt(0).toUpperCase()}
              </div>
            )}
            {isBoostLive && (
              <span style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#FF3B30', borderRadius: '50%', border: '1.5px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
                ⚡
              </span>
            )}
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
                    onClick={() => handleToggleVoice(currentProfile.voiceNote.audioUrl || currentProfile.voiceNoteUrl || currentProfile.voice_note_url)}
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
                      cursor: 'pointer',
                      border: 'none',
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
                      "{currentProfile.voiceNote.prompt || 'Listen to audio intro'}"
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
                  {currentProfile.voiceNote.duration || '0:15'}
                </div>
              </div>
            )}

            {/* BIO CARD */}
            {currentProfile.bio && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '22px 24px',
                border: '1.5px solid #E4E4E7',
                boxShadow: '0 6px 20px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  About Me
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#09090B', lineHeight: '1.5' }}>
                  {currentProfile.bio}
                </div>
              </div>
            )}

            {/* PROMPT 1 CARD */}
            {(currentProfile.prompt1Answer || currentProfile.promptAnswer) && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px',
                border: '1.5px solid #E4E4E7',
                boxShadow: '0 6px 20px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF3B30', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {currentProfile.prompt1 || currentProfile.promptQuestion || 'Together, we could...'}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#09090B', lineHeight: '1.35' }}>
                  "{currentProfile.prompt1Answer || currentProfile.promptAnswer}"
                </div>
              </div>
            )}

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
                  alt={`${currentProfile.name} secondary photo`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* PROMPT 2 CARD */}
            {currentProfile.prompt2Answer && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px',
                border: '1.5px solid #E4E4E7',
                boxShadow: '0 6px 20px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF3B30', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {currentProfile.prompt2 || 'I get along best with people who...'}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#09090B', lineHeight: '1.35' }}>
                  "{currentProfile.prompt2Answer}"
                </div>
              </div>
            )}

            {/* THIRD PROFILE PHOTO CARD */}
            {currentProfile.photos[2] && (
              <div style={{
                height: '460px',
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                border: '1.5px solid #E4E4E7'
              }}>
                <img 
                  src={currentProfile.photos[2]} 
                  alt={`${currentProfile.name} photo 3`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
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

              {currentProfile.hometown && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                  <MapPin size={20} style={{ color: '#09090B' }} />
                  <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                    From {currentProfile.hometown}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                <Compass size={20} style={{ color: '#09090B' }} />
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                  {currentProfile.distance || '4 km away'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                <Award size={20} style={{ color: '#09090B' }} />
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                  {currentProfile.religion || currentProfile.zodiac || 'Spiritual'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#09090B', width: '20px', textAlign: 'center' }}>📏</span>
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                  {currentProfile.height || "162 cm (5'3\")"}
                </span>
              </div>

              {currentProfile.education && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                  <GraduationCap size={20} style={{ color: '#09090B' }} />
                  <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                    {currentProfile.education}
                  </span>
                </div>
              )}

              {currentProfile.jobTitle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                  <Briefcase size={20} style={{ color: '#09090B' }} />
                  <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                    {currentProfile.jobTitle}
                  </span>
                </div>
              )}

              {currentProfile.drinking && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F4F4F5', paddingBottom: '14px' }}>
                  <Wine size={20} style={{ color: '#09090B' }} />
                  <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                    Drinks: {currentProfile.drinking}
                  </span>
                </div>
              )}

              {currentProfile.smoking && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Cigarette size={20} style={{ color: '#09090B' }} />
                  <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090B' }}>
                    Smoking: {currentProfile.smoking}
                  </span>
                </div>
              )}
            </div>

            {/* REMAINING PROFILE PHOTOS (4, 5, 6) */}
            {currentProfile.photos.slice(3).map((photoUrl, pIdx) => (
              <div key={pIdx} style={{
                height: '460px',
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                border: '1.5px solid #E4E4E7'
              }}>
                <img 
                  src={photoUrl} 
                  alt={`${currentProfile.name} photo ${pIdx + 4}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}

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
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px)',
          padding: '8px 14px',
          borderRadius: '999px',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.08)'
        }}>
          {/* 1. Boost Lightning Button */}
          <button 
            onClick={handleZapClick}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: isBoostLive ? '#FFF0F0' : '#F4F4F5',
              color: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isBoostLive ? '0 0 16px rgba(255,59,48,0.4)' : 'none',
              border: isBoostLive ? '2px solid #FF3B30' : '1px solid #E4E4E7',
              cursor: 'pointer',
              transition: 'transform 0.2s var(--ease-spring)'
            }}
            aria-label="Boost profile"
            title={isBoostLive ? "Boost is Live (24h)" : "Get a Profile Boost"}
          >
            <Zap size={22} fill="#FF3B30" stroke="#FF3B30" />
          </button>

          {/* 2. Pass / Cross Button */}
          <button 
            onClick={() => handleNextProfile('pass')}
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: '#FFFFFF',
              color: '#09090B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #E4E4E7',
              boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              transition: 'transform 0.2s var(--ease-spring)'
            }}
            aria-label="Reject profile"
          >
            <X size={28} strokeWidth={2.5} />
          </button>

          {/* 3. Like Button */}
          <button 
            onClick={() => handleNextProfile('like')}
            style={{
              width: '62px',
              height: '62px',
              borderRadius: '50%',
              background: '#09090B',
              color: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              boxShadow: '0 8px 24px rgba(9,9,11,0.22)',
              cursor: 'pointer',
              transition: 'transform 0.2s var(--ease-spring)'
            }}
            aria-label="Like profile"
          >
            <Heart size={30} fill="#FF3B30" stroke="#FF3B30" />
          </button>

          {/* 4. Superlike / Cufy Like Button */}
          <button 
            onClick={handleStarClick}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#FFFBEB',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #FCD34D',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
              cursor: 'pointer',
              transition: 'transform 0.2s var(--ease-spring)'
            }}
            aria-label="Cufy Like profile"
            title="Send Cufy Like (1 per day)"
          >
            <Star size={22} fill="#F59E0B" stroke="#F59E0B" />
          </button>
        </div>
      )}

      {/* CUFY LIKE FIRST-TIME CONFIRMATION POPUP MODAL (Exact Hinge Popup UI) */}
      {showCufyLikeIntroModal && (
        <div className="hinge-age-popup-overlay" style={{ zIndex: 99999 }}>
          <div className="hinge-age-popup-card">
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              background: '#FFFBEB',
              border: '2px solid #FCD34D',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Star size={28} fill="#F59E0B" stroke="#F59E0B" />
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 900, marginBottom: '8px', color: '#09090B' }}>
              Send a Cufy Like ⭐
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#52525B', lineHeight: '1.5', marginBottom: '24px' }}>
              You get <b>1 free Cufy Like every 24 hours</b>. When you send a Cufy Like, your profile is pinned directly to the very top of {currentProfile?.name ? `${currentProfile.name}'s` : "their"} Likes list so they notice you first!
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setShowCufyLikeIntroModal(false)} 
                className="btn-secondary"
                style={{ flex: 1, borderRadius: '24px' }}
              >
                Cancel
              </button>

              <button 
                type="button"
                onClick={executeCufyLike} 
                className="btn-black-pill"
                style={{ flex: 1 }}
              >
                Send Cufy Like
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUFY LIKE DAILY LIMIT REACHED MODAL (Exact Hinge Popup UI) */}
      {showCufyLikeLimitModal && (
        <div className="hinge-age-popup-overlay" style={{ zIndex: 99999 }}>
          <div className="hinge-age-popup-card">
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              background: '#FEF3C7',
              border: '2px solid #FCD34D',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Star size={28} fill="#F59E0B" stroke="#F59E0B" />
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 900, marginBottom: '8px', color: '#09090B' }}>
              Daily Limit Reached
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#52525B', lineHeight: '1.5', marginBottom: '24px' }}>
              You get <b>1 free Cufy Like per day</b>. Your next Cufy Like will be available in ~<b>{cufyLikeHoursLeft} hours</b>.
            </p>

            <button 
              type="button"
              onClick={() => setShowCufyLikeLimitModal(false)} 
              className="btn-black-pill"
              style={{ width: '100%' }}
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* FLOATING CUFY LIKE TOAST */}
      {cufyLikeToast && (
        <div style={{
          position: 'fixed',
          top: '76px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#09090B',
          color: '#FCD34D',
          padding: '12px 20px',
          borderRadius: '18px',
          fontSize: '0.85rem',
          fontWeight: 800,
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
          zIndex: 1000,
          maxWidth: '350px',
          textAlign: 'center',
          border: '1px solid rgba(252, 211, 77, 0.3)'
        }} className="animate-fade-in">
          {cufyLikeToast}
        </div>
      )}

      {/* FLOATING BOOST TOAST NOTIFICATION */}
      {boostToast && (
        <div style={{
          position: 'fixed',
          top: '76px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#09090B',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '18px',
          fontSize: '0.85rem',
          fontWeight: 800,
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
          zIndex: 1000,
          maxWidth: '350px',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.15)'
        }} className="animate-fade-in">
          {boostToast}
        </div>
      )}

      {/* BOOST CONFIRMATION MODAL (EXPLICIT USER CONFIRMATION BEFORE ACTIVATION) */}
      {showBoostConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(9, 9, 11, 0.78)',
          backdropFilter: 'blur(16px)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            background: '#FFFFFF',
            borderRadius: '28px',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            border: '1.5px solid #E4E4E7'
          }} className="animate-fade-in">
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#FFF0F0',
              color: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 20px rgba(255,59,48,0.2)'
            }}>
              <Zap size={34} fill="#FF3B30" />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#09090B', marginBottom: '8px' }}>
              ⚡ Confirm Profile Boost
            </h3>

            <div style={{
              background: '#F9F8F6',
              borderRadius: '16px',
              padding: '14px 16px',
              marginBottom: '20px',
              border: '1px solid #E4E4E7',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#09090B', lineHeight: '1.45', margin: 0 }}>
                Activate your profile boost? Your profile will be featured at the top of potential matches' feeds for <b>24 hours</b>.
              </p>
              <div style={{ fontSize: '0.75rem', color: '#71717A', marginTop: '6px', fontWeight: 600 }}>
                ✓ 1 Boost credit will be used ({boostCredits} available)
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={handleConfirmActivateBoost}
                className="btn-primary" 
                style={{ width: '100%', padding: '14px', fontSize: '0.92rem' }}
              >
                ⚡ Yes, Activate Boost (24h)
              </button>

              <button 
                onClick={() => setShowBoostConfirmModal(false)}
                className="btn-secondary" 
                style={{ width: '100%', padding: '12px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOST PURCHASE MODAL (PAYMENT REQUIRED BEFORE BOOST) */}
      {showBoostPurchaseModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(9, 9, 11, 0.78)',
          backdropFilter: 'blur(16px)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            background: '#FFFFFF',
            borderRadius: '28px',
            padding: '26px 22px',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            border: '1.5px solid #E4E4E7',
            maxHeight: '92vh',
            overflowY: 'auto'
          }} className="animate-fade-in">
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              background: '#FFF0F0',
              color: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Zap size={30} fill="#FF3B30" />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#09090B', marginBottom: '6px' }}>
              ⚡ Get a Profile Boost
            </h3>

            <p style={{ fontSize: '0.82rem', color: '#71717A', marginBottom: '16px', lineHeight: 1.45 }}>
              Select a boost package, make your payment via UPI, and submit the transaction receipt for admin verification.
            </p>

            {/* Pricing Packs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[
                { title: '1 Boost', price: 149 },
                { title: '4 Boosts', price: 399, popular: true },
                { title: '15 Boosts', price: 799 }
              ].map((b, i) => {
                const isSelected = selectedBoostPack.price === b.price;
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedBoostPack(b)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid #FF3B30' : '1.5px solid #E4E4E7',
                      background: isSelected ? '#FFF0F0' : '#FAFAFA',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#09090B' }}>{b.title}</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FF3B30', marginTop: '2px' }}>₹{b.price}</div>
                  </div>
                );
              })}
            </div>

            {/* UPI Deep Link Action Button */}
            <button 
              onClick={() => {
                window.location.href = `upi://pay?pa=aditya.378@superyes&pn=Cufy%20Boost&am=${selectedBoostPack.price}&cu=INR`;
              }}
              className="btn-primary" 
              style={{ width: '100%', padding: '13px', marginBottom: '12px', fontSize: '0.9rem' }}
            >
              Pay ₹{selectedBoostPack.price} via UPI
            </button>

            {/* Screenshot Upload Dropzone */}
            <label style={{
              display: 'block',
              padding: '14px',
              border: boostScreenshot ? '2px solid #10B981' : '2px dashed #CBD5E1',
              borderRadius: '16px',
              cursor: 'pointer',
              background: boostScreenshot ? '#F0FDF4' : '#F9F8F6',
              marginBottom: '14px',
              transition: 'all 0.2s ease'
            }}>
              {isUploadingBoostProof ? (
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#71717A' }}>Compressing screenshot...</span>
              ) : boostScreenshot ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#059669', fontWeight: 800, fontSize: '0.82rem' }}>
                  <Check size={16} /> Screenshot Selected ✓
                </div>
              ) : (
                <>
                  <Camera size={22} style={{ color: '#FF3B30', margin: '0 auto 4px' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#09090B', display: 'block' }}>Upload Payment Screenshot</span>
                  <span style={{ fontSize: '0.68rem', color: '#71717A', fontWeight: 500 }}>Tap to select transaction receipt</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      setIsUploadingBoostProof(true);
                      const base64 = await fileToCompressedBase64(file, 800, 0.72);
                      setBoostScreenshot(base64);
                    } catch (err) {
                      console.error('Boost screenshot error:', err);
                    } finally {
                      setIsUploadingBoostProof(false);
                    }
                  }
                }} 
              />
            </label>

            {/* Submit Proof to Admin */}
            <button 
              onClick={() => {
                if (!boostScreenshot) {
                  alert('Please upload your payment screenshot before submitting.');
                  return;
                }
                const reqObj = {
                  id: `boost_req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  userEmail: userProfile?.email || 'member@cufy.app',
                  userName: userProfile?.name || 'Member',
                  userGender: userProfile?.gender || 'Man',
                  userPhoto: (userProfile?.photos && userProfile.photos[0]) || userProfile?.photo || '',
                  packTitle: selectedBoostPack.title,
                  packPrice: selectedBoostPack.price,
                  screenshotUrl: boostScreenshot,
                  status: 'pending',
                  requestedAt: new Date().toISOString()
                };

                try {
                  const existingStr = localStorage.getItem('cufy_boost_requests');
                  const reqs = existingStr ? JSON.parse(existingStr) : [];
                  reqs.unshift(reqObj);
                  localStorage.setItem('cufy_boost_requests', JSON.stringify(reqs));
                } catch (e) {}

                setBoostToast('Boost payment proof submitted! Admin will verify and activate your boost.');
                setShowBoostPurchaseModal(false);
                setBoostScreenshot(null);
                setTimeout(() => setBoostToast(''), 4500);
              }}
              className="btn-black-pill" 
              style={{ width: '100%', marginBottom: '10px' }}
            >
              Submit Screenshot & Request Boost
            </button>

            <button 
              onClick={() => setShowBoostPurchaseModal(false)} 
              className="btn-secondary" 
              style={{ width: '100%', padding: '11px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
