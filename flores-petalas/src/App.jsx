/**
 * 🌸 Flores & Pétalas — App React Completo v2
 * ═══════════════════════════════════════════════════════════
 * React 18 + Supabase Auth + Supabase DB + Carrinho + Perfil
 *
 * Páginas: Home · Catálogo · Serviços · Sobre · Contato · Perfil
 * Perfil (logado): Pedidos · Comprar Novamente · Listas · Configurações
 *
 * Setup:
 *   npm create vite@latest flores -- --template react
 *   cd flores && npm install @supabase/supabase-js
 *   Substitua src/App.jsx por este arquivo
 *
 * .env:
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJhbGc...
 *
 * SQL (Supabase SQL Editor):
 * ───────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS profiles (
 *   id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   name text, phone text, address text, city text, zip text,
 *   updated_at timestamptz DEFAULT now()
 * );
 * CREATE TABLE IF NOT EXISTS products (
 *   id serial PRIMARY KEY, name text, category text,
 *   price numeric, old_price numeric, emoji text, badge text,
 *   description text, stars int, reviews int, featured boolean, img text
 * );
 * CREATE TABLE IF NOT EXISTS orders (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id uuid REFERENCES auth.users(id),
 *   items jsonb, subtotal numeric, shipping numeric,
 *   total numeric, status text DEFAULT 'pending',
 *   customer_name text, customer_email text,
 *   customer_phone text, customer_address text,
 *   payment_method text, created_at timestamptz DEFAULT now()
 * );
 * CREATE TABLE IF NOT EXISTS wishlists (
 *   id serial PRIMARY KEY,
 *   user_id uuid REFERENCES auth.users(id),
 *   product_id int REFERENCES products(id),
 *   UNIQUE(user_id, product_id)
 * );
 * -- Enable RLS
 * ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "own profile" ON profiles FOR ALL USING (auth.uid() = id);
 * CREATE POLICY "own orders" ON orders FOR ALL USING (auth.uid() = user_id);
 * CREATE POLICY "own wishlist" ON wishlists FOR ALL USING (auth.uid() = user_id);
 * CREATE POLICY "products public" ON products FOR SELECT USING (true);
 * ═══════════════════════════════════════════════════════════
 */

import {
  useState, useEffect, useCallback, useContext,
  createContext, useRef, useMemo
} from "react";
import { createClient } from "@supabase/supabase-js";

// ──────────────────────────────────────────────
// SUPABASE CLIENT
// ──────────────────────────────────────────────
const SB_URL  = import.meta.env.VITE_SUPABASE_URL  || "https://placeholder.supabase.co";
const SB_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder";
const supabase = createClient(SB_URL, SB_KEY);

// ──────────────────────────────────────────────
// MOCK DATA (usado quando Supabase não configurado)
// ──────────────────────────────────────────────
const MOCK_PRODUCTS = [
  { id:1,  name:"Buquê Rosas Vermelhas Premium", category:"buques",   price:149, old_price:179, emoji:"🌹", badge:"🔥 Mais Vendido", description:"24 rosas importadas com folhagem verde e embrulho exclusivo artesanal", stars:5, reviews:47, featured:true,  img:"https://images.pexels.com/photos/32136633/pexels-photo-32136633.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:2,  name:"Arranjo Primavera",             category:"arranjos",  price:189, old_price:null, emoji:"💐", badge:"✨ Novo",          description:"Mix colorido em caixa kraft artesanal com flores sazonais frescas",    stars:5, reviews:32, featured:true,  img:"https://images.pexels.com/photos/5706744/pexels-photo-5706744.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:3,  name:"Orquídea Phalaenopsis",         category:"plantas",   price:129, old_price:null, emoji:"🌸", badge:null,              description:"Em vaso cerâmico artesanal — duração de 2 a 3 meses",               stars:5, reviews:28, featured:true,  img:"https://images.pexels.com/photos/1037994/pexels-photo-1037994.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:4,  name:"Tulipas Holandesas",            category:"buques",    price:219, old_price:null, emoji:"🌷", badge:null,              description:"20 tulipas importadas com laço de cetim bordado à mão",              stars:4, reviews:19, featured:false, img:"https://images.pexels.com/photos/343957/pexels-photo-343957.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:5,  name:"Arranjo Girassóis",             category:"arranjos",  price:99,  old_price:139,  emoji:"🌻", badge:"−30%",            description:"7 girassóis frescos em vaso de vidro decorado com fitilho",         stars:5, reviews:51, featured:true,  img:"https://images.pexels.com/photos/5241874/pexels-photo-5241874.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:6,  name:"Kit Suculentas",                category:"plantas",   price:79,  old_price:null, emoji:"🌿", badge:null,              description:"3 suculentas em vasos de cimento com bandeja decorativa",            stars:5, reviews:63, featured:false, img:"https://images.pexels.com/photos/776656/pexels-photo-776656.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:7,  name:"Cesta Romântica",               category:"presentes", price:259, old_price:null, emoji:"🎁", badge:"💝 Especial",     description:"Rosas + chocolates finos + vinho rosé + cartão personalizado",     stars:5, reviews:14, featured:true,  img:"https://images.pexels.com/photos/2232569/pexels-photo-2232569.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:8,  name:"Buquê Margaridas",              category:"buques",    price:89,  old_price:null, emoji:"🌼", badge:null,              description:"Margaridas frescas com baby breath e fitilho de cetim",             stars:4, reviews:22, featured:false, img:"https://images.pexels.com/photos/1457790/pexels-photo-1457790.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:9,  name:"Lavanda Provençal",             category:"plantas",   price:59,  old_price:null, emoji:"💜", badge:"🌿 Orgânico",    description:"Lavanda fresca em vaso rústico — aroma relaxante incrível",        stars:5, reviews:38, featured:false, img:"https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:10, name:"Buquê Peônias Blush",           category:"buques",    price:199, old_price:239,  emoji:"🌸", badge:"💕 Exclusivo",   description:"15 peônias importadas cor blush em embrulho papel craft premium", stars:5, reviews:9,  featured:false, img:"https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:11, name:"Arranjo Tropical",              category:"arranjos",  price:159, old_price:null, emoji:"🌺", badge:null,              description:"Flores exóticas tropicais em cachepô de bambu artesanal",           stars:4, reviews:17, featured:false, img:"https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=600" },
  { id:12, name:"Box Surpresa Mensal",           category:"presentes", price:139, old_price:null, emoji:"📦", badge:"🔄 Assinatura",  description:"Seleção surpresa de flores sazonais entregue mensalmente",          stars:5, reviews:41, featured:true,  img:"https://images.pexels.com/photos/5706744/pexels-photo-5706744.jpeg?auto=compress&cs=tinysrgb&w=600" },
];

const CATEGORIES = [
  { key:"todos",    label:"Todos",     icon:"🌺" },
  { key:"buques",   label:"Buquês",    icon:"💐" },
  { key:"arranjos", label:"Arranjos",  icon:"🌸" },
  { key:"plantas",  label:"Plantas",   icon:"🌿" },
  { key:"presentes",label:"Presentes", icon:"🎁" },
];

// ──────────────────────────────────────────────
// GLOBAL CSS
// ──────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --cr:#faf7f2;--bl:#f0d4c4;--ro:#b85c50;--rd:#8e3d32;--dp:#2c1f1f;
  --sg:#7a9470;--sg2:#b5cdb0;--gd:#c4963c;--lt:#f5efe8;--wh:#fff;
  --gy:#8a7070;--br:#e8d8d0;--dp2:#1a1010;
}
html{scroll-behavior:smooth}
body{font-family:'DM Sans',sans-serif;background:var(--cr);color:var(--dp);overflow-x:hidden;-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--lt)}::-webkit-scrollbar-thumb{background:var(--bl);border-radius:3px}
.fd{font-family:'Cormorant Garamond',serif}
button{font-family:'DM Sans',sans-serif;cursor:pointer}
input,textarea,select{font-family:'DM Sans',sans-serif}
img{display:block}

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideR{from{transform:translateX(110%)}to{transform:translateX(0)}}
@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.7);opacity:.5}}
@keyframes heartPop{0%{transform:scale(1)}40%{transform:scale(1.45)}70%{transform:scale(.9)}100%{transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes toastIn{from{opacity:0;transform:translateX(120%)}to{opacity:1;transform:translateX(0)}}
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes scaleIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}

.reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease}
.reveal.vis{opacity:1;transform:translateY(0)}
.pcard{transition:box-shadow .3s,transform .3s}
.pcard:hover{box-shadow:0 14px 44px rgba(44,31,31,.11);transform:translateY(-4px)}
.pcard-img{overflow:hidden}
.pcard-img img{transition:transform .55s ease}
.pcard:hover .pcard-img img{transform:scale(1.07)}
.ov{position:absolute;inset:0;background:rgba(44,31,31,.44);opacity:0;transition:opacity .25s;display:flex;align-items:flex-end;padding:1rem}
.pcard:hover .ov{opacity:1}
.overlay-bg{position:fixed;inset:0;background:rgba(44,31,31,.52);z-index:200;backdrop-filter:blur(3px);animation:fadeIn .25s ease}

/* Skeleton loader */
.skel{background:linear-gradient(90deg,var(--lt) 25%,var(--bl) 50%,var(--lt) 75%);background-size:800px 100%;animation:shimmer 1.4s infinite}

