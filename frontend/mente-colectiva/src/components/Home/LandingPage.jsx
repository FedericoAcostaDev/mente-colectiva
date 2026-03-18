'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Users, Paintbrush, Share2, Sparkles, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const AnimatedIcon3D = ({ Icon, delay }) => (
  <div
    className="animated-icon-3d"
    style={{ animation: `bobbing 3s ease-in-out infinite ${delay}` }}
  >
    <div className="icon-bg" />
    <div className="icon-container">
      <div className="icon-inner">{Icon}</div>
    </div>
  </div>
);

const FloatingOrb = ({ delay, position }) => (
  <div
    className="floating-orb"
    style={{
      animation: `float 12s ease-in-out infinite ${delay}`,
      [position]: '0',
    }}
  />
);

const ShimmerLine = () => (
  <div className="shimmer-line" />
);

const AnimatedWave = () => (
  <div className="wave-container" style={{ animation: 'fade-in 1s ease-out' }}>
    <svg
      className="wave-svg"
      viewBox="0 0 1000 200"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(96, 165, 250)" />
          <stop offset="50%" stopColor="rgb(168, 85, 247)" />
          <stop offset="100%" stopColor="rgb(217, 70, 239)" />
        </linearGradient>
        <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(168, 85, 247)" />
          <stop offset="50%" stopColor="rgb(217, 70, 239)" />
          <stop offset="100%" stopColor="rgb(96, 165, 250)" />
        </linearGradient>
        <linearGradient id="waveGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(217, 70, 239)" />
          <stop offset="50%" stopColor="rgb(96, 165, 250)" />
          <stop offset="100%" stopColor="rgb(168, 85, 247)" />
        </linearGradient>
      </defs>
      
      <path
        d="M0,100 Q250,50 500,100 T1000,100 L1000,200 L0,200 Z"
        fill="url(#waveGradient1)"
        opacity="0.3"
        style={{
          animation: 'wave-oscillate-1 4s ease-in-out infinite',
          filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.6))',
        }}
      />
      
      <path
        d="M0,120 Q250,70 500,120 T1000,120"
        stroke="url(#waveGradient2)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        style={{
          animation: 'wave-oscillate-2 5s ease-in-out infinite',
          filter: 'drop-shadow(0 0 12px rgba(96, 165, 250, 0.5))',
        }}
      />
      
      <path
        d="M0,80 Q250,30 500,80 T1000,80"
        stroke="url(#waveGradient1)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        style={{
          animation: 'wave-oscillate-1 3.5s ease-in-out infinite',
          filter: 'drop-shadow(0 0 18px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 8px rgba(96, 165, 250, 0.6))',
        }}
      />

      <path
        d="M0,140 Q250,110 500,140 T1000,140"
        stroke="url(#waveGradient3)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
        style={{
          animation: 'wave-oscillate-3 6s ease-in-out infinite',
          filter: 'drop-shadow(0 0 10px rgba(217, 70, 239, 0.4))',
        }}
      />
    </svg>
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userDetails');
    
    if (userData) {
      try {
        setUserInfo(JSON.parse(userData));
      } catch (e) {
        console.log('[v0] Failed to parse user data');
      }
    }
    if (token) {
      setHasToken(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userDetails');
    setHasToken(false);
    setUserInfo(null);
    navigate('/');
  };

  return (
    <div className="landing-page">
      <FloatingOrb delay="0s" position="top" />
      <FloatingOrb delay="-6s" position="right" />

      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <Paintbrush className="logo-paintbrush" />
            </div>
            <span className="logo-text">Mente Colectiva</span>
          </Link>

          <div className="navbar-menu">
            <a href="#features" className="navbar-link">Features</a>
            <a href="#benefits" className="navbar-link">Benefits</a>
            <a href="#team" className="navbar-link">Team</a>
          </div>

          <div className="navbar-auth">
            {!hasToken ? (
              <>
                <Link to="/auth/login" className="auth-link">Login</Link>
                <Link to="/auth/signup" className="auth-button">Sign Up</Link>
              </>
            ) : (
              <>
                <span className="user-badge">
                  {userInfo?.name || 'User'}
                </span>
                {/* ✅ History Button */}
      <Link
        to="/history"
        className="auth-link"
        style={{ fontWeight: 500 }}
      >
        History
      </Link>

                <button
                  onClick={handleLogout}
                  className="logout-btn"
                  title="Logout"
                >
                  <LogOut className="logout-icon" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-tag" style={{ animation: 'slide-up 0.8s ease-out 0.1s both' }}>
            <span>&gt; Real-time collaboration redefined</span>
          </div>

          <h1 className="hero-title" style={{ animation: 'slide-up 0.8s ease-out 0.2s both' }}>
            Collaborate, Create,{' '}
            <span className="gradient-text">Connect</span>
          </h1>

          <p className="hero-description" style={{ animation: 'slide-up 0.8s ease-out 0.3s both' }}>
            The collaborative whiteboard that empowers creativity. Real-time sync, beautiful tools, and a seamless experience for teams that dream big.
          </p>

          <AnimatedWave />

          <div className="hero-cta" style={{ animation: 'slide-up 0.8s ease-out 0.4s both' }}>
            {hasToken ? (
              <Link to="/joinRoom" className="cta-primary">
                Create Room
                <ArrowRight className="cta-icon" />
              </Link>
            ) : (
              <Link to="/auth/signup" className="cta-primary">
                Get Started
                <ArrowRight className="cta-icon" />
              </Link>
            )}
            <Link to="/demo" className="cta-secondary">
              Watch Demo
              <Sparkles className="cta-icon" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <ShimmerLine />
        <div className="features-container">
          <div className="features-header">
            <h2>Powerful Features Built for Teams</h2>
            <p>Everything you need for seamless real-time collaboration</p>
          </div>

          <div className="features-grid">
            {[
              {
                icon: <Paintbrush className="feature-icon" />,
                title: 'Advanced Drawing Tools',
                desc: 'Pen, shapes, text, and eraser with full customization for perfect expression.',
              },
              {
                icon: <Zap className="feature-icon" />,
                title: 'Real-Time Sync',
                desc: 'Changes appear instantly across all connected users with zero lag.',
              },
              {
                icon: <Users className="feature-icon" />,
                title: 'Team Coordination',
                desc: "See who's online, track cursors, and collaborate seamlessly in shared spaces.",
              },
              {
                icon: <Share2 className="feature-icon" />,
                title: 'Easy Room Sharing',
                desc: 'Generate unique room codes to invite team members instantly.',
              },
              {
                icon: <Sparkles className="feature-icon" />,
                title: 'Rich Customization',
                desc: 'Full color spectrum, stroke widths, and dynamic property controls.',
              },
              {
                icon: <ArrowRight className="feature-icon" />,
                title: 'Undo/Redo History',
                desc: 'Complete canvas history management with full state backups.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredFeature(idx)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`feature-card ${hoveredFeature === idx ? 'hovered' : ''}`}
              >
                <div className="feature-overlay" />
                <div className="feature-content">
                  <AnimatedIcon3D Icon={feature.icon} delay={`${idx * 0.1}s`} />
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-section">
        <ShimmerLine />
        <div className="benefits-container">
          <div className="benefits-left">
            <h2>Why Teams Choose Mente Colectiva</h2>
            <div className="benefits-list">
              {[
                { num: '1', title: 'Lightning Fast', desc: 'Socket.IO powered real-time updates with zero latency.' },
                { num: '2', title: 'Secure & Private', desc: 'JWT authentication and encrypted connections for enterprise security.' },
                { num: '3', title: 'Always Available', desc: 'Built on robust Node.js and MongoDB architecture.' },
                { num: '4', title: 'Beautiful UI', desc: 'Modern interface powered by React and Tailwind CSS.' },
              ].map((item) => (
                <div key={item.num} className="benefit-item">
                  <div className="benefit-number">{item.num}</div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="benefits-right">
            <div className="benefits-card">
              <div className="benefits-content">
                <div className="benefit-detail">
                  <h3>Real-Time Sync</h3>
                  <p>See every stroke instantly. Canvas updates broadcast live to all participants with Socket.IO synchronization.</p>
                </div>
                <div className="benefit-detail">
                  <h3>Complete Toolset</h3>
                  <p>Draw with pens, shapes, text, and eraser. Undo/redo, duplicate, and customize colors and stroke width.</p>
                </div>
                <div className="benefit-detail">
                  <h3>Secure Rooms</h3>
                  <p>Create authenticated rooms with unique IDs. JWT-based security and token verification for all connections.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="team-section">
        <ShimmerLine />
        <div className="team-container">
          <h2>Creative Minds Behind Mente Colectiva</h2>
          <p>A passion project by developers who believe in real-time collaboration</p>

          <div className="team-grid">
            {[
              { name: 'Aman Mishra', role: 'Founder & Lead Dev', image: '/team/aman.jpg', initials: 'AM', color: 'primary' },
              { name: 'Ayush Pratap Singh', role: 'Full Stack Developer', image: '/team/ayush.jpg', initials: 'AS', color: 'accent' },
              { name: 'Suraj Kumar Gupta', role: 'Backend Engineer', image: '/team/suraj.jpg', initials: 'SG', color: 'secondary' },
            ].map((member, idx) => (
              <div key={idx} className="team-card">
                <div className="team-avatar-wrapper">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    className="team-avatar"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className={`team-avatar-fallback ${member.color}`}>
                    {member.initials}
                  </div>
                </div>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <ShimmerLine />
        <div className="cta-container">
          <h2>Start Collaborating Now</h2>
          <p>Create a room, share the code, and start drawing together instantly.</p>
          <Link to="/joinRoom" className="cta-button">
            Create a Room
            <ArrowRight className="cta-button-icon" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-sections">
            {[
              {
                title: 'Project',
                links: ['GitHub', 'Docs', 'Issues'],
              },
              {
                title: 'Community',
                links: ['Twitter', 'Discord', 'Contact'],
              },
            ].map((section) => (
              <div key={section.title} className="footer-section">
                <h4>{section.title}</h4>
                <ul>
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="footer-link">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="footer-divider" />
          <div className="footer-bottom">
            <p>© 2026 Mente Colectiva. Built with <span className="heart">❤</span> by Aman Mishra, Ayush Pratap Singh & Suraj Kumar Gupta.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
