import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, ShieldCheck, CheckCheck, Bell, MessageSquare } from 'lucide-react';
import { HOME_SWIPE_PROFILES } from '../../data/mockProfiles';
import { isMutualMatch } from '../../utils/likesManager';

export default function ChatDrawer({ matchProfile, onBack, userProfile, onKeyboardStateChange, onActiveThreadChange }) {
  const [userMatches, setUserMatches] = useState(() => {
    try {
      const saved = localStorage.getItem('cufy_user_matches');
      let matches = saved ? JSON.parse(saved) : [];
      return matches.filter(m => isMutualMatch(userProfile, m));
    } catch (e) { return []; }
  });

  // Chat Logs State - Safe initialization with persistent storage & fake message sanitization
  const [conversations, setConversations] = useState(() => {
    try {
      const savedStr = localStorage.getItem('cufy_conversations');
      const savedMatchesStr = localStorage.getItem('cufy_user_matches');
      let saved = savedStr ? JSON.parse(savedStr) : [];
      let matches = savedMatchesStr ? JSON.parse(savedMatchesStr) : [];

      // Clean existing threads: ONLY keep genuine mutual matches or Cufy Official!
      saved = saved
        .filter(c => c.id === 'cufy_official' || c.isOfficial || isMutualMatch(userProfile, c))
        .map(c => {
          if (c.id === 'cufy_official' || c.isOfficial) return c;
          const realMsgs = (c.messages || []).filter(m => 
            m.text !== 'Hey! Excited to connect with you on Cufy!' &&
            m.text !== 'That sounds fantastic! Let us meet up this Saturday.'
          );
          return {
            ...c,
            messages: realMsgs,
            lastMessage: realMsgs.length > 0 ? realMsgs[realMsgs.length - 1].text : `It's a Match! Say hi to ${c.name}`
          };
        });

      matches = matches.filter(m => isMutualMatch(userProfile, m));

      matches.forEach(m => {
        const threadId = (m.id || m.name).toLowerCase();
        if (!saved.some(c => c.id === threadId)) {
          const photoUrl = (m.photos && m.photos.length > 0) ? m.photos[0] : (m.photo || '/photos/front1.jpg');
          saved.unshift({
            id: threadId,
            name: m.name,
            photo: photoUrl,
            lastMessage: `It's a Match! Say hi to ${m.name}`,
            time: 'Just now',
            unread: false,
            badge: 'New Match',
            messages: [] // Real chats start clean with NO fake messages
          });
        }
      });

      // ALWAYS guarantee Cufy Official is present
      const officialIdx = saved.findIndex(c => c.id === 'cufy_official' || c.isOfficial);
      if (officialIdx < 0) {
        saved.unshift({
          id: 'cufy_official',
          name: 'Cufy Official ⚡',
          photo: '/photos/cufylogo.jpg',
          lastMessage: 'Welcome to Cufy! Official announcements, boost approvals & updates appear here.',
          time: 'Just now',
          unread: false,
          badge: 'Official',
          isOfficial: true,
          messages: [
            { 
              id: 1, 
              sender: 'them', 
              text: 'Welcome to Cufy! 🎉 Explore authentic profiles and connect. All platform announcements, profile boost approvals, and important notices will be sent right here.', 
              time: 'Just now' 
            }
          ]
        });
      } else {
        // Ensure Cufy Official is always at top or updated
        const [off] = saved.splice(officialIdx, 1);
        saved.unshift(off);
      }

      try { localStorage.setItem('cufy_conversations', JSON.stringify(saved)); } catch (e) {}
      return saved;
    } catch (e) {
      return [{
        id: 'cufy_official',
        name: 'Cufy Official ⚡',
        photo: '/photos/cufylogo.jpg',
        lastMessage: 'Welcome to Cufy! Official announcements, boost approvals & updates appear here.',
        time: 'Just now',
        unread: false,
        badge: 'Official',
        isOfficial: true,
        messages: [
          { 
            id: 1, 
            sender: 'them', 
            text: 'Welcome to Cufy! 🎉 Explore authentic profiles and connect. All platform announcements, profile boost approvals, and important notices will be sent right here.', 
            time: 'Just now' 
          }
        ]
      }];
    }
  });

  const [activeThreadId, setActiveThreadId] = useState(() => 
    (matchProfile && isMutualMatch(userProfile, matchProfile)) 
      ? (matchProfile.id || matchProfile.name).toLowerCase() 
      : null
  );
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Keyboard and Viewport tracking
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isVisualKeyboardOpen, setIsVisualKeyboardOpen] = useState(false);
  const isKeyboardActive = isInputFocused || isVisualKeyboardOpen;
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [viewportHeight, setViewportHeight] = useState(() => 
    typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : null
  );

  useEffect(() => {
    onKeyboardStateChange?.(isKeyboardActive);
  }, [isKeyboardActive]);

  useEffect(() => {
    onActiveThreadChange?.(activeThreadId);
  }, [activeThreadId]);

  // Lock document body scroll when single conversation view is active
  useEffect(() => {
    if (activeThreadId) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
      if (document.body) document.body.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [activeThreadId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleViewportResize = () => {
      setViewportHeight(vv.height);
      const isKeyboard = window.innerHeight - vv.height > 150;
      setIsVisualKeyboardOpen(isKeyboard);
      window.scrollTo(0, 0);
      if (document.body) document.body.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
    };
    vv.addEventListener('resize', handleViewportResize);
    vv.addEventListener('scroll', handleViewportResize);
    handleViewportResize();
    return () => {
      vv.removeEventListener('resize', handleViewportResize);
      vv.removeEventListener('scroll', handleViewportResize);
    };
  }, []);

  // Sync prop matchProfile if passed directly (ONLY IF MUTUAL MATCH!)
  useEffect(() => {
    if (matchProfile && matchProfile.name && isMutualMatch(userProfile, matchProfile)) {
      const threadId = (matchProfile.id || matchProfile.name).toLowerCase();
      const photoUrl = (matchProfile.photos && matchProfile.photos.length > 0) 
        ? matchProfile.photos[0] 
        : (matchProfile.photo || '/photos/front1.jpg');

      // Update conversations list
      setConversations(prev => {
        const existing = prev.find(c => c.id === threadId);
        let updated;
        if (!existing) {
          const newThread = {
            id: threadId,
            name: matchProfile.name,
            photo: photoUrl,
            lastMessage: `It's a Match! Say hi to ${matchProfile.name}`,
            time: 'Just now',
            unread: false,
            badge: 'New Match',
            messages: [] // NO fake automated message!
          };
          updated = [newThread, ...prev];
        } else {
          updated = prev;
        }
        try { localStorage.setItem('cufy_conversations', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      // Update user matches list
      setUserMatches(prev => {
        let updated;
        if (!prev.some(m => (m.id || m.name).toLowerCase() === threadId)) {
          updated = [matchProfile, ...prev];
        } else {
          updated = prev;
        }
        try { localStorage.setItem('cufy_user_matches', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      setActiveThreadId(threadId);
    }
  }, [matchProfile]);

  const currentThread = conversations.find(c => c.id === activeThreadId);

  // Auto scroll to latest message
  useEffect(() => {
    if (activeThreadId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThreadId, currentThread?.messages?.length, isKeyboardActive]);

  const handleSend = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!inputText.trim() || !activeThreadId) return;

    // Immediately keep input focused so keyboard does not close!
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === activeThreadId) {
          return {
            ...c,
            lastMessage: newMsg.text,
            time: 'Just now',
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      });
      try { localStorage.setItem('cufy_conversations', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    setInputText('');

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, 50);

    // ONLY auto-respond for Cufy Official channel! NEVER send fake replies from regular user matches
    if (activeThreadId === 'cufy_official') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyMsg = {
          id: Date.now() + 1,
          sender: 'them',
          text: 'Thanks for reaching out! ⚡ Our support & admin team monitors this channel. Boost approvals & official announcements will be delivered here.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setConversations(prev => {
          const updated = prev.map(c => {
            if (c.id === activeThreadId) {
              return {
                ...c,
                lastMessage: replyMsg.text,
                time: 'Just now',
                messages: [...c.messages, replyMsg]
              };
            }
            return c;
          });
          try { localStorage.setItem('cufy_conversations', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }, 1000);
    }
  };

  const handleSelectThread = (threadId) => {
    if (!threadId) return;
    if (threadId === 'cufy_official') {
      setActiveThreadId(threadId);
      return;
    }
    const thread = conversations.find(c => c.id === threadId);
    if (thread && !isMutualMatch(userProfile, thread)) {
      alert(`You haven't matched with ${thread.name} yet! Both users must like each other to unlock direct chat.`);
      return;
    }
    setActiveThreadId(threadId);
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
        backgroundImage: `url('/photos/haikei2 (2).png')`,
        backgroundSize: 'cover',
        opacity: 0.12,
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {/* 1. CHAT LOGS LIST VIEW (When no specific single thread is active) */}
      {!activeThreadId && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 100px', position: 'relative', zIndex: 10 }}>
          
          {/* Header matching Likes Feed typography */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 className="editorial-title" style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#09090B',
              letterSpacing: '-0.6px',
              marginBottom: 0
            }}>
              Chat
            </h1>

            {/* Top Right Action Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#E4E4E7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Bell size={18} color="#09090B" />
                <span style={{ position: 'absolute', top: '8px', right: '8px', width: '7px', height: '7px', borderRadius: '50%', background: '#FF3B30' }}></span>
              </div>

              <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #FFFFFF' }}>
                {userProfile?.photos?.[0] || userProfile?.photo ? (
                  <img 
                    src={userProfile?.photos?.[0] || userProfile?.photo} 
                    alt={userProfile?.name || 'Profile'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF3B30, #FF6B6B)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>
                    {(userProfile?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NEW MATCHES HORIZONTAL SCROLL BAR */}
          {conversations.filter(c => c.id !== 'cufy_official').length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                New Matches ({conversations.filter(c => c.id !== 'cufy_official').length})
              </div>
              <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {conversations.filter(c => c.id !== 'cufy_official').map((matchItem) => (
                  <div 
                    key={matchItem.id} 
                    onClick={() => handleSelectThread(matchItem.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <div style={{ width: '60px', height: '60px', borderRadius: '20px', overflow: 'hidden', border: '2px solid #FF3B30', boxShadow: '0 4px 14px rgba(255,59,48,0.2)' }}>
                      <img src={matchItem.photo} alt={matchItem.name} onError={(e) => { e.target.src = '/photos/front1.jpg'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#09090B', marginTop: '6px' }}>{matchItem.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations Log List */}
          {conversations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {conversations.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    border: '1.5px solid #E4E4E7',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s var(--ease-spring)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      background: '#09090B',
                      flexShrink: 0,
                      border: '1.5px solid #E4E4E7'
                    }}>
                      <img 
                        src={thread.photo} 
                        onError={(e) => { e.target.src = '/photos/cufylogo.jpg'; }}
                        alt={thread.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#09090B' }}>
                        {thread.name}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#71717A',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px'
                      }}>
                        {thread.lastMessage}
                      </div>
                    </div>
                  </div>

                  {thread.badge && (
                    <div style={{
                      padding: '6px 12px',
                      background: '#09090B',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {thread.badge}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* EMPTY CHAT LOGS STATE (Matching Screenshot 2) */
            <div style={{
              textAlign: 'center',
              padding: '40px 16px 60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              
              {/* Graphic Illustration Card Stack from Screenshot 2 */}
              <div style={{
                position: 'relative',
                width: '240px',
                height: '220px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                
                {/* Center Rounded Portrait Card */}
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.1)',
                  border: '2px solid #FFFFFF',
                  position: 'relative',
                  background: '#FFFFFF'
                }}>
                  <img 
                    src="/photos/front3.jpg" 
                    alt="Smiling match portrait" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />

                  {/* Speech Bubble on Card */}
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '12px',
                    right: '12px',
                    background: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '16px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#09090B',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    textAlign: 'center'
                  }}>
                    i'd love to check it out!
                  </div>
                </div>

                {/* Top Right Heart Eyes Emoji Badge */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '12px',
                  background: '#F4F4F5',
                  padding: '6px 12px',
                  borderRadius: '16px 16px 16px 4px',
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
                }}>
                  😍
                </div>

                {/* Bottom Right Laughing Emoji Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '20px',
                  background: '#F4F4F5',
                  padding: '6px 12px',
                  borderRadius: '16px 16px 16px 4px',
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
                }}>
                  😆
                </div>

              </div>

              {/* Exact Title from Screenshot 2 */}
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#09090B', marginBottom: '10px', letterSpacing: '-0.4px' }}>
                This is where conversations start
              </h2>

              {/* Exact Subtext from Screenshot 2 */}
              <p style={{ color: '#52525B', fontSize: '0.92rem', lineHeight: '1.45', maxWidth: '310px', marginBottom: '28px', fontWeight: 500 }}>
                Once you're in, this is where you'll chat with people you've matched with. Check out our Conversation Guide to learn how to turn a match into a date.
              </p>

              {/* Black Pill CTA Button from Screenshot 2 */}
              <button className="btn-black-pill" style={{ width: 'auto', padding: '14px 28px' }}>
                See what works
              </button>

            </div>
          )}

        </div>
      )}

      {/* 2. SINGLE CONVERSATION VIEW (PINNED VIEWPORT, ORGANIC WALLPAPER & SMOOTH KEYBOARD) */}
      {activeThreadId && currentThread && (
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 'auto',
            width: '100%',
            height: viewportHeight ? `${viewportHeight}px` : '100dvh',
            maxHeight: viewportHeight ? `${viewportHeight}px` : '100dvh',
            display: 'flex', 
            flexDirection: 'column', 
            background: '#F5F3EF',
            overflow: 'hidden',
            zIndex: 9999
          }}
        >
          {/* Organic Haikei Wallpaper Layer */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('/photos/haikei2 (2).png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.16,
            pointerEvents: 'none',
            zIndex: 0
          }} />

          {/* Header Bar & Safety Banner (Pinned, flexShrink: 0) */}
          <div style={{
            flexShrink: 0,
            padding: '12px 16px 0',
            background: 'rgba(245, 243, 239, 0.98)',
            backdropFilter: 'blur(16px)',
            zIndex: 10,
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E4E4E7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  onClick={() => setActiveThreadId(null)} 
                  style={{ padding: '8px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E4E4E7', cursor: 'pointer' }} 
                  aria-label="Back to chat logs"
                >
                  <ArrowLeft size={18} />
                </button>

                <div style={{ width: '42px', height: '42px', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #FF3B30', background: '#09090B' }}>
                  <img 
                    src={currentThread.photo} 
                    alt={currentThread.name} 
                    onError={(e) => { e.target.src = '/photos/cufylogo.jpg'; }} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>

                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#09090B' }}>{currentThread.name}</div>
                  <div style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                    Active now
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Banner */}
            <div style={{
              margin: '10px 0',
              padding: '10px 14px',
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E4E4E7',
              fontSize: '0.8rem',
              color: '#52525B',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldCheck size={16} style={{ color: '#FF3B30', flexShrink: 0 }} />
              <span>Encrypted private chat. Keep conversations respectful.</span>
            </div>
          </div>

          {/* Messages History (Only this element scrolls within boundaries) */}
          <div 
            style={{ 
              flex: 1, 
              minHeight: 0,
              overflowY: 'auto', 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              padding: '12px 16px',
              position: 'relative',
              zIndex: 5
            }}
          >
            {currentThread.messages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 16px',
                margin: 'auto 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  border: '2px solid #FF3B30',
                  boxShadow: '0 8px 24px rgba(255, 59, 48, 0.15)'
                }}>
                  <img 
                    src={currentThread.photo} 
                    alt={currentThread.name} 
                    onError={(e) => { e.target.src = '/photos/cufylogo.jpg'; }} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#09090B' }}>
                  You matched with {currentThread.name}!
                </div>
                <p style={{ fontSize: '0.85rem', color: '#71717A', maxWidth: '260px', margin: 0, lineHeight: 1.4 }}>
                  Send a thoughtful message to start your conversation.
                </p>
              </div>
            ) : (
              currentThread.messages.map(msg => (
                <div 
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    padding: '14px 18px',
                    borderRadius: msg.sender === 'me' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.sender === 'me' ? 'linear-gradient(135deg, #FF3B30 0%, #E03131 100%)' : '#FFFFFF',
                    color: msg.sender === 'me' ? '#FFFFFF' : '#09090B',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    border: msg.sender === 'me' ? 'none' : '1.5px solid #E4E4E7'
                  }}
                >
                  <div style={{ fontSize: '0.94rem', lineHeight: '1.45', fontWeight: 600 }}>{msg.text}</div>
                  <div style={{
                    fontSize: '0.7rem',
                    marginTop: '4px',
                    textAlign: 'right',
                    opacity: 0.85,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px'
                  }}>
                    <span>{msg.time}</span>
                    {msg.sender === 'me' && <CheckCheck size={13} />}
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '12px 18px',
                borderRadius: '18px 18px 18px 4px',
                background: '#FFFFFF',
                border: '1.5px solid #E4E4E7',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#71717A', fontWeight: 700 }}>{currentThread.name} is typing</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF3B30', animation: 'pulse 1s infinite alternate' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>

          {/* Message Input Form Container (Pinned above virtual keyboard) */}
          <div style={{
            flexShrink: 0,
            padding: isKeyboardActive ? '8px 14px 10px' : '10px 14px calc(14px + env(safe-area-inset-bottom, 0px))',
            background: 'rgba(245, 243, 239, 0.98)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(228, 228, 231, 0.8)',
            zIndex: 10,
            position: 'relative'
          }}>
            <form 
              onSubmit={handleSend} 
              style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
            >
              <input 
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={() => {
                  setIsInputFocused(true);
                  if (typeof window !== 'undefined') {
                    window.scrollTo(0, 0);
                    if (document.body) document.body.scrollTop = 0;
                    if (document.documentElement) document.documentElement.scrollTop = 0;
                  }
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Send a thoughtful message..."
                className="form-input"
                enterKeyHint="send"
                autoComplete="off"
                style={{ 
                  flex: 1, 
                  borderRadius: '16px', 
                  background: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  fontSize: '0.95rem'
                }}
              />
              <button 
                type="submit" 
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="btn-primary" 
                style={{ width: 'auto', padding: '14px 20px', borderRadius: '16px', flexShrink: 0 }} 
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