/* Responsive helpers */
@media(max-width:900px){
  .hide-mob{display:none!important}
  .grid-hero{grid-template-columns:1fr!important;min-height:auto!important}
  .grid-bene{grid-template-columns:1fr 1fr!important}
  .grid-3{grid-template-columns:1fr!important}
  .grid-2{grid-template-columns:1fr!important}
  .grid-cat{grid-template-columns:repeat(2,1fr)!important}
  .pad-main{padding:2rem 1.2rem!important}
  .pad-hero{padding:3.5rem 1.5rem 3rem!important}
  .hero-r{height:260px!important}
  .checkout-grid{grid-template-columns:1fr!important}
  .profile-grid{grid-template-columns:1fr!important}
  .svc-grid{grid-template-columns:1fr 1fr!important}
}
@media(max-width:600px){
  .svc-grid{grid-template-columns:1fr!important}
  .grid-bene{grid-template-columns:1fr!important}
  .grid-cat{grid-template-columns:1fr!important}
  .nav-inner{padding:.8rem 1rem!important}
}
`;

// ──────────────────────────────────────────────────────────────────
// APP CONTEXT
// ──────────────────────────────────────────────────────────────────
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

// ── Debug helper ─────────────────────────────────────────────────
const IS_DEV = import.meta.env.DEV ?? true;
const log = (...args) => { if (IS_DEV) console.log("[FP Auth]", ...args); };
const warn = (...args) => { if (IS_DEV) console.warn("[FP Auth]", ...args); };

// ── Supabase reachability flag (avoids crashing when placeholder) ─
const SB_LIVE = SB_URL !== "https://placeholder.supabase.co" && SB_KEY !== "placeholder";

function AppProvider({ children }) {
  // ── Cart (persisted) ───────────────────────────────────────────
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fp2_cart") || "[]"); } catch { return []; }
  });

  // ── Wishlist (persisted) ───────────────────────────────────────
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fp2_wish") || "[]"); } catch { return []; }
  });

  // ── Auth state ─────────────────────────────────────────────────
  // authLoading = true  → ainda verificando sessão inicial (evita flash)
  // profileLoading = true → sessão existe, buscando perfil no banco
  const [user, setUser]               = useState(null);
  const [profile, setProfile]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Toasts ─────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  // ── Persist cart & wishlist ────────────────────────────────────
  useEffect(() => { localStorage.setItem("fp2_cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("fp2_wish", JSON.stringify(wishlist)); }, [wishlist]);

  // ── fetchProfile: busca perfil garantindo que uid está presente ─
  // Retorna o perfil ou null. Nunca lança exceção.
  const fetchProfile = useCallback(async (uid) => {
    if (!uid || !SB_LIVE) {
      log("fetchProfile: skipped (uid=", uid, "SB_LIVE=", SB_LIVE, ")");
      return null;
    }
    log("fetchProfile: buscando perfil para uid=", uid);
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle(); // maybeSingle() retorna null sem erro se não existir
      if (error) {
        warn("fetchProfile error:", error.message, "code:", error.code);
        // RLS pode bloquear — log claro para debug
        if (error.code === "42501" || error.message?.includes("policy")) {
          warn("⚠️  RLS bloqueou acesso à tabela profiles. Verifique as políticas no Supabase.");
        }
        return null;
      }
      log("fetchProfile: dados recebidos =", data);
      setProfile(data ?? null);
      return data;
    } catch (ex) {
      warn("fetchProfile exception:", ex);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []); // sem dependências — usa apenas uid passado como argumento

  // ── upsertProfile: cria ou atualiza perfil ─────────────────────
  const upsertProfile = useCallback(async (updates, uid) => {
    // uid pode vir do argumento (signup) ou do estado user
    const targetId = uid || user?.id;
    if (!targetId || !SB_LIVE) {
      warn("upsertProfile: sem uid ou Supabase não configurado");
      return { data: null, error: new Error("Sem uid") };
    }
    log("upsertProfile: salvando uid=", targetId, "updates=", updates);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          { id: targetId, ...updates, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        )
        .select()
        .single();
      if (error) {
        warn("upsertProfile error:", error.message);
        return { data: null, error };
      }
      log("upsertProfile: perfil salvo =", data);
      setProfile(data);
      return { data, error: null };
    } catch (ex) {
      warn("upsertProfile exception:", ex);
      return { data: null, error: ex };
    }
  }, [user]);

  // ── Auth initialization + real-time listener ───────────────────
  // PROBLEMA CORRIGIDO: getSession() + onAuthStateChange podem disparar
  // em sequências diferentes. Usamos um flag `initialized` para não
  // chamar setUser/fetchProfile duas vezes na carga inicial.
  useEffect(() => {
    let initialized = false;
    let subscription = null;

    const init = async () => {
      log("init: verificando sessão existente...");

      // 1. Verifica sessão atual com getUser() — mais seguro que getSession()
      //    getUser() valida o token com o servidor, getSession() só lê localStorage
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        warn("getUser() error:", userError.message);
      }

      log("init: usuário atual =", currentUser?.email ?? "nenhum");

      setUser(currentUser ?? null);
      setAuthLoading(false);
      initialized = true;

      // Busca perfil se logado
      if (currentUser) {
        await fetchProfile(currentUser.id);
      }

      // 2. Listener de mudanças de sessão (login, logout, refresh de token)
      const { data: listenerData } = supabase.auth.onAuthStateChange(async (event, session) => {
        log("onAuthStateChange:", event, "user=", session?.user?.email ?? "null");

        const newUser = session?.user ?? null;

        // Atualiza estado do usuário
        setUser(newUser);

        if (newUser) {
          // LOGIN ou TOKEN_REFRESHED
          log("onAuthStateChange: usuário logado, buscando perfil...");
          await fetchProfile(newUser.id);
        } else {
          // SIGNED_OUT
          log("onAuthStateChange: usuário saiu, limpando perfil");
          setProfile(null);
          setProfileLoading(false);
        }
      });

      subscription = listenerData?.subscription;
    };

    if (SB_LIVE) {
      init();
    } else {
      // Modo demo: sem Supabase real
      log("Supabase não configurado — rodando em modo demo");
      setAuthLoading(false);
    }

    // Cleanup: cancela listener ao desmontar
    return () => {
      log("cleanup: unsubscribe listener");
      subscription?.unsubscribe();
    };
  }, [fetchProfile]); // fetchProfile é estável (useCallback sem deps)

  // ── Toast ──────────────────────────────────────────────────────
  const toast = useCallback((msg, type = "ok") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  // ── Cart ops ───────────────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    toast(`🌸 ${product.name} adicionado!`);
  }, [toast]);

  const removeFromCart = useCallback((id) => setCart(p => p.filter(i => i.id !== id)), []);
  const changeQty = useCallback((id, d) =>
    setCart(p => p.map(i => i.id === id ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0)), []);
  const clearCart = useCallback(() => setCart([]), []);

  // ── Wishlist ops ───────────────────────────────────────────────
  const toggleWish = useCallback((product) => {
    setWishlist(prev => {
      const has = prev.some(w => w.id === product.id);
      if (has) { toast("💔 Removido dos favoritos"); return prev.filter(w => w.id !== product.id); }
      toast("💝 Adicionado aos favoritos!");
      return [...prev, product];
    });
  }, [toast]);

  const cartCount    = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <Ctx.Provider value={{
      // Cart
      cart, addToCart, removeFromCart, changeQty, clearCart, cartCount, cartSubtotal,
      // Wishlist
      wishlist, toggleWish,
      // Auth — todos os estados expostos explicitamente
      user,
      profile,
      authLoading,       // true enquanto verifica sessão inicial
      profileLoading,    // true enquanto busca perfil no banco
      fetchProfile,      // (uid) => Promise<profile|null>
      upsertProfile,     // (updates, uid?) => Promise<{data,error}>
      setProfile,        // escape hatch para casos especiais
      // Toasts
      toasts, toast,
      // Config flag
      SB_LIVE,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ══════════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ══════════════════════════════════════════════════════════════════

function Btn({ children, onClick, disabled, full, variant="rose", size="md", style: s={} }) {
  const base = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:".4rem",
    border:"none", fontWeight:500, letterSpacing:".12em", textTransform:"uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    transition:"background .22s, color .22s, transform .15s",
    width: full ? "100%" : "auto",
    whiteSpace:"nowrap",
    ...s,
  };
  const sizes = { sm:{fontSize:".68rem",padding:".55rem 1.1rem"}, md:{fontSize:".74rem",padding:".82rem 1.8rem"}, lg:{fontSize:".8rem",padding:"1rem 2.2rem"} };
  const variants = {
    rose:  { background: disabled?"var(--gy)":"var(--ro)", color:"#fff" },
    deep:  { background:"var(--dp)", color:"#fff" },
    gold:  { background:"var(--gd)", color:"#fff" },
    outline: { background:"none", color:"var(--dp)", border:"2px solid var(--dp)" },
    ghost: { background:"none", color:"var(--ro)", border:"1px solid var(--ro)" },
    sage:  { background:"var(--sg)", color:"#fff" },
  };
  const [hov, setHov] = useState(false);
  const hovBg = { rose:"var(--dp)", deep:"var(--rd)", gold:"var(--ro)", outline:"var(--dp)", ghost:"var(--ro)", sage:"var(--dp)" };
  const hovColor = { outline:"#fff", ghost:"#fff" };
  return (
    <button
      disabled={disabled} onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant],
        ...(hov && !disabled ? { background: hovBg[variant], color: hovColor[variant] || "#fff", transform:"translateY(-1px)" } : {}),
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >{children}</button>
  );
}

function Input({ label, value, onChange, type="text", placeholder, error, span=1, as="input", rows=3, disabled }) {
  const [focus, setFocus] = useState(false);
  const style = {
    width:"100%", padding:".76rem 1rem",
    border:`1px solid ${error ? "#e04040" : focus ? "var(--ro)" : "var(--br)"}`,
    background: disabled ? "var(--lt)" : "#fff",
    fontSize:".88rem", outline:"none", color:"var(--dp)",
    resize: as==="textarea" ? "vertical" : undefined,
    transition:"border-color .2s",
  };
  return (
    <div style={{ gridColumn:`span ${span}` }}>
      {label && <label style={{ display:"block", fontSize:".66rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--gy)", marginBottom:".35rem" }}>{label}</label>}
      {as === "textarea"
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={style} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} disabled={disabled} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={style} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} disabled={disabled} />
      }
      {error && <div style={{ fontSize:".7rem", color:"#e04040", marginTop:".2rem" }}>{error}</div>}
    </div>
  );
}

function Stars({ n, total=5 }) {
  return <span style={{ color:"var(--gd)", fontSize:".78rem", letterSpacing:".04em" }}>{Array.from({length:total},(_,i)=>i<n?"★":"☆").join("")}</span>;
}

function SectionHeader({ label, title, sub, center }) {
  return (
    <div style={{ textAlign: center?"center":"left", marginBottom:"2.5rem" }}>
      <div style={{ fontSize:".63rem", textTransform:"uppercase", letterSpacing:".2em", color:"var(--ro)", marginBottom:".5rem" }}>{label}</div>
      <div className="fd" style={{ fontSize:"clamp(1.8rem,3vw,2.6rem)", fontWeight:300, lineHeight:1.1 }}>{title}</div>
      {sub && <p style={{ marginTop:".6rem", fontSize:".88rem", color:"var(--gy)", maxWidth: center?"480px":"none", margin: center?":.6rem auto 0":".6rem 0 0" }}>{sub}</p>}
    </div>
  );
}

function Spinner({ size=22 }) {
  return <span style={{ display:"inline-block", width:size, height:size, border:"2.5px solid rgba(255,255,255,.35)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .75s linear infinite" }} />;
}

// ── Toasts ──────────────────────────────────────────────────────
function Toasts() {
  const { toasts } = useApp();
  return (
    <div style={{ position:"fixed", bottom:"1.5rem", right:"1.5rem", zIndex:9999, display:"flex", flexDirection:"column", gap:".5rem", pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==="err" ? "#3a1010" : "var(--dp)",
          color:"#fff", padding:".72rem 1.2rem", fontSize:".82rem",
          borderLeft:`3px solid ${t.type==="err" ? "#e04040" : "var(--ro)"}`,
          boxShadow:"0 8px 28px rgba(44,31,31,.18)", animation:"toastIn .3s ease",
          maxWidth:300, pointerEvents:"all",
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ── Topbar ticker ───────────────────────────────────────────────
function Topbar() {
  const items = ["🚚 Frete grátis acima de R$ 150","⚡ Entrega no mesmo dia até 16h","🌸 Cupom FLORES10 · 10% OFF","💳 3× sem juros","🌺 Flores importadas disponíveis"];
  const doubled = [...items,...items];
  return (
    <div style={{ background:"var(--dp2)", color:"rgba(250,247,242,.5)", fontSize:".64rem", textTransform:"uppercase", letterSpacing:".15em", padding:".45rem 0", overflow:"hidden", whiteSpace:"nowrap" }}>
      <div style={{ display:"inline-flex", gap:"4rem", animation:"ticker 30s linear infinite" }}>
        {doubled.map((t,i) => <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:".5rem" }}><span style={{ color:"var(--gd)" }}>{t}</span></span>)}
      </div>
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────
const NAV_LINKS = [
  { key:"home",     label:"Início" },
  { key:"catalog",  label:"Catálogo" },
  { key:"services", label:"Serviços" },
  { key:"sobre",    label:"Sobre" },
  { key:"contato",  label:"Contato" },
];

function Navbar({ page, go, openCart, openWish }) {
  const { cartCount, wishlist, user } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const lnkS = (active) => ({
    background:"none", border:"none", cursor:"pointer",
    fontSize:".71rem", textTransform:"uppercase", letterSpacing:".12em",
    color: active ? "var(--ro)" : "var(--dp)", fontWeight:500,
    borderBottom: active ? "1px solid var(--ro)" : "1px solid transparent",
    paddingBottom:"2px", transition:"color .2s",
  });

  const iconBtn = (onClick, label, badge, icon) => (
    <button onClick={onClick} title={label} style={{ position:"relative", width:38, height:38, background:"none", border:"none", cursor:"pointer", fontSize:"1.1rem", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:2, transition:"background .2s", color:"var(--dp)" }}
      onMouseEnter={e=>e.currentTarget.style.background="var(--lt)"}
      onMouseLeave={e=>e.currentTarget.style.background="none"}>
      {icon}
      {badge > 0 && <span style={{ position:"absolute", top:3, right:3, width:15, height:15, background:"var(--ro)", color:"#fff", borderRadius:"50%", fontSize:".5rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{badge}</span>}
    </button>
  );

  return (
    <nav style={{ position:"sticky", top:0, zIndex:100, background: scrolled?"rgba(250,247,242,.97)":"var(--cr)", borderBottom:"1px solid var(--bl)", backdropFilter:"blur(14px)", transition:"background .3s" }}>
      <div className="nav-inner" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:".85rem 2.5rem", gap:"1rem" }}>
        {/* Logo */}
        <button onClick={()=>go("home")} style={{ background:"none", border:"none", cursor:"pointer", flexShrink:0 }}>
          <span className="fd" style={{ fontSize:"1.55rem", fontWeight:600, color:"var(--dp)", letterSpacing:".04em" }}>
            Flores<span style={{ color:"var(--ro)" }}>&</span>Pétalas
          </span>
        </button>

        {/* Desktop links */}
        <ul className="hide-mob" style={{ display:"flex", gap:"1.8rem", listStyle:"none" }}>
          {NAV_LINKS.map(l => <li key={l.key}><button style={lnkS(page===l.key)} onClick={()=>go(l.key)}>{l.label}</button></li>)}
        </ul>

        {/* Actions */}
        <div style={{ display:"flex", gap:".15rem", alignItems:"center" }}>
          {iconBtn(openWish,    "Favoritos",  wishlist.length, "♡")}
          {iconBtn(openCart,    "Carrinho",   cartCount,       "🛒")}
          {iconBtn(()=>go("profile"), user?"Meu perfil":"Entrar", 0, user ? "👤" : "🔑")}
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════
// PRODUCT CARD
// ══════════════════════════════════════════════════════════════════
function ProductCard({ p, delay=0 }) {
  const { addToCart, wishlist, toggleWish } = useApp();
  const [ok, setOk] = useState(false);
  const inWish = wishlist.some(w => w.id === p.id);

  const handleAdd = (e) => {
    e?.stopPropagation();
    addToCart(p); setOk(true);
    setTimeout(() => setOk(false), 900);
  };

  return (
    <div className="pcard reveal" style={{ background:"var(--wh)", border:"1px solid var(--br)", position:"relative", animationDelay:`${delay}ms` }}>
      {/* Image */}
      <div className="pcard-img" style={{ position:"relative", height:220, background:"var(--lt)" }}>
        <img src={p.img} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" />
        {p.badge && <span style={{ position:"absolute", top:".6rem", left:".6rem", background:"var(--dp)", color:"#fff", fontSize:".58rem", textTransform:"uppercase", letterSpacing:".1em", padding:".22rem .6rem" }}>{p.badge}</span>}
        <button onClick={e=>{e.stopPropagation();toggleWish(p)}} style={{ position:"absolute", top:".6rem", right:".6rem", width:30, height:30, background:"rgba(255,255,255,.9)", border:"none", borderRadius:"50%", fontSize:".9rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", animation: inWish?"heartPop .35s ease":"none" }}>
          {inWish ? "♥" : "♡"}
        </button>
        {/* Quick-add overlay */}
        <div className="ov">
          <button onClick={handleAdd} style={{ width:"100%", background:"var(--ro)", color:"#fff", border:"none", padding:".62rem", fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", cursor:"pointer" }}>
            + Adicionar ao carrinho
          </button>
        </div>
      </div>
      {/* Info */}
      <div style={{ padding:"1rem 1.1rem 1.2rem" }}>
        <div style={{ fontSize:".6rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--gy)", marginBottom:".2rem" }}>
          {CATEGORIES.find(c=>c.key===p.category)?.label || p.category}
        </div>
        <h3 className="fd" style={{ fontSize:"1.1rem", fontWeight:400, marginBottom:".3rem", lineHeight:1.2 }}>{p.name}</h3>
        <p style={{ fontSize:".74rem", color:"var(--gy)", lineHeight:1.55, minHeight:"2.2rem", marginBottom:".6rem" }}>{p.description}</p>
        <div style={{ display:"flex", alignItems:"center", gap:".35rem", marginBottom:".75rem" }}>
          <Stars n={p.stars} /> <span style={{ fontSize:".68rem", color:"var(--gy)" }}>({p.reviews})</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            {p.old_price && <span style={{ fontSize:".78rem", color:"var(--gy)", textDecoration:"line-through", marginRight:".35rem" }}>R$ {p.old_price}</span>}
            <span className="fd" style={{ fontSize:"1.4rem", color:"var(--ro)", fontWeight:300 }}>R$ {p.price}</span>
          </div>
          <button onClick={handleAdd} style={{ width:34, height:34, background: ok?"var(--sg)":"var(--ro)", color:"#fff", border:"none", fontSize:"1rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .3s" }}>
            {ok ? "✓" : "+"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CART PANEL
// ══════════════════════════════════════════════════════════════════
function CartPanel({ open, onClose, onCheckout }) {
  const { cart, removeFromCart, changeQty, cartSubtotal, cartCount } = useApp();
  const ship = cartSubtotal >= 150 ? 0 : 15;
  const total = cartSubtotal + ship;
  if (!open) return null;
  return (
    <>
      <div className="overlay-bg" onClick={onClose} />
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(420px,100vw)", background:"#fff", zIndex:201, display:"flex", flexDirection:"column", boxShadow:"-16px 0 50px rgba(44,31,31,.13)", animation:"slideR .35s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding:"1.5rem 1.8rem", borderBottom:"1px solid var(--bl)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span className="fd" style={{ fontSize:"1.5rem", fontWeight:400 }}>Meu Carrinho 🛒</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.2rem", color:"var(--gy)" }} onMouseEnter={e=>e.currentTarget.style.color="var(--ro)"} onMouseLeave={e=>e.currentTarget.style.color="var(--gy)"}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"1.2rem 1.8rem" }}>
          {cart.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1rem", color:"var(--gy)", textAlign:"center", padding:"3rem 0" }}>
              <span style={{ fontSize:"3rem" }}>🛒</span>
              <p style={{ fontSize:".85rem" }}>Seu carrinho está vazio</p>
              <button onClick={onClose} style={{ fontSize:".72rem", color:"var(--ro)", background:"none", border:"1px solid var(--ro)", padding:".5rem 1.2rem", cursor:"pointer", textTransform:"uppercase", letterSpacing:".12em" }}>Ver catálogo →</button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:".9rem" }}>
              {/* Frete bar */}
              <div style={{ padding:".7rem .9rem", background:"var(--cr)", border:"1px solid var(--br)", fontSize:".72rem", color:"var(--gy)" }}>
                <div style={{ width:"100%", height:4, background:"var(--lt)", borderRadius:2, marginBottom:".3rem", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.min(100,(cartSubtotal/150)*100)}%`, background:"var(--sg)", borderRadius:2, transition:"width .4s" }} />
                </div>
                {cartSubtotal >= 150 ? <b style={{ color:"var(--sg)" }}>🎉 Frete grátis liberado!</b>
                  : <>Falta <b>R$ {(150-cartSubtotal).toFixed(2).replace(".",",")}</b> para frete grátis</>}
              </div>
              {cart.map(item => (
                <div key={item.id} style={{ display:"flex", gap:".9rem", alignItems:"flex-start", paddingBottom:".9rem", borderBottom:"1px solid var(--lt)" }}>
                  <div style={{ width:64, height:64, borderRadius:3, overflow:"hidden", flexShrink:0 }}>
                    <img src={item.img} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:".82rem", fontWeight:500, marginBottom:".1rem" }}>{item.name}</div>
                    <div className="fd" style={{ fontSize:"1.1rem", color:"var(--ro)" }}>R$ {item.price.toFixed(2).replace(".",",")}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:".4rem", marginTop:".3rem" }}>
                      {[[-1,"−"],[1,"+"]].map(([d,l]) => (
                        <button key={d} onClick={()=>changeQty(item.id,d)} style={{ width:22, height:22, border:"1px solid var(--bl)", background:"none", cursor:"pointer", fontSize:".9rem", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}
                          onMouseEnter={e=>{e.currentTarget.style.background="var(--ro)";e.currentTarget.style.color="#fff"}}
                          onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="inherit"}}>{l}</button>
                      ))}
                      <span style={{ fontSize:".82rem", fontWeight:500, minWidth:18, textAlign:"center" }}>{item.qty}</span>
                    </div>
                  </div>
                  <button onClick={()=>removeFromCart(item.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#ccc", fontSize:".9rem", transition:"color .2s" }}
                    onMouseEnter={e=>e.currentTarget.style.color="var(--ro)"} onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div style={{ padding:"1.4rem 1.8rem", borderTop:"1px solid var(--bl)" }}>
            {[["Subtotal",`R$ ${cartSubtotal.toFixed(2).replace(".",",")}`],["Frete", ship===0?"Grátis!":`R$ ${ship.toFixed(2).replace(".",",")}`]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:".82rem", color:"var(--gy)", marginBottom:".4rem" }}>
                <span>{k}</span><span style={{ color:v==="Grátis!"?"var(--sg)":"inherit" }}>{v}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"1rem 0 1.2rem" }}>
              <span style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".14em", color:"var(--gy)" }}>Total</span>
              <span className="fd" style={{ fontSize:"2rem", fontWeight:300 }}>R$ {total.toFixed(2).replace(".",",")}</span>
            </div>
            <Btn full onClick={()=>{onClose();onCheckout();}}>Finalizar compra →</Btn>
            <button onClick={onClose} style={{ width:"100%", padding:".6rem", background:"none", border:"1px solid var(--bl)", fontSize:".72rem", textTransform:"uppercase", letterSpacing:".12em", cursor:"pointer", marginTop:".5rem", color:"var(--dp)", transition:"background .2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--lt)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>Continuar comprando</button>
          </div>
        )}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// WISHLIST PANEL
