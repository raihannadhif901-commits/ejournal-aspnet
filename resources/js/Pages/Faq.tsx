import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronDown, ArrowLeft } from 'lucide-react';
import Lenis from 'lenis';

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

function FAQItem({ question, answer, isOpen, onClick }: FAQItemProps) {
    return (
        <div className="border-b border-[#2C2520]/10 py-5">
            <button
                className="w-full flex justify-between items-center text-left py-2 focus:outline-none group"
                onClick={onClick}
            >
                <span className="text-serif text-lg font-bold text-[#2C2520] group-hover:text-[#8C7A6B] transition-colors duration-300">
                    {question}
                </span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[#8C7A6B]"
                >
                    <ChevronDown className="w-5 h-5" />
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <p className="text-sm font-light text-[#2C2520]/75 leading-relaxed pt-3 pb-2 pr-8">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Faq() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    // Initialize Lenis Smooth Scrolling
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            smoothWheel: true,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    const faqs = [
        {
            question: "Bagaimana cara melakukan pemesanan?",
            answer: "Pilih koleksi hijab yang Anda inginkan dari katalog di beranda, lalu klik 'Tambah ke Keranjang'. Setelah selesai memilih, buka keranjang belanja, lengkapi data pengiriman Anda, lalu proses pemesanan. Sistem kami akan otomatis mencatat pesanan Anda dan mengarahkan Anda ke WhatsApp kami untuk konfirmasi pembayaran transfer bank."
        },
        {
            question: "Apakah ada biaya pengiriman?",
            answer: "Kabar gembira! Dalam rangka peluncuran koleksi eksklusif perdana Yopi Hijab, kami memberikan promo gratis ongkos kirim (Free Shipping) ke seluruh wilayah Indonesia tanpa ada minimum pembelanjaan."
        },
        {
            question: "Bagaimana metode pembayaran yang didukung?",
            answer: "Saat ini kami mendukung metode pembayaran transfer bank manual ke rekening resmi kami (BCA & Bank Mandiri) yang akan ditampilkan di akhir alur checkout. Setelah transfer selesai, Anda cukup mengirimkan bukti transfer tersebut via chat WhatsApp kami."
        },
        {
            question: "Berapa lama waktu proses dan pengiriman pesanan?",
            answer: "Seluruh pesanan diproses dalam 1-2 hari kerja setelah konfirmasi transfer bank kami terima. Kami menggunakan kurir terpercaya (J&T/JNE) dari Jakarta. Estimasi pengiriman ke wilayah Jabodetabek adalah 1-2 hari kerja, sementara untuk wilayah luar pulau berkisar antara 3-5 hari kerja."
        },
        {
            question: "Apakah saya bisa menukar produk yang sudah dibeli?",
            answer: "Tentu saja. Kepuasan Anda adalah prioritas utama Yopi Hijab. Kami memberikan jaminan retur/tukar produk dalam waktu 7 hari sejak paket diterima jika barang yang Anda terima terdapat cacat produksi, rusak, atau salah kirim dari pihak kami. Silakan hubungi kami langsung via WhatsApp dengan melampirkan video unboxing."
        },
        {
            question: "Bagaimana cara merawat hijab sutra premium Yopi?",
            answer: "Untuk menjaga serat sutra Mulberry tetap halus dan mengkilap mewah alami, kami menyarankan untuk mencucinya secara manual menggunakan tangan (hand wash) dengan air dingin dan sabun lembut/shampo. Hindari memeras terlalu kencang dan jemurlah di tempat yang teduh (tidak terkena sinar matahari langsung)."
        }
    ];

    return (
        <>
            <Head>
                <title>FAQ & Bantuan | Yopi Hijab</title>
                <meta name="description" content="Pertanyaan umum tentang pemesanan, pengiriman gratis ongkir, cara merawat hijab, dan garansi penukaran Yopi Hijab." />
            </Head>

            <div className="min-h-screen bg-[#FAF8F5] text-[#2C2520] selection:bg-[#D4C5B9] selection:text-[#2C2520]">
                {/* ELEGANT HEADER */}
                <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#2C2520]/5 px-6 lg:px-16 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-2 text-xs font-semibold tracking-widest text-[#2C2520]/80 hover:text-[#2C2520] transition group">
                            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                            <span>KEMBALI KE BERANDA</span>
                        </Link>

                        <Link href="/" className="flex flex-col items-center">
                            <span className="text-serif text-2xl lg:text-3xl font-extrabold tracking-[0.25em] text-[#2C2520]">
                                YOPI
                            </span>
                            <span className="text-[9px] tracking-[0.5em] font-medium text-[#8C7A6B] -mt-1 uppercase">
                                Hijab Luxury
                            </span>
                        </Link>

                        <div className="w-32"></div> {/* Spacer for symmetry */}
                    </div>
                </header>

                {/* MAIN CONTENT AREA */}
                <main className="max-w-4xl mx-auto py-16 px-6 md:py-24">
                    <div className="text-center space-y-4 mb-16">
                        <div className="flex items-center justify-center space-x-2 text-[#8C7A6B]">
                            <span className="w-8 h-[1px] bg-[#8C7A6B]"></span>
                            <span className="text-xs uppercase tracking-[0.3em] font-semibold">CUSTOMER SUPPORT</span>
                            <span className="w-8 h-[1px] bg-[#8C7A6B]"></span>
                        </div>
                        <h1 className="text-serif text-4xl md:text-5xl font-extrabold text-[#2C2520]">
                            FAQ & Bantuan
                        </h1>
                        <p className="text-sm font-light text-[#2C2520]/65 max-w-md mx-auto leading-relaxed">
                            Temukan jawaban cepat mengenai proses pemesanan, gratis ongkir, cara pembayaran, dan panduan perawatan hijab premium kami.
                        </p>
                    </div>

                    {/* FAQ Items Card Container */}
                    <div className="bg-[#FAF8F5] border border-[#2C2520]/5 rounded-[2rem] p-6 md:p-10 shadow-sm shadow-[#2C2520]/5">
                        {faqs.map((faq, idx) => (
                            <FAQItem
                                key={idx}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openIndex === idx}
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            />
                        ))}
                    </div>
                </main>

                {/* ELEGANT FOOTER (Synchronized 4-Column Layout) */}
                <footer className="bg-[#2C2520] text-[#FAF8F5] py-16 px-6 lg:px-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
                        {/* Logo Column */}
                        <div className="col-span-2 md:col-span-1 space-y-4">
                            <span className="text-serif text-2xl font-bold tracking-[0.25em]">YOPI</span>
                            <p className="text-xs text-[#FAF8F5]/60 font-light leading-relaxed max-w-xs">
                                Butik hijab premium yang mendedikasikan seluruh karyanya untuk keanggunan, kenyamanan, dan pesona wanita muslimah modern.
                            </p>
                            <div className="flex items-center space-x-4 pt-2">
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#FAF8F5]/60 hover:text-[#D4C5B9] transition duration-300" aria-label="Instagram">
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                    </svg>
                                </a>
                                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-[#FAF8F5]/60 hover:text-[#D4C5B9] transition duration-300" aria-label="TikTok">
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.86 1.04 2.05 1.74 3.38 2 .02 1.34.02 2.68.02 4.02-1.29-.02-2.55-.41-3.62-1.12-.91-.61-1.63-1.48-2.07-2.49-.02 2.6-.01 5.2-.02 7.8-.02 1.62-.4 3.25-1.14 4.7-1.07 2.05-3.08 3.59-5.38 4.05-2.23.47-4.63.14-6.62-1.06C.56 21.03-.4 18.73-.13 16.32c.23-2.2 1.47-4.22 3.39-5.33 1.59-.92 3.44-1.27 5.26-1 .01 1.39.02 2.77.01 4.16-1.1-.38-2.31-.22-3.27.46-.86.58-1.43 1.54-1.54 2.58-.19 1.4.52 2.83 1.77 3.51 1.05.58 2.32.58 3.37-.01 1-.57 1.63-1.65 1.66-2.82.02-5.97.01-11.95.02-17.92.01-.06.01-.12.01-.17z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Shopping Column */}
                        <div className="space-y-4">
                            <h4 className="text-xs tracking-[0.2em] font-bold uppercase text-[#D4C5B9]">SHOPPING</h4>
                            <ul className="space-y-2 text-xs font-light text-[#FAF8F5]/70">
                                <li><Link href="/#shop" className="hover:text-white transition">Mulberry Silk</Link></li>
                                <li><Link href="/#shop" className="hover:text-white transition">Crinkle Chiffon</Link></li>
                                <li><Link href="/#shop" className="hover:text-white transition">Modal Jersey</Link></li>
                                <li><Link href="/#shop" className="hover:text-white transition">Linen Voile</Link></li>
                            </ul>
                        </div>

                        {/* Customer Support Column */}
                        <div className="space-y-4">
                            <h4 className="text-xs tracking-[0.2em] font-bold uppercase text-[#D4C5B9]">HELP & CUSTOMER</h4>
                            <ul className="space-y-2 text-xs font-light text-[#FAF8F5]/70">
                                <li><Link href="/faq" className="hover:text-white transition">FAQ / Bantuan</Link></li>
                            </ul>
                        </div>

                        {/* Customer Care Column */}
                        <div className="space-y-4">
                            <h4 className="text-xs tracking-[0.2em] font-bold uppercase text-[#D4C5B9]">CUSTOMER CARE</h4>
                            <p className="text-xs text-[#FAF8F5]/70 font-light leading-relaxed">
                                WhatsApp: <a href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer" className="text-[#D4C5B9] hover:underline">0812-3456-7890</a><br />
                                Email: <a href="mailto:support@yopihijab.com" className="text-[#D4C5B9] hover:underline">support@yopihijab.com</a>
                            </p>
                            <p className="text-xs text-[#FAF8F5]/50 font-light">
                                Senin - Sabtu: 09.00 - 18.00 WIB
                            </p>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#FAF8F5]/40 font-light">
                        <p>© {new Date().getFullYear()} Yopi Hijab. Crafted with Love in Jakarta.</p>
                        <p className="mt-2 sm:mt-0 tracking-[0.15em]">ELEGANCE · COMFORT · MODESTY</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
