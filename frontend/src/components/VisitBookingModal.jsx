import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, User, Phone, CheckCircle, ShieldCheck, AlertCircle, Building2, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

export default function VisitBookingModal({ isOpen, onClose, projects, defaultProject, onBookingSuccess }) {
  if (!isOpen) return null;

  const [projectId, setProjectId] = useState(defaultProject?.id || (projects[0]?.id || 1));
  
  // Default to tomorrow's date (or Monday if tomorrow is Sunday)
  const getInitialDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1); // skip Sunday
    }
    return d.toISOString().split('T')[0];
  };

  const [dateStr, setDateStr] = useState(getInitialDate());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(null);

  // Form inputs
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Load available slots whenever projectId or dateStr changes
  useEffect(() => {
    if (!projectId || !dateStr) return;

    // Check if selected date is a Sunday (0)
    const [y, m, d] = dateStr.split('-').map(Number);
    const selectedDateObj = new Date(y, m - 1, d);
    if (selectedDateObj.getDay() === 0) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      setSlotsError('Site visits are not conducted on Sundays. Please select a Monday through Saturday slot.');
      return;
    }

    setLoadingSlots(true);
    setSlotsError(null);
    setSelectedSlot(null);

    api.getAvailableSlots(projectId, dateStr)
      .then((data) => {
        setAvailableSlots(data.available_slots || []);
        if ((data.available_slots || []).length === 0) {
          setSlotsError('All slots are fully booked for this date. Please choose another date.');
        }
      })
      .catch((err) => {
        setSlotsError(err.message || 'Failed to load slots');
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [projectId, dateStr]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setSubmitError('Please choose an available appointment slot.');
      return;
    }

    const cleanPhone = buyerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setSubmitError('Please enter a valid 10-digit phone number.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await api.bookPublicVisit({
        name: buyerName.trim(),
        phone: cleanPhone,
        projectId: Number(projectId),
        slotDatetime: selectedSlot.slot_datetime,
        executiveId: selectedSlot.executive_id,
      });

      setBookingResult(result);
      if (onBookingSuccess) {
        onBookingSuccess(result);
      }
    } catch (err) {
      setSubmitError(err.message || 'Booking failed. Slot may have just been booked.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProjectObj = projects.find((p) => p.id === Number(projectId));

  // Format slot time for display
  const formatSlotTime = (dtStr) => {
    const d = new Date(dtStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white">
                Book a Verified Site Visit
              </h3>
              <p className="text-xs text-slate-400">
                Direct developer appointment with dedicated sales executive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {bookingResult ? (
            /* Success confirmation screen */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-serif font-bold text-white">
                  Site Visit Confirmed!
                </h4>
                <p className="text-sm text-slate-400 mt-1">
                  Your appointment has been registered in the Ahmedabad CRM system.
                </p>
              </div>

              {/* Appointment summary card */}
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 text-left space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Booking Reference</span>
                  <span className="font-mono font-bold text-gold-300">#SV-{bookingResult.id}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Property</span>
                  <span className="font-semibold text-white">{bookingResult.project_name}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Date & Time</span>
                  <span className="font-semibold text-gold-400">
                    {new Date(bookingResult.visit_datetime).toLocaleDateString([], {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at {formatSlotTime(bookingResult.visit_datetime)} IST
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Assigned Sales Executive</span>
                  <span className="font-semibold text-white">{bookingResult.executive_name}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Lead Status</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800/40">
                    {bookingResult.status}
                  </span>
                </div>
              </div>

              {/* DPDP guarantee pill */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Encrypted under DPDP Act 2023. An SMS reminder will be sent.</span>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-semibold text-sm transition-all"
              >
                Close & Return to Chat
              </button>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1: Project Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  1. Select Property
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {projects.map((p) => {
                    const isSelected = Number(projectId) === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProjectId(p.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-gold-500/10 border-gold-500 text-white shadow-sm'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {p.location.split(',')[0]}
                        </div>
                        <div className="text-[10px] text-gold-400 font-medium mt-1">
                          {p.price_range}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Date Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    2. Select Date (Mon – Sat)
                  </label>
                  <span className="text-[11px] text-slate-500">Sundays Closed</span>
                </div>
                <input
                  type="date"
                  value={dateStr}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                />
              </div>

              {/* Step 3: Available Slots Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    3. Choose Time Slot (IST)
                  </label>
                  {selectedSlot && (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Executive: {selectedSlot.executive_name}
                    </span>
                  )}
                </div>

                {loadingSlots ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <div className="inline-block w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mb-1"></div>
                    <div>Checking real-time executive availability...</div>
                  </div>
                ) : slotsError ? (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{slotsError}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot, index) => {
                      const isSelected = selectedSlot?.slot_datetime === slot.slot_datetime && selectedSlot?.executive_id === slot.executive_id;
                      const timeLabel = formatSlotTime(slot.slot_datetime);

                      return (
                        <button
                          key={`${slot.slot_datetime}-${slot.executive_id}-${index}`}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-gold-500 text-slate-950 font-bold border-gold-500 shadow-md shadow-gold-500/20'
                              : 'bg-slate-850 border-slate-700/80 text-slate-200 hover:border-gold-500/50 hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-xs font-semibold">{timeLabel}</div>
                          <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                            {slot.executive_name.split(' ')[0]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 4: Buyer Details (DPDP Compliant) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  4. Visitor Contact Details
                </label>

                <div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Full Name (e.g., Hardik Patel)"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit Mobile Number"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>

                {/* DPDP Privacy Badge */}
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-start gap-2 text-[11px] text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>DPDP Act 2023 Compliant:</strong> Your phone number is masked & encrypted (+91-XXXXX-XXXXX) to protect your personal data against marketing spam.
                  </span>
                </div>
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                  {submitError}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-gold-500/20 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Confirming Appointment...' : 'Confirm Site Visit Booking'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

