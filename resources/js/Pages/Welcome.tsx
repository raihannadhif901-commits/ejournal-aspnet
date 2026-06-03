import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingBag, 
    X, 
    Plus, 
    Minus, 
    ArrowRight, 
    Menu, 
    Check, 
    Info, 
    Heart, 
    Sparkles, 
    ShieldCheck, 
    RefreshCw 
} from 'lucide-react';
import Lenis from 'lenis';
import axios from 'axios';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    image: string;
    tag: string;
    description: string;
}

interface CartItem extends Product {
    quantity: number;
}

const staticProducts: Product[] = [
    {
        id: 1,
        name: "Luna Silk Scarf",
        category: "silk",
        price: 289000,
        image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop",
        tag: "Best Seller",
        description: "Dibuat dari 100% serat sutra mulberry murni. Draping yang jatuh dengan kilau mewah alami."
    },
    {
        id: 2,
        name: "Sofia Crinkled Chiffon",
        category: "chiffon",
        price: 189000,
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop",
        tag: "New In",
        description: "Chiffon crinkle premium yang super ringan. Ironless, adem, dan sangat praktis untuk hari sibuk Anda."
    },
    {
        id: 3,
        name: "Aura Premium Jersey",
        category: "jersey",
        price: 159000,
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
        tag: "Daily Choice",
        description: "Jersey modal premium dengan sensasi dingin instan. Meregang sempurna dan tegak seharian."
    },
    {
        id: 4,
        name: "Linen Cotton Voile",
        category: "cotton",
        price: 199000,
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",
        tag: "Essential",
        description: "Perpaduan serat linen organik dan katun voile halus. Sangat sejuk di iklim tropis."
    },
    {
        id: 5,
        name: "Zahra Pleated Satin",
        category: "silk",
        price: 299000,
        image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=600&auto=format&fit=crop",
        tag: "Limited",
        description: "Satin dengan lipatan mikro presisi tinggi yang memberikan efek kilau butik berkelas."
    },
    {
        id: 6,
        name: "Medina Silk Chiffon",
        category: "chiffon",
        price: 249000,
        image: "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?q=80&w=600&auto=format&fit=crop",
        tag: "Popular",
        description: "Campuran lembut sutra dan chiffon premium. Memeluk kontur wajah dengan anggun."
    }
];

const getProductImageUrl = (image: string) => {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
    }
    return `/storage/${image}`;
};

const stripHtml = (html?: string) => {
    if (!html) return '';
    // Strip HTML tags and replace HTML entities like &nbsp; or &amp; with clean text
    const text = html.replace(/<[^>]*>/g, '');
    return text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
};

