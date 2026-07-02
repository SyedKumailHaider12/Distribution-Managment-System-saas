"use client";

import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Mail, MapPin, Phone, Instagram, Facebook } from 'lucide-react';

export const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="contact"
      className="pt-16 pb-8 transition-colors duration-300"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid rgba(99,102,241,0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Company Info */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                AZ
              </div>
              <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
                AzanTechSolutions
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Empowering healthcare and businesses with enterprise-grade software solutions focused on integrity and performance.
            </p>
            <div className="flex items-center gap-3">
              {[
                { href: "https://www.facebook.com/profile.php?id=61587677720551", Icon: Facebook },
                { href: "https://www.linkedin.com/in/syedkumailhaiderrizvi", Icon: Linkedin },
                { href: "https://www.instagram.com/azantechsolutions/", Icon: Instagram },
                { href: "https://github.com/azantechsolutions/", Icon: Github },
              ].map(({ href, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-colors hover:text-indigo-500"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
              Products
            </h4>
            <ul className="space-y-4">
              {["Hospital Management", "Pharmacy Manager", "Accounts Management", "Web Development"].map((item) => (
                <li key={item}>
                  <Link
                    href="/#products"
                    className="text-sm transition-colors hover:text-indigo-500"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
              Resources
            </h4>
            <ul className="space-y-4">
              {[
                { label: "Documentation", href: "/#about" },
                { label: "Help Center", href: "/#about" },
                { label: "Privacy Policy", href: "/#pricing" },
                { label: "Terms of Service", href: "/#pricing" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:text-indigo-500"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>Pindi Bhattian, Hafizabad, Punjab, Pakistan</span>
              </li>
              <li className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>+92 332 0638672</span>
              </li>
              <li className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>azantechsolutions@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            © {currentYear} AzanTechSolutions. Developed by Syed Kumail Haider Rizvi.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-xs transition-colors hover:text-indigo-500"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
