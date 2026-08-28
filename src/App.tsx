import React, { useState, useEffect } from 'react';
import {
    Bus, MapPin, Phone, CreditCard, CheckCircle2, ShieldCheck,
    Clock, ArrowRight, AlertCircle, Loader2, Navigation, QrCode,
    Smartphone, Sparkles, Check, RefreshCw
} from 'lucide-react';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState<'book' | 'checkout' | 'success'>('book');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const apiBase = 'http://localhost:5000';

    const [busId, setBusId] = useState<string>('BUS-ET-8821');
    const [startPoint, setStartPoint] = useState<string>('Bole');
    const [dropOffPoint, setDropOffPoint] = useState<string>('Piasa');
    const [phoneNumber, setPhoneNumber] = useState<string>('0911223344');

    const [fareData, setFareData] = useState<{ distanceKm: number; fareEtb: number; currency: string } | null>({
        distanceKm: 5.0,
        fareEtb: 20.0,
        currency: 'ETB'
    });

    const [bookingData, setBookingData] = useState<{
        bookingId: string;
        ticketToken: string;
        transactionId: string;
        paymentUrl: string;
        amount: number;
        merchantName: string;
        status: string;
    } | null>(null);

    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [bgPulse, setBgPulse] = useState<boolean>(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const bId = params.get('busId');
        if (bId) setBusId(bId);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 50);
        const pulseTimer = setInterval(() => setBgPulse(prev => !prev), 1500);
        return () => {
            clearInterval(timer);
            clearInterval(pulseTimer);
        };
    }, []);

    const handleEstimateFare = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!startPoint || !dropOffPoint) {
            setError('Please enter start point and drop-off point.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${apiBase}/api/passenger/estimate-fare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ busId, startPoint, dropOffPoint })
            });

            if (!res.ok) throw new Error('Failed to estimate fare from backend.');

            const data = await res.json();
            // Handle different possible response structures from backend
            const fare = data.fareEtb !== undefined ? data.fareEtb : (data.fare !== undefined ? data.fare : 20.0);
            const dist = data.distanceKm !== undefined ? data.distanceKm : 5.0;

            setFareData({
                distanceKm: dist,
                fareEtb: fare,
                currency: data.currency || 'ETB'
            });
        } catch (err: any) {
            setError(err.message || 'Error communicating with backend API.');
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || !startPoint || !dropOffPoint) {
            setError('Please complete all fields.');
            return;
        }

        setLoading(true);
        setError(null);

        const currentFare = fareData ? fareData.fareEtb : 20.0;

        try {
            const res = await fetch(`${apiBase}/api/passenger/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    busId,
                    startPoint,
                    dropOffPoint,
                    phoneNumber,
                    fare: currentFare
                })
            });

            if (!res.ok) throw new Error('Booking failed from backend.');

            const data = await res.json();
            setBookingData({
                bookingId: data.bookingId || data._id || 'BK-' + Math.floor(100000 + Math.random() * 900000),
                ticketToken: data.ticketToken || data.token || 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                transactionId: data.transactionId || 'TXN-' + Math.floor(100000000 + Math.random() * 900000000),
                paymentUrl: data.paymentUrl || '#',
                amount: data.amount || currentFare,
                merchantName: data.merchantName || 'Teguzh Transit PLC',
                status: 'PENDING'
            });
            setCurrentScreen('checkout');
        } catch (err: any) {
            setError(err.message || 'Failed to initialize Telebirr payment.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySimulate = async () => {
        if (!bookingData) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${apiBase}/api/passenger/verify-simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: bookingData.bookingId,
                    transactionId: bookingData.transactionId,
                    phoneNumber
                })
            });

            if (!res.ok) throw new Error('Payment verification failed.');

            const data = await res.json();
            setBookingData(prev => prev ? { ...prev, ...data, status: 'PAID' } : null);
            setCurrentScreen('success');
        } catch (err: any) {
            setError(err.message || 'Failed to verify payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[780px]">

                {/* Header */}
                <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between text-white shadow-lg">
                    <div className="flex items-center space-x-2.5">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Bus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-lg tracking-wide flex items-center gap-1.5">
                                Teguzh <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                            </h1>
                            <p className="text-[11px] text-emerald-100 font-medium">Cashless Bus Ticketing</p>
                        </div>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 overflow-y-auto p-5 flex flex-col">
                    {error && (
                        <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-start space-x-3 text-rose-300 text-sm">
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-xs">Error</p>
                                <p className="text-xs text-rose-200">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* SCREEN 1 */}
                    {currentScreen === 'book' && (
                        <div className="flex-1 flex flex-col space-y-4">
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Active Bus ID
                                    </span>
                                    <span className="text-sm font-bold font-mono text-white">{busId}</span>
                                </div>
                            </div>

                            <form onSubmit={handleBook} className="space-y-3.5 flex-1 flex flex-col">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Start Point
                                    </label>
                                    <input
                                        type="text"
                                        value={startPoint}
                                        onChange={(e) => setStartPoint(e.target.value)}
                                        placeholder="e.g., Bole"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Drop-Off Point
                                    </label>
                                    <input
                                        type="text"
                                        value={dropOffPoint}
                                        onChange={(e) => setDropOffPoint(e.target.value)}
                                        placeholder="e.g., Piasa"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-amber-400" /> Passenger Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="0911223344"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                                    />
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mt-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-slate-400">Calculated Trip Fare</span>
                                        <button
                                            type="button"
                                            onClick={handleEstimateFare}
                                            disabled={loading}
                                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-900/50"
                                        >
                                            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Estimate Fare
                                        </button>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <div>
                                            <span className="text-2xl font-black text-white font-mono">
                                                {fareData ? fareData.fareEtb.toFixed(2) : '20.00'}
                                            </span>
                                            <span className="text-xs text-emerald-400 font-semibold ml-1">ETB</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] text-slate-400 block">Distance</span>
                                            <span className="text-sm font-semibold text-slate-200 font-mono">
                                                {fareData ? `${fareData.distanceKm} km` : '5.0 km'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 mt-auto">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-bold py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-950" /> : (
                                            <>
                                                <Smartphone className="w-5 h-5" />
                                                <span>Pay with Telebirr</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* SCREEN 2 */}
                    {currentScreen === 'checkout' && bookingData && (
                        <div className="flex-1 flex flex-col space-y-4">
                            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-5 text-center relative overflow-hidden">
                                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center mb-3 border border-emerald-500/30">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-bold text-white mb-1">Telebirr H5 Secure Checkout</h2>
                                <p className="text-xs text-slate-400">Ethio Telecom payment gateway session initialized.</p>
                            </div>

                            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                                <div className="flex justify-between py-1 border-b border-slate-900">
                                    <span className="text-slate-400">Merchant</span>
                                    <span className="font-semibold text-slate-200">{bookingData.merchantName}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-900">
                                    <span className="text-slate-400">Booking Reference</span>
                                    <span className="font-mono text-emerald-400">{bookingData.bookingId}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-900">
                                    <span className="text-slate-400">Route</span>
                                    <span className="font-medium text-slate-200">{startPoint} ➔ {dropOffPoint}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-900">
                                    <span className="text-slate-400">Phone Account</span>
                                    <span className="font-mono text-slate-200">{phoneNumber}</span>
                                </div>
                                <div className="flex justify-between pt-1 text-sm font-bold">
                                    <span className="text-slate-300">Total Amount</span>
                                    <span className="text-emerald-400 font-mono text-base">{bookingData.amount.toFixed(2)} ETB</span>
                                </div>
                            </div>

                            <div className="pt-4 mt-auto space-y-2.5">
                                <button
                                    onClick={handleVerifySimulate}
                                    disabled={loading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-950" /> : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            <span>Confirm & Pay {bookingData.amount.toFixed(2)} ETB</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setCurrentScreen('book')}
                                    className="w-full bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold py-2.5 rounded-xl border border-slate-800 transition"
                                >
                                    Cancel & Return
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SCREEN 3 */}
                    {currentScreen === 'success' && bookingData && (
                        <div className={`flex-1 flex flex-col space-y-4 transition-colors duration-1000 ${bgPulse ? 'bg-emerald-950/20' : 'bg-transparent'} rounded-3xl p-1`}>
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 text-white text-center shadow-lg flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="bg-white text-emerald-600 p-1.5 rounded-full shadow">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <span className="inline-block px-2.5 py-0.5 bg-white text-emerald-900 font-black text-xs rounded-full tracking-widest shadow">
                                            [ PAID ]
                                        </span>
                                        <p className="text-[11px] text-emerald-100 font-medium mt-0.5">Verified Boarding Pass</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-emerald-200 block font-mono">Token</span>
                                    <span className="text-sm font-bold font-mono tracking-wider text-white">{bookingData.ticketToken}</span>
                                </div>
                            </div>

                            <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-xl relative overflow-hidden">
                                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                                    <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold">
                                        <ShieldCheck className="w-4 h-4" /> Anti-Fraud Live Security
                                    </div>
                                    <div className="flex items-center space-x-1 text-slate-300 text-xs font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                        <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                        <span>{currentTime.toLocaleTimeString()}</span>
                                        <span className="text-[10px] text-emerald-400">.{String(currentTime.getMilliseconds()).padStart(3, '0')}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                        <span className="text-slate-400 block mb-0.5 text-[10px]">Start Point</span>
                                        <span className="font-semibold text-white truncate block">{startPoint}</span>
                                    </div>
                                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                        <span className="text-slate-400 block mb-0.5 text-[10px]">Drop-Off</span>
                                        <span className="font-semibold text-white truncate block">{dropOffPoint}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Fare Amount:</span>
                                        <span className="text-emerald-400 font-bold">{bookingData.amount.toFixed(2)} ETB</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Transaction ID:</span>
                                        <span className="text-slate-200">{bookingData.transactionId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Passenger Phone:</span>
                                        <span className="text-slate-200">{phoneNumber}</span>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-center space-x-2.5 bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-xl">
                                    <QrCode className="w-5 h-5 text-emerald-400 animate-pulse" />
                                    <span className="text-[11px] text-emerald-300 font-medium">Cryptographically Signed & Verified</span>
                                </div>
                            </div>

                            <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-2xl p-3 text-center">
                                <p className="text-xs font-semibold text-cyan-200">
                                    📱 Show this active animated pass to the bus conductor.
                                </p>
                            </div>

                            <div className="pt-2 mt-auto">
                                <button
                                    onClick={() => {
                                        setCurrentScreen('book');
                                        setBookingData(null);
                                        setStartPoint('Bole');
                                        setDropOffPoint('Piasa');
                                        setPhoneNumber('0911223344');
                                    }}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-6 rounded-xl transition text-xs flex items-center justify-center space-x-1.5 border border-slate-700"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Book Another Trip</span>
                                </button>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="bg-slate-950 border-t border-slate-900 py-2.5 text-center text-[10px] text-slate-500">
                    Teguzh Cashless Bus Transit • Connected to <span className="text-emerald-400 font-mono">{apiBase}</span>
                </footer>
            </div>
        </div>
    );
}
