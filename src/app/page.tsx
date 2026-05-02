import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Clock, Calendar, CheckCircle2, Star, Phone, Mail, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

async function getBusinessData() {
  const [settings, services] = await Promise.all([
    prisma.businessSettings.findFirst(),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
  ]);
  return { settings, services };
}

export default async function LandingPage() {
  const { settings, services } = await getBusinessData();

  const businessName = settings?.businessName || "Our Business";
  const tagline = settings?.tagline || "Professional services tailored to your needs";
  const description =
    settings?.description ||
    "We provide top-quality services with flexible scheduling. Book your appointment online in under 60 seconds.";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">{businessName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700 transition-colors hidden sm:block">
              Admin
            </Link>
            <Link
              href="/book"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Book Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 sm:py-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-100 opacity-50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-100 opacity-50 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full border border-indigo-100 mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Now accepting online bookings
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight mb-4">
            {businessName}
          </h1>
          <p className="text-xl text-slate-600 mb-4 font-medium">{tagline}</p>
          <p className="text-base text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 text-base"
            >
              Book an Appointment
            </Link>
            <a
              href="#services"
              className="w-full sm:w-auto text-slate-600 hover:text-slate-900 font-medium px-8 py-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-base bg-white"
            >
              View Services
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
            Book in 3 easy steps
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              {
                step: "1",
                icon: <Calendar size={20} />,
                title: "Choose a Service",
                desc: "Browse our services and pick what works for you.",
              },
              {
                step: "2",
                icon: <Clock size={20} />,
                title: "Pick a Time",
                desc: "Select a date and available time slot that fits your schedule.",
              },
              {
                step: "3",
                icon: <CheckCircle2 size={20} />,
                title: "Get Confirmed",
                desc: "Receive an instant confirmation with all your booking details.",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    {icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Our Services</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Choose from our range of professional services, all tailored to you.
            </p>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-40" />
              <p>Services coming soon. Check back shortly!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <Star size={18} className="text-indigo-600" />
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Clock size={14} />
                    <span>{service.duration} min</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {services.length > 0 && (
            <div className="text-center mt-10">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-sm text-sm"
              >
                Book an Appointment
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-indigo-200 mb-8 max-w-md mx-auto">
            Book your appointment online in under 60 seconds. No account required.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold px-8 py-4 rounded-xl transition-all shadow-lg text-base"
          >
            <Calendar size={18} />
            Book Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
                <Calendar size={13} className="text-white" />
              </div>
              <span className="font-semibold text-white">{businessName}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5">
              {settings?.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Mail size={13} />
                  {settings.email}
                </a>
              )}
              {settings?.phone && (
                <a href={`tel:${settings.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Phone size={13} />
                  {settings.phone}
                </a>
              )}
              {settings?.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {settings.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