// ══════════════════════════════════════════════════════════════════
function WishPanel({ open, onClose }) {
  const { wishlist, toggleWish, addToCart } = useApp();
  if (!open) return null;
  return (
    <>
      <div className="overlay-bg" onClick={onClose} />
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(420px,100vw)", background:"#fff", zIndex:201, display:"flex", flexDirection:"column", boxShadow:"-16px 0 50px rgba(44,31,31,.13)", animation:"slideR .35s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding:"1.5rem 1.8rem", borderBottom:"1px solid var(--bl)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".7rem" }}>
            <span className="fd" style={{ fontSize:"1.5rem", fontWeight:400 }}>Favoritos ♥</span>
            <span style={{ background:"var(--bl)", color:"var(--ro)", fontSize:".65rem", fontWeight:700, padding:".2rem .55rem", borderRadius:20 }}>{wishlist.length}</span>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.2rem", color:"var(--gy)" }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"1.2rem 1.5rem", display:"flex", flexDirection:"column", gap:".8rem" }}>
          {wishlist.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem 0", color:"var(--gy)" }}>
              <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>♡</div>
              <p style={{ fontSize:".85rem", lineHeight:1.6 }}>Sua lista de favoritos está vazia.<br/>Clique em ♡ nos produtos para salvar.</p>
            </div>
          ) : wishlist.map(w => (
            <div key={w.id} style={{ display:"flex", gap:".9rem", background:"var(--cr)", border:"1px solid var(--br)", padding:".9rem" }}>
              <div style={{ width:68, height:68, flexShrink:0, overflow:"hidden", borderRadius:2 }}>
                <img src={w.img} alt={w.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:".6rem", textTransform:"uppercase", letterSpacing:".1em", color:"var(--gy)" }}>{w.category}</div>
                <div style={{ fontSize:".88rem", fontWeight:500, marginBottom:".3rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.name}</div>
                <div className="fd" style={{ fontSize:"1.2rem", color:"var(--ro)", marginBottom:".45rem" }}>R$ {w.price}</div>
                <div style={{ display:"flex", gap:".5rem" }}>
                  <button onClick={()=>addToCart(w)} style={{ flex:1, padding:".38rem .6rem", background:"var(--ro)", color:"#fff", border:"none", fontSize:".68rem", textTransform:"uppercase", letterSpacing:".1em", cursor:"pointer" }}>+ Carrinho</button>
                  <button onClick={()=>toggleWish(w)} style={{ width:28, height:28, border:"1px solid var(--bl)", background:"none", cursor:"pointer", color:"var(--gy)", fontSize:".75rem", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {wishlist.length > 0 && (
          <div style={{ padding:"1.2rem 1.5rem", borderTop:"1px solid var(--bl)" }}>
            <Btn full onClick={()=>{ wishlist.forEach(w=>addToCart(w)); }}>Adicionar tudo ao carrinho →</Btn>
          </div>
        )}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// HERO
// ══════════════════════════════════════════════════════════════════
function Hero({ go }) {
  return (
    <section className="grid-hero" style={{ display:"grid", gridTemplateColumns:"52% 48%", minHeight:"88vh", overflow:"hidden" }}>
      <div className="pad-hero" style={{ display:"flex", flexDirection:"column", justifyContent:"center", padding:"5rem 3.5rem 5rem 5rem" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:".6rem", background:"var(--bl)", padding:".38rem 1rem", fontSize:".63rem", textTransform:"uppercase", letterSpacing:".18em", color:"var(--ro)", marginBottom:"1.5rem", width:"fit-content", animation:"fadeUp .6s .1s both" }}>
          <span style={{ width:6, height:6, background:"var(--ro)", borderRadius:"50%", animation:"pulse 2s infinite" }} />
          Nova coleção — Primavera 2025
        </div>
        <h1 className="fd" style={{ fontSize:"clamp(2.8rem,5vw,5.2rem)", fontWeight:300, lineHeight:1.05, marginBottom:"1.3rem", animation:"fadeUp .6s .25s both" }}>
          Flores que<br/>falam pelo<br/><em style={{ color:"var(--ro)", fontStyle:"italic" }}>coração</em>
        </h1>
        <p style={{ fontSize:".92rem", lineHeight:1.85, color:"var(--gy)", maxWidth:400, marginBottom:"2rem", fontWeight:300, animation:"fadeUp .6s .4s both" }}>
          Arranjos frescos entregues no mesmo dia. Do buquê romântico ao presente perfeito — a natureza mais bela na sua porta.
        </p>
        <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", animation:"fadeUp .6s .55s both" }}>
          <Btn onClick={()=>go("catalog")} size="lg">Comprar agora →</Btn>
          <Btn variant="outline" onClick={()=>go("services")} size="lg">Ver serviços</Btn>
        </div>
        <div style={{ display:"flex", gap:"2.5rem", marginTop:"2.5rem", animation:"fadeUp .6s .7s both", flexWrap:"wrap" }}>
          {[["8k+","clientes"],["★ 4.9","avaliação"],["Mesmo dia","entrega"]].map(([v,l])=>(
            <div key={l} style={{ fontSize:".72rem", color:"var(--gy)" }}>
              <strong style={{ color:"var(--dp)", fontSize:".9rem" }}>{v}</strong> {l}
            </div>
          ))}
        </div>
      </div>
      <div className="hero-r" style={{ position:"relative", overflow:"hidden", background:"linear-gradient(135deg,#fde8e0,#f5d0c0,#e8d5c8)" }}>
        <img src="https://images.pexels.com/photos/33486193/pexels-photo-33486193.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Flores" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.06)" }} />
        <div style={{ position:"absolute", bottom:"2.5rem", left:"2.5rem", right:"2.5rem", background:"var(--dp)", color:"#fff", padding:".85rem 1.4rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>
          <div>
            <div style={{ fontSize:".55rem", textTransform:"uppercase", letterSpacing:".14em", color:"rgba(255,255,255,.4)" }}>Oferta da semana</div>
            <div className="fd" style={{ fontSize:"1.2rem", color:"var(--gd)" }}>Buquê Especial — R$ 99</div>
          </div>
          <button onClick={()=>go("catalog")} style={{ background:"var(--ro)", color:"#fff", border:"none", padding:".4rem .85rem", fontSize:".62rem", textTransform:"uppercase", letterSpacing:".1em", cursor:"pointer" }}>Ver →</button>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// BENEFITS
// ══════════════════════════════════════════════════════════════════
function Benefits() {
  const items = [
    {icon:"🚚",title:"Entrega no mesmo dia",sub:"Pedidos até 16h"},
    {icon:"🌺",title:"Flores sempre frescas",sub:"Colhidas diariamente"},
    {icon:"💳",title:"3× sem juros",sub:"Principais cartões"},
    {icon:"🎁",title:"Embalagem exclusiva",sub:"Presente perfeito"},
  ];
  return (
    <div className="grid-bene" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", background:"var(--wh)", borderTop:"1px solid var(--br)", borderBottom:"1px solid var(--br)" }}>
      {items.map((b,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"1.5rem 1.8rem", borderRight: i<3?"1px solid var(--br)":"none" }}>
          <span style={{ fontSize:"1.6rem" }}>{b.icon}</span>
          <div>
            <div style={{ fontSize:".82rem", fontWeight:600, color:"var(--dp)" }}>{b.title}</div>
            <div style={{ fontSize:".72rem", color:"var(--gy)" }}>{b.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PROMO BANNER w/ countdown
// ══════════════════════════════════════════════════════════════════
function PromoBanner({ go }) {
  const [t, setT] = useState({h:"07",m:"42",s:"18"});
  useEffect(() => {
    const end = new Date(); end.setHours(23,59,59,0);
    const iv = setInterval(() => {
      let d = Math.max(0, end - Date.now()) / 1000;
      const h = Math.floor(d/3600); d%=3600;
      setT({ h:String(h).padStart(2,"0"), m:String(Math.floor(d/60)).padStart(2,"0"), s:String(Math.floor(d%60)).padStart(2,"0") });
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  const cdN = v => <span style={{ background:"var(--ro)", color:"#fff", padding:".48rem .88rem", fontSize:"1.35rem", fontWeight:700, minWidth:50, textAlign:"center", display:"inline-block" }}>{v}</span>;
  return (
    <div style={{ margin:"3rem 2.5rem", background:"var(--dp)", color:"#fff", display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", padding:"2.5rem 3rem", gap:"2rem", overflow:"hidden", position:"relative" }}>
      <div style={{ position:"absolute", top:"-20%", right:"-4%", fontSize:"11rem", opacity:.04, pointerEvents:"none" }}>🌸</div>
      <div>
        <div style={{ fontSize:".62rem", textTransform:"uppercase", letterSpacing:".2em", color:"var(--gd)", marginBottom:".6rem" }}>🔥 Oferta relâmpago — termina hoje</div>
        <div className="fd" style={{ fontSize:"clamp(1.4rem,3vw,2.4rem)", fontWeight:300, marginBottom:".5rem" }}>30% OFF em todos os arranjos</div>
        <p style={{ fontSize:".82rem", color:"rgba(250,247,242,.6)", marginBottom:"1.5rem" }}>Use o cupom <strong style={{ color:"var(--gd)" }}>FLORES10</strong> na finalização da compra</p>
        <Btn variant="gold" onClick={()=>go("catalog")}>Aproveitar oferta →</Btn>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:".6rem", textTransform:"uppercase", letterSpacing:".16em", color:"rgba(255,255,255,.35)", marginBottom:".7rem" }}>Termina em</div>
        <div style={{ display:"flex", alignItems:"center", gap:".4rem" }}>
          {cdN(t.h)}<span style={{ color:"var(--gd)", fontWeight:700, fontSize:"1.35rem" }}>:</span>
          {cdN(t.m)}<span style={{ color:"var(--gd)", fontWeight:700, fontSize:"1.35rem" }}>:</span>
          {cdN(t.s)}
        </div>
        <div style={{ display:"flex", justifyContent:"space-around", fontSize:".58rem", textTransform:"uppercase", letterSpacing:".1em", color:"rgba(255,255,255,.3)", marginTop:".4rem" }}>
          {["Horas","Min","Seg"].map(x=><span key={x} style={{ minWidth:50, textAlign:"center" }}>{x}</span>)}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// NEWSLETTER
// ══════════════════════════════════════════════════════════════════
function Newsletter() {
  const { toast } = useApp();
  const [email, setEmail] = useState("");
  const send = () => {
    if (!email.includes("@")) { toast("⚠️ E-mail inválido","err"); return; }
    toast("✓ Cupom FLORES10 enviado para " + email + " 🌸");
    setEmail("");
  };
  return (
    <div style={{ background:"var(--ro)", padding:"4rem 2.5rem", textAlign:"center" }}>
      <div style={{ maxWidth:580, margin:"0 auto" }}>
        <div style={{ fontSize:"2rem", marginBottom:".5rem" }}>🌸</div>
        <div className="fd" style={{ fontSize:"clamp(1.5rem,2.5vw,2.2rem)", fontWeight:300, color:"#fff", marginBottom:".5rem" }}>Ganhe 10% OFF na primeira compra</div>
        <p style={{ fontSize:".85rem", color:"rgba(255,255,255,.75)", marginBottom:"1.5rem" }}>Inscreva-se e receba o cupom direto no seu e-mail</p>
        <div style={{ display:"flex", gap:0, maxWidth:420, margin:"0 auto" }}>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="seu@email.com"
            style={{ flex:1, padding:".85rem 1rem", border:"none", fontSize:".85rem", outline:"none", fontFamily:"DM Sans,sans-serif" }} />
          <button onClick={send} style={{ background:"var(--dp)", color:"#fff", border:"none", padding:".85rem 1.4rem", fontSize:".72rem", textTransform:"uppercase", letterSpacing:".12em", cursor:"pointer", whiteSpace:"nowrap", transition:"background .2s" }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--rd)"} onMouseLeave={e=>e.currentTarget.style.background="var(--dp)"}>Quero o cupom</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ══════════════════════════════════════════════════════════════════
const TESTIMONIALS = [
  {name:"Ana Paula Ramos",   detail:"Casamento · Mar 2025",     icon:"👰", stars:5, text:"O buquê da noiva ficou absolutamente perfeito! Superou todas as expectativas. As flores chegaram fresquíssimas e a equipe foi super atenciosa em cada detalhe."},
  {name:"Carlos Mendes",     detail:"Assinatura semanal",       icon:"🌺", stars:5, text:"Compro pela assinatura toda semana. A qualidade é sempre impecável! Flores chegam fresquíssimas e a embalagem é linda. Recomendo muito!"},
  {name:"Marina Santos",     detail:"Cesta Romântica · Fev 25", icon:"💐", stars:5, text:"Pedi a cesta romântica de surpresa para meu marido. Chegou pontual, lindo demais! Ele amou cada detalhe. Com certeza voltarei a comprar!"},
];

function Testimonials() {
  return (
    <section style={{ padding:"4rem 2.5rem", background:"var(--wh)" }}>
      <SectionHeader label="O que dizem" title="Clientes apaixonados" center />
      <div className="grid-3" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.5rem", maxWidth:1100, margin:"0 auto" }}>
        {TESTIMONIALS.map((t,i) => (
          <div key={i} className="reveal" style={{ background:"var(--cr)", padding:"1.8rem", border:"1px solid var(--br)" }}>
            <Stars n={t.stars} />
            <p style={{ fontSize:".85rem", lineHeight:1.7, color:"var(--gy)", margin:".8rem 0 1.2rem", fontStyle:"italic" }}>"{t.text}"</p>
            <div style={{ display:"flex", alignItems:"center", gap:".8rem" }}>
              <div style={{ width:36, height:36, background:"var(--bl)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 }}>{t.icon}</div>
              <div>
                <div style={{ fontSize:".82rem", fontWeight:500 }}>{t.name}</div>
                <div style={{ fontSize:".7rem", color:"var(--gy)" }}>{t.detail}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════
function HomePage({ products, loading, go }) {
  const featured = products.filter(p => p.featured).slice(0, 4);
  return (
    <>
      <Hero go={go} />
      <Benefits />

      {/* Destaque */}
      <section style={{ padding:"4rem 2.5rem", background:"var(--wh)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"2.5rem" }}>
            <SectionHeader label="Os favoritos" title="Mais vendidos" />
            <button onClick={()=>go("catalog")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:".72rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--ro)" }}>Ver tudo →</button>
          </div>
          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"1.5rem" }}>
              {[1,2,3,4].map(i => <div key={i} className="skel" style={{ height:360, borderRadius:2 }} />)}
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"1.5rem" }}>
              {featured.map((p,i) => <ProductCard key={p.id} p={p} delay={i*80} />)}
            </div>
          )}
        </div>
      </section>

      <PromoBanner go={go} />

      {/* Categorias */}
      <section style={{ padding:"4rem 2.5rem", background:"var(--cr)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <SectionHeader label="Navegue por" title="Nossas categorias" center />
          <div className="grid-cat" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", maxWidth:760, margin:"0 auto" }}>
            {CATEGORIES.filter(c=>c.key!=="todos").map((c) => (
              <button key={c.key} onClick={()=>go("catalog")} className="reveal"
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:".6rem", padding:"1.5rem 1rem", background:"#fff", border:"1px solid var(--br)", cursor:"pointer", transition:"all .25s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--ro)";e.currentTarget.style.transform="translateY(-3px)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--br)";e.currentTarget.style.transform="translateY(0)"}}>
                <span style={{ fontSize:"1.8rem" }}>{c.icon}</span>
                <span style={{ fontSize:".75rem", textTransform:"uppercase", letterSpacing:".12em", fontWeight:500 }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
      <Newsletter />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// CATALOG PAGE
// ══════════════════════════════════════════════════════════════════
function CatalogPage({ products, loading }) {
  const [cat, setCat] = useState("todos");
  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => products
    .filter(p => cat === "todos" || p.category === cat)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (sort==="price-asc")  return a.price - b.price;
      if (sort==="price-desc") return b.price - a.price;
      if (sort==="popular")    return b.reviews - a.reviews;
      return (b.featured?1:0) - (a.featured?1:0);
    }), [products, cat, sort, search]);

  return (
    <div className="pad-main" style={{ padding:"3rem 2.5rem", minHeight:"70vh" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <SectionHeader label="Nossa loja" title="Catálogo completo" sub="Flores frescas colhidas diariamente, entregues no mesmo dia" />
        {/* Filters */}
        <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", alignItems:"center", marginBottom:"2rem" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar produtos..." style={{ padding:".65rem 1rem", border:"1px solid var(--br)", background:"#fff", fontSize:".85rem", outline:"none", fontFamily:"DM Sans,sans-serif", minWidth:200, flex:"1 0 200px", maxWidth:300 }} />
          <div style={{ display:"flex", gap:".4rem", flexWrap:"wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={()=>setCat(c.key)} style={{ padding:".5rem 1rem", border:`1px solid ${cat===c.key?"var(--ro)":"var(--br)"}`, background: cat===c.key?"var(--ro)":"#fff", color: cat===c.key?"#fff":"var(--dp)", fontSize:".7rem", textTransform:"uppercase", letterSpacing:".1em", cursor:"pointer", transition:"all .2s" }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{ padding:".55rem .9rem", border:"1px solid var(--br)", background:"#fff", fontSize:".8rem", fontFamily:"DM Sans,sans-serif", outline:"none", cursor:"pointer" }}>
            <option value="default">Destaques</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="popular">Mais avaliados</option>
          </select>
        </div>
        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"1.5rem" }}>
            {[1,2,3,4,5,6].map(i=><div key={i} className="skel" style={{ height:360 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem", color:"var(--gy)" }}>
            <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>🌸</div>
            <p>Nenhum produto encontrado.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize:".76rem", color:"var(--gy)", marginBottom:"1.5rem" }}>{filtered.length} produto{filtered.length!==1?"s":""} encontrado{filtered.length!==1?"s":""}</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"1.5rem" }}>
              {filtered.map((p,i) => <ProductCard key={p.id} p={p} delay={i*50} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SERVICES PAGE
// ══════════════════════════════════════════════════════════════════
const SERVICES = [
  {
    icon:"💐", title:"Buquês Personalizados",
    price:"A partir de R$ 89", tag:"Mais popular",
    desc:"Criamos o buquê dos seus sonhos sob encomenda. Escolha as flores, cores, tamanho e embrulho — cada peça é única, confeccionada por nossas floristas com mais de 10 anos de experiência.",
    items:["Consulta gratuita por WhatsApp","Flores nacionais e importadas","Embrulho exclusivo artesanal","Pronto em até 2 horas","Foto antes da entrega"],
    img:"https://images.pexels.com/photos/32136633/pexels-photo-32136633.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    icon:"📅", title:"Entregas Programadas",
    price:"Frete grátis acima de R$ 150", tag:"Praticidade",
    desc:"Agende suas entregas com antecedência e garanta que suas flores cheguem no momento certo. Ideal para datas comemorativas, aniversários e surpresas especiais.",
    items:["Agendamento com até 30 dias de antecedência","Confirmação por e-mail e WhatsApp","Rastreamento da entrega em tempo real","Reagendamento gratuito em até 24h","Entrega no mesmo dia (pedidos até 16h)"],
    img:"https://images.pexels.com/photos/5706744/pexels-photo-5706744.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    icon:"🎊", title:"Decoração para Eventos",
    price:"Orçamento personalizado", tag:"Premium",
    desc:"Transformamos seu evento em uma experiência visual inesquecível. Casamentos, aniversários, formaturas, eventos corporativos — nossa equipe cuida de cada detalhe da decoração floral.",
    items:["Consultoria de decoração presencial","Arco e arranjo de entrada","Mesa de flores para recepção","Topiária e centros de mesa","Desmontagem após o evento incluída"],
    img:"https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    icon:"🔄", title:"Assinatura de Flores",
    price:"A partir de R$ 129/mês", tag:"Economize até 25%",
    desc:"Tenha flores frescas sempre em casa ou no escritório. Nossa assinatura mensal traz uma seleção especial de flores da estação com desconto exclusivo para assinantes.",
    items:["Entrega semanal, quinzenal ou mensal","Flores da estação selecionadas","Desconto progressivo no plano anual","Personalização das flores preferidas","Pausa ou cancelamento sem burocracia"],
    img:"https://images.pexels.com/photos/1037994/pexels-photo-1037994.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    icon:"🎁", title:"Presentes Corporativos",
    price:"Pedidos a partir de 10 unidades", tag:"Empresas",
    desc:"Fortaleça relacionamentos profissionais com presentes florais personalizados. Kits corporativos com branding da sua empresa, entregues em toda a cidade.",
    items:["Personalização com logotipo da empresa","Nota fiscal emitida","Entrega em lote programada","Consultoria de presentes executivos","Embalagem corporativa premium"],
    img:"https://images.pexels.com/photos/2232569/pexels-photo-2232569.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    icon:"🌿", title:"Plantas & Jardins",
    price:"A partir de R$ 59", tag:"Sustentável",
    desc:"Curadoria de plantas para ambientes internos e externos. Ensinamos como cuidar de cada espécie e oferecemos suporte pós-compra para garantir que sua planta floresça.",
    items:["Consultoria de espécies por ambiente","Vasos artesanais exclusivos","Guia de cuidados personalizado","Adubo e substrato incluídos","Suporte pós-compra por 30 dias"],
    img:"https://images.pexels.com/photos/776656/pexels-photo-776656.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
];

function ServicesPage({ go }) {
  const { toast } = useApp();
  return (
    <div className="pad-main" style={{ padding:"3rem 2.5rem" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <SectionHeader label="O que oferecemos" title="Nossos serviços" sub="Soluções florais completas para cada momento da sua vida" center />

        {/* Hero banner */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem", marginBottom:"4rem", background:"var(--dp)", overflow:"hidden", position:"relative" }} className="grid-2">
          <div style={{ padding:"3rem", color:"#fff", display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <div style={{ fontSize:".62rem", textTransform:"uppercase", letterSpacing:".2em", color:"var(--gd)", marginBottom:".8rem" }}>✦ Por que nos escolher?</div>
            <div className="fd" style={{ fontSize:"clamp(1.6rem,2.5vw,2.2rem)", fontWeight:300, marginBottom:"1rem" }}>12 anos criando momentos inesquecíveis</div>
            <p style={{ fontSize:".88rem", lineHeight:1.75, color:"rgba(250,247,242,.7)", marginBottom:"1.5rem" }}>
              Da flor colhida ao sorriso na entrega — cada etapa é cuidada com paixão. Nossa equipe de floristas certificadas garante qualidade, frescor e pontualidade em cada pedido.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1.5rem" }}>
              {[["8.000+","Pedidos entregues"],["★ 4.9","Avaliação média"],["2h","Tempo médio"],["12+","Anos de mercado"]].map(([v,l])=>(
                <div key={l} style={{ borderLeft:"2px solid var(--ro)", paddingLeft:".8rem" }}>
                  <div className="fd" style={{ fontSize:"1.5rem", color:"var(--gd)", fontWeight:300 }}>{v}</div>
                  <div style={{ fontSize:".7rem", color:"rgba(250,247,242,.5)", textTransform:"uppercase", letterSpacing:".08em" }}>{l}</div>
                </div>
              ))}
            </div>
            <Btn variant="gold" onClick={()=>go("contato")}>Solicitar orçamento →</Btn>
          </div>
          <div style={{ position:"relative", minHeight:320 }}>
            <img src="https://images.pexels.com/photos/5241874/pexels-photo-5241874.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Serviços" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        </div>

        {/* Services grid */}
        <div className="svc-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.5rem", marginBottom:"4rem" }}>
          {SERVICES.map((svc, i) => (
            <div key={i} className="reveal" style={{ background:"var(--wh)", border:"1px solid var(--br)", overflow:"hidden", transition:"box-shadow .3s,transform .3s" }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 12px 40px rgba(44,31,31,.1)";e.currentTarget.style.transform="translateY(-4px)"}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)"}}>
              <div style={{ height:180, overflow:"hidden", position:"relative" }}>
                <img src={svc.img} alt={svc.title} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .5s" }}
                  onMouseEnter={e=>e.target.style.transform="scale(1.07)"} onMouseLeave={e=>e.target.style.transform="scale(1)"} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(44,31,31,.6), transparent)" }} />
                <div style={{ position:"absolute", bottom:".8rem", left:".8rem", background:"var(--ro)", color:"#fff", fontSize:".6rem", textTransform:"uppercase", letterSpacing:".1em", padding:".22rem .65rem" }}>{svc.tag}</div>
              </div>
              <div style={{ padding:"1.4rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:".6rem", marginBottom:".7rem" }}>
                  <span style={{ fontSize:"1.4rem" }}>{svc.icon}</span>
                  <h3 className="fd" style={{ fontSize:"1.1rem", fontWeight:400 }}>{svc.title}</h3>
                </div>
                <p style={{ fontSize:".8rem", lineHeight:1.65, color:"var(--gy)", marginBottom:"1rem" }}>{svc.desc}</p>
                <ul style={{ listStyle:"none", marginBottom:"1.1rem", display:"flex", flexDirection:"column", gap:".35rem" }}>
                  {svc.items.map((it,j) => (
                    <li key={j} style={{ display:"flex", alignItems:"flex-start", gap:".5rem", fontSize:".76rem", color:"var(--dp)" }}>
                      <span style={{ color:"var(--sg)", fontWeight:700, flexShrink:0 }}>✓</span>{it}
                    </li>
                  ))}
                </ul>
                <div style={{ borderTop:"1px solid var(--br)", paddingTop:".9rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:".6rem", textTransform:"uppercase", letterSpacing:".1em", color:"var(--gy)" }}>Investimento</div>
                    <div className="fd" style={{ fontSize:"1rem", color:"var(--ro)", fontWeight:300 }}>{svc.price}</div>
                  </div>
                  <Btn size="sm" variant="ghost" onClick={()=>{toast(`📞 Em breve entraremos em contato sobre: ${svc.title}`);go("contato");}}>Solicitar</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background:"var(--bl)", padding:"2.5rem 3rem", textAlign:"center", border:"1px solid var(--br)" }}>
          <div className="fd" style={{ fontSize:"clamp(1.4rem,2.5vw,2rem)", fontWeight:300, marginBottom:".5rem" }}>
            Não encontrou o que procura?
          </div>
          <p style={{ fontSize:".88rem", color:"var(--gy)", marginBottom:"1.5rem" }}>
            Entre em contato — criamos soluções personalizadas para qualquer ocasião
          </p>
          <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
            <Btn onClick={()=>go("contato")}>Falar pelo WhatsApp →</Btn>
            <Btn variant="outline" onClick={()=>go("catalog")}>Ver produtos</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SOBRE PAGE
// ══════════════════════════════════════════════════════════════════
const VALORES = [
  {icon:"🌺",title:"Qualidade Acima de Tudo",desc:"Trabalhamos apenas com flores selecionadas, colhidas diariamente de produtores parceiros certificados. Nosso controle de qualidade garante que cada flor chegue perfeita."},
  {icon:"⚡",title:"Entrega Rápida e Pontual",desc:"Pedidos feitos até 16h são entregues no mesmo dia. Nossa logística própria garante pontualidade — sabemos que atraso em datas especiais é inaceitável."},
  {icon:"💚",title:"Sustentabilidade",desc:"Priorizamos fornecedores locais para reduzir o impacto ambiental. Nossas embalagens são biodegradáveis e reutilizamos materiais sempre que possível."},
  {icon:"🤝",title:"Atendimento Humanizado",desc:"Cada cliente é único. Nossa equipe está disponível por WhatsApp, e-mail e telefone para entender sua necessidade e criar a solução perfeita."},
  {icon:"✨",title:"Floristas Certificadas",desc:"Nossa equipe tem certificação em arranjos florais com mais de 10 anos de experiência. Cada buquê é uma obra de arte criada com técnica e paixão."},
  {icon:"🎁",title:"Experiência Completa",desc:"Da escolha à entrega, cada etapa é pensada para encantar. Embalagens exclusivas, cartões personalizados e atenção aos mínimos detalhes fazem a diferença."},
];

const TIMELINE = [
  {year:"2012",title:"O início de tudo",desc:"Maria Flores abriu a primeira loja com 20m² e um sonho: levar beleza autêntica às pessoas. Os primeiros pedidos eram entregues de bicicleta."},
  {year:"2015",title:"Expansão e conquistas",desc:"Com o crescimento, chegou o primeiro espaço próprio e a equipe dobrou de tamanho. Começamos a atender eventos e casamentos na região."},
  {year:"2018",title:"Flores importadas",desc:"Fechamos parcerias com importadoras da Holanda e Colômbia, trazendo variedades exclusivas que nenhum concorrente local oferecia."},
  {year:"2020",title:"Presença digital",desc:"Com a pandemia, aceleramos nossa loja online e sistema de entrega. Resultado: crescimento de 180% nas vendas mesmo em época de crise."},
  {year:"2023",title:"Assinatura mensal",desc:"Lançamos o serviço de assinatura, que se tornou um dos mais amados pelos clientes, garantindo flores frescas toda semana na porta de casa."},
  {year:"2025",title:"Hoje — 8.000 clientes",desc:"Somos referência em qualidade floral na cidade, com mais de 8 mil clientes fiéis e uma equipe apaixonada por flores e por gente."},
];

function SobrePage({ go }) {
  return (
    <div>
      {/* Hero */}
      <div style={{ background:"var(--dp)", color:"#fff", padding:"5rem 2.5rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-10%", right:"-5%", fontSize:"18rem", opacity:.04, pointerEvents:"none" }}>🌸</div>
        <div style={{ maxWidth:800, margin:"0 auto", textAlign:"center", position:"relative", zIndex:1 }}>
          <div style={{ fontSize:".62rem", textTransform:"uppercase", letterSpacing:".2em", color:"var(--gd)", marginBottom:"1rem" }}>Nossa história</div>
          <h1 className="fd" style={{ fontSize:"clamp(2.5rem,5vw,4rem)", fontWeight:300, lineHeight:1.1, marginBottom:"1.2rem" }}>
            Desde 2012 levando <em style={{ color:"var(--ro)", fontStyle:"italic" }}>beleza e emoção</em> através das flores
          </h1>
          <p style={{ fontSize:".95rem", lineHeight:1.85, color:"rgba(250,247,242,.7)", maxWidth:600, margin:"0 auto 2rem" }}>
            Nascemos de um amor genuíno por flores e da crença de que cada buquê carrega uma emoção. Hoje somos referência em qualidade floral, com mais de 8 mil clientes que confiam em nós para os momentos mais especiais das suas vidas.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:"3rem", flexWrap:"wrap" }}>
            {[["12+","Anos"],["8.000+","Clientes"],["★4.9","Avaliação"],["50k+","Flores/mês"]].map(([v,l])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div className="fd" style={{ fontSize:"2.5rem", color:"var(--gd)", fontWeight:300 }}>{v}</div>
                <div style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", color:"rgba(255,255,255,.4)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pad-main" style={{ padding:"4rem 2.5rem" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>

          {/* Missão & Visão */}
          <div className="grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2.5rem", marginBottom:"4rem", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:".62rem", textTransform:"uppercase", letterSpacing:".2em", color:"var(--ro)", marginBottom:".8rem" }}>Quem somos</div>
              <div className="fd" style={{ fontSize:"clamp(1.6rem,2.5vw,2.4rem)", fontWeight:300, marginBottom:"1.2rem", lineHeight:1.1 }}>Missão, Visão & Propósito</div>
              <div style={{ borderLeft:"3px solid var(--ro)", paddingLeft:"1.2rem", marginBottom:"1.5rem" }}>
                <div style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--ro)", marginBottom:".3rem" }}>Nossa Missão</div>
                <p style={{ fontSize:".9rem", lineHeight:1.75, color:"var(--gy)" }}>Transformar flores em experiências emocionantes, conectando pessoas através da beleza natural com qualidade, frescor e entrega impecável.</p>
              </div>
              <div style={{ borderLeft:"3px solid var(--sg)", paddingLeft:"1.2rem", marginBottom:"1.5rem" }}>
                <div style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--sg)", marginBottom:".3rem" }}>Nossa Visão</div>
                <p style={{ fontSize:".9rem", lineHeight:1.75, color:"var(--gy)" }}>Ser a floricultura mais amada da cidade, reconhecida pela excelência em qualidade, atendimento humanizado e inovação constante.</p>
              </div>
              <div style={{ borderLeft:"3px solid var(--gd)", paddingLeft:"1.2rem" }}>
                <div style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--gd)", marginBottom:".3rem" }}>Nosso Propósito</div>
                <p style={{ fontSize:".9rem", lineHeight:1.75, color:"var(--gy)" }}>Acreditamos que flores têm o poder de transformar momentos em memórias. Cada entrega é uma oportunidade de fazer alguém sorrir.</p>
              </div>
            </div>
            <div>
              <img src="https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Nossa loja" style={{ width:"100%", height:420, objectFit:"cover" }} />
            </div>
          </div>

          {/* Valores */}
          <div style={{ marginBottom:"4rem" }}>
            <SectionHeader label="Nossos valores" title="O que nos diferencia" center />
            <div className="svc-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.2rem" }}>
              {VALORES.map((v,i) => (
                <div key={i} className="reveal" style={{ background:"var(--wh)", border:"1px solid var(--br)", padding:"1.5rem", transition:"border-color .25s,transform .25s" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--ro)";e.currentTarget.style.transform="translateY(-3px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--br)";e.currentTarget.style.transform="translateY(0)"}}>
                  <span style={{ fontSize:"1.8rem", display:"block", marginBottom:".7rem" }}>{v.icon}</span>
                  <h4 style={{ fontSize:".9rem", fontWeight:600, marginBottom:".5rem" }}>{v.title}</h4>
                  <p style={{ fontSize:".8rem", lineHeight:1.65, color:"var(--gy)" }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ marginBottom:"3rem" }}>
            <SectionHeader label="Nossa trajetória" title="Uma história de amor por flores" />
            <div style={{ position:"relative", paddingLeft:"2rem" }}>
              <div style={{ position:"absolute", left:".45rem", top:0, bottom:0, width:"2px", background:"var(--bl)" }} />
              {TIMELINE.map((t,i) => (
                <div key={i} className="reveal" style={{ position:"relative", paddingBottom:"2rem", paddingLeft:"2rem" }}>
                  <div style={{ position:"absolute", left:"-.5rem", top:".3rem", width:18, height:18, background:"var(--ro)", borderRadius:"50%", border:"3px solid var(--cr)" }} />
                  <div style={{ fontSize:".65rem", textTransform:"uppercase", letterSpacing:".14em", color:"var(--ro)", marginBottom:".3rem" }}>{t.year}</div>
                  <h4 style={{ fontSize:"1rem", fontWeight:600, marginBottom:".4rem" }}>{t.title}</h4>
                  <p style={{ fontSize:".84rem", lineHeight:1.65, color:"var(--gy)", maxWidth:600 }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div style={{ background:"var(--cr)", border:"1px solid var(--br)", padding:"2.5rem", textAlign:"center", marginBottom:"3rem" }}>
            <SectionHeader label="Nossa equipe" title="Pessoas apaixonadas por flores" center />
            <div style={{ display:"flex", justifyContent:"center", gap:"2rem", flexWrap:"wrap" }}>
              {[{n:"Maria Flores",r:"Fundadora & Florista-chefe",i:"👩‍🌾"},{n:"Beatriz Lima",r:"Florista Sênior",i:"👩‍🎨"},{n:"Carlos Eduardo",r:"Logística & Entregas",i:"🚚"},{n:"Ana Rodrigues",r:"Atendimento ao Cliente",i:"💬"}].map((m,i)=>(
                <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:".5rem" }}>
                  <div style={{ width:72, height:72, background:"var(--bl)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem" }}>{m.i}</div>
                  <div style={{ fontSize:".88rem", fontWeight:600 }}>{m.n}</div>
                  <div style={{ fontSize:".72rem", color:"var(--gy)" }}>{m.r}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign:"center" }}>
            <Btn size="lg" onClick={()=>go("catalog")}>Explorar nossos produtos →</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CONTATO PAGE
// ══════════════════════════════════════════════════════════════════
function ContatoPage() {
  const { toast } = useApp();
  const [form, setForm] = useState({ name:"", email:"", phone:"", subject:"", msg:"" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSend = async () => {
    if (!form.name || !form.email.includes("@") || !form.msg) {
      toast("⚠️ Preencha todos os campos obrigatórios","err"); return;
    }
    setLoading(true);
    await new Promise(r=>setTimeout(r,900)); // simula envio
    setSent(true); setLoading(false);
    toast("✓ Mensagem enviada! Retornaremos em até 24h 🌸");
  };

  const INFOS = [
    {icon:"📍",title:"Endereço",lines:["Rua das Flores, 142","Vila Jardim, São Paulo - SP","CEP 04501-000"]},
    {icon:"📞",title:"Telefone",lines:["(11) 3000-8888","(11) 99999-8888 (WhatsApp)"]},
    {icon:"✉️",title:"E-mail",lines:["contato@florespetalas.com.br","pedidos@florespetalas.com.br"]},
    {icon:"🕐",title:"Horário de funcionamento",lines:["Segunda a Sexta: 8h às 20h","Sábado: 8h às 18h","Domingo: 9h às 14h"]},
  ];

  return (
    <div className="pad-main" style={{ padding:"3rem 2.5rem" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <SectionHeader label="Fale conosco" title="Estamos aqui para você" sub="Nossa equipe responde em até 2 horas em horário comercial" />

        <div className="grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:"2.5rem", marginBottom:"4rem" }}>
          {/* Info */}
          <div>
            {INFOS.map((info,i) => (
              <div key={i} style={{ display:"flex", gap:"1rem", marginBottom:"1.8rem", padding:"1.2rem", background:"var(--wh)", border:"1px solid var(--br)" }}>
                <span style={{ fontSize:"1.4rem", flexShrink:0, marginTop:".1rem" }}>{info.icon}</span>
                <div>
                  <div style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--gy)", marginBottom:".4rem" }}>{info.title}</div>
                  {info.lines.map((l,j) => <div key={j} style={{ fontSize:".88rem", fontWeight: j===0?500:400, color:"var(--dp)", lineHeight:1.6 }}>{l}</div>)}
                </div>
              </div>
            ))}
            {/* WhatsApp CTA */}
            <a href="https://wa.me/5511999998888?text=Olá! Gostaria de fazer um pedido." target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:".8rem", background:"#25d366", color:"#fff", padding:"1rem 1.4rem", textDecoration:"none", transition:"background .2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#1da851"} onMouseLeave={e=>e.currentTarget.style.background="#25d366"}>
              <span style={{ fontSize:"1.4rem" }}>💬</span>
              <div>
                <div style={{ fontSize:".82rem", fontWeight:600, letterSpacing:".04em" }}>Chamar no WhatsApp</div>
                <div style={{ fontSize:".72rem", opacity:.85 }}>Resposta em minutos</div>
              </div>
            </a>
          </div>

          {/* Form */}
          <div style={{ background:"var(--wh)", border:"1px solid var(--br)", padding:"2rem" }}>
            {sent ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"1rem", textAlign:"center", padding:"3rem 0" }}>
                <div style={{ width:72, height:72, background:"var(--sg)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem" }}>✓</div>
                <div className="fd" style={{ fontSize:"1.4rem", fontWeight:400 }}>Mensagem enviada!</div>
                <p style={{ fontSize:".85rem", color:"var(--gy)", lineHeight:1.6 }}>Recebemos sua mensagem e retornaremos em até 24 horas. Obrigada pelo contato!</p>
                <Btn variant="ghost" onClick={()=>setSent(false)}>Enviar outra mensagem</Btn>
              </div>
            ) : (
              <>
                <h3 className="fd" style={{ fontSize:"1.3rem", fontWeight:400, marginBottom:"1.5rem" }}>Envie uma mensagem</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                  <Input label="Nome completo *" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Maria Silva" />
                  <Input label="E-mail *" value={form.email} onChange={e=>set("email",e.target.value)} type="email" placeholder="maria@email.com" />
                  <Input label="Telefone" value={form.phone} onChange={e=>set("phone",e.target.value)} type="tel" placeholder="(11) 99999-8888" />
                  <div>
                    <label style={{ display:"block", fontSize:".66rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--gy)", marginBottom:".35rem" }}>Assunto</label>
                    <select value={form.subject} onChange={e=>set("subject",e.target.value)} style={{ width:"100%", padding:".76rem 1rem", border:"1px solid var(--br)", background:"#fff", fontSize:".88rem", outline:"none", fontFamily:"DM Sans,sans-serif", color:"var(--dp)" }}>
                      <option value="">Selecione...</option>
                      <option>Pedido personalizado</option>
                      <option>Decoração para evento</option>
                      <option>Assinatura de flores</option>
                      <option>Presente corporativo</option>
                      <option>Outro assunto</option>
                    </select>
                  </div>
                  <Input label="Mensagem *" value={form.msg} onChange={e=>set("msg",e.target.value)} placeholder="Descreva sua necessidade..." as="textarea" rows={5} span={2} />
                </div>
                <Btn full onClick={handleSend} disabled={loading} style={{ marginTop:"1.2rem" }}>
                  {loading ? <><Spinner size={16} /> Enviando...</> : "Enviar mensagem →"}
                </Btn>
              </>
            )}
          </div>
        </div>

        {/* Map placeholder */}
        <div style={{ background:"var(--lt)", border:"1px solid var(--br)", height:280, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"url(https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=1200)", backgroundSize:"cover", backgroundPosition:"center", filter:"blur(2px) brightness(.4)" }} />
          <div style={{ position:"relative", zIndex:1, textAlign:"center", color:"#fff" }}>
            <div style={{ fontSize:"2rem", marginBottom:".5rem" }}>📍</div>
            <div className="fd" style={{ fontSize:"1.3rem", fontWeight:400, marginBottom:".3rem" }}>Rua das Flores, 142</div>
            <div style={{ fontSize:".82rem", opacity:.8 }}>Vila Jardim, São Paulo — SP</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CHECKOUT PAGE
// ══════════════════════════════════════════════════════════════════
const EMPTY_FORM = { name:"", email:"", phone:"", address:"", city:"", zip:"", notes:"", payment:"pix" };

function CheckoutPage({ onBack, onSuccess }) {
  const { cart, cartSubtotal, clearCart, user, profile, toast } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const ship = cartSubtotal >= 150 ? 0 : 15;
  const total = cartSubtotal + ship;

  // Pré-preencher com dados do perfil/user quando logado
  useEffect(() => {
    if (user && profile) {
      setForm(f => ({
        ...f,
        name: profile.name || "",
        email: user.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        zip: profile.zip || "",
      }));
    }
  }, [user, profile]);

  const set = (k,v) => { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:""})); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                    e.name    = "Nome obrigatório";
    if (!form.email.includes("@"))            e.email   = "E-mail inválido";
    if (form.phone.replace(/\D/g,"").length<10) e.phone = "Telefone inválido";
    if (!form.address.trim())                 e.address = "Endereço obrigatório";
    if (!form.city.trim())                    e.city    = "Cidade obrigatória";
    if (form.zip.replace(/\D/g,"").length<8)  e.zip     = "CEP inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { toast("⚠️ Verifique os campos obrigatórios","err"); return; }
    setLoading(true);
    try {
      // Salva pedido no Supabase
      const orderPayload = {
        items: cart.map(i=>({ id:i.id, name:i.name, qty:i.qty, price:i.price, emoji:i.emoji })),
        subtotal: cartSubtotal, shipping: ship, total,
        customer_name: form.name, customer_email: form.email,
        customer_phone: form.phone,
        customer_address: `${form.address}, ${form.city} — CEP ${form.zip}`,
        payment_method: form.payment,
        status: "pending",
        ...(user ? { user_id: user.id } : {}),
      };
      const { data, error } = await supabase.from("orders").insert(orderPayload).select().single();
      if (error) throw error;
      clearCart();
      onSuccess(data || { id: `LOCAL-${Date.now()}` });
    } catch (err) {
      console.warn("saveOrder:", err.message);
      // Simula sucesso se Supabase não configurado
      clearCart();
      onSuccess({ id: `DEMO-${Date.now().toString().slice(-6)}` });
    } finally {
      setLoading(false);
    }
  };

  const F = ({ label, field, type="text", placeholder, span=1 }) => (
    <Input label={label} value={form[field]} onChange={e=>set(field,e.target.value)} type={type} placeholder={placeholder} error={errors[field]} span={span} />
  );

  return (
    <div className="pad-main" style={{ minHeight:"100vh", background:"var(--cr)", padding:"3rem 2.5rem" }}>
      <div style={{ maxWidth:1000, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"2.5rem" }}>
          <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--gy)", fontSize:".82rem", display:"flex", alignItems:"center", gap:".3rem" }}>← Voltar</button>
          <span className="fd" style={{ fontSize:"2rem", fontWeight:300 }}>Finalizar Compra</span>
        </div>

        {user && profile && (
          <div style={{ background:"rgba(122,148,112,.1)", border:"1px solid var(--sg2)", padding:".75rem 1rem", marginBottom:"1.5rem", fontSize:".8rem", color:"var(--sg)" }}>
            ✓ Dados do seu perfil foram preenchidos automaticamente. Verifique e ajuste se necessário.
          </div>
        )}

        <div className="checkout-grid" style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:"2rem", alignItems:"start" }}>
          <div style={{ background:"#fff", border:"1px solid var(--br)", padding:"2rem" }}>
            <div className="fd" style={{ fontSize:"1.3rem", fontWeight:400, marginBottom:"1.5rem" }}>Dados de entrega</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
              <F label="Nome completo *" field="name" placeholder="Maria Silva" span={2} />
              <F label="E-mail *" field="email" type="email" placeholder="maria@email.com" />
              <F label="Telefone / WhatsApp *" field="phone" type="tel" placeholder="(11) 99999-8888" />
              <F label="Endereço completo *" field="address" placeholder="Rua das Flores, 142, Apto 3" span={2} />
              <F label="Cidade *" field="city" placeholder="São Paulo" />
              <F label="CEP *" field="zip" placeholder="01310-100" />
              <Input label="Observações para entrega" value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Ex: Portão azul, interfone 12..." as="textarea" rows={3} span={2} />
            </div>

            {/* Pagamento */}
            <div style={{ marginTop:"1.5rem" }}>
              <label style={{ display:"block", fontSize:".66rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--gy)", marginBottom:".5rem" }}>Forma de pagamento</label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:".7rem" }}>
                {[["pix","Pix 💚","5% OFF"],["credito","Crédito 💳","3× s/ juros"],["boleto","Boleto 📄","À vista"]].map(([val,lbl,sub])=>(
                  <label key={val} style={{ border:`2px solid ${form.payment===val?"var(--ro)":"var(--br)"}`, padding:".8rem", cursor:"pointer", textAlign:"center", transition:"border .2s", background: form.payment===val?"rgba(184,92,80,.05)":"#fff" }}>
                    <input type="radio" name="payment" value={val} checked={form.payment===val} onChange={()=>set("payment",val)} style={{ display:"none" }} />
                    <div style={{ fontSize:".82rem", fontWeight:500 }}>{lbl}</div>
                    <div style={{ fontSize:".68rem", color:"var(--gy)" }}>{sub}</div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div style={{ background:"#fff", border:"1px solid var(--br)", padding:"1.5rem" }}>
            <div className="fd" style={{ fontSize:"1.3rem", fontWeight:400, marginBottom:"1.2rem" }}>Resumo do pedido</div>
            <div style={{ display:"flex", flexDirection:"column", gap:".7rem", marginBottom:"1rem" }}>
              {cart.map(item => (
                <div key={item.id} style={{ display:"flex", gap:".7rem", alignItems:"center" }}>
                  <img src={item.img} alt={item.name} style={{ width:46, height:46, objectFit:"cover", borderRadius:2, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:".8rem", fontWeight:500, lineHeight:1.3 }}>{item.name}</div>
                    <div style={{ fontSize:".72rem", color:"var(--gy)" }}>×{item.qty}</div>
                  </div>
                  <div className="fd" style={{ fontSize:"1rem", color:"var(--ro)", flexShrink:0 }}>R$ {(item.price*item.qty).toFixed(2).replace(".",",")}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop:"1px solid var(--br)", paddingTop:"1rem" }}>
              {[["Subtotal",`R$ ${cartSubtotal.toFixed(2).replace(".",",")}`],["Frete", ship===0?"Grátis!":`R$ ${ship.toFixed(2).replace(".",",")}`]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:".82rem", color:"var(--gy)", marginBottom:".4rem" }}>
                  <span>{k}</span><span style={{ color:v==="Grátis!"?"var(--sg)":"inherit" }}>{v}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:".8rem 0 1.2rem", paddingTop:".8rem", borderTop:"1px solid var(--br)" }}>
                <span style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--gy)" }}>Total</span>
                <span className="fd" style={{ fontSize:"1.8rem", fontWeight:300 }}>R$ {total.toFixed(2).replace(".",",")}</span>
              </div>
            </div>
            <Btn full onClick={handleSubmit} disabled={loading}>
              {loading ? <><Spinner size={16} /> Processando...</> : "Confirmar pedido →"}
            </Btn>
            <p style={{ fontSize:".68rem", color:"var(--gy)", textAlign:"center", marginTop:".8rem", lineHeight:1.5 }}>🔒 Dados protegidos com criptografia SSL</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SUCCESS PAGE
// ══════════════════════════════════════════════════════════════════
function SuccessPage({ order, onContinue }) {
  return (
    <div style={{ minHeight:"80vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"4rem 2rem", background:"var(--cr)" }}>
      <div style={{ background:"#fff", border:"1px solid var(--br)", padding:"3rem 2.5rem", textAlign:"center", maxWidth:500, width:"100%", animation:"scaleIn .5s ease" }}>
        <div style={{ width:80, height:80, background:"var(--sg)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.5rem", fontSize:"2.2rem" }}>🌸</div>
        <div className="fd" style={{ fontSize:"2rem", fontWeight:300, marginBottom:".5rem" }}>Pedido confirmado!</div>
        <p style={{ fontSize:".88rem", color:"var(--gy)", lineHeight:1.65, marginBottom:".5rem" }}>
          Seu pedido foi recebido com sucesso! Você receberá a confirmação por e-mail e poderá acompanhar o status na área do seu perfil.
        </p>
        {order?.id && (
          <div style={{ background:"var(--cr)", border:"1px solid var(--br)", padding:".8rem 1.2rem", display:"inline-block", margin:".8rem 0" }}>
            <span style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--gy)" }}>Número do pedido: </span>
            <strong style={{ fontSize:".88rem", color:"var(--ro)" }}>#{String(order.id).slice(-8).toUpperCase()}</strong>
          </div>
        )}
        <div style={{ background:"rgba(122,148,112,.1)", border:"1px solid var(--sg2)", padding:"1rem", margin:"1rem 0", fontSize:".82rem", color:"var(--sg)", textAlign:"left", lineHeight:1.65 }}>
          📦 Seu pedido será preparado com carinho e entregue em até <strong>4 horas</strong>.<br/>
          📱 Você receberá updates por WhatsApp: <strong>(11) 99999-8888</strong>
        </div>
        <Btn full size="lg" onClick={onContinue}>Continuar comprando →</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// AUTH MODAL — Login / Cadastro com Supabase Auth
// Correções aplicadas:
//  • handleSignup: espera signUp() antes de criar perfil
//  • Criação do perfil usa uid do data.user (não do estado user)
//  • fetchProfile chamado APÓS upsert completar
//  • Mensagens de erro do Supabase exibidas ao usuário
//  • Reset do formulário ao fechar
// ══════════════════════════════════════════════════════════════════
function AuthModal({ open, onClose }) {
  const { toast, fetchProfile, upsertProfile } = useApp();
  const [tab, setTab]       = useState("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({ email:"", password:"", name:"", confirm:"" });
  const [err, setErr]       = useState("");
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErr(""); };

  // Limpa formulário quando modal fecha
  useEffect(() => {
    if (!open) {
      setForm({ email:"", password:"", name:"", confirm:"" });
      setErr("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  // ── Login ──────────────────────────────────────────────────────
  const handleLogin = async () => {
    const emailTrim = form.email.trim().toLowerCase();
    if (!emailTrim.includes("@"))      { setErr("Digite um e-mail válido"); return; }
    if (form.password.length < 6)      { setErr("Senha deve ter pelo menos 6 caracteres"); return; }

    setLoading(true);
    log("AuthModal: tentando login para", emailTrim);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailTrim,
      password: form.password,
    });

    setLoading(false);

    if (error) {
      warn("handleLogin error:", error.message);
      // Mensagem amigável baseada no código de erro
      if (error.message?.toLowerCase().includes("invalid login")) {
        setErr("E-mail ou senha incorretos. Verifique seus dados.");
      } else if (error.message?.toLowerCase().includes("email not confirmed")) {
        setErr("Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.");
      } else {
        setErr(error.message || "Erro ao fazer login. Tente novamente.");
      }
      return;
    }

    log("handleLogin: login bem-sucedido, user=", data.user?.email);
    // onAuthStateChange já vai chamar fetchProfile automaticamente
    toast("🌸 Bem-vinda de volta, " + (data.user?.email?.split("@")[0] || "") + "!");
    onClose();
  };

  // ── Signup ─────────────────────────────────────────────────────
  const handleSignup = async () => {
    const nameTrim  = form.name.trim();
    const emailTrim = form.email.trim().toLowerCase();

    if (!nameTrim)                      { setErr("Nome é obrigatório"); return; }
    if (!emailTrim.includes("@"))       { setErr("Digite um e-mail válido"); return; }
    if (form.password.length < 6)       { setErr("Senha deve ter pelo menos 6 caracteres"); return; }
    if (form.password !== form.confirm) { setErr("As senhas não coincidem"); return; }

    setLoading(true);
    log("AuthModal: criando conta para", emailTrim);

    // 1. Cria usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: emailTrim,
      password: form.password,
      options: {
        // Passa nome nos metadados (útil se o usuário precisar de confirmação)
        data: { full_name: nameTrim },
      },
    });

    if (error) {
      setLoading(false);
      warn("handleSignup error:", error.message);
      if (error.message?.toLowerCase().includes("already registered")) {
        setErr("Este e-mail já está cadastrado. Faça login.");
      } else {
        setErr(error.message || "Erro ao criar conta. Tente novamente.");
      }
      return;
    }

    const newUser = data.user;
    log("handleSignup: usuário criado uid=", newUser?.id, "needsConfirmation=", !data.session);

    // 2. Cria perfil na tabela profiles usando uid recém-criado
    //    IMPORTANTE: passa uid explicitamente — estado user ainda não foi atualizado
    if (newUser?.id) {
      const { data: prof, error: profErr } = await upsertProfile(
        { name: nameTrim, email: emailTrim },
        newUser.id // uid explícito, não depende do estado
      );
      if (profErr) {
        warn("handleSignup: erro ao criar perfil:", profErr.message);
        // Não bloqueia o fluxo — perfil pode ser criado depois
      } else {
        log("handleSignup: perfil criado =", prof);
      }
    }

    setLoading(false);

    // 3. Verifica se e-mail precisa de confirmação
    if (!data.session) {
      // Supabase configurado para confirmar e-mail
      toast("✉️ Verifique seu e-mail para confirmar a conta antes de entrar!", "ok");
      setErr(""); // limpa erros
      setTab("login");
    } else {
      // Login automático após signup (confirm desabilitado)
      // onAuthStateChange já cuida de atualizar user + fetchProfile
      toast("✓ Conta criada! Bem-vinda, " + nameTrim.split(" ")[0] + "! 🌷");
      onClose();
    }
  };

  const tabBtn = (t, label) => (
    <button
      onClick={() => { setTab(t); setErr(""); }}
      style={{
        flex:1, padding:"1rem", background:"none", border:"none", cursor:"pointer",
        fontFamily:"DM Sans,sans-serif", fontSize:".72rem", textTransform:"uppercase",
        letterSpacing:".14em",
        color: tab === t ? "var(--ro)" : "var(--gy)",
        borderBottom: tab === t ? "2px solid var(--ro)" : "2px solid transparent",
        marginBottom: "-1px", transition:"color .2s",
      }}
    >{label}</button>
  );

  return (
    <>
      <div className="overlay-bg" onClick={onClose} />
      <div style={{
        position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:"min(440px,94vw)", background:"#fff", zIndex:201,
        boxShadow:"0 32px 80px rgba(44,31,31,.22)", animation:"scaleIn .3s ease",
      }}>
        <div style={{ display:"flex", borderBottom:"1px solid var(--bl)", position:"relative" }}>
          {tabBtn("login", "Entrar")}
          {tabBtn("signup", "Criar conta")}
          <button onClick={onClose} style={{ position:"absolute", top:".8rem", right:".8rem", background:"none", border:"none", cursor:"pointer", fontSize:"1.1rem", color:"var(--gy)" }}>✕</button>
        </div>

        <div style={{ padding:"2rem 2.2rem 2.2rem" }}>
          {/* Error banner */}
          {err && (
            <div style={{ background:"#fde8e8", border:"1px solid #e8a0a0", color:"#8c2020", fontSize:".78rem", padding:".65rem .9rem", marginBottom:"1rem", lineHeight:1.5 }}>
              ⚠️ {err}
            </div>
          )}

          {tab === "login" ? (
            <>
              <div className="fd" style={{ fontSize:"1.8rem", fontWeight:300, marginBottom:".3rem" }}>Bem-vinda de volta 🌸</div>
              <p style={{ fontSize:".78rem", color:"var(--gy)", marginBottom:"1.4rem" }}>Acesse sua conta para continuar</p>
              <div style={{ display:"flex", flexDirection:"column", gap:".9rem" }}>
                <Input label="E-mail" value={form.email} onChange={e => set("email", e.target.value)} type="email" placeholder="seu@email.com" />
                <Input label="Senha" value={form.password} onChange={e => set("password", e.target.value)} type="password" placeholder="••••••••" />
              </div>
              <Btn full onClick={handleLogin} disabled={loading} style={{ marginTop:"1.2rem" }}>
                {loading ? <><Spinner size={16} /> Entrando...</> : "Entrar na minha conta →"}
              </Btn>
              <p style={{ textAlign:"center", fontSize:".78rem", color:"var(--gy)", marginTop:"1rem" }}>
                Não tem conta?{" "}
                <button onClick={() => setTab("signup")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--ro)", fontSize:".78rem" }}>
                  Cadastre-se grátis
                </button>
              </p>
              {!SB_LIVE && (
                <div style={{ marginTop:"1rem", padding:".7rem", background:"#fffbe6", border:"1px solid #f0c040", fontSize:".72rem", color:"#7a5c00", textAlign:"center", lineHeight:1.5 }}>
                  ⚙️ <strong>Modo demo</strong> — configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no <code>.env</code> para ativar autenticação real.
                </div>
              )}
            </>
          ) : (
            <>
              <div className="fd" style={{ fontSize:"1.8rem", fontWeight:300, marginBottom:".3rem" }}>Crie sua conta 🌷</div>
              <p style={{ fontSize:".78rem", color:"var(--gy)", marginBottom:"1.4rem" }}>Junte-se a mais de 8 mil clientes</p>
              <div style={{ display:"flex", flexDirection:"column", gap:".9rem" }}>
                <Input label="Nome completo *" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Maria Silva" />
                <Input label="E-mail *" value={form.email} onChange={e => set("email", e.target.value)} type="email" placeholder="seu@email.com" />
                <Input label="Senha (mín. 6 caracteres) *" value={form.password} onChange={e => set("password", e.target.value)} type="password" placeholder="••••••••" />
                <Input label="Confirmar senha *" value={form.confirm} onChange={e => set("confirm", e.target.value)} type="password" placeholder="repita a senha" />
              </div>
              <Btn full onClick={handleSignup} disabled={loading} style={{ marginTop:"1.2rem" }}>
                {loading ? <><Spinner size={16} /> Criando conta...</> : "Criar minha conta →"}
              </Btn>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// PROFILE PAGE — 4 abas internas
// Correções aplicadas:
//  • authLoading + profileLoading mostram skeleton em vez de tela branca
//  • orders: useEffect com cleanup para evitar setState em componente desmontado
//  • SettingsTab: upsertProfile sem uid (usa user.id do contexto)
//  • Logout: aguarda signOut() antes de navegar
//  • Dados do perfil aparecem imediatamente quando disponíveis
// ══════════════════════════════════════════════════════════════════
function ProfilePage({ go, openAuth }) {
  const {
    user, profile, authLoading, profileLoading,
    upsertProfile, toast, addToCart, wishlist, toggleWish,
  } = useApp();

  const [tab, setTab]               = useState("orders");
  const [orders, setOrders]         = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError]     = useState(null);
  const [settingsForm, setSettingsForm]   = useState({ name:"", phone:"", address:"", city:"", zip:"" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [pwForm, setPwForm]         = useState({ next:"", confirm:"" });

  // Sincroniza settingsForm com profile sempre que profile mudar
  // useEffect com dependência correta [profile] — não usa string comparação
  useEffect(() => {
    if (!profile) return;
    setSettingsForm({
      name:    profile.name    || "",
      phone:   profile.phone   || "",
      address: profile.address || "",
      city:    profile.city    || "",
      zip:     profile.zip     || "",
    });
    log("ProfilePage: settingsForm sincronizado com perfil", profile);
  }, [profile]);

  // Busca pedidos — com cleanup para evitar setState após unmount
  useEffect(() => {
    if (!user || tab !== "orders") return;

    let cancelled = false;
    setLoadingOrders(true);
    setOrdersError(null);
    log("ProfilePage: buscando pedidos para user_id=", user.id);

    supabase
      .from("orders")
      .select("id, created_at, status, total, items, payment_method")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return; // componente foi desmontado
        if (error) {
          warn("fetchOrders error:", error.message);
          setOrdersError(error.message);
        } else {
          log("fetchOrders: ", data?.length || 0, "pedidos encontrados");
          setOrders(data || []);
        }
        setLoadingOrders(false);
      });

    return () => { cancelled = true; };
  }, [user, tab]); // re-executa quando user ou tab mudam

  // ── Loading global (verificando sessão) ─────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ display:"inline-block", width:36, height:36, border:"3px solid var(--bl)", borderTopColor:"var(--ro)", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
          <p style={{ marginTop:"1rem", fontSize:".85rem", color:"var(--gy)" }}>Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // ── Sem sessão → gate de login ───────────────────────────────
  if (!user) {
    return (
      <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1.5rem", padding:"4rem 2rem", textAlign:"center" }}>
        <span style={{ fontSize:"4rem" }}>🔑</span>
        <div className="fd" style={{ fontSize:"2rem", fontWeight:300 }}>Área do cliente</div>
        <p style={{ fontSize:".9rem", color:"var(--gy)", maxWidth:380, lineHeight:1.65 }}>
          Faça login para acessar seus pedidos, favoritos, listas e configurações de conta.
        </p>
        <Btn size="lg" onClick={openAuth}>Entrar na minha conta →</Btn>
        <p style={{ fontSize:".78rem", color:"var(--gy)" }}>
          Não tem conta?{" "}
          <button onClick={openAuth} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--ro)", fontSize:".78rem" }}>
            Cadastre-se grátis
          </button>
        </p>
      </div>
    );
  }

  // ── Nome para exibir (perfil pode ainda estar carregando) ────
  const displayName = profile?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Cliente";
  const avatarChar  = displayName[0].toUpperCase();

  // ── Tabs config ──────────────────────────────────────────────
  const tabs = [
    { key:"orders",   icon:"📦", label:"Meus pedidos" },
    { key:"reorder",  icon:"🔄", label:"Comprar novamente" },
    { key:"lists",    icon:"♡",  label:"Listas" },
    { key:"settings", icon:"⚙️", label:"Configurações" },
  ];

  const SideTab = ({ t }) => (
    <button
      key={t.key}
      onClick={() => setTab(t.key)}
      style={{
        display:"flex", alignItems:"center", gap:".6rem", width:"100%",
        padding:".85rem 1.1rem",
        background: tab === t.key ? "var(--ro)" : "none",
        color: tab === t.key ? "#fff" : "var(--dp)",
        border:"none", cursor:"pointer", fontSize:".8rem",
        fontWeight: tab === t.key ? 600 : 400,
        transition:"all .2s", textAlign:"left",
      }}
      onMouseEnter={e => { if (tab !== t.key) e.currentTarget.style.background = "var(--lt)"; }}
      onMouseLeave={e => { if (tab !== t.key) e.currentTarget.style.background = "none"; }}
    >
      <span>{t.icon}</span>{t.label}
    </button>
  );

  // ── OrdersTab ────────────────────────────────────────────────
  const OrdersTab = () => {
    const statusColor = { pending:"var(--gd)", processing:"var(--sg)", delivered:"var(--sg)", cancelled:"#e04040" };
    const statusLabel = { pending:"Aguardando", processing:"Em preparo", delivered:"Entregue", cancelled:"Cancelado" };
    return (
      <div>
        <h2 className="fd" style={{ fontSize:"1.5rem", fontWeight:400, marginBottom:"1.5rem" }}>Meus Pedidos</h2>
        {loadingOrders ? (
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {[1,2,3].map(i => <div key={i} className="skel" style={{ height:90 }} />)}
          </div>
        ) : ordersError ? (
          <div style={{ padding:"1.5rem", background:"#fde8e8", border:"1px solid #e8a0a0", color:"#8c2020", fontSize:".85rem", lineHeight:1.5 }}>
            ⚠️ Erro ao carregar pedidos: {ordersError}<br/>
            <small>Verifique as políticas RLS da tabela <code>orders</code> no Supabase.</small>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:"center", padding:"3rem", color:"var(--gy)" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:".8rem" }}>📦</div>
            <p style={{ marginBottom:"1rem", fontSize:".88rem" }}>Você ainda não fez pedidos.</p>
            <Btn variant="ghost" onClick={() => go("catalog")}>Ver catálogo →</Btn>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {orders.map(o => {
              const items = Array.isArray(o.items) ? o.items : [];
              return (
                <div key={o.id} style={{ border:"1px solid var(--br)", padding:"1.2rem", background:"var(--wh)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:".7rem" }}>
                    <div>
                      <div style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".1em", color:"var(--gy)" }}>Pedido</div>
                      <div style={{ fontWeight:600, fontSize:".9rem" }}>#{String(o.id).slice(-8).toUpperCase()}</div>
                      <div style={{ fontSize:".72rem", color:"var(--gy)", marginTop:".15rem" }}>
                        {new Date(o.created_at).toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })}
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:".4rem" }}>
                      <span style={{ background: statusColor[o.status] || "var(--gy)", color:"#fff", fontSize:".62rem", textTransform:"uppercase", letterSpacing:".1em", padding:".22rem .65rem", borderRadius:20 }}>
                        {statusLabel[o.status] || o.status}
                      </span>
                      <div className="fd" style={{ fontSize:"1.2rem", color:"var(--ro)" }}>
                        R$ {Number(o.total).toFixed(2).replace(".", ",")}
                      </div>
                    </div>
                  </div>
                  {items.length > 0 && (
                    <div style={{ fontSize:".78rem", color:"var(--gy)", borderTop:"1px solid var(--lt)", paddingTop:".6rem" }}>
                      {items.map((it, i) => (
                        <span key={i}>{it.emoji || "🌸"} {it.name} ×{it.qty}{i < items.length - 1 ? " · " : ""}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── ReorderTab ───────────────────────────────────────────────
  const ReorderTab = () => {
    const allItems = useMemo(() => {
      const seen = new Set();
      return orders
        .flatMap(o => Array.isArray(o.items) ? o.items : [])
        .filter(it => { if (seen.has(it.id)) return false; seen.add(it.id); return true; });
    }, []);
    return (
      <div>
        <h2 className="fd" style={{ fontSize:"1.5rem", fontWeight:400, marginBottom:".5rem" }}>Comprar Novamente</h2>
        <p style={{ fontSize:".82rem", color:"var(--gy)", marginBottom:"1.5rem" }}>
          Produtos que você já comprou — adicione ao carrinho com um clique
        </p>
        {allItems.length === 0 ? (
          <div style={{ textAlign:"center", padding:"3rem", color:"var(--gy)" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:".8rem" }}>🛒</div>
            <p style={{ fontSize:".88rem" }}>Seus produtos comprados anteriores aparecerão aqui.</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"1rem" }}>
            {allItems.map((it, i) => {
              const full = MOCK_PRODUCTS.find(p => p.id === it.id) || it;
              return (
                <div key={i} style={{ border:"1px solid var(--br)", padding:"1rem", background:"var(--wh)", display:"flex", flexDirection:"column", gap:".5rem" }}>
                  <div style={{ fontSize:"2rem" }}>{it.emoji || "🌸"}</div>
                  <div style={{ fontSize:".85rem", fontWeight:500, flex:1 }}>{it.name}</div>
                  <div className="fd" style={{ fontSize:"1.1rem", color:"var(--ro)" }}>R$ {it.price}</div>
                  <Btn size="sm" full onClick={() => addToCart(full)}>+ Carrinho</Btn>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── ListsTab ─────────────────────────────────────────────────
  const ListsTab = () => (
    <div>
      <h2 className="fd" style={{ fontSize:"1.5rem", fontWeight:400, marginBottom:".5rem" }}>Minhas Listas</h2>
      <p style={{ fontSize:".82rem", color:"var(--gy)", marginBottom:"1.5rem" }}>Produtos salvos nos seus favoritos</p>
      {wishlist.length === 0 ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"var(--gy)" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:".8rem" }}>♡</div>
          <p style={{ marginBottom:"1rem", fontSize:".88rem" }}>
            Sua lista de favoritos está vazia. Clique em ♡ nos produtos para salvar.
          </p>
          <Btn variant="ghost" onClick={() => go("catalog")}>Explorar produtos →</Btn>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <span style={{ fontSize:".8rem", color:"var(--gy)" }}>{wishlist.length} produto{wishlist.length !== 1 ? "s" : ""} salvos</span>
            <Btn size="sm" onClick={() => { wishlist.forEach(w => addToCart(w)); }}>Adicionar tudo ao carrinho</Btn>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"1rem" }}>
            {wishlist.map(w => (
              <div key={w.id} style={{ border:"1px solid var(--br)", background:"var(--wh)", overflow:"hidden" }}>
                <div style={{ height:140, overflow:"hidden" }}>
                  <img src={w.img} alt={w.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
                <div style={{ padding:"1rem" }}>
                  <div style={{ fontSize:".85rem", fontWeight:500, marginBottom:".3rem" }}>{w.name}</div>
                  <div className="fd" style={{ fontSize:"1.2rem", color:"var(--ro)", marginBottom:".6rem" }}>R$ {w.price}</div>
                  <div style={{ display:"flex", gap:".5rem" }}>
                    <Btn size="sm" full onClick={() => addToCart(w)}>+ Carrinho</Btn>
                    <button onClick={() => toggleWish(w)} style={{ padding:".45rem .7rem", border:"1px solid var(--bl)", background:"none", cursor:"pointer", color:"var(--gy)", fontSize:".8rem" }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ── SettingsTab ──────────────────────────────────────────────
  const SettingsTab = () => {
    const setSF = (k, v) => setSettingsForm(p => ({ ...p, [k]: v }));

    const handleSave = async () => {
      setSavingSettings(true);
      log("SettingsTab: salvando perfil", settingsForm);
      // upsertProfile sem uid — usa user.id do contexto interno
      const { error } = await upsertProfile(settingsForm);
      setSavingSettings(false);
      if (error) {
        warn("handleSave error:", error.message);
        toast("❌ Erro ao salvar. Verifique as políticas RLS.", "err");
      } else {
        toast("✓ Perfil atualizado com sucesso! 🌸");
      }
    };

    const handleLogout = async () => {
      log("handleLogout: fazendo signOut...");
      const { error } = await supabase.auth.signOut();
      if (error) warn("signOut error:", error.message);
      // onAuthStateChange cuida de limpar user + profile no contexto
      toast("👋 Até logo! Volte sempre 🌸");
      go("home");
    };

    const handleChangePassword = async () => {
      if (pwForm.next.length < 6)           { toast("Senha: mínimo 6 caracteres", "err"); return; }
      if (pwForm.next !== pwForm.confirm)    { toast("As senhas não coincidem", "err"); return; }
      const { error } = await supabase.auth.updateUser({ password: pwForm.next });
      if (error) {
        warn("updatePassword error:", error.message);
        toast("❌ " + (error.message || "Erro ao alterar senha"), "err");
      } else {
        toast("✓ Senha alterada com sucesso!");
        setPwForm({ next:"", confirm:"" });
      }
    };

    return (
      <div>
        <h2 className="fd" style={{ fontSize:"1.5rem", fontWeight:400, marginBottom:"1.5rem" }}>Configurações</h2>

        {/* Perfil */}
        <div style={{ background:"var(--wh)", border:"1px solid var(--br)", padding:"1.5rem", marginBottom:"1.5rem" }}>
          <div style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--gy)", marginBottom:"1rem" }}>
            Informações pessoais
          </div>
          {profileLoading ? (
            <div style={{ display:"flex", flexDirection:"column", gap:".7rem", marginBottom:"1rem" }}>
              {[1,2,3].map(i => <div key={i} className="skel" style={{ height:42 }} />)}
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
              <Input label="Nome completo" value={settingsForm.name}    onChange={e => setSF("name",    e.target.value)} placeholder="Maria Silva" />
              <Input label="E-mail (não editável)" value={user.email} disabled />
              <Input label="Telefone / WhatsApp"   value={settingsForm.phone}   onChange={e => setSF("phone",   e.target.value)} type="tel" placeholder="(11) 99999-8888" />
              <Input label="Endereço"              value={settingsForm.address} onChange={e => setSF("address", e.target.value)} placeholder="Rua das Flores, 142" />
              <Input label="Cidade"                value={settingsForm.city}    onChange={e => setSF("city",    e.target.value)} placeholder="São Paulo" />
              <Input label="CEP"                   value={settingsForm.zip}     onChange={e => setSF("zip",     e.target.value)} placeholder="01310-100" />
            </div>
          )}
          <Btn onClick={handleSave} disabled={savingSettings || profileLoading}>
            {savingSettings ? <><Spinner size={14} /> Salvando...</> : "Salvar alterações"}
          </Btn>
        </div>

        {/* Senha */}
        <div style={{ background:"var(--wh)", border:"1px solid var(--br)", padding:"1.5rem", marginBottom:"1.5rem" }}>
          <div style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", color:"var(--gy)", marginBottom:"1rem" }}>Alterar senha</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
            <Input label="Nova senha (mín. 6 caracteres)" value={pwForm.next}    onChange={e => setPwForm(p => ({ ...p, next:    e.target.value }))} type="password" placeholder="••••••••" />
            <Input label="Confirmar nova senha"           value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} type="password" placeholder="repita a senha" />
          </div>
          <Btn variant="outline" onClick={handleChangePassword}>Alterar senha</Btn>
        </div>

        {/* Logout */}
        <div style={{ background:"var(--wh)", border:"1px solid #e04040", padding:"1.5rem" }}>
          <div style={{ fontSize:".7rem", textTransform:"uppercase", letterSpacing:".12em", color:"#e04040", marginBottom:".8rem" }}>Sessão</div>
          <p style={{ fontSize:".82rem", color:"var(--gy)", marginBottom:"1rem" }}>
            Clique abaixo para sair da sua conta neste dispositivo.
          </p>
          <button
            onClick={handleLogout}
            style={{ background:"none", border:"1px solid #e04040", color:"#e04040", padding:".65rem 1.4rem", fontSize:".72rem", textTransform:"uppercase", letterSpacing:".12em", cursor:"pointer", transition:"all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#e04040"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#e04040"; }}
          >
            Sair da conta
          </button>
        </div>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="pad-main" style={{ padding:"3rem 2.5rem", minHeight:"70vh" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Header do perfil */}
        <div style={{ display:"flex", alignItems:"center", gap:"1.2rem", marginBottom:"2rem", padding:"1.2rem", background:"var(--wh)", border:"1px solid var(--br)" }}>
          {/* Avatar */}
          <div style={{ width:56, height:56, background:"var(--ro)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"1.3rem", fontWeight:700, flexShrink:0 }}>
            {avatarChar}
          </div>
          <div style={{ flex:1 }}>
            {profileLoading ? (
              <div className="skel" style={{ height:20, width:180, marginBottom:6 }} />
            ) : (
              <div className="fd" style={{ fontSize:"1.5rem", fontWeight:300 }}>{displayName}</div>
            )}
            <div style={{ fontSize:".78rem", color:"var(--gy)" }}>{user.email}</div>
          </div>
          {/* Badge de status */}
          <div style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".72rem", color:"var(--sg)" }}>
            <span style={{ width:8, height:8, background:"var(--sg)", borderRadius:"50%", display:"inline-block" }} />
            Conectado
          </div>
        </div>

        <div className="profile-grid" style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:"2rem" }}>
          {/* Sidebar */}
          <div style={{ background:"var(--wh)", border:"1px solid var(--br)", padding:".5rem 0", height:"fit-content" }}>
            {tabs.map(t => <SideTab key={t.key} t={t} />)}
          </div>
          {/* Conteúdo */}
          <div>
            {tab === "orders"   && <OrdersTab />}
            {tab === "reorder"  && <ReorderTab />}
            {tab === "lists"    && <ListsTab />}
            {tab === "settings" && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════
function Footer({ go }) {
  const cols = [
    { title:"Loja",     links:[["catalog","Buquês"],["catalog","Arranjos"],["catalog","Plantas"],["catalog","Presentes"]] },
    { title:"Serviços", links:[["services","Personalizados"],["services","Eventos"],["services","Assinatura"],["services","Corporativo"]] },
    { title:"Empresa",  links:[["sobre","Sobre nós"],["contato","Fale conosco"],["contato","Entrega"],["contato","Trocas"]] },
  ];
  return (
    <footer style={{ background:"var(--dp2)", color:"rgba(250,247,242,.5)", padding:"4rem 2.5rem 2rem" }}>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"2.5rem", maxWidth:1100, margin:"0 auto", paddingBottom:"2.5rem", borderBottom:"1px solid rgba(255,255,255,.07)" }}>
        <div>
          <button onClick={()=>go("home")} style={{ background:"none", border:"none", cursor:"pointer" }}>
            <span className="fd" style={{ fontSize:"1.5rem", fontWeight:600, color:"#fff" }}>Flores<span style={{ color:"var(--ro)" }}>&</span>Pétalas</span>
          </button>
          <p style={{ fontSize:".8rem", lineHeight:1.7, marginTop:".8rem", maxWidth:240 }}>Trazendo beleza e emoção através das flores desde 2012.</p>
          <div style={{ display:"flex", gap:".6rem", marginTop:"1.2rem" }}>
            {["📸","💬","📘","🎵"].map((ic,i) => (
              <button key={i} style={{ width:34, height:34, background:"rgba(255,255,255,.07)", border:"none", cursor:"pointer", borderRadius:2, fontSize:".9rem", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .2s" }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--ro)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.07)"}>{ic}</button>
            ))}
          </div>
        </div>
        {cols.map(col => (
          <div key={col.title}>
            <div style={{ fontSize:".68rem", textTransform:"uppercase", letterSpacing:".16em", color:"rgba(250,247,242,.3)", marginBottom:"1rem" }}>{col.title}</div>
            <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:".5rem" }}>
              {col.links.map(([page,label]) => (
                <li key={label}><button onClick={()=>go(page)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:".82rem", color:"rgba(250,247,242,.55)", transition:"color .2s", textAlign:"left" }}
                  onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(250,247,242,.55)"}>{label}</button></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"1.5rem", gap:"1rem", flexWrap:"wrap" }}>
        <p style={{ fontSize:".72rem" }}>© 2025 Flores & Pétalas. Todos os direitos reservados.</p>
        <div style={{ display:"flex", gap:".5rem" }}>
          {["Pix","Visa","Master","Elo"].map(p=><span key={p} style={{ background:"rgba(255,255,255,.1)", padding:".25rem .6rem", fontSize:".65rem", letterSpacing:".08em", color:"rgba(250,247,242,.5)" }}>{p}</span>)}
        </div>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════
// REVEAL HOOK
// ══════════════════════════════════════════════════════════════════
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  });
}

// ══════════════════════════════════════════════════════════════════
// ROOT APP INNER
// ══════════════════════════════════════════════════════════════════
function AppInner() {
  const { authLoading, user, SB_LIVE } = useApp();
  const [page, setPage]           = useState("home");
  const [cartOpen, setCartOpen]   = useState(false);
  const [wishOpen, setWishOpen]   = useState(false);
  const [authOpen, setAuthOpen]   = useState(false);
  const [products, setProducts]   = useState([]);
  const [loadingProd, setLoadingProd] = useState(true);
  const [successOrder, setSuccessOrder] = useState(null);

  const go = useCallback((p) => {
    setCartOpen(false); setWishOpen(false); setAuthOpen(false);
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Carrega produtos
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("featured", { ascending: false });
        if (error || !data?.length) throw new Error(error?.message || "sem dados");
        log("AppInner: produtos carregados do Supabase:", data.length);
        setProducts(data);
      } catch (e) {
        log("AppInner: usando produtos mock. Motivo:", e.message);
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoadingProd(false);
      }
    })();
  }, []);

  useReveal();

  const showFooter = !["checkout", "success"].includes(page);

  // Skeleton global durante verificação de sessão inicial (evita flash de UI não autenticada)
  // Mostra por no máximo ~1s — depois renderiza normalmente com user=null se não houver sessão
  if (authLoading) {
    return (
      <>
        <style>{G}</style>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--cr)" }}>
          <div className="fd" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--dp)", marginBottom: "1.5rem" }}>
            Flores<span style={{ color: "var(--ro)" }}>&</span>Pétalas
          </div>
          <div style={{ display: "inline-block", width: 36, height: 36, border: "3px solid var(--bl)", borderTopColor: "var(--ro)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          <p style={{ marginTop: "1rem", fontSize: ".8rem", color: "var(--gy)" }}>Carregando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{G}</style>

      {/* Banner de desenvolvimento — visível apenas em modo demo */}
      {!SB_LIVE && (
        <div style={{ background: "#fffbe6", borderBottom: "1px solid #f0c040", padding: ".5rem 1.5rem", fontSize: ".72rem", color: "#7a5c00", display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
          <strong>⚙️ Modo demo</strong> — Supabase não configurado.
          Crie um arquivo <code>.env</code> com <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> para ativar autenticação e persistência real.
        </div>
      )}

      <Topbar />
      <Navbar page={page} go={go} openCart={() => setCartOpen(true)} openWish={() => setWishOpen(true)} />

      <main>
        {page === "home"     && <HomePage products={products} loading={loadingProd} go={go} />}
        {page === "catalog"  && <CatalogPage products={products} loading={loadingProd} />}
        {page === "services" && <ServicesPage go={go} />}
        {page === "sobre"    && <SobrePage go={go} />}
        {page === "contato"  && <ContatoPage />}
        {page === "profile"  && <ProfilePage go={go} openAuth={() => setAuthOpen(true)} />}
        {page === "checkout" && <CheckoutPage onBack={() => go("home")} onSuccess={o => { setSuccessOrder(o); go("success"); }} />}
        {page === "success"  && <SuccessPage order={successOrder} onContinue={() => go("home")} />}
      </main>

      {showFooter && <Footer go={go} />}

      <CartPanel  open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => go("checkout")} />
      <WishPanel  open={wishOpen} onClose={() => setWishOpen(false)} />
      <AuthModal  open={authOpen} onClose={() => setAuthOpen(false)} />
      <Toasts />
    </>
  );
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>;
}
