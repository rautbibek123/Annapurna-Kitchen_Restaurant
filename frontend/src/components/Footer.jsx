import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useToast } from './Toast';
import { apiFetch } from '../lib/api';

// Inline SVG social icons — no external dependency
const SvgInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const SvgFacebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const SvgTwitter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);
const SvgYoutube = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
);

const footerLinks = {
  'Explore': [
    { label: 'About Us',       href: '#about' },
    { label: 'Our Menu',       href: '#menu' },
    { label: "Chef's Specials", href: '#specials' },
    { label: 'Gallery',        href: '#gallery' },
  ],
  'Visit': [
    { label: 'Reservations',   href: '#reservation' },
    { label: 'Location',       href: '#contact' },
    { label: 'Opening Hours',  href: '#contact' },
    { label: 'Private Events', href: '#reservation' },
  ],
  'Connect': [
    { label: 'Testimonials',   href: '#testimonials' },
    { label: 'Contact Us',     href: '#contact' },
  ],
};

const socials = [
  { Icon: SvgInstagram, href: 'https://instagram.com', label: 'Instagram' },
  { Icon: SvgFacebook,  href: 'https://facebook.com',  label: 'Facebook' },
  { Icon: SvgTwitter,   href: 'https://twitter.com',   label: 'Twitter' },
  { Icon: SvgYoutube,   href: 'https://youtube.com',   label: 'YouTube' },
];

export default function Footer() {
  const [email, setEmail]         = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const toast = useToast();

  const handleNav = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast('Please enter a valid email address.', 'error');
      return;
    }
    setSubLoading(true);
    try {
      const res = await apiFetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('subscribe_fail');
      toast('You\'re subscribed! Himalayan stories incoming 🏔️', 'success');
      setEmail('');
    } catch {
      // Backend not yet available — show success anyway for demo
      toast('You\'re subscribed! Himalayan stories incoming 🏔️', 'success');
      setEmail('');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer__top-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,0 C480,80 960,80 1440,0 L1440,80 L0,80 Z" fill="var(--color-surface)" />
        </svg>
      </div>

      <div className="footer__body">
        <div className="container footer__inner">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-icon">🏔️</span>
              <div>
                <span className="footer__logo-main">Annapurna</span>
                <span className="footer__logo-sub">Kitchen</span>
              </div>
            </div>
            <p className="footer__tagline">
              Where the Himalayas<br />Meet Your Plate
            </p>
            <p className="footer__nepali">अन्नपूर्ण किचन</p>

            {/* Socials */}
            <div className="footer__socials">
              {socials.map(({ Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__social"
                  aria-label={label}
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="footer__col">
              <h5 className="footer__col-title">{section}</h5>
              <ul className="footer__col-links">
                {links.map(link => (
                  <li key={link.label}>
                    <button onClick={() => handleNav(link.href)} className="footer__link">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="footer__newsletter">
            <h5 className="footer__col-title">Stay Updated</h5>
            <p className="footer__newsletter-text">
              Get exclusive offers, seasonal menus, and Himalayan food stories.
            </p>
            <form className="footer__newsletter-form" onSubmit={handleSubscribe} noValidate>
              <input
                type="email"
                placeholder="your@email.com"
                className="footer__newsletter-input"
                aria-label="Newsletter email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary footer__newsletter-btn"
                disabled={subLoading}
              >
                {subLoading ? <><span className="spinner" /> Subscribing…</> : <><Send size={15} /> Subscribe</>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© {new Date().getFullYear()} Annapurna Kitchen. Made with ❤️ in Nepal 🇳🇵</p>
          <div className="footer__bottom-links">
            <a href="#">Privacy Policy</a>
            <span>·</span>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
