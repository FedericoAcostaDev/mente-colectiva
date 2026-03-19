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
  <div className="wave-container">
    <svg
      className="wave-svg"
      viewBox="0 0 1000 160"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Teal fill gradient */}
        <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b9ea0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#5b9ea0" stopOpacity="0.25" />
        </linearGradient>
        {/* Light grey fill for second layer */}
        <linearGradient id="greyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8c8c8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#c8c8c8" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Graph paper grid lines — vertical */}
      {[0,100,200,300,400,500,600,700,800,900,1000].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="160"
          stroke="#5b9ea0" strokeWidth="0.5" strokeOpacity="0.25" />
      ))}
      {/* Graph paper grid lines — horizontal */}
      {[0,40,80,120,160].map(y => (
        <line key={y} x1="0" y1={y} x2="1000" y2={y}
          stroke="#5b9ea0" strokeWidth="0.5" strokeOpacity="0.25" />
      ))}

      {/* Axis lines */}
      <line x1="0" y1="159" x2="1000" y2="159" stroke="#3a3a3a" strokeWidth="1.5" />
      <line x1="0" y1="0" x2="0" y2="160" stroke="#3a3a3a" strokeWidth="1.5" />

      {/* Tick labels */}
      {[0,200,400,600,800,1000].map((x, i) => (
        <text key={x} x={x + 4} y="12"
          fontFamily="Kalam, cursive" fontSize="11" fill="#777" opacity="0.8">
          {i * 20}
        </text>
      ))}

      {/* Teal filled area — top layer (animated) */}
      <path
        d="M0,30 L120,55 L200,20 L320,60 L440,25 L560,50 L680,15 L800,45 L900,30 L1000,10 L1000,0 L0,0 Z"
        fill="url(#tealFill)"
        style={{ animation: 'chartShift 6s ease-in-out infinite alternate' }}
      />

      {/* Grey filled area — main jagged chart */}
      <path
        d="M0,80 L120,130 L200,60 L320,110 L440,50 L560,100 L680,70 L800,120 L900,55 L1000,90 L1000,160 L0,160 Z"
        fill="url(#greyFill)"
        style={{ animation: 'chartShift 8s ease-in-out infinite alternate-reverse' }}
      />

      {/* Main jagged line — dark */}
      <polyline
        points="0,80 120,130 200,60 320,110 440,50 560,100 680,70 800,120 900,55 1000,90"
        fill="none"
        stroke="#3a3a3a"
        strokeWidth="2"
        strokeLinejoin="miter"
        style={{ animation: 'chartShift 8s ease-in-out infinite alternate-reverse' }}
      />

      {/* Secondary lighter line */}
      <polyline
        points="0,100 120,145 200,85 320,125 440,75 560,115 680,90 800,135 900,75 1000,110"
        fill="none"
        stroke="#aaaaaa"
        strokeWidth="1.5"
        strokeLinejoin="miter"
        strokeDasharray="6 3"
        opacity="0.6"
        style={{ animation: 'chartShift 10s ease-in-out infinite alternate' }}
      />

      {/* Data point dots on main line */}
      {[[0,80],[120,130],[200,60],[320,110],[440,50],[560,100],[680,70],[800,120],[900,55],[1000,90]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5"
          fill="#fff" stroke="#3a3a3a" strokeWidth="1.5"
          style={{ animation: `chartShift 8s ease-in-out infinite alternate-reverse` }}
        />
      ))}
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
        <AnimatedWave />
        <div className="hero-content">
          <div className="hero-tag" style={{ animation: 'slide-up 0.8s ease-out 0.1s both' }}>
            <span>&gt; Real-time collaboration redefined</span>
          </div>

          <h1 className="hero-title" style={{ animation: 'slide-up 0.8s ease-out 0.2s both' }}>
            <mark className="hero-highlight">Collaborate, Create, Connect</mark>
          </h1>

          <p className="hero-description" style={{ animation: 'slide-up 0.8s ease-out 0.3s both' }}>
            <mark className="hero-highlight">The collaborative whiteboard that empowers creativity. Real-time sync, beautiful tools, and a seamless experience for teams that dream big.</mark>
          </p>

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
