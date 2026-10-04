import React, { useState } from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import { HOME_SWIPE_PROFILES } from '../../data/mockProfiles';

export default function LikesFeed({ onSelectProfile, onOpenChat }) {
  const [activeTab, setActiveTab] = useState('likes_you'); // 'likes_you' | 'you_liked'
  const [showEmptyState, setShowEmptyState] = useState(false);

  const likesYouProfiles = showEmptyState ? [] : HOME_SWIPE_PROFILES;
  const youLikedProfiles = showEmptyState ? [] : HOME_SWIPE_PROFILES.slice(1);

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#F5F3EF',
      overflow: 'hidden'
    }} className="animate-fade-in">
      
      {/* FIXED HAIKEI BACKGROUND GRAPHIC LAYER (Does NOT scroll!) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('/photos/haikei2 (2).png')`,
        backgroundSize: 'cover',
        opacity: 0.14,
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {/* SCROLLABLE INNER CONTENT CONTAINER */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 100px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h1 className="editorial-title" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 0 }}>
              Your Connections
            </h1>

            {/* Quick Demo Toggle for Empty State vs Active State */}
            <button 
              onClick={() => setShowEmptyState(!showEmptyState)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '10px',
                background: showEmptyState ? '#FF3B30' : '#E4E4E7',
                color: showEmptyState ? '#FFFFFF' : '#09090B'
              }}
            >
              {showEmptyState ? 'Show Likes' : 'Demo Empty State'}
            </button>
          </div>

          <p className="editorial-subtitle" style={{ marginBottom: '16px' }}>
            See authentic members who liked your profile and matches you've explored.
          </p>

          {/* Tab Selector: Likes You | You Liked */}
          <div style={{
            display: 'flex',
            background: '#E4E4E7',
            padding: '4px',
            borderRadius: '18px',
            gap: '4px'
          }}>
            <button 
              onClick={() => setActiveTab('likes_you')}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '14px',
                background: activeTab === 'likes_you' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'likes_you' ? '#09090B' : '#71717A',
                fontWeight: 800,
                fontSize: '0.88rem',
                boxShadow: activeTab === 'likes_you' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s var(--ease-spring)'
              }}
            >
              Likes You ({likesYouProfiles.length})
            </button>

            <button 
              onClick={() => setActiveTab('you_liked')}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '14px',
                background: activeTab === 'you_liked' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'you_liked' ? '#09090B' : '#71717A',
                fontWeight: 800,
                fontSize: '0.88rem',
                boxShadow: activeTab === 'you_liked' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s var(--ease-spring)'
              }}
            >
              You Liked ({youLikedProfiles.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* POPULATED STATE */}
          {!showEmptyState && activeTab === 'likes_you' && likesYouProfiles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {likesYouProfiles.map((profile) => (
                <div 
                  key={profile.id}
                  onClick={() => onSelectProfile(profile)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1.5px solid #E4E4E7',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'transform 0.25s var(--ease-spring)'
                  }}
                >
                  <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={profile.photos[0]} 
                      alt={profile.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: '#FF3B30',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Heart size={16} fill="#FFFFFF" />
                    </div>
                  </div>

                  <div style={{ padding: '14px 12px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#09090B' }}>
                      {profile.name}, {profile.age}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#71717A', fontWeight: 600, margin: '2px 0 10px' }}>
                      {profile.city}
                    </div>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(profile);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#FF3B30',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>Match & Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showEmptyState && activeTab === 'you_liked' && youLikedProfiles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {youLikedProfiles.map((profile) => (
                <div 
                  key={profile.id}
                  onClick={() => onSelectProfile(profile)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1.5px solid #E4E4E7',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={profile.photos[0]} 
                      alt={profile.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(9,9,11,0.7)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      Liked
                    </div>
                  </div>

                  <div style={{ padding: '14px 12px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#09090B' }}>
                      {profile.name}, {profile.age}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#71717A', fontWeight: 600, marginTop: '2px' }}>
                      {profile.city}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {(showEmptyState || (activeTab === 'likes_you' && likesYouProfiles.length === 0) || (activeTab === 'you_liked' && youLikedProfiles.length === 0)) && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '20px 10px 40px'
            }}>
              
              {/* Tilted Dual Card Graphic */}
              <div style={{
                position: 'relative',
                width: '260px',
                height: '240px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Card 1: Mahi */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '10px',
                  width: '140px',
                  height: '180px',
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '10px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                  transform: 'rotate(-10deg)',
                  zIndex: 1,
                  border: '1px solid #E4E4E7'
                }}>
                  <div style={{
                    background: '#F4F4F5',
                    padding: '4px 8px',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#09090B',
                    marginBottom: '6px',
                    textAlign: 'left'
                  }}>
                    we should definit...
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, textAlign: 'left', marginBottom: '6px' }}>Mahi</div>
                  <div style={{ height: '110px', borderRadius: '12px', overflow: 'hidden' }}>
                    <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80" alt="Mahi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '-10px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Heart size={16} fill="#09090B" stroke="#09090B" />
                  </div>
                </div>

                {/* Card 2: Aarna */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '10px',
                  width: '140px',
                  height: '180px',
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '10px',
                  boxShadow: '0 14px 36px rgba(0,0,0,0.1)',
                  transform: 'rotate(6deg)',
                  zIndex: 2,
                  border: '1px solid #E4E4E7'
                }}>
                  <div style={{
                    background: '#F4F4F5',
                    padding: '4px 8px',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#09090B',
                    marginBottom: '6px',
                    textAlign: 'left'
                  }}>
                    let's check it out!
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, textAlign: 'left', marginBottom: '6px' }}>Aarna</div>
                  <div style={{ height: '110px', borderRadius: '12px', overflow: 'hidden' }}>
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80" alt="Aarna" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    right: '-10px',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Heart size={18} fill="#09090B" stroke="#09090B" />
                  </div>
                </div>

              </div>

              {/* Headline */}
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#09090B', marginBottom: '10px', letterSpacing: '-0.4px' }}>
                Likes you get will appear here
              </h2>

              {/* Subtitle */}
              <p style={{ fontSize: '0.92rem', color: '#52525B', lineHeight: '1.45', maxWidth: '300px', marginBottom: '28px', fontWeight: 500 }}>
                Great photos and thoughtful prompts are what get people to Like you. Check out our What Works Guide for profile tips.
              </p>

              {/* Button */}
              <button className="btn-black-pill" style={{ width: 'auto', padding: '14px 28px' }}>
                See what works
              </button>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
