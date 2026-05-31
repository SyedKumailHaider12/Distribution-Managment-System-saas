import { Building2, Package, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-black text-blue-500">AzanTech DMS</h1>
        <div className="flex gap-4">
          <Link href="/login" className="px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-all">Login</Link>
          <Link href="/signup" className="px-6 py-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition-all">Sign Up</Link>
        </div>
      </nav>
      
      <header className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-6xl font-black mb-6 leading-tight">Advanced Distribution Management <br /><span className="text-blue-500">For Modern Enterprises</span></h2>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">Complete ERP solution with multi-tenant SaaS architecture, inventory batch tracking, HR management, and intelligent analytics.</p>
        <Link href="/signup" className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:scale-105 transition-transform">Get Started Today</Link>
      </header>
      
      <section className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Package, title: 'Smart Inventory', desc: 'Real-time FEFO batch management & automated stock alerts.' },
          { icon: Users, title: 'Staff & HR', desc: 'Complete employee lifecycle management, roles, and payroll.' },
          { icon: ShieldCheck, title: 'Secure Multi-Tenant', desc: 'Isolated data environments for every organization.' }
        ].map((feature, i) => (
          <div key={i} className="bg-slate-800 p-8 rounded-3xl border border-slate-700">
            <feature.icon className="w-12 h-12 text-blue-500 mb-6" />
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
