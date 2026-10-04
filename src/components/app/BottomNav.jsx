import React from 'react';
import { Heart, MessageSquare, Settings } from 'lucide-react';

// Custom Home House Line Icon matching reference style
function HomeIconSVG({ size = 22, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L3 10V20C3 20.6 3.4 21 4 21H20C20.6 21 21 20.6 21 20V10L12 3Z" />
      <path d="M9 14C9 15.7 10.3 17 12 17C13.7 17 15 15.7 15 14" />
    </svg>
  );
}

export default function BottomNav({ activeTab, onChangeTab }) {
  return (
    <div className="custom-curved-navbar-container">
      {/* Curved SVG Background Path with Central Concave Cutout */}
      <svg className="navbar-svg-bg" viewBox="0 0 400 70" preserveAspectRatio="none">
        <path 
          d="M 0,0 
             L 155,0 
             C 170,0 172,34 200,34 
             C 228,34 230,0 245,0 
             L 400,0 
             L 400,70 
             L 0,70 
             Z" 
          fill="#FFFFFF" 
        />
      </svg>

      {/* Center Floating Cupid Logo Badge (Perfect Circle!) */}
      <button 
        onClick={() => onChangeTab('home')} 
        className="center-mascot-badge"
        aria-label="Cupid Home Logo"
        title="Cufy Home"
        style={{ overflow: 'hidden', padding: 0, border: '3px solid #FFFFFF' }}
      >
        <img 
          src="/photos/cupidlogo.jpg" 
          onError={(e) => { e.target.src = '/photos/cufylogo.jpg'; }}
          alt="Cupid logo" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
        />
      </button>

      {/* Nav Items Container */}
      <div className="curved-nav-items">
        {/* Item 1: Home */}
        <button 
          onClick={() => onChangeTab('home')}
          className={`curved-nav-item ${activeTab === 'home' ? 'active' : ''}`}
          aria-label="Home"
        >
          <HomeIconSVG size={22} strokeWidth={activeTab === 'home' ? 2.5 : 1.8} color={activeTab === 'home' ? '#FF3B30' : '#71717A'} />
          <span style={{ color: activeTab === 'home' ? '#FF3B30' : '#71717A' }}>Home</span>
        </button>

        {/* Item 2: Likes (Renamed from Explore as requested!) */}
        <button 
          onClick={() => onChangeTab('likes')}
          className={`curved-nav-item ${activeTab === 'likes' ? 'active' : ''}`}
          aria-label="Likes"
        >
          <Heart size={22} strokeWidth={activeTab === 'likes' ? 2.5 : 1.8} color={activeTab === 'likes' ? '#FF3B30' : '#71717A'} fill={activeTab === 'likes' ? '#FF3B30' : 'none'} />
          <span style={{ color: activeTab === 'likes' ? '#FF3B30' : '#71717A' }}>Likes</span>
        </button>

        {/* Spacer for central circular logo badge */}
        <div className="nav-center-spacer"></div>

        {/* Item 3: Chats */}
        <button 
          onClick={() => onChangeTab('chat')}
          className={`curved-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
          aria-label="Chats"
        >
          <MessageSquare size={22} strokeWidth={activeTab === 'chat' ? 2.5 : 1.8} color={activeTab === 'chat' ? '#FF3B30' : '#71717A'} />
          <span style={{ color: activeTab === 'chat' ? '#FF3B30' : '#71717A' }}>Chats</span>
        </button>

        {/* Item 4: Settings */}
        <button 
          onClick={() => onChangeTab('settings')}
          className={`curved-nav-item ${activeTab === 'settings' || activeTab === 'profile' ? 'active' : ''}`}
          aria-label="Settings"
        >
          <Settings size={22} strokeWidth={activeTab === 'settings' || activeTab === 'profile' ? 2.5 : 1.8} color={activeTab === 'settings' ? '#FF3B30' : '#71717A'} />
          <span style={{ color: activeTab === 'settings' ? '#FF3B30' : '#71717A' }}>Settings</span>
        </button>
      </div>
    </div>
  );
}
