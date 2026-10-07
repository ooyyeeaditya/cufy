import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, ShieldCheck, CheckCheck, Bell, MessageSquare } from 'lucide-react';
import { HOME_SWIPE_PROFILES } from '../../data/mockProfiles';

export default function ChatDrawer({ matchProfile, onBack, userProfile }) {
  // Chat Logs State - Safe initialization without dummy profiles
  const [conversations, setConversations] = useState([
    {
      id: 'cufy_official',
      name: 'Cufy Team',
      photo: '/photos/cufylogo.jpg',
      lastMessage: 'Welcome to Cufy! Explore authentic profiles and connect.',
      time: 'Just now',
      unread: true,
      badge: 'Official',
      messages: [
        { id: 1, sender: 'them', text: 'Welcome to Cufy! We are excited to have you here.', time: 'Just now' }
      ]
    }
  ]);

  const [activeThreadId, setActiveThreadId] = useState(matchProfile ? matchProfile.name.toLowerCase() : null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Sync prop matchProfile if passed directly
  useEffect(() => {
    if (matchProfile && matchProfile.name) {
      const threadId = matchProfile.name.toLowerCase();
      const existing = conversations.find(c => c.id === threadId);
      if (!existing) {
        const photoUrl = (matchProfile.photos && matchProfile.photos.length > 0) 
          ? matchProfile.photos[0] 
          : '/photos/front1.jpg';
        const newThread = {
          id: threadId,
          name: matchProfile.name,
          photo: photoUrl,
          lastMessage: `It's a Match! Say hi to ${matchProfile.name}`,
          time: 'Just now',
          unread: true,
          badge: 'New Match',
          messages: [
            { id: 1, sender: 'them', text: `Hey! Excited to connect with you on Cufy!`, time: 'Just now' }
          ]
        };
        setConversations(prev => [newThread, ...prev]);
      }
      setActiveThreadId(threadId);
    } else {
      setActiveThreadId(null);
    }
  }, [matchProfile]);

  const currentThread = conversations.find(c => c.id === activeThreadId);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThreadId) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeThreadId) {
        return {
          ...c,
          lastMessage: newMsg.text,
          time: 'Just now',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    setInputText('');

    // Typing simulation
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyMsg = {
        id: Date.now() + 1,
        sender: 'them',
        text: 'That sounds fantastic! Let us meet up this Saturday.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setConversations(prev => prev.map(c => {
        if (c.id === activeThreadId) {
          return {
            ...c,
            lastMessage: replyMsg.text,
            time: 'Just now',
            messages: [...c.messages, replyMsg]
          };
        }
        return c;
      }));
    }, 1200);
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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

          {/* Conversations Log List */}
          {conversations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {conversations.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
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

      {/* 2. SINGLE CONVERSATION VIEW (NO CALL / VIDEO CALL BUTTONS AT ALL!) */}
      {activeThreadId && currentThread && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 16px 80px', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
          
          {/* Header Bar */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E4E4E7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setActiveThreadId(null)} style={{ padding: '8px', background: '#FFFFFF', borderRadius: '12px' }} aria-label="Back to chat logs">
                  <ArrowLeft size={18} />
                </button>

                <div style={{ width: '42px', height: '42px', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #FF3B30' }}>
                  <img src={currentThread.photo} alt={currentThread.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              <ShieldCheck size={16} style={{ color: '#FF3B30' }} />
              <span>Encrypted private chat. Keep conversations respectful.</span>
            </div>
          </div>

          {/* Messages History */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', margin: '12px 0' }}>
            {currentThread.messages.map(msg => (
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
            ))}

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
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send a thoughtful message..."
              className="form-input"
              style={{ flex: 1, borderRadius: '16px', background: '#FFFFFF' }}
            />
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '14px 20px', borderRadius: '16px' }} aria-label="Send message">
              <Send size={18} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
