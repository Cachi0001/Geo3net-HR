import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/common'
import './LandingPage.css'

const LandingPage: React.FC = () => {
  return (
    <div className="landing">
      <header className="landing__header" role="banner">
        <div className="landing__brand">
          <img src="/image.png" alt="Go3net-HR logo" className="landing__logo-img" />
          <div className="landing__brand-text">
            <h1 className="landing__title">Go3net-HR</h1>
            <p className="landing__subtitle">Modern HR platform for teams that move fast</p>
          </div>
        </div>
        <nav className="landing__auth-actions" aria-label="Main">
          <Link to="/login" className="landing__link">Sign in</Link>
          <Link to="/register" className="landing__link landing__link--primary">Get started</Link>
        </nav>
      </header>

      <main className="landing__content">
        {/* Hero Section */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__shape hero__shape--1"></div>
          <div className="hero__shape hero__shape--2"></div>
          <div className="hero__shape hero__shape--3"></div>
          
          <div className="hero__container">
            <div className="hero__content">
              <div className="hero__text">
                <h2 id="hero-title" className="hero__title">Transform Your HR Operations</h2>
                <p className="hero__subtitle">
                  Streamline employee management, automate workflows, and boost productivity with Go3net-HR's intelligent platform.
                </p>
                <div className="hero__actions">
                  <Button as="a" href="/register" variant="primary" size="lg">Start Free Trial</Button>
                  <Button as="a" href="/login" variant="outline" size="lg">Watch Demo</Button>
                </div>
                <p className="hero__hint">✨ No credit card required • 14-day free trial • Setup in 5 minutes</p>
              </div>

              <div className="hero__visual">
                <div className="hero__mockup">
                  <div className="mockup__header">
                    <div className="mockup__dot"></div>
                    <span className="mockup__title">Go3net-HR Dashboard</span>
                  </div>
                  <div className="mockup__bars">
                    <div className="mockup__bar mockup__bar--primary"></div>
                    <div className="mockup__bar mockup__bar--secondary"></div>
                    <div className="mockup__bar mockup__bar--tertiary"></div>
                  </div>
                  <div className="mockup__cards">
                    <div className="mockup__card"></div>
                    <div className="mockup__card mockup__card--secondary"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats" aria-label="Trust metrics">
          <div className="stats__container">
            <div className="stats__header">
              <h3 className="stats__title">Trusted by Modern Teams</h3>
              <p className="stats__subtitle">Join thousands of companies that have transformed their HR operations</p>
            </div>
            <div className="stats__grid">
              <div className="stat-card">
                <span className="stat-card__number">99.9%</span>
                <div className="stat-card__label">Uptime Guarantee</div>
                <div className="stat-card__description">Reliable service you can count on</div>
              </div>
              <div className="stat-card">
                <span className="stat-card__number">10,000+</span>
                <div className="stat-card__label">Employees Managed</div>
                <div className="stat-card__description">Trusted by growing companies</div>
              </div>
              <div className="stat-card">
                <span className="stat-card__number">500+</span>
                <div className="stat-card__label">Companies</div>
                <div className="stat-card__description">Across various industries</div>
              </div>
              <div className="stat-card">
                <span className="stat-card__number">24/7</span>
                <div className="stat-card__label">Support</div>
                <div className="stat-card__description">Always here when you need us</div>
              </div>
            </div>
          </div>
        </section>

        <section className="features" aria-labelledby="features-title">
          <div className="features__container">
            <div className="features__header">
              <h3 id="features-title" className="features__title">Everything You Need to Manage HR</h3>
              <p className="features__subtitle">Powerful features designed to streamline your HR operations and empower your team</p>
            </div>
            <div className="features__grid">
              <div className="feature-card">
                <div className="feature-card__icon-wrapper">
                  <svg className="feature-card__icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" fill="#007bff"/>
                    <path d="M4 20a8 8 0 1116 0H4z" fill="#007bff" opacity="0.85"/>
                  </svg>
                </div>
                <h4 className="feature-card__title">Employee Profiles</h4>
                <p className="feature-card__description">Comprehensive employee directory with roles, departments, and permissions. Manage your workforce with intelligent organization.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon-wrapper">
                  <svg className="feature-card__icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11l3 3L22 4" stroke="#38a169" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#38a169" strokeWidth="2"/>
                  </svg>
                </div>
                <h4 className="feature-card__title">Tasks & Workflows</h4>
                <p className="feature-card__description">Automate routine HR processes with smart task assignment and approval workflows. Boost productivity effortlessly.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon-wrapper">
                  <svg className="feature-card__icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8v5l3 2" stroke="#1a8cff" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="9" stroke="#1a8cff" strokeWidth="2"/>
                  </svg>
                </div>
                <h4 className="feature-card__title">Time & Attendance</h4>
                <p className="feature-card__description">Advanced time tracking with GPS check-in/out, shift management, and real-time attendance insights.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon-wrapper">
                  <svg className="feature-card__icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3h18v4H3z" fill="#2f855a"/>
                    <path d="M3 9h18v12H3z" fill="#2f855a" opacity="0.85"/>
                  </svg>
                </div>
                <h4 className="feature-card__title">Document Management</h4>
                <p className="feature-card__description">Secure document storage with role-based access control. Keep contracts, policies, and records organized.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials" aria-labelledby="testimonials-title">
          <div className="testimonials__container">
            <div className="testimonials__header">
              <h3 id="testimonials-title" className="testimonials__title">Loved by HR Teams Worldwide</h3>
              <p className="testimonials__subtitle">See how companies are transforming their HR operations with Go3net-HR</p>
            </div>
            <div className="testimonials__grid">
              <div className="testimonial-card">
                <div className="testimonial-card__quote-icon">"</div>
                <div className="testimonial-card__rating">
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                </div>
                <p className="testimonial-card__quote">Go3net-HR transformed our entire HR workflow. The automation features saved us 15+ hours per week, and the intuitive interface made adoption seamless across our team.</p>
                <div className="testimonial-card__highlight">Saved 15+ hours per week</div>
                <div className="testimonial-card__author">
                  <img src="https://i.pravatar.cc/150?img=1" alt="Amina Musa" className="testimonial-card__avatar" />
                  <div className="testimonial-card__author-info">
                    <div className="testimonial-card__name">Amina Musa</div>
                    <div className="testimonial-card__role">People Operations Manager</div>
                    <div className="testimonial-card__company">Nexa Technologies</div>
                  </div>
                </div>
              </div>

              <div className="testimonial-card">
                <div className="testimonial-card__quote-icon">"</div>
                <div className="testimonial-card__rating">
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                </div>
                <p className="testimonial-card__quote">The time tracking and approval workflows are game-changers. Our managers love the real-time insights, and employees appreciate the mobile-first experience.</p>
                <div className="testimonial-card__highlight">Mobile-first experience</div>
                <div className="testimonial-card__author">
                  <img src="https://i.pravatar.cc/150?img=2" alt="Kunle Okoye" className="testimonial-card__avatar" />
                  <div className="testimonial-card__author-info">
                    <div className="testimonial-card__name">Kunle Okoye</div>
                    <div className="testimonial-card__role">HR Director</div>
                    <div className="testimonial-card__company">Timbra Solutions</div>
                  </div>
                </div>
              </div>

              <div className="testimonial-card">
                <div className="testimonial-card__quote-icon">"</div>
                <div className="testimonial-card__rating">
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                </div>
                <p className="testimonial-card__quote">Implementation was incredibly smooth. The support team guided us every step of the way, and we were fully operational within days, not weeks.</p>
                <div className="testimonial-card__highlight">Operational within days</div>
                <div className="testimonial-card__author">
                  <img src="https://i.pravatar.cc/150?img=3" alt="Sarah Johnson" className="testimonial-card__avatar" />
                  <div className="testimonial-card__author-info">
                    <div className="testimonial-card__name">Sarah Johnson</div>
                    <div className="testimonial-card__role">Chief People Officer</div>
                    <div className="testimonial-card__company">InnovateCorp</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta" aria-label="Call to action">
          <div className="cta__container">
            <h3 className="cta__title">Ready to Transform Your HR?</h3>
            <p className="cta__subtitle">Join thousands of companies already using Go3net-HR to streamline their operations and boost productivity.</p>
            
            <div className="cta__features">
              <div className="cta__feature">
                <span className="cta__feature-icon">🔒</span>
                Enterprise Security
              </div>
              <div className="cta__feature">
                <span className="cta__feature-icon">🎧</span>
                24/7 Support
              </div>
              <div className="cta__feature">
                <span className="cta__feature-icon">⚡</span>
                5-Min Setup
              </div>
            </div>

            <div className="cta__actions">
              <a href="/register" className="cta__primary-btn">
                Start Your Free Trial
                <span>→</span>
              </a>
              <a href="/login" className="cta__secondary-btn">
                Schedule Demo
              </a>
            </div>

            <p className="cta__hint">✨ No credit card required • 14-day free trial • Cancel anytime</p>
          </div>
        </section>
      </main>

      <footer className="landing__footer" role="contentinfo">
        <p className="landing__copyright">© {new Date().getFullYear()} Go3net-HR</p>
        <nav className="landing__footer-nav" aria-label="Footer">
          <a href="#" className="landing__footer-link">Privacy</a>
          <a href="#" className="landing__footer-link">Terms</a>
          <a href="#" className="landing__footer-link">Contact</a>
        </nav>
      </footer>
    </div>
  )
}

export default LandingPage