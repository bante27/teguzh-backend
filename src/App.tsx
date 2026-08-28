import React, { useState, useEffect, useCallback } from 'react';
import {
    Bus, MapPin, Phone, CreditCard, CheckCircle2, ShieldCheck,
    Clock, ArrowRight, AlertCircle, Loader2, Navigation,
    Smartphone, Sparkles, Check, RefreshCw
} from 'lucide-react';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState<'book' | 'checkout' | 'success'>('book');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const apiBase = 'http://localhost:5000';

    const [busId, setBusId] = useState<string>('651234567890abcdef123456');
    const [startPoint, setStartPoint] = useState<string>('');
    const [dropOffPoint, setDropOffPoint] = useState<string>('');
    const [passengerPhone, setPassengerPhone] = useState<string>('+251911223344');

    const [fareData, setFareData] = useState<{ distanceKm?: number; fareAmount?: number; currency?: string } | null>(null);

    const [bookingData, setBookingData] = useState<{
        ticketToken?: string;
        fareAmount?: number;
        paymentUrl?: string;
        redirectUrl?: string;
    } | null>(null);

    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const bId = params.get('busId');
        if (bId) setBusId(bId);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Debounced live fare estimation calling exact backend endpoint
    const fetchFare = useCallback(async (start: string, drop: string) => {
        if (!start.trim() || !drop.trim()) {
            setFareData(null);
            return;
        }
        try {
            const res = await fetch(`${apiBase}/api/passenger/estimate-fare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startPoint: start.trim(), dropOffPoint: drop.trim() })
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.success) {
                setFareData({
                    distanceKm: data.distanceKm,
                    fareAmount: data.fareAmount,
                    currency: data.currency || 'ETB'
                });
            }
        } catch {
            // Non-blocking estimation failure
        }
    }, [apiBase]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (startPoint && dropOffPoint) {
                fetchFare(startPoint, dropOffPoint);
            }
        }, 400);
        return () => clearTimeout(handler);
    }, [startPoint, dropOffPoint, fetchFare]);

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passengerPhone || !startPoint || !dropOffPoint) {
            setError('Please complete all required fields.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${apiBase}/api/passenger/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    busId,
                    startPoint: startPoint.trim(),
                    dropOffPoint: dropOffPoint.trim(),
                    passengerPhone: passengerPhone.trim()
                })
            });

            if (!res.ok) throw new Error('Booking failed from API.');

            const data = await res.json();
            if (data.success) {
                setBookingData({
                    ticketToken: data.ticketToken,
                    fareAmount: data.fareAmount || fareData?.fareAmount || 15.00,
                    paymentUrl: data.paymentUrl || '#'
                });
                setCurrentScreen('checkout');
            } else {
                throw new Error(data.message || 'Booking unsuccessful.');
            }
        } catch (err: any) {
            setError(err.message || 'Unable to connect to Teguzh backend server.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySimulate = async () => {
        if (!bookingData || !bookingData.ticketToken) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${apiBase}/api/passenger/verify-simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: bookingData.ticketToken
                })
            });

            if (!res.ok) throw new Error('Verification failed.');

            const data = await res.json();
            if (data.success) {
                setBookingData(prev => prev ? { ...prev, redirectUrl: data.redirectUrl } : null);
                setCurrentScreen('success');
            } else {
                throw new Error('Verification response unsuccessful.');
            }
        } catch (err: any) {
            setError(err.message || 'Payment verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-3 font-sans relative overflow-hidden">
            {/* Subtle animated background hue for success screen / ambient effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 via-slate-900 to-cyan-950/20 animate-pulse pointer-events-none" />

            <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative z-10">

                {/* Smart Compact Header */}
                <header className="bg-emerald-600 px-4 py-3 flex items-center justify-between text-white shadow-md">
                    <div className="flex items-center space-x-2">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <Bus className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm tracking-wide flex items-center gap-1">
                                Teguzh <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                            </h1>
                            <p className="text-[10px] text-emerald-100">Live Database Passenger Portal</p>
                        </div>
                    </div>
                    <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded font-mono border border-emerald-500/30">API Connected</span>
                </header>

                {/* Main Content */}
                <main className="p-4 flex flex-col space-y-3">
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 flex items-center space-x-2 text-rose-300 text-xs">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* SCREEN 1: Station Selection & Fare Estimation Screen (/book) */}
                    {currentScreen === 'book' && (
                        <div className="flex flex-col space-y-3">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                                <span className="text-slate-400 flex items-center gap-1">
                                    <Navigation className="w-3 h-3 text-emerald-400" /> Bus ID:
                                </span>
                                <span className="font-mono text-emerald-400 font-semibold truncate max-w-[180px]">{busId}</span>
                            </div>

                            <form onSubmit={handleBook} className="space-y-3 flex flex-col">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-emerald-400" /> Start Point (Database)
                                    </label>
                                    <input
                                        type="text"
                                        value={startPoint}
                                        onChange={(e) => setStartPoint(e.target.value)}
                                        placeholder="e.g. Bole"
                                        required
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-cyan-400" /> Drop-Off Point (Database)
                                    </label>
                                    <input
                                        type="text"
                                        value={dropOffPoint}
                                        onChange={(e) => setDropOffPoint(e.target.value)}
                                        placeholder="e.g. Piasa"
                                        required
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                                        <Phone className="w-3 h-3 text-amber-400" /> Passenger Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={passengerPhone}
                                        onChange={(e) => setPassengerPhone(e.target.value)}
                                        placeholder="+251911223344"
                                        required
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500 transition"
                                    />
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] text-slate-400">Calculated Fare</span>
                                        <span className="text-[10px] text-emerald-400 font-mono">
                                            {fareData ? 'Live DB Estimate' : 'Enter stations above'}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <div>
                                            <span className="text-lg font-black text-white font-mono">
                                                {fareData?.fareAmount !== undefined ? fareData.fareAmount.toFixed(2) : '0.00'}
                                            </span>
                                            <span className="text-[10px] text-emerald-400 font-semibold ml-1">{fareData?.currency || 'ETB'}</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            {fareData?.distanceKm !== undefined ? `${fareData.distanceKm} km` : '-- km'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !fareData}
                                    className={`w-full font-semibold py-2.5 px-4 rounded-xl text-xs shadow flex items-center justify-center space-x-1.5 transition ${fareData && !loading
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        }`}
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (
                                        <>
                                            <Smartphone className="w-4 h-4" />
                                            <span>Pay with Telebirr</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* SCREEN 2: Telebirr H5 Checkout Screen (/checkout) */}
                    {currentScreen === 'checkout' && bookingData && (
                        <div className="flex flex-col space-y-3">
                            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3 text-center">
                                <CreditCard className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                                <h2 className="text-xs font-bold text-white">Telebirr H5 Checkout</h2>
                                <p className="text-[10px] text-slate-400">Secure payment gateway session</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
                                <div className="flex justify-between py-0.5 border-b border-slate-800">
                                    <span className="text-slate-400 text-[11px]">Merchant</span>
                                    <span className="font-semibold text-slate-200">Teguzh Transit PLC</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-800">
                                    <span className="text-slate-400 text-[11px]">Ticket Token</span>
                                    <span className="font-mono text-emerald-400 truncate max-w-[160px]">{bookingData.ticketToken}</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-800">
                                    <span className="text-slate-400 text-[11px]">Route</span>
                                    <span className="font-medium text-slate-200">{startPoint} ➔ {dropOffPoint}</span>
                                </div>
                                <div className="flex justify-between pt-0.5 text-xs font-bold">
                                    <span className="text-slate-300">Amount</span>
                                    <span className="text-emerald-400 font-mono">{(bookingData.fareAmount || 0).toFixed(2)} ETB</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-1">
                                <button
                                    onClick={handleVerifySimulate}
                                    disabled={loading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow flex items-center justify-center space-x-1.5 transition cursor-pointer"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span>Confirm & Pay {(bookingData.fareAmount || 0).toFixed(2)} ETB</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setCurrentScreen('book')}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium py-2 rounded-xl border border-slate-800 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SCREEN 3: Verified Boarding Pass Screen (/success) */}
                    {currentScreen === 'success' && bookingData && (
                        <div className="flex flex-col space-y-3">
                            <div className="bg-emerald-600 rounded-xl p-3 text-white flex items-center justify-between shadow">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                    <div>
                                        <span className="px-2 py-0.5 bg-white text-emerald-800 font-black text-[10px] rounded-full uppercase tracking-wider shadow-sm">
                                            [ PAID & VERIFIED ]
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[11px] font-mono font-bold bg-emerald-700/60 px-2 py-0.5 rounded">
                                    {bookingData.ticketToken?.substring(0, 10)}...
                                </span>
                            </div>

                            <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3 text-xs space-y-2">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Security Pass
                                    </span>
                                    <span className="text-slate-200 font-mono text-[11px] flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                        <Clock className="w-3 h-3 text-cyan-400 animate-pulse" /> {currentTime.toLocaleTimeString()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                        <span className="text-slate-400 block text-[9px]">From</span>
                                        <span className="font-semibold text-white truncate block">{startPoint}</span>
                                    </div>
                                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                        <span className="text-slate-400 block text-[9px]">To</span>
                                        <span className="font-semibold text-white truncate block">{dropOffPoint}</span>
                                    </div>
                                </div>

                                <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Fare Paid:</span>
                                        <span className="text-emerald-400 font-bold">{(bookingData.fareAmount || 0).toFixed(2)} ETB</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Token ID:</span>
                                        <span className="text-slate-200 font-mono truncate max-w-[150px]">{bookingData.ticketToken}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center">
                                <p className="text-[11px] text-cyan-300 font-medium">
                                    Show this live boarding pass to the bus conductor.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setCurrentScreen('book');
                                    setBookingData(null);
                                    setStartPoint('');
                                    setDropOffPoint('');
                                    setPassengerPhone('+251911223344');
                                    setFareData(null);
                                }}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1 border border-slate-800 transition cursor-pointer"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>Book Another Trip</span>
                            </button>
                        </div>
                    )}
                </main>

                <footer className="bg-slate-950 border-t border-slate-900 py-2 text-center text-[10px] text-slate-500">
                    Teguzh Transit • <span className="text-emerald-400 font-mono">{apiBase}</span>
                </footer>
            </div>
        </div>
    );
}
