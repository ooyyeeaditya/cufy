import React from 'react';
import { X, Bell, Heart, Flame, MessageSquare, Sparkles } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose, onSelectNotification, userNotifications = [] }) {
  if (!isOpen) return null;

  // Load real notifications from props or localStorage
  let notifications = userNotifications;
  if (!notifications || notifications.length === 0) {
    try {
      const stored = localStorage.getItem('cufy_notifications');
      if (stored) {
        notifications = JSON.parse(stored);
      }
    } catch (e) {
      notifications = [];
    }
  }

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

        {/* Notifications List or Clean Empty State */}
        {(!notifications || notifications.length === 0) ? (
          <div style={{
            textAlign: 'center',
            padding: '36px 16px',
            background: '#F9F8F6',
            borderRadius: '24px',
            border: '1.5px solid #E4E4E7',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              background: '#FFF0F0',
              color: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <Bell size={28} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#09090B', marginBottom: '6px' }}>
              No Notifications Yet
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#71717A', lineHeight: '1.4', margin: 0 }}>
              When people like your profile, match with you, or send messages, alerts will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {notifications.map((notif, idx) => (
              <div 
                key={notif.id || idx}
                onClick={() => {
                  if (onSelectNotification) onSelectNotification(notif);
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
                  background: notif.type === 'like' ? '#FFF0F0' : '#EFF6FF',
                  color: notif.type === 'like' ? '#FF3B30' : '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {notif.type === 'like' ? <Heart size={20} fill="#FF3B30" /> : <MessageSquare size={20} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#09090B' }}>{notif.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#71717A', fontWeight: 500, marginTop: '2px' }}>{notif.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Close CTA */}
        <button onClick={onClose} className="btn-secondary">
          Close Notifications
        </button>

      </div>
    </div>
  );
}
