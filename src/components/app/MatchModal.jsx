import React from 'react';
import { Heart, MessageSquare, X } from 'lucide-react';

export default function MatchModal({ matchProfile, onSendMessage, onClose, userProfile }) {
  if (!matchProfile) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.95) 0%, rgba(9, 9, 11, 0.98) 100%)',
      backdropFilter: 'blur(20px)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: '#FFFFFF',
      textAlign: 'center'
    }} className="animate-fade-in">
      
      {/* Background Haikei Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('/photos/haikei2 (1).png')`,
        backgroundSize: 'cover',
        opacity: 0.15,
        pointerEvents: 'none'
      }}></div>

      {/* Top Close Button */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '50%',
          color: '#FFFFFF'
        }}
        aria-label="Close match screen"
      >
        <X size={20} />
      </button>

      <h1 className="editorial-title" style={{ fontSize: '2.8rem', color: '#FFFFFF', fontWeight: 900, letterSpacing: '-0.8px', marginBottom: '8px' }}>
        It's a Match!
      </h1>

      <p style={{ fontSize: '1.02rem', color: '#A1A1AA', fontWeight: 500, maxWidth: '280px', marginBottom: '36px' }}>
        You and <span style={{ color: '#FFFFFF', fontWeight: 800 }}>{matchProfile.name}</span> liked each other!
      </p>

      {/* Dual Overlapping Circular Photo Portraits */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 40px', position: 'relative' }}>
        {/* User DP */}
        <div style={{
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '4px solid #FFFFFF',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          marginRight: '-20px',
          zIndex: 10
        }}>
          {userProfile?.photos?.[0] || userProfile?.photo ? (
            <img 
              src={userProfile?.photos?.[0] || userProfile?.photo} 
              alt={userProfile?.name || "Your portrait"} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.src = '/photos/cupidlogo.jpg'; }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '2.4rem' }}>
              {(userProfile?.name || 'C').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Center Glowing Heart Badge */}
        <div style={{
          position: 'absolute',
          zIndex: 30,
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: '#FF3B30',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(255, 59, 48, 0.8)',
          border: '3px solid #FFFFFF'
        }}>
          <Heart size={22} fill="#FFFFFF" />
        </div>

        {/* Match Profile DP */}
        <div style={{
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '4px solid #FFFFFF',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          marginLeft: '-20px',
          zIndex: 20
        }}>
          <img 
            src={matchProfile.photos[0]} 
            alt={matchProfile.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          onClick={() => onSendMessage(matchProfile)}
          className="btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}
        >
          <MessageSquare size={20} />
          Send a Message to {matchProfile.name}
        </button>

        <button 
          onClick={onClose}
          className="btn-secondary"
          style={{ width: '100%', padding: '14px', background: 'transparent', color: '#A1A1AA', border: '1.5px solid rgba(255,255,255,0.2)' }}
        >
          Keep Browsing
        </button>
      </div>

    </div>
  );
}
