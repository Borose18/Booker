"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatTime } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string | null;
};

type Step = "service" | "datetime" | "details" | "confirm";

const STEP_LABELS: Record<Step, string> = {
  service: "Select Service",
  datetime: "Pick Date & Time",
  details: "Your Details",
  confirm: "Confirm",
};

const STEPS: Step[] = ["service", "datetime", "details", "confirm"];

export default function BookingPage() {
  const [step, setStep] = useState<Step>("service");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [calendarStart, setCalendarStart] = useState<Date>(startOfDay(new Date()));

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ id: string } | null>(null);

  const [businessName, setBusinessName] = useState("Booker");

  useEffect(() => {
    fetch("/api/services?active=true")
      .then((r) => r.json())
      .then(setServices);
    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => d.businessName && setBusinessName(d.businessName));
  }, []);

  const fetchSlots = useCallback(async (date: string, serviceId: string) => {
    setSlotsLoading(true);
    setAvailableSlots([]);
    try {
      const res = await fetch(`/api/slots?date=${date}&serviceId=${serviceId}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchSlots(selectedDate, selectedService.id);
    }
  }, [selectedDate, selectedService, fetchSlots]);

  const currentStepIndex = STEPS.indexOf(step);

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const validateDetails = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.name = "Name is required";
    if (!customerEmail.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
      errs.email = "Enter a valid email address";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleDetailsNext = () => {
    if (validateDetails()) goNext();
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          customerName,
          customerEmail,
          customerPhone,
          date: selectedDate,
          startTime: selectedTime,
          notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to book. Please try again.");
        return;
      }
      const data = await res.json();
      setBookingResult(data);
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingResult) {
    return <ConfirmationScreen
      customerName={customerName}
      serviceName={selectedService?.name || ""}
      date={selectedDate}
      startTime={selectedTime}
      customerEmail={customerEmail}
      businessName={businessName}
    />;
  }

  const calendarDays = Array.from({ length: 14 }, (_, i) => addDays(calendarStart, i));
  const today = startOfDay(new Date());

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Calendar size={12} className="text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">{businessName}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < currentStepIndex
                    ? "bg-indigo-600 text-white"
                    : i === currentStepIndex
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                    : "bg-slate-200 text-slate-500"
                }`}>
                  {i < currentStepIndex ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 w-8 sm:w-16 transition-all ${i < currentStepIndex ? "bg-indigo-600" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
          <h1 className="text-xl font-bold text-slate-900">{STEP_LABELS[step]}</h1>
        </div>

        {/* Step: Service Selection */}
        {step === "service" && (
          <div className="space-y-3">
            {services.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Calendar size={40} className="mx-auto mb-3 opacity-40" />
                <p>No services available yet.</p>
              </div>
            ) : (
              services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setSelectedDate("");
                    setSelectedTime("");
                    goNext();
                  }}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all hover:border-indigo-300 hover:shadow-sm ${
                    selectedService?.id === service.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-base mb-1">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-slate-500 leading-relaxed">{service.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={13} />
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-bold text-slate-900">{formatCurrency(service.price)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step: Date & Time */}
        {step === "datetime" && selectedService && (
          <div className="space-y-6">
            {/* Service summary */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-900">{selectedService.name}</p>
                <p className="text-xs text-indigo-600 mt-0.5">{selectedService.duration} min · {formatCurrency(selectedService.price)}</p>
              </div>
              <button onClick={goBack} className="text-xs text-indigo-600 hover:underline">Change</button>
            </div>

            {/* Date picker */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">Select a Date</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCalendarStart((d) => {
                      const prev = addDays(d, -7);
                      return isBefore(prev, today) ? today : prev;
                    })}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30"
                    disabled={!isBefore(today, calendarStart)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCalendarStart((d) => addDays(d, 7))}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isPast = isBefore(day, today);
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      disabled={isPast}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedTime("");
                      }}
                      className={`flex flex-col items-center p-2 rounded-xl text-xs font-medium transition-all ${
                        isPast
                          ? "opacity-30 cursor-not-allowed"
                          : isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "hover:bg-indigo-50 text-slate-700 border border-slate-200"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-70">{format(day, "EEE")}</span>
                      <span className="text-sm">{format(day, "d")}</span>
                      <span className="text-[9px] opacity-60">{format(day, "MMM")}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-3">
                  Available Times for {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d")}
                </h2>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8 text-slate-400">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading available times...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
                    <Clock size={28} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">No available slots on this day.</p>
                    <p className="text-xs text-slate-400 mt-1">Try selecting a different date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2.5 px-3 rounded-lg text-sm font-medium text-center transition-all ${
                          selectedTime === slot
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ChevronLeft size={16} /> Back
              </Button>
              <Button
                onClick={goNext}
                disabled={!selectedDate || !selectedTime}
                className="flex-1"
              >
                Continue <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Customer Details */}
        {step === "details" && (
          <div className="space-y-5">
            {/* Booking summary */}
            <div className="bg-slate-100 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Service</span>
                <span className="font-medium text-slate-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-900">
                  {selectedDate && format(new Date(selectedDate + "T12:00:00"), "EEE, MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time</span>
                <span className="font-medium text-slate-900">{selectedTime && formatTime(selectedTime)}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700">Your Information</h2>
              </div>
              <Input
                label="Full Name"
                id="name"
                required
                placeholder="Jane Smith"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                error={errors.name}
              />
              <Input
                label="Email Address"
                id="email"
                type="email"
                required
                placeholder="jane@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                error={errors.email}
              />
              <Input
                label="Phone Number"
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="notes" className="text-sm font-medium text-slate-700">
                  Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Any special requests or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ChevronLeft size={16} /> Back
              </Button>
              <Button onClick={handleDetailsNext} className="flex-1">
                Review Booking <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && selectedService && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">Booking Summary</p>
                <h2 className="text-white text-xl font-bold">{selectedService.name}</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Date</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedDate && format(new Date(selectedDate + "T12:00:00"), "EEE, MMM d")}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Time</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedTime && formatTime(selectedTime)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Duration</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedService.duration} min</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Price</p>
                    <p className="text-sm font-bold text-indigo-700">{formatCurrency(selectedService.price)}</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-700">{customerName}</span>
                  </div>
                  <p className="text-xs text-slate-400 pl-5">{customerEmail}</p>
                  {customerPhone && <p className="text-xs text-slate-400 pl-5">{customerPhone}</p>}
                  {notes && <p className="text-xs text-slate-500 pl-5 italic">&quot;{notes}&quot;</p>}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">
              A confirmation will be sent to <strong>{customerEmail}</strong>
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1" disabled={submitting}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1" loading={submitting}>
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ConfirmationScreen({
  customerName,
  serviceName,
  date,
  startTime,
  customerEmail,
  businessName,
}: {
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  customerEmail: string;
  businessName: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
            <Calendar size={12} className="text-white" />
          </div>
          <span className="font-semibold text-slate-900 text-sm">{businessName}</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re all set!</h1>
          <p className="text-slate-500 mb-8">
            Your appointment has been confirmed. A confirmation email has been sent to{" "}
            <span className="font-medium text-slate-700">{customerEmail}</span>.
          </p>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left space-y-3 mb-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Booking Details</h2>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Name</span>
              <span className="font-medium text-slate-900">{customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Service</span>
              <span className="font-medium text-slate-900">{serviceName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-900">
                {format(new Date(date + "T12:00:00"), "EEEE, MMMM d, yyyy")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Time</span>
              <span className="font-medium text-slate-900">{formatTime(startTime)}</span>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
