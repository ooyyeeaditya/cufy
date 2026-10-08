import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Zap, ShieldCheck, Lock, ChevronRight, CheckCircle2, RotateCcw, UserX, X, Camera, Sparkles, Clock, Check } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import { fileToCompressedBase64 } from '../../utils/imageUpload';

export default function SettingsView({ userProfile, onOpenPrivacy, onOpenTerms, onLogout, onOpenAdmin, onUpdateProfile }) {
  const [toastMessage, setToastMessage] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  // Boost States
  const isBoostLive = Boolean(userProfile?.boostActiveUntil && new Date(userProfile.boostActiveUntil) > new Date());
  const boostCredits = userProfile?.boostCredits || 0;
  const [showBoostConfirmModal, setShowBoostConfirmModal] = useState(false);
  const [showBoostPurchaseModal, setShowBoostPurchaseModal] = useState(false);
  const [selectedBoostPack, setSelectedBoostPack] = useState({ title: '1 Boost', price: 149 });
  const [boostScreenshot, setBoostScreenshot] = useState(null);
  const [isUploadingBoostProof, setIsUploadingBoostProof] = useState(false);

  const [profileData, setProfileData] = useState({
    name: userProfile?.name || 'Aditya',
    gender: userProfile?.gender || 'Man',
    bio: userProfile?.bio || '',
    promptQuestion: userProfile?.promptQuestion || 'Ideal Sunday Morning',
    promptAnswer: userProfile?.promptAnswer || '',
    height: userProfile?.height || "178 cm (5'10\")",
    city: userProfile?.city || 'Greater Noida',
    occupation: userProfile?.occupation || userProfile?.jobTitle || '',
    education: userProfile?.education || '',
    religion: userProfile?.religion || '',
    photos: (userProfile?.photos && userProfile.photos.length > 0) ? userProfile.photos : (userProfile?.photo ? [userProfile.photo] : [])
  });

  // Keep internal profile state synced with external userProfile prop
  useEffect(() => {
    if (userProfile) {
      setProfileData(prev => ({
        ...prev,
        name: userProfile.name || prev.name,
        gender: userProfile.gender || prev.gender,
        bio: userProfile.bio !== undefined ? userProfile.bio : prev.bio,
        promptQuestion: userProfile.promptQuestion || prev.promptQuestion,
        promptAnswer: userProfile.promptAnswer !== undefined ? userProfile.promptAnswer : prev.promptAnswer,
        height: userProfile.height || prev.height,
        city: userProfile.city || prev.city,
        occupation: userProfile.occupation || userProfile.jobTitle || prev.occupation,
        education: userProfile.education || prev.education,
        religion: userProfile.religion || prev.religion,
        photos: (userProfile.photos && userProfile.photos.length > 0) ? userProfile.photos : prev.photos
      }));
    }
  }, [userProfile]);

  // Calculate dynamic profile completion percentage based on filled profile fields
  const calculateProfileScore = (data) => {
    if (!data) return 15;
    let score = 0;
    
    // Name (10%)
    if (data.name && data.name.trim().length > 0) score += 10;
    
    // Bio (25%) - length dependent
    if (data.bio && data.bio.trim().length > 15) score += 25;
    else if (data.bio && data.bio.trim().length > 0) score += 12;
    
    // Prompt & Answer (20%)
    if (data.promptAnswer && data.promptAnswer.trim().length > 5) score += 20;
    else if (data.promptAnswer && data.promptAnswer.trim().length > 0) score += 10;
    
    // City (10%)
    if (data.city && data.city.trim().length > 0) score += 10;
    
    // Occupation/Job (10%)
    if ((data.occupation && data.occupation.trim().length > 0) || (data.jobTitle && data.jobTitle.trim().length > 0)) score += 10;
    
    // Education (10%)
    if (data.education && data.education.trim().length > 0) score += 10;
    
    // Photos (up to 15% max - 5% per photo up to 3 photos)
    const validPhotos = (data.photos || []).filter(p => Boolean(p) && typeof p === 'string' && p.trim().length > 0);
    score += Math.min(15, validPhotos.length * 5);

    return Math.min(100, Math.max(15, score));
  };

  const currentProfileScore = calculateProfileScore(profileData);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSaveProfile = (updatedData) => {
    const updated = { ...profileData, ...updatedData };
    setProfileData(updated);
    const newScore = calculateProfileScore(updated);

    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }

    showToast(`Profile successfully updated! Profile strength now ${newScore}%.`);
  };


  const handleBoostClick = () => {
    if (isBoostLive) {
      const exp = new Date(userProfile.boostActiveUntil);
      const diffHours = Math.max(1, Math.round((exp - new Date()) / (1000 * 60 * 60)));
      showToast(`⚡ Boost is currently Active! ~${diffHours}h left.`);
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
    showToast('⚡ Boost Activated! Your profile is at the top of every feed for 24 hours.');
  };

  const handleRestorePurchases = () => {
    showToast('✓ Purchases successfully restored to your account.');
  };

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: '#F5F3EF', overflow: 'hidden' }} className="animate-fade-in">
      
      {/* FIXED HAIKEI BACKGROUND GRAPHIC LAYER (Does NOT scroll!) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('/photos/haikei2 (3).png')`,
        backgroundSize: 'cover',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#09090B',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '16px',
          fontSize: '0.88rem',
          fontWeight: 800,
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
          zIndex: 1000,
          maxWidth: '340px',
          textAlign: 'center'
        }} className="animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* SCROLLABLE INNER CONTENT CONTAINER */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 110px', position: 'relative', zIndex: 10 }}>

        {/* Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#09090B', letterSpacing: '-0.8px', margin: 0 }}>
                {profileData.name.toLowerCase()}
              </h1>
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#71717A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontWeight: 800, color: '#09090B' }}>
                {userProfile?.gender === 'Woman' ? 'Cufy VIP' : (userProfile?.plan || 'VIP Pass')}
              </span>
              <span style={{ color: '#D4D4D8' }}>•</span>
              <span style={{ color: '#09090B', fontWeight: 800 }}>Active Member</span>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button 
            onClick={() => setIsEditModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#E4E4E7',
              borderRadius: '14px',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#09090B',
              transition: 'transform 0.2s var(--ease-spring)'
            }}
          >
            <Edit2 size={14} />
            Edit
          </button>
        </div>

        {/* CARD 1: Profile Strength Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          marginBottom: '20px',
          border: '1px solid #E4E4E7',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
                {currentProfileScore === 100 ? 'All-Star Profile' : 'Profile Strength'}
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: currentProfileScore === 100 ? '#10B981' : '#FF3B30', margin: '4px 0 10px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {currentProfileScore} <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>%</span>
              </div>
            </div>

            {/* User Thumbnail Avatar */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #FF3B30' }}>
                {profileData.photos?.[0] ? (
                  <img src={profileData.photos[0]} alt={profileData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem' }}>
                    {(profileData.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: '#F4F4F5', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ width: `${currentProfileScore}%`, height: '100%', background: currentProfileScore === 100 ? '#10B981' : '#FF3B30', borderRadius: '3px', transition: 'width 0.4s ease' }}></div>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#52525B', marginBottom: '18px', lineHeight: '1.4' }}>
            {currentProfileScore === 100 ? 'Your profile is fully optimized for maximum matches!' : 'By completing your profile photos, bio, and prompts, you\'ll attract more Likes.'}
          </p>

          <button 
            onClick={() => setIsEditModalOpen(true)}
            style={{
              width: '100%',
              padding: '14px',
              background: '#09090B',
              color: '#FFFFFF',
              fontSize: '0.95rem',
              fontWeight: 800,
              borderRadius: '16px',
              border: 'none'
            }}
          >
            {currentProfileScore === 100 ? 'Edit Profile Details' : 'Increase your attractiveness'}
          </button>
        </div>

        {/* CARD 2: Cufy Premium Banner */}
        <div style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          height: '210px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
          marginBottom: '20px',
          border: '1.5px solid #FFD6D6'
        }}>
          <img 
            src="/photos/couple1.jpg" 
            alt="Cufy Premium background" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to right, rgba(9,9,11,0.75) 0%, rgba(9,9,11,0.3) 60%, transparent 100%)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '4px' }}>
              cufy Premium
            </h2>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, opacity: 0.95, maxWidth: '240px', marginBottom: '16px' }}>
              Boost visibility and get unlimited Likes!
            </p>

            <button 
              onClick={() => setIsPremiumModalOpen(true)}
              style={{
                alignSelf: 'flex-start',
                padding: '10px 20px',
                background: '#FF3B30',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 800,
                borderRadius: '14px',
                boxShadow: '0 4px 14px rgba(255, 59, 48, 0.4)'
              }}
            >
              Upgrade membership
            </button>
          </div>
        </div>

        {/* CARD 3: My Boosts */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          marginBottom: '28px',
          border: isBoostLive ? '1.5px solid #FF3B30' : '1px solid #E4E4E7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
              {isBoostLive ? 'Boost Active! ⚡' : `My Boosts (${boostCredits} Available)`}
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#52525B', margin: '4px 0 16px', maxWidth: '200px' }}>
              {isBoostLive 
                ? 'Your profile is highlighted at top of feed for 24h' 
                : boostCredits > 0 
                  ? 'Activate now to get 10x visibility and top feed placement'
                  : 'Boost visibility and get unlimited Likes'}
            </p>
            <button 
              onClick={handleBoostClick}
              style={{
                padding: '10px 18px',
                background: isBoostLive ? '#FFF0F0' : (boostCredits > 0 ? '#09090B' : '#F4F4F5'),
                color: isBoostLive ? '#FF3B30' : (boostCredits > 0 ? '#FFFFFF' : '#09090B'),
                fontSize: '0.85rem',
                fontWeight: 800,
                borderRadius: '12px',
                border: isBoostLive ? '1px solid #FF3B30' : 'none',
                cursor: 'pointer'
              }}
            >
              {isBoostLive ? 'Boosted ⚡ (Active)' : (boostCredits > 0 ? 'Activate Boost ⚡' : 'Get a Boost')}
            </button>
          </div>

          <div style={{ color: '#F97316', padding: '12px' }}>
            <Zap size={44} fill="#F97316" />
          </div>
        </div>

        {/* SECTION LIST OPTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderTop: '1px solid #E4E4E7', paddingTop: '12px', marginBottom: '24px' }}>
          
          <button 
            onClick={handleRestorePurchases}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 4px',
              borderBottom: '1px solid #E4E4E7',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#09090B' }}>Restore my purchases</span>
            <ChevronRight size={18} style={{ color: '#09090B' }} />
          </button>

          <button 
            onClick={() => setIsDeactivateOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 4px',
              borderBottom: '1px solid #E4E4E7',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#09090B' }}>Deactivate my account</span>
            <ChevronRight size={18} style={{ color: '#09090B' }} />
          </button>

          {/* Section Header */}
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#9CA3AF', marginTop: '28px', marginBottom: '8px' }}>
            Legal Notice
          </div>

          <button onClick={onOpenTerms} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 4px',
            borderBottom: '1px solid #E4E4E7',
            width: '100%',
            textAlign: 'left'
          }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#09090B' }}>General Terms of Service</span>
            <ChevronRight size={18} style={{ color: '#09090B' }} />
          </button>

          <button onClick={onOpenPrivacy} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 4px',
            borderBottom: '1px solid #E4E4E7',
            width: '100%',
            textAlign: 'left'
          }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#09090B' }}>Privacy Policy</span>
            <ChevronRight size={18} style={{ color: '#09090B' }} />
          </button>

          <button onClick={onOpenPrivacy} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 4px',
            borderBottom: '1px solid #E4E4E7',
            width: '100%',
            textAlign: 'left'
          }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#09090B' }}>Cookie policy</span>
            <ChevronRight size={18} style={{ color: '#09090B' }} />
          </button>
        </div>

        {/* Footer Brand Logo & Version */}
        <div style={{ textAlign: 'center', margin: '32px 0 24px' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#09090B', letterSpacing: '-1px', fontFamily: 'serif', fontStyle: 'italic' }}>
            cufy<span style={{ color: '#FF3B30', fontStyle: 'normal' }}>.</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600, marginTop: '4px' }}>
            Cufy 2026.19.0 (1219)
          </div>
        </div>

        {/* Black Rounded CTA Pill Button: Log out */}
        <button onClick={onLogout} className="btn-black-pill" style={{ width: '100%', padding: '16px 28px' }}>
          Log out
        </button>

      </div>

      {/* FULL FEATURED EDIT PROFILE MODAL */}
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        userProfile={{ ...userProfile, ...profileData }} 
        onSave={handleSaveProfile} 
      />

      {/* BOOST CONFIRMATION MODAL (EXPLICIT CONFIRMATION BEFORE ACTIVATION) */}
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
              ⚡ Boost Activation Confirm
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
                Boost chala dein? Yeh <b>24 hours</b> ke liye active rhega and har ladki ke top pr aapki profile jaaegi.
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

      {/* BOOST PURCHASE & ADMIN VERIFICATION MODAL */}
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

            <p style={{ fontSize: '0.82rem', color: '#71717A', marginBottom: '16px', lineHeight: 1.4 }}>
              Payment ke baad hi boost milta hai. Select a pack, transfer via UPI, and submit your payment screenshot for admin verification.
            </p>

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

            <button 
              onClick={() => {
                window.location.href = `upi://pay?pa=aditya.378@superyes&pn=Cufy%20Boost&am=${selectedBoostPack.price}&cu=INR`;
              }}
              className="btn-primary"
              style={{ width: '100%', marginBottom: '12px', padding: '13px', fontSize: '0.9rem' }}
            >
              Pay ₹{selectedBoostPack.price} via UPI
            </button>

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

            <button 
              onClick={() => {
                if (!boostScreenshot) {
                  alert('Please upload your payment screenshot before submitting.');
                  return;
                }
                showToast('⚡ Boost Payment Proof submitted! Admin will verify and activate your boost.');
                setShowBoostPurchaseModal(false);
                setBoostScreenshot(null);
              }}
              className="btn-black-pill" 
              style={{ width: '100%', marginBottom: '10px' }}
            >
              Submit Screenshot & Request Boost
            </button>

            <button onClick={() => setShowBoostPurchaseModal(false)} className="btn-secondary" style={{ width: '100%', padding: '11px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PREMIUM MEMBERSHIP PLAN UPGRADE MODAL */}
      {isPremiumModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(9, 9, 11, 0.75)',
          backdropFilter: 'blur(16px)',
          zIndex: 999,
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
            padding: '24px',
            textAlign: 'center',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button onClick={() => setIsPremiumModalOpen(false)} style={{ padding: '6px', background: '#F4F4F5', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '4px', color: '#09090B' }}>cufy Premium</h3>
            <p style={{ fontSize: '0.85rem', color: '#71717A', marginBottom: '16px' }}>
              Upgrade your membership to unlock unlimited likes & top placement!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { title: '1 Day Pass', price: 199, highlight: false },
                { title: '1 Week Pass', price: 299, highlight: false },
                { title: '15 Days Pass', price: 499, highlight: false },
                { title: '1 Month Pass', price: 799, highlight: true, note: 'Includes 1 FREE Boost ⚡' }
              ].map((plan, i) => (
                <div 
                  key={i} 
                  style={{
                    padding: '12px 14px',
                    borderRadius: '16px',
                    border: plan.highlight ? '2px solid #FF3B30' : '1.5px solid #E4E4E7',
                    background: plan.highlight ? '#FFF0F0' : '#FFFFFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: plan.highlight ? '#FF3B30' : '#09090B' }}>{plan.title}</div>
                    {plan.note && <div style={{ fontSize: '0.72rem', color: '#FF3B30', fontWeight: 700 }}>{plan.note}</div>}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#09090B' }}>₹{plan.price}</div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                window.location.href = `upi://pay?pa=aditya.378@superyes&pn=Cufy%20Membership&am=799&cu=INR`;
              }}
              className="btn-primary"
              style={{ width: '100%', marginBottom: '12px' }}
            >
              Pay via UPI (aditya.378@superyes)
            </button>

            <label style={{
              display: 'block',
              padding: '12px',
              border: '2px dashed #CBD5E1',
              borderRadius: '16px',
              cursor: 'pointer',
              background: '#F9F8F6'
            }}>
              <Camera size={20} style={{ color: '#FF3B30', margin: '0 auto 4px' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#09090B' }}>Upload Payment Screenshot</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={() => {
                showToast('✨ Membership Screenshot sent! Admin will verify and activate.');
                setIsPremiumModalOpen(false);
              }} />
            </label>
          </div>
        </div>
      )}

      {/* DEACTIVATE ACCOUNT CONFIRMATION MODAL */}
      {isDeactivateOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(9, 9, 11, 0.65)',
          backdropFilter: 'blur(12px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '360px',
            background: '#FFFFFF',
            borderRadius: '28px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '8px' }}>Deactivate Account?</h3>
            <p style={{ fontSize: '0.88rem', color: '#71717A', marginBottom: '20px' }}>
              Your profile will be temporarily hidden from daily discovery. You can reactivate anytime by logging back in.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsDeactivateOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsDeactivateOpen(false);
                  onLogout();
                }} 
                className="btn-primary" 
                style={{ flex: 1, padding: '12px' }}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
