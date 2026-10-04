import React from 'react';
import { X, Bell, Heart, Flame, MessageSquare } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose, onSelectNotification }) {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      type: 'like',
      title: 'Priya liked your profile',
      subtitle: '5 minutes ago • Click to open match',
      icon: Heart,
      iconColor: '#FF3B30',
      bgColor: '#FFF0F0'
    },
    {
      id: 2,
      type: 'curated',
      title: 'Your daily curated match is ready',
      subtitle: '1 hour ago • 1 connection selected for you today',
      icon: Flame,
      iconColor: '#F59E0B',
      bgColor: '#FEF3C7'
    },
    {
      id: 3,
      type: 'chat',
      title: 'Elena sent you a message',
      subtitle: '3 hours ago • "Hey! Love your photo in Austin!"',
      icon: MessageSquare,
      iconColor: '#3B82F6',
      bgColor: '#EFF6FF'
    }
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(9, 9, 11, 0.65)',
      backdropFilter: 'blur(12px)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '16px'
    }} className="animate-fade-in">
      
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#FFFFFF',
        borderRadius: '32px',
        padding: '24px 24px 28px',
        boxShadow: '0 -16px 48px rgba(0,0,0,0.22)',
        border: '1.5px solid #E4E4E7'
      }}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem', fontWeight: 900, color: '#09090B' }}>
            <Bell size={20} style={{ color: '#FF3B30' }} />
            Notifications
          </div>
          <button onClick={onClose} style={{ padding: '6px', background: '#F4F4F5', borderRadius: '50%', color: '#71717A' }}>
            <X size={18} />
          </button>
        </div>

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => {
                onSelectNotification(notif);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '20px',
                background: '#F9F8F6',
                border: '1.5px solid #E4E4E7',
                cursor: 'pointer',
                transition: 'transform 0.2s var(--ease-spring)'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: notif.bgColor,
                color: notif.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <notif.icon size={20} fill={notif.type === 'like' ? notif.iconColor : 'none'} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#09090B' }}>{notif.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#71717A', fontWeight: 500, marginTop: '2px' }}>{notif.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Close CTA */}
        <button onClick={onClose} className="btn-secondary">
          Close Notifications
        </button>

      </div>
    </div>
  );
}