export default function Welcome({ auth, products, featuredProduct }: PageProps & { products?: Product[], featuredProduct?: Product }) {
    const displayProducts = products && products.length > 0 ? products : staticProducts;
    const heroProduct = featuredProduct || displayProducts.find(p => p.name === 'Luna Silk Scarf') || displayProducts[0] || staticProducts[0];
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'info' | 'payment'>('cart');
    const [shippingInfo, setShippingInfo] = useState({ name: '', phone: '', address: '' });
    const [orderId, setOrderId] = useState('');
    const [snapToken, setSnapToken] = useState<string | null>(null);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const [isCopiedBca, setIsCopiedBca] = useState(false);
    const [isCopiedMandiri, setIsCopiedMandiri] = useState(false);

    const openProductDetail = (product: Product) => {
        setSelectedProductForDetail(product);
        axios.post(`/products/${product.id}/view`).catch(err => console.error(err));
    };

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

    const formatPrice = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existingIndex = prev.findIndex(
                item => item.id === product.id
            );

            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex].quantity += 1;
                return updated;
            } else {
                return [...prev, { ...product, quantity: 1 }];
            }
        });
        setCheckoutStep('cart');
        setIsCartOpen(true);
        axios.post(`/products/${product.id}/add-to-cart`).catch(err => console.error(err));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === productId) {
                    const newQty = item.quantity + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            }).filter(Boolean) as CartItem[];
        });
    };

    const removeItem = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const getCartTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const getCartCount = () => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    };

    const handleCheckout = async () => {
        setIsCheckoutLoading(true);
        try {
            const response = await axios.post('/checkout', {
                name: shippingInfo.name,
                phone: shippingInfo.phone,
                address: shippingInfo.address,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            });

            if (response.data.success) {
                const token = response.data.snap_token;
                const oId = response.data.order_id;
                setSnapToken(token);
                setOrderId(oId);
                setCheckoutStep('payment');
                setIsCheckoutLoading(false);

                // Trigger Midtrans Snap Popup
                triggerSnapPayment(token, oId);
            } else {
                alert(response.data.message || 'Gagal memproses pesanan.');
                setIsCheckoutLoading(false);
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            alert(error.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan Anda.');
            setIsCheckoutLoading(false);
        }
    };

    const triggerSnapPayment = (token: string, oId: string) => {
        if ((window as any).snap) {
            (window as any).snap.pay(token, {
                onSuccess: function (result: any) {
                    console.log('Payment success:', result);
                    setCart([]);
                    setCheckoutSuccess(true);
                    setCheckoutStep('cart');
                    setShippingInfo({ name: '', phone: '', address: '' });
                    setTimeout(() => {
                        setCheckoutSuccess(false);
                        setIsCartOpen(false);
                    }, 3000);
                },
                onPending: function (result: any) {
                    console.log('Payment pending:', result);
                },
                onError: function (result: any) {
                    console.error('Payment error:', result);
                    alert('Pembayaran gagal. Silakan coba kembali.');
                },
                onClose: function () {
                    console.log('Payment popup closed without finishing payment');
                }
            });
        } else {
            alert('Sistem pembayaran Midtrans sedang memuat, silakan coba sesaat lagi.');
        }
    };

    const filteredProducts = selectedCategory === 'all' 
        ? displayProducts 
        : displayProducts.filter(p => p.category === selectedCategory);

    return (
        <>
            <Head>
                <title>Yopi Hijab | Premium Modest Fashion</title>
                <meta name="description" content="Koleksi hijab premium kelas atas dengan draping anggun, kain sutra murni, dan keindahan warna-warna bumi yang menawan." />
            </Head>

            <div className="min-h-screen bg-[#FAF8F5] text-[#2C2520] selection:bg-[#D4C5B9] selection:text-[#2C2520]">
                {/* 1. ELEGANT HEADER / STICKY NAVBAR */}
                <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#2C2520]/5 px-6 lg:px-16 py-4 transition duration-300">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        {/* Mobile Hamburguer */}
                        <button 
                            className="lg:hidden p-1 text-[#2C2520]" 
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Luxury Logo */}
                        <Link href="/" className="flex flex-col items-center">
                            <span className="text-serif text-2xl lg:text-3xl font-extrabold tracking-[0.25em] text-[#2C2520]">
                                YOPI
                            </span>
                            <span className="text-[9px] tracking-[0.5em] font-medium text-[#8C7A6B] -mt-1 uppercase">
                                Hijab Luxury
                            </span>
                        </Link>

                        {/* Navigation Links */}
                        <nav className="hidden lg:flex items-center space-x-12">
                            <a href="#collections" className="text-sm font-medium tracking-widest text-[#2C2520]/80 hover:text-[#2C2520] transition relative group">
                                COLLECTIONS
                                <span className="absolute bottom-[-4px] left-0 w-0 h-[1.5px] bg-[#8C7A6B] transition-all duration-300 group-hover:w-full"></span>
                            </a>
                            <a href="#about" className="text-sm font-medium tracking-widest text-[#2C2520]/80 hover:text-[#2C2520] transition relative group">
                                OUR BRAND
                                <span className="absolute bottom-[-4px] left-0 w-0 h-[1.5px] bg-[#8C7A6B] transition-all duration-300 group-hover:w-full"></span>
                            </a>
                            <a href="#shop" className="text-sm font-medium tracking-widest text-[#2C2520]/80 hover:text-[#2C2520] transition relative group">
                                SHOP ONLINE
                                <span className="absolute bottom-[-4px] left-0 w-0 h-[1.5px] bg-[#8C7A6B] transition-all duration-300 group-hover:w-full"></span>
                            </a>
                        </nav>

                        {/* User Options & Shopping Bag */}
                        <div className="flex items-center space-x-6">
                            {auth.user ? (
                                <Link 
                                    href={route('dashboard')} 
                                    className="hidden sm:inline-block text-xs font-semibold tracking-widest border border-[#2C2520]/20 rounded-full px-4 py-2 hover:bg-[#2C2520] hover:text-[#FAF8F5] transition"
                                >
                                    DASHBOARD
                                </Link>
                            ) : (
                                <Link 
                                    href={route('login')} 
                                    className="hidden sm:inline-block text-xs font-semibold tracking-widest border border-[#2C2520]/20 rounded-full px-4 py-2 hover:bg-[#2C2520] hover:text-[#FAF8F5] transition"
                                >
                                    LOG IN
                                </Link>
                            )}

                            {/* Cart Icon Button */}
                            <button 
                                className="relative p-2 hover:scale-105 transition"
                                onClick={() => setIsCartOpen(true)}
                                aria-label="Cart"
                            >
                                <ShoppingBag className="w-6 h-6 text-[#2C2520]" />
                                {getCartCount() > 0 && (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-1 right-1 bg-[#8C7A6B] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                                    >
                                        {getCartCount()}
                                    </motion.span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* MOBILE MENU DRAWER */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMobileMenuOpen(false)}
                                className="fixed inset-0 z-50 bg-black"
                            />
                            <motion.div 
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#FAF8F5] p-8 flex flex-col border-r border-[#2C2520]/10"
                            >
                                <div className="flex justify-between items-center mb-12">
                                    <span className="text-serif font-bold text-xl tracking-[0.2em]">YOPI</span>
                                    <button onClick={() => setMobileMenuOpen(false)}>
                                        <X className="w-5 h-5 text-[#2C2520]" />
                                    </button>
                                </div>
                                <div className="flex flex-col space-y-6 text-lg font-medium tracking-widest text-[#2C2520]/80">
                                    <a href="#collections" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#2C2520] transition">COLLECTIONS</a>
                                    <a href="#about" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#2C2520] transition">OUR BRAND</a>
                                    <a href="#shop" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#2C2520] transition">SHOP ONLINE</a>
                                </div>

                                <div className="mt-auto border-t border-[#2C2520]/10 pt-8 flex flex-col space-y-4">
                                    {auth.user ? (
                                        <Link href={route('dashboard')} className="w-full text-center border border-[#2C2520] rounded-full py-3 text-sm font-semibold tracking-wider hover:bg-[#2C2520] hover:text-[#FAF8F5] transition">
                                            DASHBOARD
                                        </Link>
                                    ) : (
                                        <>
                                            <Link href={route('login')} className="w-full text-center border border-[#2C2520]/20 rounded-full py-3 text-sm font-semibold tracking-wider hover:border-[#2C2520] transition">
                                                LOG IN
                                            </Link>
                                            <Link href={route('register')} className="w-full text-center bg-[#8C7A6B] text-white rounded-full py-3 text-sm font-semibold tracking-wider hover:bg-[#2C2520] transition">
                                                SIGN UP
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* 2. DYNAMIC HERO SECTION (Editorial Modest Scaffolding) */}
                <section className="relative overflow-hidden pt-12 pb-20 lg:py-24 px-6 lg:px-16 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                        
                        {/* Hero Text */}
                        <div className="lg:col-span-6 flex flex-col justify-center space-y-8">
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center space-x-2 text-[#8C7A6B]">
                                    <span className="w-8 h-[1px] bg-[#8C7A6B]"></span>
                                    <span className="text-xs uppercase tracking-[0.3em] font-semibold">PREMIUM MODESTY SERIES</span>
                                </div>
                                <h1 className="text-serif text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.1] text-[#2C2520]">
                                    The Poetry of <br />
                                    <span className="text-[#8C7A6B] italic font-normal">Sartorial Grace</span>
                                </h1>
                            </motion.div>

                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-[#2C2520]/75 text-base md:text-lg max-w-md leading-relaxed font-light"
                            >
                                Hadirkan pancaran keanggunan sejati dalam mahakarya hijab eksklusif Yopi. 
                                Ditenun dengan sentuhan presisi dan dedikasi, mengekspresikan kesempurnaan 
                                kesederhanaan modern tanpa menghilangkan kemewahan.
                            </motion.p>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="flex items-center space-x-6"
                            >
                                <a 
                                    href="#shop" 
                                    className="bg-[#2C2520] text-[#FAF8F5] px-8 py-4 rounded-full text-xs font-semibold tracking-[0.2em] hover:bg-[#8C7A6B] transition shadow-lg shadow-[#2C2520]/10 flex items-center space-x-3 group"
                                >
                                    <span>SHOP NOW</span>
                                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                                </a>
                                <a 
                                    href="#collections" 
                                    className="text-xs font-semibold tracking-[0.2em] border-b border-[#2C2C20]/40 pb-1 text-[#2C2520] hover:text-[#8C7A6B] hover:border-[#8C7A6B] transition"
                                >
                                    VIEW CATALOG
                                </a>
                            </motion.div>
                        </div>

                        {/* Parallax Hero Image Frame */}
                        <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1 }}
                                className="relative w-full max-w-md aspect-[3/4] overflow-hidden rounded-[2rem] border-8 border-white shadow-2xl shadow-[#2C2520]/10 bg-[#D4C5B9]/20"
                            >
                                <motion.img 
                                    src={getProductImageUrl(heroProduct.image)}
                                    alt={`${heroProduct.name} Lookbook`}
                                    className="w-full h-full object-cover cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.8 }}
                                    onClick={() => openProductDetail(heroProduct)}
                                />
                                
                                {/* Absolute floating box */}
                                <div 
                                    className="absolute bottom-8 left-8 right-8 bg-[#FAF8F5]/90 backdrop-blur-md p-6 rounded-xl border border-white/40 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5] transition"
                                    onClick={() => openProductDetail(heroProduct)}
                                >
                                    <div>
                                        <p className="text-[10px] tracking-[0.2em] text-[#8C7A6B] font-bold uppercase">{heroProduct.tag || "Featured Collection"}</p>
                                        <p className="text-serif text-lg font-bold mt-0.5 text-[#2C2520]">{heroProduct.name}</p>
                                    </div>
                                    <span className="bg-[#8C7A6B] text-white text-[10px] font-bold px-3 py-1 rounded-full">
                                        {formatPrice(heroProduct.price)}
                                    </span>
                                </div>
                            </motion.div>

                            {/* Floating decoration */}
                            <div className="absolute -top-6 -left-6 w-36 h-36 border border-[#8C7A6B]/20 rounded-[2rem] pointer-events-none -z-10 hidden md:block"></div>
                            <div className="absolute -bottom-6 -right-6 w-24 h-48 bg-[#D4C5B9]/30 rounded-full blur-2xl pointer-events-none -z-10"></div>
                        </div>
                    </div>
                </section>

                {/* 3. VALUE PROPOSITION SECTION */}
                <section id="about" className="bg-[#FAF8F5] border-y border-[#2C2520]/5 py-16 px-6 lg:px-16">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
                        <div className="flex flex-col items-center text-center space-y-3 p-4">
                            <div className="w-12 h-12 bg-[#8C7A6B]/10 rounded-full flex items-center justify-center text-[#8C7A6B] mb-2">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-serif text-lg font-bold text-[#2C2520]">Premium Silk & Fibers</h3>
                            <p className="text-sm font-light text-[#2C2520]/70 max-w-xs leading-relaxed">
                                Kami hanya menyeleksi benang sutra Mulberry berkualitas ekspor dan katun organik terbaik untuk menjamin kenyamanan maksimal.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center space-y-3 p-4">
                            <div className="w-12 h-12 bg-[#8C7A6B]/10 rounded-full flex items-center justify-center text-[#8C7A6B] mb-2">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h3 className="text-serif text-lg font-bold text-[#2C2520]">Butik Craftsmanship</h3>
                            <p className="text-sm font-light text-[#2C2520]/70 max-w-xs leading-relaxed">
                                Setiap jahitan tepi dineci dengan tingkat kerapatan tinggi (baby-hemming) oleh pengrajin lokal profesional untuk menjaga keindahan kain.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center space-y-3 p-4">
                            <div className="w-12 h-12 bg-[#8C7A6B]/10 rounded-full flex items-center justify-center text-[#8C7A6B] mb-2">
                                <RefreshCw className="w-5 h-5" />
                            </div>
                            <h3 className="text-serif text-lg font-bold text-[#2C2520]">Garansi Kepuasan 100%</h3>
                            <p className="text-sm font-light text-[#2C2520]/70 max-w-xs leading-relaxed">
                                Tidak puas dengan kelembutan hijab atau warna tidak sesuai? Kami memberikan kemudahan tukar barang dalam 7 hari tanpa syarat.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 4. FILTERABLE SHOPPING CATALOG */}
                <section id="shop" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto space-y-12">
                    
                    {/* Catalog Header */}
                    <div className="text-center space-y-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#8C7A6B] font-bold">Aesthetic Collections</p>
                        <h2 className="text-serif text-4xl lg:text-5xl font-extrabold text-[#2C2520]">
                            Beli Koleksi Eksklusif Kami
                        </h2>
                        <div className="w-16 h-[2px] bg-[#8C7A6B] mx-auto mt-2"></div>
                    </div>

                    {/* Filter Tabs (Framer Motion Animated Active Indicator) */}
                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto pb-4">
                        {[
                            { id: 'all', label: 'ALL PRODUCTS' },
                            { id: 'silk', label: 'PREMIUM SILK' },
                            { id: 'chiffon', label: 'CRINKLED CHIFFON' },
                            { id: 'jersey', label: 'LUXURY JERSEY' },
                            { id: 'cotton', label: 'SOFT COTTON' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedCategory(tab.id)}
                                className={`relative px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider transition ${
                                    selectedCategory === tab.id 
                                        ? 'text-[#FAF8F5]' 
                                        : 'text-[#2C2520]/60 hover:text-[#2C2520]'
                                }`}
                            >
                                {selectedCategory === tab.id && (
                                    <motion.div 
                                        layoutId="activeCategory"
                                        className="absolute inset-0 bg-[#2C2520] rounded-full -z-10"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Product Cards Grid */}
                    <motion.div 
                        layout 
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 pt-4"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map(product => {
                                return (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.5 }}
                                        className="flex flex-col space-y-4 group"
                                    >
                                        {/* Image Frame */}
                                        <div 
                                            className="relative overflow-hidden rounded-[1.5rem] bg-white aspect-[3/4] shadow-md shadow-[#2C2520]/5 cursor-pointer"
                                            onClick={() => openProductDetail(product)}
                                        >
                                            <span className="absolute top-4 left-4 bg-[#FAF8F5] text-[#8C7A6B] text-[10px] tracking-widest font-extrabold px-3 py-1.5 rounded-full z-15 shadow-sm border border-[#2C2520]/5 uppercase">
                                                {product.tag}
                                            </span>
                                            
                                            <motion.img 
                                                src={getProductImageUrl(product.image)}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                                            {/* Hover add to bag quick-action */}
                                            <div className="absolute bottom-4 left-4 right-4 flex justify-center z-20">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                                    className="w-full bg-[#FAF8F5]/95 backdrop-blur-sm text-[#2C2520] py-3 rounded-full text-xs font-semibold tracking-widest opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-[#2C2520] hover:text-[#FAF8F5]"
                                                >
                                                    QUICK ADD TO BAG
                                                </button>
                                            </div>
                                        </div>

                                        {/* Product Details */}
                                        <div className="space-y-1.5 px-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#8C7A6B]">{product.category}</span>
                                            </div>

                                            <h3 
                                                className="text-serif text-lg font-bold text-[#2C2520] group-hover:text-[#8C7A6B] transition cursor-pointer"
                                                onClick={() => openProductDetail(product)}
                                            >
                                                {product.name}
                                            </h3>

                                            <p className="text-sm font-light text-[#2C2520]/75 line-clamp-2">
                                                {stripHtml(product.description)}
                                            </p>

                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-base font-bold text-[#2C2520]">
                                                    {formatPrice(product.price)}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                </section>

                {/* 5. EDITORIAL LOOKBOOK SECTION */}
                <section id="collections" className="bg-[#D4C5B9]/15 py-24 px-6 lg:px-16 border-y border-[#2C2520]/5">
                    <div className="max-w-7xl mx-auto space-y-16">
                        
                        <div className="grid md:grid-cols-12 gap-8 items-end">
                            <div className="md:col-span-8 space-y-3">
                                <p className="text-xs uppercase tracking-[0.3em] text-[#8C7A6B] font-bold">Aesthetic Inspiration</p>
                                <h2 className="text-serif text-3xl md:text-5xl font-extrabold text-[#2C2520]">
                                    Modest & Modern Lookbook
                                </h2>
                            </div>
                            <div className="md:col-span-4 flex md:justify-end">
                                <p className="text-sm font-light text-[#2C2520]/70 max-w-sm">
                                    Temukan inspirasi padu padan warna bumi yang hangat untuk merefleksikan kepribadian anggun Anda setiap hari.
                                </p>
                            </div>
                        </div>

                        {/* Staggered Row Grid */}
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-lg border border-white">
                                    <img 
                                        src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop" 
                                        alt="Lookbook 1" 
                                        className="w-full h-full object-cover hover:scale-105 transition duration-700"
                                    />
                                </div>
                                <h4 className="text-serif text-lg font-bold text-[#2C2520] mt-2">Soft Crinkle Elegance</h4>
                                <p className="text-xs font-light text-[#2C2520]/70 tracking-widest uppercase">Casual Chic Collection</p>
                            </div>

                            <div className="space-y-4 md:-translate-y-8">
                                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-lg border border-white">
                                    <img 
                                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" 
                                        alt="Lookbook 2" 
                                        className="w-full h-full object-cover hover:scale-105 transition duration-700"
                                    />
                                </div>
                                <h4 className="text-serif text-lg font-bold text-[#2C2520] mt-2">Classic Formal Drapery</h4>
                                <p className="text-xs font-light text-[#2C2520]/70 tracking-widest uppercase">Office & Ceremony Look</p>
                            </div>

                            <div className="space-y-4">
                                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-lg border border-white">
                                    <img 
                                        src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=600&auto=format&fit=crop" 
                                        alt="Lookbook 3" 
                                        className="w-full h-full object-cover hover:scale-105 transition duration-700"
                                    />
                                </div>
                                <h4 className="text-serif text-lg font-bold text-[#2C2520] mt-2">Pleated Satin Dream</h4>
                                <p className="text-xs font-light text-[#2C2520]/70 tracking-widest uppercase">Evening Galas & Soirees</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. NEWSLETTER SUBSCRIPTION */}
                <section className="py-20 px-6 lg:px-16 max-w-4xl mx-auto text-center space-y-8">
                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#8C7A6B] font-bold">Yopi Club</p>
                        <h2 className="text-serif text-3xl lg:text-4xl font-extrabold text-[#2C2520]">Dapatkan Penawaran & Info Rilis Eksklusif</h2>
                        <p className="text-sm font-light text-[#2C2520]/70 max-w-lg mx-auto">
                            Bergabunglah dengan newsletter Yopi dan jadilah yang pertama menerima potongan harga spesial 10% untuk transaksi pertama Anda.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                        <input 
                            type="email" 
                            placeholder="Email address"
                            className="w-full sm:flex-1 bg-white border border-[#2C2520]/15 rounded-full px-6 py-4 text-sm focus:outline-none focus:border-[#8C7A6B] transition shadow-inner"
                        />
                        <button className="w-full sm:w-auto bg-[#2C2520] text-[#FAF8F5] px-8 py-4 rounded-full text-xs font-semibold tracking-[0.2em] hover:bg-[#8C7A6B] transition shadow-lg">
                            SUBSCRIBE
                        </button>
                    </div>
                </section>

                {/* 7. ELEGANT FOOTER */}
                <footer className="bg-[#2C2520] text-[#FAF8F5] py-16 px-6 lg:px-16">
                    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
                        <div className="col-span-2 md:col-span-1 space-y-4">
                            <span className="text-serif text-2xl font-bold tracking-[0.25em]">YOPI</span>
                            <p className="text-xs text-[#FAF8F5]/60 font-light leading-relaxed max-w-xs">
                                Butik hijab premium yang mendedikasikan seluruh karyanya untuk keanggunan, kenyamanan, dan pesona wanita muslimah modern.
                            </p>
                            {/* Social Media Icons SVG */}
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
 
                        <div className="space-y-4">
                            <h4 className="text-xs tracking-[0.2em] font-bold uppercase text-[#D4C5B9]">SHOPPING</h4>
                            <ul className="space-y-2 text-xs font-light text-[#FAF8F5]/70">
                                <li><a href="#shop" className="hover:text-white transition">Mulberry Silk</a></li>
                                <li><a href="#shop" className="hover:text-white transition">Crinkle Chiffon</a></li>
                                <li><a href="#shop" className="hover:text-white transition">Modal Jersey</a></li>
                                <li><a href="#shop" className="hover:text-white transition">Linen Voile</a></li>
                            </ul>
                        </div>
 
                        <div className="space-y-4">
                            <h4 className="text-xs tracking-[0.2em] font-bold uppercase text-[#D4C5B9]">HELP & CUSTOMER</h4>
                            <ul className="space-y-2 text-xs font-light text-[#FAF8F5]/70">
                                <li><Link href="/faq" className="hover:text-white transition">FAQ / Bantuan</Link></li>
                            </ul>
                        </div>

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

                {/* 8. SHOPPING CART DRAWER (Framer Motion) */}
                <AnimatePresence>
                    {isCartOpen && (
                        <>
                            {/* Backdrop overlay */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsCartOpen(false)}
                                className="fixed inset-0 z-50 bg-black/60"
                            />
                            
                            {/* Cart Side panel */}
                            <motion.div 
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
                                className="fixed top-0 bottom-0 right-0 z-50 w-full max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col border-l border-[#2C2520]/10"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-[#2C2520]/10 flex items-center justify-between">
                                    <div className="flex items-center space-x-3 text-[#2C2520]">
                                        <ShoppingBag className="w-5 h-5" />
                                        <span className="font-bold text-serif text-lg">
                                            {checkoutStep === 'cart' && "Shopping Bag"}
                                            {checkoutStep === 'info' && "Data Pengiriman"}
                                            {checkoutStep === 'payment' && "Konfirmasi Pembayaran"}
                                        </span>
                                        {checkoutStep === 'cart' && getCartCount() > 0 && (
                                            <span className="bg-[#8C7A6B] text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                                                {getCartCount()}
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        className="p-1 hover:bg-[#2C2520]/5 rounded-full transition"
                                        onClick={() => setIsCartOpen(false)}
                                    >
                                        <X className="w-5 h-5 text-[#2C2520]" />
                                    </button>
                                </div>

                                {/* Main body */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {checkoutSuccess ? (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="h-full flex flex-col items-center justify-center text-center space-y-4"
                                        >
                                            <div className="w-16 h-16 bg-[#8B9A86]/20 text-[#8B9A86] rounded-full flex items-center justify-center mx-auto mb-2">
                                                <Check className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-serif text-2xl font-bold text-[#2C2520]">Pesanan Terkirim!</h3>
                                            <p className="text-sm font-light text-[#2C2520]/70 max-w-xs leading-relaxed">
                                                Detail pesanan Anda telah dikirimkan ke WhatsApp kami. Mohon tunggu balasan dari Admin Yopi Hijab. Terima kasih!
                                            </p>
                                        </motion.div>
                                    ) : cart.length === 0 && checkoutStep !== 'payment' ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                            <ShoppingBag className="w-12 h-12 text-[#2C2520]/20" />
                                            <p className="text-serif text-lg font-bold text-[#2C2520]/60">Keranjang Belanja Kosong</p>
                                            <p className="text-xs font-light text-[#2C2520]/50 max-w-[200px]">
                                                Silakan pilih koleksi hijab elegan kami di halaman utama.
                                            </p>
                                            <button 
                                                onClick={() => setIsCartOpen(false)}
                                                className="bg-[#2C2520] text-white px-6 py-2.5 rounded-full text-xs font-bold tracking-widest hover:bg-[#8C7A6B] transition"
                                            >
                                                KEMBALI BELANJA
                                            </button>
                                        </div>
                                    ) : checkoutStep === 'cart' ? (
                                        <div className="space-y-4">
                                            {cart.map((item, idx) => (
                                                <motion.div 
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center space-x-4 border-b border-[#2C2520]/5 pb-4 text-left"
                                                >
                                                    {/* Product img */}
                                                    <div className="w-20 aspect-[3/4] rounded-xl overflow-hidden flex-shrink-0 border border-[#2C2520]/5 bg-white">
                                                        <img src={getProductImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    
                                                    {/* Product details */}
                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="text-serif font-bold text-sm text-[#2C2520] line-clamp-1">{item.name}</h4>
                                                        <p className="text-xs font-bold text-[#2C2520]">{formatPrice(item.price)}</p>
                                                        
                                                        {/* Quantity selector */}
                                                        <div className="flex items-center space-x-2 pt-1">
                                                            <button 
                                                                className="w-6 h-6 rounded-full border border-[#2C2520]/15 flex items-center justify-center text-[#2C2520] hover:bg-[#2C2520] hover:text-[#FAF8F5] transition"
                                                                onClick={() => updateQuantity(item.id, -1)}
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="text-xs font-semibold text-[#2C2520] w-6 text-center">{item.quantity}</span>
                                                            <button 
                                                                className="w-6 h-6 rounded-full border border-[#2C2520]/15 flex items-center justify-center text-[#2C2520] hover:bg-[#2C2520] hover:text-[#FAF8F5] transition"
                                                                onClick={() => updateQuantity(item.id, 1)}
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Remove btn */}
                                                    <button 
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-1.5 text-[#2C2520]/40 hover:text-[#2C2520] transition"
                                                        aria-label="Remove item"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : checkoutStep === 'info' ? (
                                        <div className="space-y-5 text-left">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase tracking-wider text-[#8C7A6B] font-bold">Langkah 2 dari 3</p>
                                                <h3 className="text-serif text-xl font-bold text-[#2C2520]">Alamat Pengiriman</h3>
                                                <p className="text-xs text-[#2C2520]/60 font-light">Lengkapi data di bawah ini untuk mengirimkan koleksi hijab pesanan Anda.</p>
                                            </div>

                                            <div className="space-y-4 pt-2">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold tracking-wider text-[#2C2520]/80 uppercase">NAMA LENGKAP</label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={shippingInfo.name}
                                                        onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                                                        placeholder="cth. Fatimah Azzahra"
                                                        className="w-full bg-white border border-[#2C2520]/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8C7A6B] transition shadow-inner"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold tracking-wider text-[#2C2520]/80 uppercase">NOMOR WHATSAPP</label>
                                                    <input 
                                                        type="tel" 
                                                        required
                                                        value={shippingInfo.phone}
                                                        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                                                        placeholder="cth. 08123456789"
                                                        className="w-full bg-white border border-[#2C2520]/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8C7A6B] transition shadow-inner"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold tracking-wider text-[#2C2520]/80 uppercase">ALAMAT PENGIRIMAN LENGKAP</label>
                                                    <textarea 
                                                        required
                                                        rows={4}
                                                        value={shippingInfo.address}
                                                        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                                                        placeholder="cth. Jl. Kemang Raya No. 42B, Mampang Prapatan, Jakarta Selatan, 12730"
                                                        className="w-full bg-white border border-[#2C2520]/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8C7A6B] transition shadow-inner resize-none font-light"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 text-left">
                                            <div className="space-y-1 text-center pb-2 border-b border-[#2C2520]/5">
                                                <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold flex items-center justify-center gap-1">
                                                    <Info className="w-3.5 h-3.5 text-amber-600" /> MENUNGGU PEMBAYARAN
                                                </p>
                                                <h3 className="text-serif text-xl font-bold text-[#2C2520] tracking-wide mt-1">ID Pesanan: {orderId}</h3>
                                                <p className="text-xs text-[#2C2520]/60 font-light">Silakan lakukan pembayaran aman melalui payment gateway Midtrans.</p>
                                            </div>

                                            {/* Instructions Alert */}
                                            <div className="bg-[#8C7A6B]/5 border border-[#8C7A6B]/15 p-4 rounded-2xl space-y-2">
                                                <h5 className="text-xs font-bold text-[#8C7A6B]">Petunjuk Pembayaran:</h5>
                                                <ul className="text-[10px] leading-relaxed text-[#2C2520]/70 space-y-1.5 pl-1 list-decimal list-inside font-light">
                                                    <li>Klik tombol **Bayar Sekarang** di bawah.</li>
                                                    <li>Pilih metode pembayaran (Virtual Account, GoPay, QRIS, Kartu Kredit, dll).</li>
                                                    <li>Selesaikan pembayaran sesuai petunjuk pada layar Midtrans.</li>
                                                    <li>Setelah selesai, status pesanan Anda akan otomatis diperbarui.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer summary */}
                                {!checkoutSuccess && cart.length > 0 && (
                                    <div className="p-6 border-t border-[#2C2520]/10 bg-[#FAF8F5] space-y-4">
                                        
                                        {/* STEP 1 FOOTER: REVIEW CART */}
                                        {checkoutStep === 'cart' && (
                                            <>
                                                <div className="space-y-1.5 text-xs text-[#2C2520]/80">
                                                    <div className="flex justify-between">
                                                        <span>Subtotal</span>
                                                        <span className="font-semibold">{formatPrice(getCartTotal())}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Pengiriman (Lokal)</span>
                                                        <span className="font-semibold text-emerald-600">GRATIS ONGKIR</span>
                                                    </div>
                                                    <div className="flex justify-between border-t border-[#2C2520]/5 pt-2 text-sm text-[#2C2520] font-bold">
                                                        <span>TOTAL ESTIMASI</span>
                                                        <span>{formatPrice(getCartTotal())}</span>
                                                    </div>
                                                </div>

                                                <div className="bg-[#8C7A6B]/5 border border-[#8C7A6B]/15 p-3.5 rounded-xl flex items-start space-x-2 text-[10px] leading-relaxed text-[#8C7A6B] font-medium text-left">
                                                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                    <span>Nikmati gratis ongkos kirim ke seluruh kota di Indonesia tanpa syarat minimum pembelanjaan untuk rilis perdana ini.</span>
                                                </div>

                                                <button 
                                                    onClick={() => setCheckoutStep('info')}
                                                    className="w-full bg-[#2C2520] text-white py-4 rounded-full text-xs font-semibold tracking-[0.25em] hover:bg-[#8C7A6B] transition shadow-lg flex items-center justify-center space-x-2"
                                                >
                                                    <span>LANJUT KE PENGIRIMAN</span>
                                                </button>
                                            </>
                                        )}

                                        {/* STEP 2 FOOTER: FILL INFO */}
                                        {checkoutStep === 'info' && (
                                            <div className="space-y-3">
                                                <button 
                                                    disabled={!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address || isCheckoutLoading}
                                                    onClick={handleCheckout}
                                                    className="w-full bg-[#2C2520] text-white py-4 rounded-full text-xs font-semibold tracking-[0.25em] hover:bg-[#8C7A6B] transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:bg-[#2C2520]"
                                                >
                                                    {isCheckoutLoading ? (
                                                        <span>MEMPROSES...</span>
                                                    ) : (
                                                        <span>PROSES PEMESANAN</span>
                                                    )}
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setCheckoutStep('cart')}
                                                    className="w-full bg-transparent text-[#2C2520]/70 py-2.5 rounded-full text-[10px] font-extrabold tracking-widest hover:text-[#2C2520] transition uppercase"
                                                >
                                                    KEMBALI KE KERANJANG
                                                </button>
                                            </div>
                                        )}

                                        {/* STEP 3 FOOTER: PAY NOW (Midtrans) */}
                                        {checkoutStep === 'payment' && (
                                            <div className="space-y-3">
                                                <div className="space-y-1.5 text-xs text-[#2C2520]/80">
                                                    <div className="flex justify-between border-b border-[#2C2520]/5 pb-2 text-sm text-[#2C2520] font-bold">
                                                        <span>TOTAL PEMBAYARAN</span>
                                                        <span className="text-[#8C7A6B]">{formatPrice(getCartTotal())}</span>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => triggerSnapPayment(snapToken || '', orderId)}
                                                    className="w-full bg-[#2C2520] text-white py-4 rounded-full text-xs font-semibold tracking-[0.2em] hover:bg-[#8C7A6B] transition shadow-lg flex items-center justify-center space-x-2 animate-pulse"
                                                >
                                                    <span>BAYAR SEKARANG</span>
                                                </button>

                                                <button 
                                                    onClick={() => setCheckoutStep('info')}
                                                    className="w-full bg-transparent text-[#2C2520]/70 py-2.5 rounded-full text-[10px] font-extrabold tracking-widest hover:text-[#2C2520] transition uppercase"
                                                >
                                                    KEMBALI KE PENGIRIMAN
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* 9. PRODUCT DETAIL MODAL (Quick View) */}
                <AnimatePresence>
                    {selectedProductForDetail && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedProductForDetail(null)}
                                className="fixed inset-0 z-50 bg-[#2C2520]/45 backdrop-blur-sm"
                            />
                            
                            {/* Modal Container */}
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="bg-[#FAF8F5] rounded-[2rem] max-w-4xl w-full p-6 md:p-10 relative overflow-hidden border border-[#2C2520]/5 shadow-2xl flex flex-col md:flex-row gap-8 md:gap-12"
                                >
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setSelectedProductForDetail(null)}
                                        className="absolute top-6 right-6 p-2.5 bg-[#2C2520]/5 hover:bg-[#2C2520]/10 rounded-full transition z-10"
                                        aria-label="Close details"
                                    >
                                        <X className="w-5 h-5 text-[#2C2520]" />
                                    </button>

                                    {/* Left: Product Image */}
                                    <div className="w-full md:w-1/2 flex flex-col space-y-4">
                                        <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden bg-white shadow-inner border border-[#2C2520]/5">
                                            <img
                                                src={getProductImageUrl(selectedProductForDetail.image)}
                                                alt={selectedProductForDetail.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <span className="absolute top-4 left-4 bg-[#2C2520] text-[#FAF8F5] text-[9px] tracking-widest font-extrabold px-3 py-1.5 rounded-full uppercase z-10 shadow-md">
                                                {selectedProductForDetail.tag}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-[10px] text-[#8C7A6B] font-semibold tracking-wider pl-1">
                                            <Info className="w-4 h-4 flex-shrink-0" />
                                            <span>Free premium storage box & tag logo logam emas YOPI</span>
                                        </div>
                                    </div>

                                    {/* Right: Product Metadata & Actions */}
                                    <div className="w-full md:w-1/2 flex flex-col justify-between py-2 text-left">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#8C7A6B] bg-[#8C7A6B]/10 px-2.5 py-1 rounded">
                                                        {selectedProductForDetail.category}
                                                    </span>
                                                </div>
                                                <h2 className="text-serif text-3xl font-extrabold text-[#2C2520] leading-tight">
                                                    {selectedProductForDetail.name}
                                                </h2>
                                                <p className="text-2xl font-bold text-[#2C2520] pt-1">
                                                    {formatPrice(selectedProductForDetail.price)}
                                                </p>
                                            </div>

                                            <div className="space-y-2 border-t border-[#2C2520]/10 pt-4">
                                                <h4 className="text-xs uppercase font-bold tracking-[0.2em] text-[#8C7A6B]">Deskripsi Produk</h4>
                                                <div 
                                                    className="text-sm font-light leading-relaxed text-[#2C2520]/80 description-html"
                                                    dangerouslySetInnerHTML={{ __html: selectedProductForDetail.description || '' }}
                                                />
                                                <ul className="text-xs space-y-1.5 text-[#2C2520]/70 font-light pt-2 pl-1">
                                                    <li className="flex items-center space-x-2">
                                                        <span className="text-[#8C7A6B]">✔</span>
                                                        <span>Serat alami premium kelas ekspor (super lembut & dingin)</span>
                                                    </li>
                                                    <li className="flex items-center space-x-2">
                                                        <span className="text-[#8C7A6B]">✔</span>
                                                        <span>Jahitan tepi neci baby-hemming super kecil dan kokoh</span>
                                                    </li>
                                                    <li className="flex items-center space-x-2">
                                                        <span className="text-[#8C7A6B]">✔</span>
                                                        <span>Logam plat logo anti-karat berbalut warna emas butik</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* CTA Button */}
                                        <div className="pt-6 border-t border-[#2C2520]/10 mt-6">
                                            <button
                                                onClick={() => {
                                                    addToCart(selectedProductForDetail);
                                                    setSelectedProductForDetail(null);
                                                }}
                                                className="w-full bg-[#2C2520] text-white py-4 rounded-full text-xs font-semibold tracking-[0.25em] hover:bg-[#8C7A6B] transition shadow-lg flex items-center justify-center space-x-3 group"
                                            >
                                                <ShoppingBag className="w-4 h-4" />
                                                <span>TAMBAH KE KERANJANG</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
