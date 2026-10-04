import React, { useState } from 'react';
import { Heart, MessageSquare, ShieldCheck, Sparkles, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DailyMatchCard({ profile, onOpenChat, onSelectProfile }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);

  const photos = profile?.photos && profile.photos.length > 0 
    ? profile.photos 
    : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'];

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex < photos.length - 1) {
      setPhotoIndex(photoIndex + 1);
    } else {
      setPhotoIndex(0);
    }
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (photoIndex > 0) {
      setPhotoIndex(photoIndex - 1);
    } else {
      setPhotoIndex(photos.length - 1);
    }
  };

  const handleLikeToggle = () => {
    if (!liked) {
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
    }
    setLiked(!liked);
  };

  return (
    <div style={{ padding: '12px 16px 90px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }} className="animate-fade-in">
      
      {/* Background Subtle Gradient Glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '240px',
        background: 'radial-gradient(ellipse at top, rgba(255,59,48,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }}></div>

      {/* Top Banner Tagline Matching Template */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        zIndex: 5
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#09090B' }}>
          just <span style={{ padding: '2px 8px', background: '#F4F4F5', borderRadius: '8px', border: '1px solid #E4E4E7' }}>one</span> a day
        </div>
        <div style={{ fontSize: '0.8rem', color: '#FF3B30', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={14} />
          Curated Connection
        </div>
      </div>

      {/* Interactive Main Match Profile Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '30px',
        padding: '12px',
        boxShadow: '0 20px 48px -12px rgba(0,0,0,0.1)',
        border: '1px solid #F4F4F5',
        position: 'relative',
        zIndex: 5
      }}>
        
        {/* Main Photo Gallery Viewport */}
        <div 
          onClick={() => onSelectProfile(profile)}
          style={{
            position: 'relative',
            borderRadius: '24px',
            overflow: 'hidden',
            height: '350px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
          }}
        >
          <img 
            src={photos[photoIndex]} 
            alt={`${profile.name} photo ${photoIndex + 1}`} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s var(--ease-smooth)' }}
            loading="lazy"
          />

          {/* Photo Navigation Segment Bars */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            gap: '6px',
            zIndex: 10
          }}>
            {photos.map((_, idx) => (
              <div 
                key={idx} 
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: idx === photoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                  transition: 'background 0.25s var(--ease-smooth)'
                }}
              />
            ))}
          </div>

          {/* Prev/Next Photo Tap Zones */}
          <button 
            onClick={handlePrevPhoto}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(0,0,0,0.3)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              zIndex: 10
            }}
            aria-label="Previous photo"
          >
            <ChevronLeft size={20} />
          </button>

          <button 
            onClick={handleNextPhoto}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(0,0,0,0.3)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              zIndex: 10
            }}
            aria-label="Next photo"
          >
            <ChevronRight size={20} />
          </button>

          {/* Name & Age Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px 16px 14px',
            background: 'linear-gradient(to top, rgba(9, 9, 11, 0.88) 0%, transparent 100%)',
            color: '#FFFFFF',
            zIndex: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
                {profile.name}, {profile.age}
              </h2>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                background: '#10B981',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check size={14} />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '2px' }}>{profile.city}</div>
          </div>
        </div>

        {/* Tags & Bio */}
        <div style={{ padding: '16px 8px 12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {profile.tags && profile.tags.map((t, i) => (
              <span key={i} style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '6px 12px',
                background: '#F4F4F5',
                color: '#27272A',
                borderRadius: '12px',
                border: '1px solid #E4E4E7'
              }}>
                {t}
              </span>
            ))}
          </div>

          <p style={{ fontSize: '0.96rem', color: '#3F3F46', lineHeight: '1.5', marginBottom: '14px' }}>
            {profile.bio}
          </p>

          {/* Prompt Quote Box */}
          {profile.promptQuestion && (
            <div style={{
              background: 'linear-gradient(135deg, #FAF8F5 0%, #F4F4F5 100%)',
              borderRadius: '16px',
              padding: '14px 16px',
              border: '1.5px solid #E4E4E7',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {profile.promptQuestion}
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#09090B', marginTop: '4px' }}>
                "{profile.promptAnswer}"
              </div>
            </div>
          )}
        </div>

        {/* Like & Chat Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
          <button 
            onClick={handleLikeToggle} 
            className={`btn-secondary ${liked ? 'liked' : ''}`}
            style={{
              flex: 1,
              borderColor: liked ? '#FF3B30' : '#E4E4E7',
              color: liked ? '#FF3B30' : '#09090B',
              backgroundColor: liked ? '#FFF0F0' : '#FFFFFF',
              position: 'relative'
            }}
          >
            <Heart size={20} fill={liked ? '#FF3B30' : 'none'} color={liked ? '#FF3B30' : '#09090B'} className={showHeartPop ? 'animate-heart-pop' : ''} />
            <span>{liked ? 'Liked' : 'Send Like'}</span>
          </button>

          <button 
            onClick={() => onOpenChat(profile)} 
            className="btn-primary"
            style={{ flex: 1 }}
          >
            <MessageSquare size={18} />
            <span>Start Chat</span>
          </button>
        </div>

      </div>

      {/* Heart Explosion Pop Effect Overlay */}
      {showHeartPop && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255, 59, 48, 0.9)',
          boxShadow: '0 0 50px rgba(255, 59, 48, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          zIndex: 100,
          pointerEvents: 'none'
        }} className="animate-heart-pop">
          <Heart size={50} fill="#FFFFFF" />
        </div>
      )}

    </div>
  );
}
