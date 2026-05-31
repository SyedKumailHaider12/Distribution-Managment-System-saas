"use client";

import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail, MapPin, Phone, Instagram, Facebook } from 'lucide-react';

export const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                AZ
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                AzanTechSolutions
              </span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Empowering healthcare and businesses with enterprise-grade software solutions focused on integrity and performance.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/profile.php?id=61587677720551" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.linkedin.com/in/syedkumailhaiderrizvi" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/azantechsolutions/" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://github.com/azantechsolutions/" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6 text-sm uppercase tracking-widest">Products</h4>
            <ul className="space-y-4">
              <li><Link href="/#products" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Hospital Management</Link></li>
              <li><Link href="/#products" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Pharmacy Manager</Link></li>
              <li><Link href="/#products" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Accounts Management</Link></li>
              <li><Link href="/#products" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Web Development</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6 text-sm uppercase tracking-widest">Resources</h4>
            <ul className="space-y-4">
              <li><Link href="/#about" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Documentation</Link></li>
              <li><Link href="/#about" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Help Center</Link></li>
              <li><Link href="/#pricing" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/#pricing" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6 text-sm uppercase tracking-widest">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-indigo-500 mt-0.5" />
                <span>Pindi Bhattian, Hafizabad, Punjab, Pakistan</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <Phone className="w-4 h-4 text-indigo-500" />
                <span>+92 332 0638672</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <Mail className="w-4 h-4 text-indigo-500" />
                <span>azantechsolutions@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">
            © {currentYear} AzanTechSolutions. Developed by Syed Kumail Haider Rizvi.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
