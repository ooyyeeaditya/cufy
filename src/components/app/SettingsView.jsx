import React, { useState } from 'react';
import { ArrowLeft, Edit2, Zap, ShieldCheck, Lock, ChevronRight, CheckCircle2, RotateCcw, UserX, X, Camera, Sparkles } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

export default function SettingsView({ userProfile, onOpenPrivacy, onOpenTerms, onLogout, onOpenAdmin }) {
  const [profileData, setProfileData] = useState({
    name: userProfile?.name || 'Aditya',
    gender: userProfile?.gender || 'Man',
    bio: userProfile?.bio || 'Architecture enthusiast, sourdough baker, and lover of spontaneous getaways.',
    promptQuestion: userProfile?.promptQuestion || 'Ideal Sunday Morning',
    promptAnswer: userProfile?.promptAnswer || 'Fresh pour-over coffee, listening to vinyl records, and long walk in the park.',
    height: userProfile?.height || "178 cm (5'10\")",
    city: userProfile?.city || 'Greater Noida',
    occupation: userProfile?.occupation || userProfile?.jobTitle || 'Product Designer',
    education: userProfile?.education || 'Bachelor',
    religion: userProfile?.religion || 'Agnostic',
    photos: userProfile?.photos || ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80']
  });

  const [profileScore, setProfileScore] = useState(37);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isBoostActive, setIsBoostActive] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSaveProfile = (updatedData) => {
    setProfileData({ ...profileData, ...updatedData });
    setProfileScore(100);
    showToast('Profile successfully updated! Profile strength now 100%.');
  };

  const handleBoost = () => {
    setIsBoostActive(true);
    showToast('⚡ Boost Activated! Your profile visibility is 10x for 24 hours.');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#09090B', letterSpacing: '-0.8px' }}>
              {profileData.name.toLowerCase()}
            </h1>
            {/* Verified Badge */}
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#A1A1AA',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem'
            }}>
              ✓
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
                {profileScore === 100 ? 'All-Star Profile' : 'Beginner profile'}
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: profileScore === 100 ? '#10B981' : '#B91C1C', margin: '4px 0 10px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {profileScore} <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>%</span>
              </div>
            </div>

            {/* User Thumbnail Avatar */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #FF3B30' }}>
                <img src={profileData.photos[0]} alt="Profile photo 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: '#F4F4F5', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ width: `${profileScore}%`, height: '100%', background: profileScore === 100 ? '#10B981' : '#B91C1C', borderRadius: '3px', transition: 'width 0.4s ease' }}></div>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#52525B', marginBottom: '18px', lineHeight: '1.4' }}>
            {profileScore === 100 ? 'Your profile is fully optimized for maximum matches!' : 'By improving your profile, you\'ll attract more Likes.'}
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
            {profileScore === 100 ? 'Edit Profile Details' : 'Increase your attractiveness'}
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
          border: '1px solid #E4E4E7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#09090B' }}>
              {isBoostActive ? 'Boost Active! ⚡' : 'My Boosts'}
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#52525B', margin: '4px 0 16px', maxWidth: '200px' }}>
              {isBoostActive ? 'Your profile is highlighted at top of feed for 24h' : 'Your visibility will skyrocket for 24h'}
            </p>
            <button 
              onClick={handleBoost}
              style={{
                padding: '10px 18px',
                background: isBoostActive ? '#FFF0F0' : '#F4F4F5',
                color: isBoostActive ? '#FF3B30' : '#09090B',
                fontSize: '0.85rem',
                fontWeight: 800,
                borderRadius: '12px',
                border: isBoostActive ? '1px solid #FF3B30' : 'none'
              }}
            >
              {isBoostActive ? 'Boosted ⚡' : 'Get a Boost'}
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

      {/* BOOST PURCHASE & ADMIN VERIFICATION MODAL */}
      {isBoostActive === 'pending' && (
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
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '6px', color: '#09090B' }}>⚡ Boost Purchase</h3>
            <p style={{ fontSize: '0.86rem', color: '#71717A', marginBottom: '16px' }}>
              Select a boost pack, pay via UPI, and upload your payment screenshot for admin verification.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[
                { title: '1 Boost', price: 149 },
                { title: '4 Boosts', price: 399 },
                { title: '15 Boosts', price: 799 }
              ].map((b, i) => (
                <div key={i} style={{ padding: '10px', borderRadius: '14px', border: '2px solid #FF3B30', background: '#FFF0F0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#09090B' }}>{b.title}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FF3B30', marginTop: '2px' }}>₹{b.price}</div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                window.location.href = `upi://pay?pa=aditya.378@superyes&pn=Cufy%20Boost&am=149&cu=INR`;
              }}
              className="btn-primary"
              style={{ width: '100%', marginBottom: '12px' }}
            >
              Pay ₹149 via UPI (aditya.378@superyes)
            </button>

            <label style={{
              display: 'block',
              padding: '12px',
              border: '2px dashed #CBD5E1',
              borderRadius: '16px',
              cursor: 'pointer',
              background: '#F9F8F6',
              marginBottom: '14px'
            }}>
              <Camera size={20} style={{ color: '#FF3B30', margin: '0 auto 4px' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#09090B' }}>Upload Payment Screenshot</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={() => {
                showToast('⚡ Boost Payment Proof submitted! Admin will verify and activate your boost.');
                setIsBoostActive(false);
              }} />
            </label>

            <button onClick={() => setIsBoostActive(false)} className="btn-secondary" style={{ width: '100%' }}>
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
