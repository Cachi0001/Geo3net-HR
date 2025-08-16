import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  Clock, 
  ClipboardList, 
  TrendingUp, 
  Shield, 
  Smartphone,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react'
import { Button } from '../../components/common'
import styles from './ModernLandingPage.module.css'

const ModernLandingPage: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Comprehensive employee records, organizational charts, and HR workflows.',
      color: 'blue'
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'GPS-enabled check-in/out, attendance monitoring, and work hours analytics.',
      color: 'green'
    },
    {
      icon: ClipboardList,
      title: 'Task Management',
      description: 'Assign, track, and collaborate on tasks with real-time updates.',
      color: 'purple'
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Reports',
      description: 'Detailed insights into productivity, attendance, and team performance.',
      color: 'orange'
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Secure, permission-based access control for different user roles.',
      color: 'cyan'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Full mobile support with location-based features and responsive design.',
      color: 'pink'
    }
  ]

  const testimonials = [
    {
      name: 'Kayode Adebayo',
      role: 'CEO, Go3net Technologies',
      content: 'This HR system has transformed how we manage our workforce. The real-time insights and mobile features are game-changers.',
      rating: 5
    },
    {
      name: 'Sarah Johnson',
      role: 'HR Director',
      content: 'The employee management features are comprehensive and intuitive. Our HR processes are now 10x more efficient.',
      rating: 5
    },
    {
      name: 'Mike Wilson',
      role: 'Operations Manager',
      content: 'Task management and team tracking features help me stay on top of everything. The dashboard is beautiful and functional.',
      rating: 5
    }
  ]

  return (
    <div className={styles.landingPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>G3</div>
              <div className={styles.logoText}>
                <span className={styles.logoTextBlue}>Go3</span>
                <span className={styles.logoTextGreen}>NET</span>
              </div>
            </div>
            
            <nav className={styles.nav}>
              <Link to="/login" className={styles.navLink}>Login</Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Modern HR Management
                <span className={styles.heroTitleAccent}> Made Simple</span>
              </h1>
              <p className={styles.heroDescription}>
                Streamline your workforce management with our comprehensive HR system. 
                From employee records to time tracking, task management to analytics - 
                everything you need in one powerful platform.
              </p>
              <div className={styles.heroActions}>
                <Link to="/register">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight size={20} />}>
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <div className={styles.heroStatNumber}>500+</div>
                  <div className={styles.heroStatLabel}>Companies</div>
                </div>
                <div className={styles.heroStat}>
                  <div className={styles.heroStatNumber}>50K+</div>
                  <div className={styles.heroStatLabel}>Employees</div>
                </div>
                <div className={styles.heroStat}>
                  <div className={styles.heroStatNumber}>99.9%</div>
                  <div className={styles.heroStatLabel}>Uptime</div>
                </div>
              </div>
            </div>
            
            <div className={styles.heroVisual}>
              <div className={styles.dashboardPreview}>
                <div className={styles.previewHeader}>
                  <div className={styles.previewDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className={styles.previewTitle}>Go3net HR Dashboard</span>
                </div>
                <div className={styles.previewContent}>
                  <div className={styles.previewSidebar}>
                    <div className={styles.previewLogo}></div>
                    <div className={styles.previewNav}>
                      <div className={styles.previewNavItem}></div>
                      <div className={styles.previewNavItem}></div>
                      <div className={styles.previewNavItem}></div>
                    </div>
                  </div>
                  <div className={styles.previewMain}>
                    <div className={styles.previewStats}>
                      <div className={styles.previewStatCard}></div>
                      <div className={styles.previewStatCard}></div>
                      <div className={styles.previewStatCard}></div>
                    </div>
                    <div className={styles.previewChart}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Everything You Need</h2>
            <p className={styles.sectionDescription}>
              Powerful features designed to streamline your HR operations and boost productivity.
            </p>
          </div>
          
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={`${styles.featureIcon} ${styles[`color${feature.color.charAt(0).toUpperCase() + feature.color.slice(1)}`]}`}>
                  <feature.icon size={24} />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonials}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Trusted by Industry Leaders</h2>
            <p className={styles.sectionDescription}>
              See what our customers say about Go3net HR Management System.
            </p>
          </div>
          
          <div className={styles.testimonialsGrid}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className={styles.testimonialCard}>
                <div className={styles.testimonialRating}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className={styles.testimonialStar} />
                  ))}
                </div>
                <p className={styles.testimonialContent}>"{testimonial.content}"</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className={styles.testimonialName}>{testimonial.name}</div>
                    <div className={styles.testimonialRole}>{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Transform Your HR Operations?</h2>
            <p className={styles.ctaDescription}>
              Join thousands of companies already using Go3net HR Management System.
            </p>
            <div className={styles.ctaActions}>
              <Link to="/register">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={20} />}>
                  Start Your Free Trial
                </Button>
              </Link>
              <div className={styles.ctaNote}>
                <CheckCircle size={16} className={styles.ctaNoteIcon} />
                <span>No credit card required • 14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <div className={styles.logoIcon}>G3</div>
                <div className={styles.logoText}>
                  <span className={styles.logoTextBlue}>Go3</span>
                  <span className={styles.logoTextGreen}>NET</span>
                </div>
              </div>
              <p className={styles.footerDescription}>
                Empowering businesses with modern HR management solutions.
              </p>
            </div>
            
            <div className={styles.footerLinks}>
              <div className={styles.footerSection}>
                <h4 className={styles.footerSectionTitle}>Product</h4>
                <Link to="/features" className={styles.footerLink}>Features</Link>
                <Link to="/pricing" className={styles.footerLink}>Pricing</Link>
                <Link to="/security" className={styles.footerLink}>Security</Link>
              </div>
              
              <div className={styles.footerSection}>
                <h4 className={styles.footerSectionTitle}>Company</h4>
                <Link to="/about" className={styles.footerLink}>About Us</Link>
                <Link to="/contact" className={styles.footerLink}>Contact</Link>
                <Link to="/careers" className={styles.footerLink}>Careers</Link>
              </div>
              
              <div className={styles.footerSection}>
                <h4 className={styles.footerSectionTitle}>Support</h4>
                <Link to="/help" className={styles.footerLink}>Help Center</Link>
                <Link to="/docs" className={styles.footerLink}>Documentation</Link>
                <Link to="/api" className={styles.footerLink}>API</Link>
              </div>
            </div>
          </div>
          
          <div className={styles.footerBottom}>
            <p className={styles.footerCopyright}>
              © 2024 Go3net Technologies. All rights reserved.
            </p>
            <div className={styles.footerBottomLinks}>
              <Link to="/privacy" className={styles.footerBottomLink}>Privacy Policy</Link>
              <Link to="/terms" className={styles.footerBottomLink}>Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ModernLandingPage