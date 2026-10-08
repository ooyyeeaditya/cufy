import React, { useState, useEffect } from 'react';
import { X, Bell, Heart, MessageSquare, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose, onSelectNotification, userNotifications = [] }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // Load real notifications from props or localStorage
    let list = userNotifications;
    if (!list || list.length === 0) {
      try {
        const stored = localStorage.getItem('cufy_notifications');
        if (stored) {
          list = JSON.parse(stored);
        }
      } catch (e) {
        list = [];
      }
    }
    setNotifications(list || []);
  }, [isOpen, userNotifications]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    localStorage.removeItem('cufy_notifications');
    setNotifications([]);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100%', height: '100%',
      background: 'rgba(9, 9, 11, 0.65)',
      backdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      boxSizing: 'border-box'
    }} className="animate-fade-in">

      {/* Backdrop Click to Close */}
      <div style={{ flex: 1 }} onClick={onClose} />
      
      {/* Bottom Sheet Modal Container */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        margin: '0 auto',
        background: '#FFFFFF',
        borderRadius: '32px 32px 0 0',
        padding: '12px 20px 32px',
        boxShadow: '0 -20px 50px rgba(0,0,0,0.25)',
        border: '1px solid #E4E4E7',
        maxHeight: '82vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }} className="animate-slide-up-1">

        {/* Top Pull Indicator Handle */}
        <div style={{
          width: '38px',
          height: '4px',
          borderRadius: '2px',
          background: '#E4E4E7',
          margin: '0 auto 14px'
        }} />

        {/* Drawer Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #F4F4F5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: '#FFF0F0',
              color: '#FF3B30',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bell size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#09090B', letterSpacing: '-0.3px', margin: 0 }}>
                Notifications
              </div>
              <div style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 600 }}>
                {notifications.length} update{notifications.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notifications.length > 0 && (
              <button 
                onClick={handleClearAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FF3B30',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Clear all
              </button>
            )}

            <button 
              onClick={onClose} 
              style={{
                width: '32px', height: '32px',
                borderRadius: '50%',
                background: '#F4F4F5',
                border: 'none',
                color: '#09090B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notifications List or Clean Empty State */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', paddingRight: '2px' }}>
          {(!notifications || notifications.length === 0) ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 16px',
              background: '#FAF8F5',
              borderRadius: '24px',
              border: '1.5px dashed #E4E4E7',
              margin: '8px 0'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '18px',
                background: '#FFFFFF',
                color: '#A1A1AA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
              }}>
                <Bell size={24} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#09090B', marginBottom: '4px' }}>
                All Caught Up!
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#71717A', lineHeight: '1.45', margin: 0, maxWidth: '260px' }}>
                You have no new alerts right now. Match and verification updates will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map((notif, idx) => {
                const isAlert = notif.tag === 'cufy-rejected' || (notif.title && notif.title.includes('Verification'));
                const isLike = notif.tag === 'like' || notif.type === 'like';

                return (
                  <div 
                    key={notif.id || idx}
                    onClick={() => {
                      if (onSelectNotification) onSelectNotification(notif);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: '20px',
                      background: isAlert ? '#FFF5F5' : '#FFFFFF',
                      border: isAlert ? '1.5px solid #FECACA' : '1.5px solid #E4E4E7',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      transition: 'transform 0.15s ease, background 0.15s ease'
                    }}
                  >
                    {/* Icon Badge */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '14px',
                      background: isAlert ? '#FEF2F2' : (isLike ? '#FFF0F0' : '#EFF6FF'),
                      color: isAlert ? '#DC2626' : (isLike ? '#FF3B30' : '#2563EB'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {isAlert ? (
                        <ShieldAlert size={20} />
                      ) : isLike ? (
                        <Heart size={20} fill="#FF3B30" />
                      ) : (
                        <MessageSquare size={20} />
                      )}
                    </div>

                    {/* Notification Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 900, color: isAlert ? '#991B1B' : '#09090B' }}>
                          {notif.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#A1A1AA', fontWeight: 600 }}>
                          {notif.timestamp || 'Today'}
                        </span>
                      </div>

                      <p style={{
                        fontSize: '0.8rem',
                        color: isAlert ? '#7F1D1D' : '#52525B',
                        fontWeight: 500,
                        margin: '4px 0 0',
                        lineHeight: '1.4'
                      }}>
                        {notif.message || notif.subtitle || 'Tap to view details'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button 
          onClick={onClose} 
          className="btn-black-pill"
          style={{ width: '100%', padding: '14px', fontSize: '0.88rem', fontWeight: 900 }}
        >
          Close Notifications
        </button>

      </div>
    </div>
  );
}
