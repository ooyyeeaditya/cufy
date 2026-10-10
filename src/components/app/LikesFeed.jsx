import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import { getSentLikes, getReceivedLikes, syncLikesFromCloud, recordUserLike } from '../../utils/likesManager';

export default function LikesFeed({ onSelectProfile, onOpenChat, userProfile, onGoExplore, onOpenSettings }) {
  const [activeTab, setActiveTab] = useState('likes_you'); // 'likes_you' | 'you_liked'
  const [likesYouProfiles, setLikesYouProfiles] = useState(() => getReceivedLikes(userProfile));
  const [youLikedProfiles, setYouLikedProfiles] = useState(() => getSentLikes(userProfile));

  // Load actual likes for the active user
  const reloadLikes = async () => {
    if (!userProfile?.email) return;
    const localSent = getSentLikes(userProfile);
    const localReceived = getReceivedLikes(userProfile);
    setYouLikedProfiles(localSent);
    setLikesYouProfiles(localReceived);

    try {
      const cloudLikes = await syncLikesFromCloud(userProfile);
      if (cloudLikes) {
        setYouLikedProfiles(cloudLikes.sent || localSent);
        setLikesYouProfiles(cloudLikes.received || localReceived);
      }
    } catch (e) {}
  };

  useEffect(() => {
    reloadLikes();

    // Listen to real-time like broadcasts across open tabs
    let channel;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('cufy_global_sync_v1');
        channel.onmessage = (event) => {
          if (event?.data?.type === 'CUFY_LIKE_SENT') {
            const userEmail = (userProfile?.email || '').toLowerCase().trim();
            if (event.data.receiverEmail === userEmail || event.data.senderEmail === userEmail) {
              reloadLikes();
            }
          }
        };
      } catch (e) {}
    }

    return () => {
      if (channel) {
        try { channel.close(); } catch (e) {}
      }
    };
  }, [userProfile?.email, userProfile?.id]);

  const handleMatchAndChat = async (profile) => {
    if (!profile) return;
    try {
      // Record like back to create mutual match
      await recordUserLike(userProfile, profile);
      // Refresh state
      reloadLikes();
    } catch (e) {}
    if (onOpenChat) {
      onOpenChat(profile);
    }
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
      
      {/* FIXED HAIKEI BACKGROUND GRAPHIC LAYER */}
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

      {/* INNER CONTENT CONTAINER */}
      <div style={{ flex: 1, padding: '16px 18px 85px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Minimal Compact Header */}
        <div style={{ marginBottom: '14px' }}>
          <h1 className="editorial-title" style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px' }}>
            Connections
          </h1>

          {/* Tab Selector: Likes You | You Liked */}
          <div style={{
            display: 'flex',
            background: '#E4E4E7',
            padding: '3px',
            borderRadius: '16px',
            gap: '4px'
          }}>
            <button 
              onClick={() => setActiveTab('likes_you')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '13px',
                background: activeTab === 'likes_you' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'likes_you' ? '#09090B' : '#71717A',
                fontWeight: 800,
                fontSize: '0.84rem',
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
                padding: '8px 12px',
                borderRadius: '13px',
                background: activeTab === 'you_liked' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'you_liked' ? '#09090B' : '#71717A',
                fontWeight: 800,
                fontSize: '0.84rem',
                boxShadow: activeTab === 'you_liked' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s var(--ease-spring)'
              }}
            >
              You Liked ({youLikedProfiles.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* LIKES YOU: POPULATED STATE */}
          {activeTab === 'likes_you' && likesYouProfiles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {likesYouProfiles.map((profile) => (
                <div 
                  key={profile.id || profile.name}
                  onClick={() => onSelectProfile(profile)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1.5px solid #E4E4E7',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={Array.isArray(profile.photos) && profile.photos[0] ? profile.photos[0] : (profile.photo || '/photos/front1.jpg')} 
                      alt={profile.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#FF3B30',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Heart size={14} fill="#FFFFFF" />
                    </div>
                  </div>

                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#09090B' }}>
                      {profile.name}, {profile.age || 24}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#71717A', fontWeight: 600, margin: '2px 0 8px' }}>
                      {profile.city || profile.location || 'Greater Noida'}
                    </div>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMatchAndChat(profile);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#FF3B30',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>Match & Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* YOU LIKED: POPULATED STATE */}
          {activeTab === 'you_liked' && youLikedProfiles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {youLikedProfiles.map((profile) => (
                <div 
                  key={profile.id || profile.name}
                  onClick={() => onSelectProfile(profile)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1.5px solid #E4E4E7',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={Array.isArray(profile.photos) && profile.photos[0] ? profile.photos[0] : (profile.photo || '/photos/front1.jpg')} 
                      alt={profile.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#09090B' }}>
                      {profile.name}, {profile.age || 24}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#71717A', fontWeight: 600, marginTop: '2px' }}>
                      {profile.city || profile.location || 'Greater Noida'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE FOR LIKES YOU */}
          {activeTab === 'likes_you' && likesYouProfiles.length === 0 && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '20px 16px 40px'
            }}>
              
              {/* Tilted Dual Card Graphic Stack */}
              <div style={{
                position: 'relative',
                width: '260px',
                height: '240px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Left Card: Mahi */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '10px',
                  width: '140px',
                  height: '180px',
                  background: '#FFFFFF',
                  borderRadius: '22px',
                  padding: '10px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                  transform: 'rotate(-10deg)',
                  zIndex: 1,
                  border: '1.5px solid #E4E4E7'
                }}>
                  <div style={{
                    background: '#F4F4F5',
                    padding: '4px 8px',
                    borderRadius: '10px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#09090B',
                    marginBottom: '6px',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    we should definit...
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, textAlign: 'left', marginBottom: '6px', color: '#09090B' }}>Mahi</div>
                  <div style={{ height: '110px', borderRadius: '14px', overflow: 'hidden' }}>
                    <img src="/photos/front3.jpg" alt="Mahi portrait" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    justifyContent: 'center',
                    border: '1px solid #E4E4E7'
                  }}>
                    <Heart size={16} fill="#09090B" stroke="#09090B" />
                  </div>
                </div>

                {/* Right Card: Aarna */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '10px',
                  width: '140px',
                  height: '180px',
                  background: '#FFFFFF',
                  borderRadius: '22px',
                  padding: '10px',
                  boxShadow: '0 14px 36px rgba(0,0,0,0.1)',
                  transform: 'rotate(6deg)',
                  zIndex: 2,
                  border: '1.5px solid #E4E4E7'
                }}>
                  <div style={{
                    background: '#F4F4F5',
                    padding: '4px 8px',
                    borderRadius: '10px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#09090B',
                    marginBottom: '6px',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    let's check it out!
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, textAlign: 'left', marginBottom: '6px', color: '#09090B' }}>Aarna</div>
                  <div style={{ height: '110px', borderRadius: '14px', overflow: 'hidden' }}>
                    <img src="/photos/front1.jpg" alt="Aarna portrait" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    justifyContent: 'center',
                    border: '1px solid #E4E4E7'
                  }}>
                    <Heart size={18} fill="#09090B" stroke="#09090B" />
                  </div>
                </div>

              </div>

              {/* Exact Headline from Screenshot 1 */}
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#09090B', marginBottom: '10px', letterSpacing: '-0.4px' }}>
                Likes you get will appear here
              </h2>

              {/* Exact Subtext from Screenshot 1 */}
              <p style={{ fontSize: '0.92rem', color: '#52525B', lineHeight: '1.45', maxWidth: '300px', marginBottom: '28px', fontWeight: 500 }}>
                Great photos and thoughtful prompts are what get people to Like you. Check out our What Works Guide for profile tips.
              </p>

              {/* CTA Button */}
              <button 
                onClick={onOpenSettings}
                className="btn-black-pill" 
                style={{ width: 'auto', padding: '14px 28px' }}
              >
                Boost Your Profile
              </button>

            </div>
          )}

          {/* EMPTY STATE FOR YOU LIKED */}
          {activeTab === 'you_liked' && youLikedProfiles.length === 0 && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '20px 16px 40px'
            }}>
              
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#FFFFFF',
                boxShadow: '0 10px 28px rgba(0,0,0,0.06)',
                border: '1.5px solid #E4E4E7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                color: '#FF3B30'
              }}>
                <Heart size={36} fill="#FF3B30" />
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#09090B', marginBottom: '10px', letterSpacing: '-0.4px' }}>
                You haven't liked anyone yet
              </h2>

              <p style={{ fontSize: '0.92rem', color: '#52525B', lineHeight: '1.45', maxWidth: '300px', marginBottom: '28px', fontWeight: 500 }}>
                Profiles you like while exploring or swiping will appear right here. Start browsing authentic singles near you!
              </p>

              <button 
                onClick={onGoExplore}
                className="btn-black-pill" 
                style={{ width: 'auto', padding: '14px 28px' }}
              >
                Start Exploring
              </button>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
