'use client';

/**
 * Trang giới thiệu NỀN TẢNG (marketing cho MKT) tại tên miền gốc xeghep.info.
 * Landing tự chứa (CSS + markup + JS), KHÔNG phụ thuộc tenant. Các route quản trị
 * (/control, /admin) không đổi — đây chỉ là trang demo/giới thiệu sản phẩm.
 *
 * Markup nhúng qua dangerouslySetInnerHTML; tương tác (sticky header, menu, FAQ,
 * reveal, đếm số, modal xem mẫu, form lead demo) chạy trong useEffect.
 */
import { useEffect } from 'react';

const CSS = `
:root{
  --navy-900:#0A2E63; --navy-800:#0D47A1; --blue-700:#1565C0; --blue-600:#1976D2;
  --blue-500:#1E88E5; --blue-400:#42A5F5; --blue-300:#64B5F6; --blue-100:#BBDEFB; --blue-50:#E8F2FE;
  --orange:#FF8C00; --orange-600:#F57C00; --gold:#FFD700; --gold-600:#FFC107;
  --pink:#FF4081; --green:#2ECC71; --green-600:#27AE60;
  --white:#FFFFFF; --ink:#11253F; --ink-soft:#41556E; --ink-faint:#7B8AA0;
  --line:#E2E9F2; --surface:#F4F8FD; --surface-2:#EAF2FB;
  --fb:#1877F2; --zalo:#0068FF; --tiktok:#000000; --youtube:#FF0000;
  --grad-hero:linear-gradient(135deg,#1565C0 0%,#1E88E5 52%,#64B5F6 100%);
  --grad-hero-deep:linear-gradient(135deg,#0A2E63 0%,#1565C0 55%,#1E88E5 100%);
  --grad-product:linear-gradient(150deg,#0D47A1 0%,#1565C0 100%);
  --grad-cta:linear-gradient(135deg,#FF9D2E 0%,#FF8C00 100%);
  --grad-cta-press:linear-gradient(135deg,#FF8C00 0%,#F57C00 100%);
  --grad-gold:linear-gradient(135deg,#FFE45C 0%,#FFD700 100%);
  --grad-sheen:linear-gradient(180deg,rgba(255,255,255,.18) 0%,rgba(255,255,255,0) 60%);
  --font-sans:var(--font-be-vietnam-pro),"Segoe UI",system-ui,-apple-system,sans-serif;
  --fs-hero:clamp(38px,5.2vw,68px); --fs-h2:clamp(28px,3.2vw,44px); --fs-h3:clamp(20px,2.1vw,28px);
  --lh-tight:1.05; --lh-snug:1.16; --lh-body:1.6;
  --tracking-cap:.01em; --tracking-eyebrow:.14em;
  --r-sm:10px; --r-md:16px; --r-lg:22px; --r-xl:30px; --r-pill:999px;
  --sh-sm:0 2px 8px rgba(13,71,161,.10); --sh-md:0 10px 24px rgba(13,71,161,.16);
  --sh-lg:0 20px 48px rgba(10,46,99,.24); --sh-float:0 24px 60px rgba(10,46,99,.34);
  --sh-cta:0 12px 26px rgba(255,140,0,.42); --sh-gold:0 8px 22px rgba(255,200,0,.45);
  --transition:transform .14s ease, box-shadow .25s ease, background .25s ease, color .2s ease;
}
#mkt-landing *{margin:0;padding:0;box-sizing:border-box}
#mkt-landing{font-family:var(--font-sans);color:var(--ink);line-height:var(--lh-body);overflow-x:hidden;background:var(--white);-webkit-font-smoothing:antialiased}
#mkt-landing .container{max-width:1200px;margin:0 auto;padding:0 24px}
#mkt-landing section{position:relative}
#mkt-landing a{text-decoration:none;color:inherit}
#mkt-landing img{max-width:100%;display:block}
#mkt-landing svg{display:block}
#mkt-landing .ic{width:1em;height:1em;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none}
#mkt-landing .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-weight:800;border:none;cursor:pointer;border-radius:var(--r-pill);transition:var(--transition);font-size:15.5px;font-family:inherit;line-height:1}
#mkt-landing .btn svg{width:18px;height:18px}
#mkt-landing .btn-primary{background:var(--grad-cta);color:#fff;padding:15px 32px;box-shadow:var(--sh-cta);text-transform:uppercase;letter-spacing:.02em}
#mkt-landing .btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(255,140,0,.52)}
#mkt-landing .btn-primary:active{transform:scale(.97);background:var(--grad-cta-press)}
#mkt-landing .btn-ghost{background:rgba(255,255,255,.14);color:#fff;padding:15px 28px;border:1px solid rgba(255,255,255,.4);font-weight:700;backdrop-filter:blur(6px)}
#mkt-landing .btn-ghost:hover{background:rgba(255,255,255,.24);transform:translateY(-2px)}
#mkt-landing .btn-white{background:#fff;color:var(--orange-600);padding:15px 34px;box-shadow:var(--sh-md);text-transform:uppercase;letter-spacing:.02em}
#mkt-landing .btn-white:hover{transform:translateY(-2px);box-shadow:0 16px 32px rgba(0,0,0,.18)}
#mkt-landing .btn-outline{background:#fff;border:1.5px solid var(--blue-700);color:var(--blue-700);padding:14px 30px}
#mkt-landing .btn-outline:hover{background:var(--blue-700);color:#fff;transform:translateY(-2px)}
#mkt-landing .cta-pulse{position:relative;animation:pulse-glow 2.8s ease-in-out infinite}
@keyframes pulse-glow{0%,100%{box-shadow:var(--sh-cta),0 0 0 0 rgba(255,140,0,.4)}50%{box-shadow:var(--sh-cta),0 0 0 13px rgba(255,140,0,0)}}
#mkt-landing .btn-primary::after,#mkt-landing .btn-white::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-120%);transition:none}
#mkt-landing .btn-primary,#mkt-landing .btn-white{position:relative;overflow:hidden}
#mkt-landing .btn-primary:hover::after,#mkt-landing .btn-white:hover::after{animation:sheen .8s ease}
@keyframes sheen{to{transform:translateX(120%)}}
#mkt-landing header{position:fixed;top:0;left:0;right:0;z-index:1000;padding:16px 0;transition:var(--transition),padding .25s ease}
#mkt-landing header.scrolled{background:rgba(255,255,255,.9);backdrop-filter:blur(14px);box-shadow:0 2px 18px rgba(13,71,161,.12);padding:9px 0;border-bottom:1px solid var(--line)}
#mkt-landing .nav{display:flex;align-items:center;gap:24px}
#mkt-landing .logo{display:flex;align-items:center;gap:11px}
#mkt-landing .logo .wm{line-height:1.02}
#mkt-landing .logo .wm b{display:block;font-weight:900;font-size:20px;letter-spacing:.01em;color:#fff}
#mkt-landing .logo .wm b .dot{color:var(--gold)}
#mkt-landing .logo .wm small{display:block;font-size:9.5px;font-weight:600;color:rgba(255,255,255,.72);margin-top:2px}
#mkt-landing header.scrolled .logo .wm b{color:var(--navy-900)}
#mkt-landing header.scrolled .logo .wm b .dot{color:var(--orange)}
#mkt-landing header.scrolled .logo .wm small{color:var(--ink-faint)}
#mkt-landing .nav-links{display:flex;align-items:center;gap:26px;list-style:none;margin-left:8px}
#mkt-landing .nav-links a{color:rgba(255,255,255,.92);font-weight:600;font-size:14.5px;transition:var(--transition)}
#mkt-landing .nav-links a:hover{color:var(--gold)}
#mkt-landing header.scrolled .nav-links a{color:var(--ink-soft)}
#mkt-landing header.scrolled .nav-links a:hover{color:var(--blue-700)}
#mkt-landing .nav-right{margin-left:auto;display:flex;align-items:center;gap:12px}
#mkt-landing .nav-cta{background:var(--grad-cta);color:#fff!important;padding:10px 22px;border-radius:var(--r-pill);font-size:13.5px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;box-shadow:var(--sh-cta)}
#mkt-landing .nav-cta:hover{transform:translateY(-2px)}
#mkt-landing .hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:6px}
#mkt-landing .hamburger span{width:26px;height:3px;background:#fff;border-radius:3px;transition:var(--transition)}
#mkt-landing header.scrolled .hamburger span{background:var(--navy-900)}
#mkt-landing .eyebrow{display:inline-block;font-weight:800;font-size:12.5px;letter-spacing:var(--tracking-eyebrow);text-transform:uppercase;color:var(--orange)}
#mkt-landing .sec-dark .eyebrow{color:var(--gold)}
#mkt-landing .gift-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);padding:8px 16px 8px 10px;border-radius:var(--r-pill);font-size:13.5px;font-weight:700;color:#fff;backdrop-filter:blur(6px)}
#mkt-landing .gift-badge .g{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--grad-gold);color:var(--navy-900)}
#mkt-landing .gift-badge .g svg{width:14px;height:14px;stroke-width:2.4}
#mkt-landing .subpill{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:clamp(14px,1.3vw,17px);color:#fff;background:var(--navy-800);padding:11px 20px;border-radius:var(--r-pill);box-shadow:var(--sh-sm)}
#mkt-landing .feat-pill{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:14.5px;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.24);padding:9px 16px 9px 10px;border-radius:var(--r-pill);backdrop-filter:blur(4px)}
#mkt-landing .feat-pill .tick{display:inline-grid;place-items:center;width:21px;height:21px;border-radius:50%;background:var(--green);color:#fff;flex:none}
#mkt-landing .feat-pill .tick svg{width:13px;height:13px;stroke-width:3}
#mkt-landing .statbadge{display:inline-flex;align-items:baseline;gap:6px;background:var(--grad-gold);color:var(--navy-900);padding:9px 16px;border-radius:var(--r-pill);box-shadow:var(--sh-gold);font-weight:800;font-size:13.5px}
#mkt-landing .statbadge .num{font-weight:900;font-size:1.18em}
#mkt-landing .hero{background:var(--grad-hero);color:#fff;padding:150px 0 96px;overflow:hidden}
#mkt-landing .hero::before{content:"";position:absolute;inset:0;background:var(--grad-sheen);pointer-events:none}
#mkt-landing .dot-grid{position:absolute;inset:0;opacity:.16;background-image:radial-gradient(rgba(255,255,255,.6) 1.2px,transparent 1.2px);background-size:26px 26px;pointer-events:none}
#mkt-landing .blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.26;pointer-events:none;animation:float 20s ease-in-out infinite}
#mkt-landing .blob1{width:440px;height:440px;background:var(--orange);top:-130px;right:-70px}
#mkt-landing .blob2{width:400px;height:400px;background:var(--blue-300);bottom:-160px;left:-110px;animation-delay:-7s}
@keyframes float{0%,100%{transform:translate(0,0)}33%{transform:translate(28px,-26px)}66%{transform:translate(-18px,18px)}}
#mkt-landing .hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:46px;align-items:center;position:relative;z-index:2}
#mkt-landing .hero h1{font-weight:900;font-size:clamp(30px,4.4vw,56px);line-height:var(--lh-tight);letter-spacing:var(--tracking-cap);text-transform:uppercase;margin:16px 0 18px}
#mkt-landing .hero h1 .ln{display:block;white-space:nowrap}
#mkt-landing .hero h1 .gold{color:var(--gold)}
#mkt-landing .hero h1 .accent{color:var(--orange)}
#mkt-landing .hero-sub{margin-bottom:22px}
#mkt-landing .hero-pills{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:28px}
#mkt-landing .hero-ctas{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:26px}
#mkt-landing .hero-trust{display:flex;align-items:center;gap:20px;font-size:13.5px;color:rgba(255,255,255,.92);font-weight:600;flex-wrap:wrap}
#mkt-landing .hero-trust span{display:inline-flex;align-items:center;gap:7px}
#mkt-landing .hero-trust svg{width:17px;height:17px}
#mkt-landing .hero-trust .stars{color:var(--gold);letter-spacing:2px}
#mkt-landing .box-wrap{position:relative;display:grid;place-items:center;min-height:420px}
#mkt-landing .box-glow{position:absolute;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.32),transparent 70%);filter:blur(8px)}
#mkt-landing .box-tilt{position:relative;transform:perspective(1200px) rotateY(-15deg) rotateX(6deg);transform-style:preserve-3d;animation:boxfloat 7s ease-in-out infinite}
@keyframes boxfloat{0%,100%{transform:perspective(1200px) rotateY(-15deg) rotateX(6deg) translateY(0)}50%{transform:perspective(1200px) rotateY(-15deg) rotateX(6deg) translateY(-14px)}}
#mkt-landing .mockup{width:400px;max-width:88vw;background:#fff;border-radius:18px;box-shadow:0 44px 84px rgba(10,46,99,.5);overflow:hidden;border:1px solid rgba(255,255,255,.5)}
#mkt-landing .mockup-bar{background:#eef2f7;padding:11px 14px;display:flex;align-items:center;gap:7px}
#mkt-landing .mockup-bar .d{width:11px;height:11px;border-radius:50%}
#mkt-landing .mockup-bar .d1{background:#ff5f57}#mkt-landing .mockup-bar .d2{background:#febc2e}#mkt-landing .mockup-bar .d3{background:#28c840}
#mkt-landing .mockup-url{margin-left:10px;background:#fff;border-radius:6px;padding:5px 12px;font-size:11.5px;color:var(--ink-faint);flex:1;font-weight:600}
#mkt-landing .mk-hero{background:var(--grad-hero);color:#fff;padding:22px 20px;text-align:center}
#mkt-landing .mk-hero h4{font-size:17px;font-weight:900;margin-bottom:4px}
#mkt-landing .mk-hero p{font-size:12px;opacity:.92;font-weight:500}
#mkt-landing .mk-search{background:#fff;margin:-16px 16px 0;border-radius:11px;box-shadow:0 8px 20px rgba(13,71,161,.16);padding:11px;display:flex;gap:8px;position:relative}
#mkt-landing .mk-input{flex:1;background:var(--surface);border-radius:8px;padding:8px 10px;font-size:11px;color:var(--ink-faint);font-weight:600}
#mkt-landing .mk-btn{background:var(--grad-cta);color:#fff;border-radius:8px;padding:8px 14px;font-size:11px;font-weight:800}
#mkt-landing .mk-routes{padding:16px}
#mkt-landing .mk-route{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);border-radius:10px;padding:11px 12px;margin-bottom:8px}
#mkt-landing .mk-route:last-child{margin-bottom:0}
#mkt-landing .mk-route .r-l{font-size:12px;font-weight:700;color:var(--ink)}
#mkt-landing .mk-route .r-l small{display:block;font-weight:500;color:var(--ink-faint);font-size:10px;margin-top:2px}
#mkt-landing .mk-route .r-p{font-size:13px;font-weight:900;color:var(--orange)}
#mkt-landing .bubble{position:absolute;display:grid;place-items:center;border-radius:50%;box-shadow:0 0 0 3px #fff,0 16px 30px rgba(10,46,99,.34);z-index:3}
#mkt-landing .bb1{width:56px;height:56px;background:var(--fb);top:8px;left:2%;animation:bob 5s ease-in-out infinite}
#mkt-landing .bb2{width:50px;height:50px;background:var(--tiktok);top:32%;right:-3%;animation:bob 5.6s ease-in-out infinite .5s}
#mkt-landing .bb3{width:48px;height:48px;background:var(--zalo);bottom:16%;left:-3%;animation:bob 6s ease-in-out infinite 1s}
#mkt-landing .bb4{width:44px;height:44px;background:var(--youtube);bottom:2%;right:14%;animation:bob 5.3s ease-in-out infinite .3s}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
#mkt-landing .float-badge{position:absolute;z-index:3}
#mkt-landing .fb-top{top:4%;right:4%}
#mkt-landing .fb-bot{bottom:18%;left:8%;background:#fff;color:var(--green-600);font-weight:800;font-size:12.5px;padding:8px 14px;border-radius:var(--r-pill);box-shadow:var(--sh-md);display:inline-flex;align-items:center;gap:6px}
#mkt-landing .fb-bot svg{width:15px;height:15px}
#mkt-landing .stats{background:var(--grad-hero-deep);color:#fff;overflow:hidden}
#mkt-landing .stats::before{content:"";position:absolute;inset:0;background:var(--grad-sheen)}
#mkt-landing .stats-inner{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center;padding:44px 0;position:relative;z-index:2}
#mkt-landing .stat .num{font-size:clamp(30px,4vw,44px);font-weight:900;color:var(--gold);line-height:1}
#mkt-landing .stat .lbl{font-size:14px;color:rgba(255,255,255,.88);margin-top:8px;font-weight:600}
#mkt-landing .sec{padding:90px 0}
#mkt-landing .sec-light{background:var(--surface)}
#mkt-landing .sec-dark{background:var(--grad-hero-deep);color:#fff;overflow:hidden}
#mkt-landing .sec-dark::before{content:"";position:absolute;inset:0;background:var(--grad-sheen);pointer-events:none}
#mkt-landing .sec-head{text-align:center;max-width:720px;margin:0 auto 56px;position:relative;z-index:2}
#mkt-landing .sec-head .eyebrow{margin-bottom:12px}
#mkt-landing .sec-head h2{font-size:var(--fs-h2);font-weight:800;line-height:var(--lh-snug);text-wrap:balance;margin-bottom:14px}
#mkt-landing .sec-head p{font-size:17.5px;color:var(--ink-soft);font-weight:500}
#mkt-landing .sec-dark .sec-head p{color:rgba(255,255,255,.9)}
#mkt-landing .tile{display:grid;place-items:center;border-radius:14px;flex:none}
#mkt-landing .tile svg{stroke-width:2}
#mkt-landing .tile-blue{width:54px;height:54px;background:var(--grad-product);color:#fff;box-shadow:var(--sh-md)}
#mkt-landing .tile-blue svg{width:26px;height:26px}
#mkt-landing .tile-orange{width:58px;height:58px;background:var(--grad-cta);color:#fff;box-shadow:var(--sh-cta)}
#mkt-landing .tile-orange svg{width:27px;height:27px}
#mkt-landing .tile-soft{width:54px;height:54px;background:var(--blue-50);color:var(--blue-700)}
#mkt-landing .tile-soft svg{width:26px;height:26px}
#mkt-landing .pain-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
#mkt-landing .pain-card{background:#fff;border-radius:var(--r-md);padding:28px 24px;box-shadow:var(--sh-sm);border:1px solid var(--line);transition:var(--transition)}
#mkt-landing .pain-card:hover{transform:translateY(-6px);box-shadow:var(--sh-lg)}
#mkt-landing .pain-card .tile{margin-bottom:16px;background:#FFF1E6;color:var(--orange-600);width:50px;height:50px}
#mkt-landing .pain-card .tile svg{width:25px;height:25px}
#mkt-landing .pain-card h3{font-size:17px;font-weight:800;margin-bottom:8px;color:var(--ink)}
#mkt-landing .pain-card p{font-size:14.5px;color:var(--ink-soft);font-weight:500}
#mkt-landing .ports{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;position:relative;z-index:2}
#mkt-landing .port{background:rgba(255,255,255,.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.18);border-radius:var(--r-lg);padding:32px 28px;transition:var(--transition)}
#mkt-landing .port:hover{transform:translateY(-6px);background:rgba(255,255,255,.15)}
#mkt-landing .port .tile{margin-bottom:20px}
#mkt-landing .port h3{font-size:21px;font-weight:800;margin-bottom:10px}
#mkt-landing .port>p{font-size:14.5px;color:rgba(255,255,255,.88);font-weight:500}
#mkt-landing .port ul{list-style:none;margin-top:18px;display:flex;flex-direction:column;gap:10px}
#mkt-landing .port li{font-size:14px;color:rgba(255,255,255,.92);font-weight:500;padding-left:28px;position:relative}
#mkt-landing .port li .tick{position:absolute;left:0;top:1px;display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:var(--green);color:#fff}
#mkt-landing .port li .tick svg{width:11px;height:11px;stroke-width:3.4}
#mkt-landing .tpl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:30px;max-width:1000px;margin:0 auto}
#mkt-landing .tpl-card{background:#fff;border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--sh-md);border:1px solid var(--line);transition:var(--transition)}
#mkt-landing .tpl-card:hover{transform:translateY(-6px);box-shadow:var(--sh-lg)}
#mkt-landing .tpl-prev{position:relative;height:264px;overflow:hidden;cursor:pointer}
#mkt-landing .tpl-prev .open-hint{position:absolute;inset:0;background:rgba(13,71,161,.5);opacity:0;display:flex;align-items:center;justify-content:center;transition:var(--transition);backdrop-filter:blur(2px)}
#mkt-landing .tpl-prev:hover .open-hint{opacity:1}
#mkt-landing .tpl-prev .open-hint span{background:#fff;color:var(--blue-700);font-weight:800;padding:11px 24px;border-radius:var(--r-pill);font-size:14.5px;box-shadow:var(--sh-lg);display:inline-flex;align-items:center;gap:8px}
#mkt-landing .tpl-prev .open-hint svg{width:17px;height:17px}
#mkt-landing .tpl-meta{padding:20px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px}
#mkt-landing .tpl-meta h3{font-size:17px;font-weight:800;display:flex;align-items:center;gap:9px}
#mkt-landing .tpl-meta p{font-size:13px;color:var(--ink-soft);font-weight:500;margin-top:4px}
#mkt-landing .tpl-tag{font-size:11.5px;font-weight:800;padding:4px 12px;border-radius:var(--r-pill);white-space:nowrap;text-transform:uppercase;letter-spacing:.03em}
#mkt-landing .tag-free{background:#E7F7EE;color:var(--green-600)}
#mkt-landing .tag-pro{background:#FFF1E6;color:var(--orange-600)}
#mkt-landing .tpl-btn{background:var(--surface);border:1px solid var(--line);color:var(--blue-700);font-weight:800;font-size:13.5px;padding:9px 18px;border-radius:var(--r-pill);cursor:pointer;transition:var(--transition);font-family:inherit;white-space:nowrap}
#mkt-landing .tpl-btn:hover{background:var(--blue-700);color:#fff;border-color:var(--blue-700)}
#mkt-landing .site{height:100%;display:flex;flex-direction:column;font-size:11px;background:var(--s-bg,#fff);color:var(--s-text,#11253F)}
#mkt-landing .site-nav{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;background:var(--s-nav,transparent);color:var(--s-navtext,#fff)}
#mkt-landing .site-nav .s-logo{font-weight:900;font-size:13px}
#mkt-landing .site-nav .s-links{display:flex;gap:12px;font-size:10px;opacity:.85;font-weight:600}
#mkt-landing .site-hero{flex:1;background:var(--s-hero);color:var(--s-herotext,#fff);padding:22px 18px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
#mkt-landing .site-hero h4{font-size:18px;font-weight:900;line-height:1.18;margin-bottom:6px}
#mkt-landing .site-hero p{font-size:11px;opacity:.92;margin-bottom:12px;font-weight:500}
#mkt-landing .site-hero .s-cta{align-self:flex-start;background:var(--s-acc);color:var(--s-ctatext,#fff);font-weight:800;padding:7px 16px;border-radius:var(--r-pill);font-size:11px}
#mkt-landing .site-search{margin:0 16px;transform:translateY(-14px);background:#fff;border-radius:10px;box-shadow:0 8px 18px rgba(0,0,0,.14);padding:8px;display:flex;gap:6px;align-items:center}
#mkt-landing .site-search .si{flex:1;background:#f1f5fb;border-radius:7px;padding:6px 8px;font-size:10px;color:#5a6478;font-weight:600}
#mkt-landing .site-search .sb{background:var(--s-acc);color:var(--s-ctatext,#fff);border-radius:7px;padding:6px 12px;font-size:10px;font-weight:800}
#mkt-landing .tpl1{--s-hero:linear-gradient(135deg,#1565C0,#1E88E5);--s-acc:#FF8C00;--s-nav:transparent;--s-navtext:#fff}
#mkt-landing .tpl2{--s-bg:#0f1c2e;--s-text:#cfe0f0;--s-hero:linear-gradient(135deg,#0f2027,#203a43,#2c5364);--s-acc:#00E5C7;--s-ctatext:#04241f;--s-navtext:#9fe9dd}
#mkt-landing .tpl3{--s-bg:#13132a;--s-text:#e8e2c8;--s-hero:linear-gradient(135deg,#1a1a2e,#0f3460);--s-acc:#FFD700;--s-ctatext:#1a1a2e;--s-herotext:#f5efd0;--s-navtext:#FFD700}
#mkt-landing .tpl4{--s-bg:#ffffff;--s-text:#11253F;--s-hero:linear-gradient(160deg,#26A69A,#4DD0C4);--s-acc:#FF6F61;--s-nav:#fff;--s-navtext:#11253F;--s-herotext:#fff}
#mkt-landing .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
#mkt-landing .feat{background:#fff;border-radius:var(--r-md);padding:30px 26px;box-shadow:var(--sh-sm);border:1px solid var(--line);transition:var(--transition)}
#mkt-landing .feat:hover{transform:translateY(-6px);box-shadow:var(--sh-lg)}
#mkt-landing .feat .tile{margin-bottom:18px}
#mkt-landing .feat h3{font-size:18px;font-weight:800;margin-bottom:9px;color:var(--ink)}
#mkt-landing .feat p{font-size:14.5px;color:var(--ink-soft);font-weight:500}
#mkt-landing .test-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
#mkt-landing .test{background:#fff;border-radius:var(--r-md);padding:30px 26px;box-shadow:var(--sh-sm);border:1px solid var(--line)}
#mkt-landing .test .stars{color:var(--gold);letter-spacing:2px;margin-bottom:14px;font-size:15px}
#mkt-landing .test p{font-size:14.5px;color:var(--ink);font-weight:500;margin-bottom:20px;line-height:1.65}
#mkt-landing .test .who{display:flex;align-items:center;gap:12px}
#mkt-landing .test .av{width:46px;height:46px;border-radius:50%;background:var(--grad-product);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:18px;flex:none}
#mkt-landing .test .who b{display:block;font-size:14.5px;font-weight:800}
#mkt-landing .test .who small{color:var(--ink-faint);font-size:12.5px}
#mkt-landing .price-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:30px;max-width:880px;margin:0 auto}
#mkt-landing .price{background:#fff;border-radius:var(--r-lg);padding:40px 34px;box-shadow:var(--sh-sm);border:1px solid var(--line);position:relative;transition:var(--transition)}
#mkt-landing .price:hover{transform:translateY(-6px);box-shadow:var(--sh-lg)}
#mkt-landing .price.reco{border:2px solid var(--orange);box-shadow:0 18px 44px rgba(255,140,0,.2)}
#mkt-landing .price .pop{position:absolute;top:-15px;left:50%;transform:translateX(-50%);background:var(--grad-cta);color:#fff;font-size:12.5px;font-weight:800;padding:7px 20px;border-radius:var(--r-pill);white-space:nowrap;box-shadow:var(--sh-cta);display:inline-flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.02em}
#mkt-landing .price .pop svg{width:14px;height:14px}
#mkt-landing .price h3{font-size:22px;font-weight:900;margin-bottom:6px;color:var(--ink)}
#mkt-landing .price .desc{font-size:14px;color:var(--ink-soft);font-weight:500;margin-bottom:20px;min-height:42px}
#mkt-landing .price .amt{font-size:42px;font-weight:900;color:var(--ink);line-height:1}
#mkt-landing .price .amt small{font-size:16px;font-weight:600;color:var(--ink-faint)}
#mkt-landing .price .amt .free{color:var(--green-600)}
#mkt-landing .price .year{font-size:13px;color:var(--orange-600);font-weight:800;margin-top:6px;min-height:20px}
#mkt-landing .price ul{list-style:none;margin:24px 0}
#mkt-landing .price li{font-size:14.5px;padding:8px 0 8px 28px;position:relative;color:var(--ink);font-weight:500}
#mkt-landing .price li::before{content:"";position:absolute;left:0;top:13px;width:16px;height:16px;border-radius:50%;background:var(--green);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");background-size:11px;background-position:center;background-repeat:no-repeat}
#mkt-landing .price li.off{color:var(--ink-faint)}
#mkt-landing .price li.off::before{background:var(--line);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'/%3E%3Cline x1='6' y1='6' x2='18' y2='18'/%3E%3C/svg%3E")}
#mkt-landing .price .btn{width:100%;margin-top:6px}
#mkt-landing .funnel{background:var(--grad-cta);color:#fff;padding:0;overflow:hidden}
#mkt-landing .funnel-inner{max-width:1000px;margin:0 auto;padding:60px 24px;text-align:center;position:relative;z-index:2}
#mkt-landing .funnel::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(255,255,255,.22),transparent 50%);pointer-events:none}
#mkt-landing .funnel h2{font-size:clamp(26px,3.4vw,38px);font-weight:900;margin-bottom:14px;text-wrap:balance}
#mkt-landing .funnel p{font-size:17px;max-width:700px;margin:0 auto 28px;opacity:.96;font-weight:500}
#mkt-landing .faq{max-width:800px;margin:0 auto}
#mkt-landing .faq-item{background:#fff;border:1px solid var(--line);border-radius:14px;margin-bottom:14px;overflow:hidden;box-shadow:var(--sh-sm)}
#mkt-landing .faq-q{padding:20px 24px;font-weight:700;font-size:16.5px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;gap:16px;color:var(--ink)}
#mkt-landing .faq-q .arr{flex:none;width:30px;height:30px;border-radius:50%;background:var(--surface);display:grid;place-items:center;transition:var(--transition);color:var(--orange)}
#mkt-landing .faq-q .arr svg{width:18px;height:18px;transition:var(--transition)}
#mkt-landing .faq-item.open .arr{background:var(--grad-cta);color:#fff}
#mkt-landing .faq-item.open .arr svg{transform:rotate(45deg)}
#mkt-landing .faq-a{max-height:0;overflow:hidden;transition:max-height .35s ease;padding:0 24px}
#mkt-landing .faq-item.open .faq-a{max-height:260px;padding:0 24px 22px}
#mkt-landing .faq-a p{font-size:14.5px;color:var(--ink-soft);font-weight:500}
#mkt-landing .final{background:var(--grad-hero-deep);color:#fff;text-align:center;padding:90px 0;overflow:hidden}
#mkt-landing .final::before{content:"";position:absolute;inset:0;background:var(--grad-sheen);pointer-events:none}
#mkt-landing .final h2{font-size:var(--fs-h2);font-weight:900;margin-bottom:16px;position:relative;z-index:2;text-transform:uppercase;letter-spacing:var(--tracking-cap);text-wrap:balance}
#mkt-landing .final h2 .gold{color:var(--gold)}
#mkt-landing .final>.container>p{font-size:18px;opacity:.94;margin-bottom:32px;position:relative;z-index:2;font-weight:500}
#mkt-landing .final .guarantee{font-size:13.5px;opacity:.86;margin-top:20px;position:relative;z-index:2;font-weight:600;display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap}
#mkt-landing .final .guarantee span{display:inline-flex;align-items:center;gap:7px}
#mkt-landing .final .guarantee svg{width:16px;height:16px}
#mkt-landing .lead-form{background:rgba(255,255,255,.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.22);border-radius:var(--r-lg);padding:28px;max-width:480px;margin:0 auto;position:relative;z-index:2}
#mkt-landing .lead-form input{width:100%;padding:14px 16px;border-radius:11px;border:none;margin-bottom:12px;font-size:15px;font-family:inherit;color:var(--ink)}
#mkt-landing .lead-form input::placeholder{color:var(--ink-faint)}
#mkt-landing .lead-form .btn{width:100%}
#mkt-landing .form-note{font-size:12.5px;opacity:.9;margin-top:12px;font-weight:500}
#mkt-landing footer{background:var(--navy-900);color:rgba(255,255,255,.7);padding:56px 0 28px}
#mkt-landing .foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:40px;margin-bottom:36px}
#mkt-landing .foot-grid h4{color:#fff;font-size:15px;margin-bottom:16px;font-weight:800}
#mkt-landing .foot-brand .logo{margin-bottom:14px}
#mkt-landing .foot-brand .logo .wm b{color:#fff}
#mkt-landing .foot-brand p{font-size:13.5px;line-height:1.65;max-width:300px;font-weight:500}
#mkt-landing .foot-socials{display:flex;gap:10px;margin-top:18px}
#mkt-landing .foot-socials .bub{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;box-shadow:0 0 0 2px rgba(255,255,255,.2)}
#mkt-landing .foot-socials .bub img{width:17px;height:17px}
#mkt-landing .foot-grid p,#mkt-landing .foot-grid a{font-size:13.5px;line-height:2;display:block;font-weight:500}
#mkt-landing .foot-grid a{transition:var(--transition)}
#mkt-landing .foot-grid a:hover{color:var(--gold)}
#mkt-landing .foot-bot{border-top:1px solid rgba(255,255,255,.1);padding-top:22px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12.5px;font-weight:500}
#mkt-landing .float-cta{display:none;position:fixed;bottom:0;left:0;right:0;z-index:999;padding:12px 16px;background:rgba(13,71,161,.96);backdrop-filter:blur(10px);box-shadow:0 -4px 20px rgba(0,0,0,.25)}
#mkt-landing .float-cta .btn{width:100%}
#mkt-landing .reveal{opacity:0;transform:translateY(28px);transition:opacity .6s ease,transform .6s ease}
#mkt-landing .reveal.visible{opacity:1;transform:translateY(0)}
.mkt-modal{position:fixed;inset:0;z-index:2000;background:rgba(10,22,40,.78);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:24px;font-family:var(--font-sans)}
.mkt-modal.show{display:flex}
.mkt-modal .modal-box{background:#fff;border-radius:var(--r-lg);width:100%;max-width:760px;max-height:90vh;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.4);display:flex;flex-direction:column;animation:popin .3s ease}
@keyframes popin{from{transform:scale(.94);opacity:0}to{transform:scale(1);opacity:1}}
.mkt-modal .modal-bar{background:#eef2f7;padding:11px 16px;display:flex;align-items:center;gap:7px}
.mkt-modal .modal-bar .d{width:11px;height:11px;border-radius:50%}
.mkt-modal .modal-bar .d1{background:#ff5f57}.mkt-modal .modal-bar .d2{background:#febc2e}.mkt-modal .modal-bar .d3{background:#28c840}
.mkt-modal .modal-bar .url{margin-left:10px;background:#fff;border-radius:6px;padding:5px 12px;font-size:12px;color:var(--ink-faint);flex:1;font-weight:600}
.mkt-modal .modal-bar .close{background:#dde3ec;border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;display:grid;place-items:center;color:var(--ink-soft);transition:var(--transition)}
.mkt-modal .modal-bar .close svg{width:16px;height:16px}
.mkt-modal .modal-bar .close:hover{background:var(--orange);color:#fff}
.mkt-modal .modal-scroll{overflow-y:auto;flex:1}
.mkt-modal .modal-foot{padding:16px 22px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.mkt-modal .modal-foot .mf-name{font-weight:800;font-size:16px;color:var(--ink)}
.mkt-modal .modal-foot .mf-name small{display:block;font-weight:500;font-size:13px;color:var(--ink-soft)}
.mkt-modal .site{font-size:13px}
.mkt-modal .tpl-full .site-hero{min-height:230px}
.mkt-modal .tpl-full .site-hero h4{font-size:26px}
.mkt-modal .tpl-full .site-hero p{font-size:14px}
.mkt-modal .ic{width:1em;height:1em;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none}
.mkt-modal .site-nav{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;background:var(--s-nav,transparent);color:var(--s-navtext,#fff)}
.mkt-modal .site-nav .s-logo{font-weight:900;font-size:13px}
.mkt-modal .site-nav .s-links{display:flex;gap:12px;font-size:10px;opacity:.85;font-weight:600}
.mkt-modal .site-hero{background:var(--s-hero);color:var(--s-herotext,#fff);padding:22px 18px;display:flex;flex-direction:column;justify-content:center}
.mkt-modal .site-hero .s-cta{align-self:flex-start;background:var(--s-acc);color:var(--s-ctatext,#fff);font-weight:800;padding:7px 16px;border-radius:var(--r-pill);font-size:12px}
.mkt-modal .site-search{margin:0 16px;transform:translateY(-14px);background:#fff;border-radius:10px;box-shadow:0 8px 18px rgba(0,0,0,.14);padding:8px;display:flex;gap:6px;align-items:center}
.mkt-modal .site-search .si{flex:1;background:#f1f5fb;border-radius:7px;padding:7px 9px;font-size:11px;color:#5a6478;font-weight:600}
.mkt-modal .site-search .sb{background:var(--s-acc);color:var(--s-ctatext,#fff);border-radius:7px;padding:7px 13px;font-size:11px;font-weight:800}
.mkt-modal .tf-routes{padding:18px 20px;background:var(--s-bg,#fff);color:var(--s-text,#11253F)}
.mkt-modal .tf-routes .rt{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border:1px solid rgba(128,128,128,.18);border-radius:10px;margin-bottom:9px}
.mkt-modal .tf-routes .rt b{font-size:13px}
.mkt-modal .tf-routes .rt small{display:block;font-weight:500;opacity:.7;font-size:11px}
.mkt-modal .tf-routes .rt .p{font-weight:900;color:var(--s-acc)}
.mkt-modal .tf-feats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:6px 20px 22px;background:var(--s-bg,#fff);color:var(--s-text,#11253F)}
.mkt-modal .tf-feats .ff{text-align:center;padding:14px 8px;border-radius:10px;background:rgba(128,128,128,.08)}
.mkt-modal .tf-feats .ff svg{width:22px;height:22px;margin:0 auto}
.mkt-modal .tf-feats .ff div{font-size:11px;font-weight:700;margin-top:6px}
@media(max-width:1024px){
  #mkt-landing .pain-grid{grid-template-columns:repeat(2,1fr)}
  #mkt-landing .feat-grid,#mkt-landing .test-grid,#mkt-landing .ports{grid-template-columns:1fr 1fr}
}
@media(max-width:980px){
  #mkt-landing .nav-links{display:none;position:absolute;top:100%;left:0;right:0;background:rgba(13,71,161,.98);flex-direction:column;gap:0;padding:10px 0;backdrop-filter:blur(12px);margin-left:0}
  #mkt-landing .nav-links.open{display:flex}
  #mkt-landing .nav-links li{width:100%;text-align:center}
  #mkt-landing .nav-links a{display:block;padding:14px;font-size:17px;color:#fff!important}
  #mkt-landing .nav-right{margin-left:auto}
  #mkt-landing .nav-right .nav-cta{display:none}
  #mkt-landing .hamburger{display:flex}
  #mkt-landing .hero{padding:120px 0 72px}
  #mkt-landing .hero-grid{grid-template-columns:1fr;text-align:center}
  #mkt-landing .hero-pills,#mkt-landing .hero-ctas,#mkt-landing .hero-trust{justify-content:center}
  #mkt-landing .box-wrap{margin-top:30px;min-height:360px}
  #mkt-landing .stats-inner{grid-template-columns:1fr 1fr;gap:30px 20px}
  #mkt-landing .sec{padding:62px 0}
  #mkt-landing .pain-grid,#mkt-landing .feat-grid,#mkt-landing .test-grid,#mkt-landing .ports,#mkt-landing .price-grid,#mkt-landing .tpl-grid{grid-template-columns:1fr}
  #mkt-landing .tpl-prev{height:220px}
  #mkt-landing .foot-grid{grid-template-columns:1fr;gap:28px}
  #mkt-landing .foot-bot{justify-content:center;text-align:center}
  #mkt-landing .float-cta{display:block}
  #mkt-landing{padding-bottom:74px}
}
`;

const BODY = `
<header id="hdr">
  <div class="container nav">
    <a href="#" class="logo"><span class="wm"><b>XEGHEP<span class="dot">.INFO</span></b><small>Sản phẩm của MKT Software</small></span></a>
    <ul class="nav-links" id="navLinks">
      <li><a href="#van-de">Vấn đề</a></li>
      <li><a href="#giai-phap">Giải pháp</a></li>
      <li><a href="#mau-giao-dien">Mẫu giao diện</a></li>
      <li><a href="#tinh-nang">Tính năng</a></li>
      <li><a href="#bang-gia">Bảng giá</a></li>
      <li><a href="#cau-hoi">Câu hỏi</a></li>
    </ul>
    <div class="nav-right">
      <a href="#dang-ky" class="nav-cta">Nhận website miễn phí</a>
      <button class="hamburger" id="hamburger" aria-label="Mở menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>

<section class="hero">
  <div class="dot-grid"></div><div class="blob blob1"></div><div class="blob blob2"></div>
  <div class="container hero-grid">
    <div>
      <span class="gift-badge"><span class="g"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></span> Quà tặng kèm khi dùng MKT Software</span>
      <h1><span class="ln">Website xe ghép</span><span class="ln gold">thương hiệu riêng</span><span class="ln">nhận khách <span class="accent">24/7</span></span></h1>
      <div class="hero-sub"><span class="subpill">Không qua trung gian · Mang đúng tên thương hiệu của bạn</span></div>
      <div class="hero-pills">
        <span class="feat-pill"><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span> Khách tự tìm chuyến</span>
        <span class="feat-pill"><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span> Tài xế tự nhận chuyến</span>
        <span class="feat-pill"><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span> Hệ thống tự tính hoa hồng</span>
      </div>
      <div class="hero-ctas">
        <a href="#dang-ky" class="btn btn-primary cta-pulse">Nhận website miễn phí <svg class="ic"><use href="#i-arrow"/></svg></a>
        <a href="#mau-giao-dien" class="btn btn-ghost"><svg class="ic"><use href="#i-eye"/></svg> Xem mẫu giao diện</a>
      </div>
      <div class="hero-trust">
        <span class="stars">★★★★★</span>
        <span><svg class="ic"><use href="#i-zap"/></svg> Dựng site trong <b>&nbsp;dưới 10 phút</b></span>
        <span><svg class="ic"><use href="#i-shield"/></svg> Không cần biết kỹ thuật</span>
      </div>
    </div>
    <div class="box-wrap">
      <div class="box-glow"></div>
      <div class="box-tilt">
        <div class="mockup">
          <div class="mockup-bar"><span class="d d1"></span><span class="d d2"></span><span class="d d3"></span><span class="mockup-url">xeghep-cuaban.vn</span></div>
          <div class="mk-hero"><h4>Nhà Xe Thành Đạt</h4><p>Đặt xe ghép nhanh – an toàn – đúng giờ</p></div>
          <div class="mk-search"><span class="mk-input">📍 Hà Nội → Yên Bái</span><span class="mk-btn">Tìm chuyến</span></div>
          <div class="mk-routes">
            <div class="mk-route"><span class="r-l">Hà Nội → Yên Bái<small>07:00 • còn 3 ghế</small></span><span class="r-p">180.000đ</span></div>
            <div class="mk-route"><span class="r-l">Yên Bái → Hà Nội<small>13:30 • còn 2 ghế</small></span><span class="r-p">180.000đ</span></div>
            <div class="mk-route"><span class="r-l">Hà Nội → Lào Cai<small>20:00 • còn 5 ghế</small></span><span class="r-p">250.000đ</span></div>
          </div>
        </div>
      </div>
      <span class="bubble bb1"><img src="https://cdn.simpleicons.org/facebook/ffffff" width="26" height="26" alt="Facebook"></span>
      <span class="bubble bb2"><img src="https://cdn.simpleicons.org/tiktok/ffffff" width="23" height="23" alt="TikTok"></span>
      <span class="bubble bb3"><img src="https://cdn.simpleicons.org/zalo/ffffff" width="22" height="22" alt="Zalo"></span>
      <span class="bubble bb4"><img src="https://cdn.simpleicons.org/youtube/ffffff" width="22" height="22" alt="YouTube"></span>
      <span class="statbadge float-badge fb-top"><span class="num">24/7</span> Nhận đơn</span>
      <span class="float-badge fb-bot"><svg class="ic"><use href="#i-rocket"/></svg> +3 ghế vừa đặt</span>
    </div>
  </div>
</section>

<section class="stats">
  <div class="dot-grid"></div>
  <div class="container stats-inner">
    <div class="stat"><div class="num count-up" data-target="10" data-suffix=" phút">0</div><div class="lbl">Thời gian dựng xong website</div></div>
    <div class="stat"><div class="num count-up" data-target="12" data-suffix="%">0</div><div class="lbl">Hoa hồng tự tính trên hệ thống</div></div>
    <div class="stat"><div class="num count-up" data-target="3" data-suffix=" cổng">0</div><div class="lbl">Khách · Tài xế · Quản trị</div></div>
    <div class="stat"><div class="num count-up" data-target="24" data-suffix="/7">0</div><div class="lbl">Nhận đơn đặt xe tự động</div></div>
  </div>
</section>

<section class="sec sec-light" id="van-de">
  <div class="container">
    <div class="sec-head reveal"><span class="eyebrow">Bạn có đang gặp phải?</span><h2>Quản lý nhà xe ghép theo cách cũ đang khiến bạn mất khách mỗi ngày</h2></div>
    <div class="pain-grid">
      <div class="pain-card reveal"><span class="tile"><svg class="ic"><use href="#i-edit"/></svg></span><h3>Đăng chuyến thủ công</h3><p>Mỗi ngày ngồi gõ lịch trình lên Facebook, Zalo, group — vừa tốn thời gian vừa dễ sót chuyến.</p></div>
      <div class="pain-card reveal"><span class="tile"><svg class="ic"><use href="#i-phone-off"/></svg></span><h3>Khách gọi loạn, dễ mất chuyến</h3><p>Tin nhắn, cuộc gọi lẫn lộn khắp nơi, không có chỗ quản lý đặt chỗ tập trung nên hay nhầm, hay trùng ghế.</p></div>
      <div class="pain-card reveal"><span class="tile"><svg class="ic"><use href="#i-store"/></svg></span><h3>Trông thiếu chuyên nghiệp</h3><p>Không có website riêng, khách khó tin tưởng, khó cạnh tranh với các nhà xe đã có thương hiệu rõ ràng.</p></div>
      <div class="pain-card reveal"><span class="tile"><svg class="ic"><use href="#i-trend-down"/></svg></span><h3>Bị app trung gian ăn hoa hồng</h3><p>Phụ thuộc nền tảng của người khác, mất phần trăm cao và không sở hữu được dữ liệu khách hàng của chính mình.</p></div>
    </div>
  </div>
</section>

<section class="sec sec-dark" id="giai-phap">
  <div class="dot-grid"></div>
  <div class="container">
    <div class="sec-head reveal"><span class="eyebrow">Giải pháp trọn gói</span><h2>Một website – ba cổng vận hành đầy đủ</h2><p>Đừng lo, bạn không cần thuê lập trình viên. Hệ thống đã có sẵn ba cổng riêng biệt, chỉ việc đăng nhập và dùng.</p></div>
    <div class="ports">
      <div class="port reveal">
        <span class="tile tile-orange"><svg class="ic"><use href="#i-users"/></svg></span>
        <h3>Cổng khách hàng</h3><p>Khách tự tìm và đặt chỗ trên website thương hiệu của bạn.</p>
        <ul><li><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span>Tìm chuyến theo tuyến, giờ, giá</li><li><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span>Đặt chỗ online ngay</li><li><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span>Xem tuyến phổ biến, đánh giá</li></ul>
      </div>
      <div class="port reveal">
        <span class="tile tile-orange"><svg class="ic"><use href="#i-car"/></svg></span>
        <h3>Cổng tài xế</h3><p>Cộng tác viên đăng ký, xác thực hồ sơ và nhận chuyến.</p>
        <ul><li><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span>Đăng ký &amp; duyệt hồ sơ (KYC)</li><li><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span>Nhận chuyến, quản lý lịch chạy</li><li><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span>Theo dõi thu nhập minh bạch</li></ul>
      </div>
      <div class="port reveal">
        <span class="tile tile-orange"><svg class="ic"><use href="#i-chart"/></svg></span>
        <h3>Cổng quản trị</h3><p>Bạn điều hành toàn bộ kinh doanh từ một bảng điều khiển.</p>
        <ul><li><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span>Quản lý chuyến, ghế, giá, tài xế</li><li><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span>Tự tính hoa hồng, báo cáo doanh thu</li><li><span class="tick"><svg class="ic"><use href="#i-check"/></svg></span>Nhận lead đặt xe qua Telegram</li></ul>
      </div>
    </div>
  </div>
</section>

<section class="sec sec-light" id="mau-giao-dien">
  <div class="container">
    <div class="sec-head reveal"><span class="eyebrow">Mẫu giao diện website</span><h2>Chọn giao diện đẹp – website của bạn lên sóng ngay</h2><p>Bấm "Xem mẫu" để xem trước từng giao diện. Gói Free dùng mẫu mặc định, gói Pro được chọn 1 trong các mẫu cao cấp và đổi bất cứ lúc nào — không mất dữ liệu đã nhập.</p></div>
    <div class="tpl-grid">
      <div class="tpl-card reveal">
        <div class="tpl-prev" data-tpl="tpl1">
          <div class="site tpl1"><div class="site-nav"><span class="s-logo">Nhà Xe Năng Động</span><span class="s-links">Tuyến · Đặt xe · Liên hệ</span></div><div class="site-hero"><h4>Đặt xe ghép nhanh, an toàn, đúng giờ</h4><p>Tuyến phổ biến khắp miền Bắc</p><span class="s-cta">Tìm chuyến ngay</span></div><div class="site-search"><span class="si">📍 Điểm đi → Điểm đến</span><span class="sb">Tìm</span></div></div>
          <div class="open-hint"><span><svg class="ic"><use href="#i-eye"/></svg> Xem mẫu này</span></div>
        </div>
        <div class="tpl-meta"><div><h3>Mẫu Năng Động <span class="tpl-tag tag-free">Free</span></h3><p>Phong cách trẻ trung, gradient xanh – cam đặc trưng MKT.</p></div><button class="tpl-btn" data-tpl="tpl1">Xem mẫu</button></div>
      </div>
      <div class="tpl-card reveal">
        <div class="tpl-prev" data-tpl="tpl2">
          <div class="site tpl2"><div class="site-nav"><span class="s-logo">Xanh Express</span><span class="s-links">Tuyến · Đặt xe · Liên hệ</span></div><div class="site-hero"><h4>Di chuyển hiện đại, kết nối tức thì</h4><p>Công nghệ đặt xe thông minh</p><span class="s-cta">Bắt đầu</span></div><div class="site-search"><span class="si">📍 Điểm đi → Điểm đến</span><span class="sb">Tìm</span></div></div>
          <div class="open-hint"><span><svg class="ic"><use href="#i-eye"/></svg> Xem mẫu này</span></div>
        </div>
        <div class="tpl-meta"><div><h3>Mẫu Hiện Đại <span class="tpl-tag tag-pro">Pro</span></h3><p>Tông tối sang trọng, điểm nhấn xanh ngọc công nghệ.</p></div><button class="tpl-btn" data-tpl="tpl2">Xem mẫu</button></div>
      </div>
      <div class="tpl-card reveal">
        <div class="tpl-prev" data-tpl="tpl3">
          <div class="site tpl3"><div class="site-nav"><span class="s-logo">Hoàng Gia Limousine</span><span class="s-links">Tuyến · Đặt xe · Liên hệ</span></div><div class="site-hero"><h4>Trải nghiệm di chuyển đẳng cấp</h4><p>Dịch vụ xe ghép cao cấp</p><span class="s-cta">Đặt chỗ VIP</span></div><div class="site-search"><span class="si">📍 Điểm đi → Điểm đến</span><span class="sb">Tìm</span></div></div>
          <div class="open-hint"><span><svg class="ic"><use href="#i-eye"/></svg> Xem mẫu này</span></div>
        </div>
        <div class="tpl-meta"><div><h3>Mẫu Cao Cấp <span class="tpl-tag tag-pro">Pro</span></h3><p>Navy – vàng gold sang trọng, hợp xe limousine/VIP.</p></div><button class="tpl-btn" data-tpl="tpl3">Xem mẫu</button></div>
      </div>
      <div class="tpl-card reveal">
        <div class="tpl-prev" data-tpl="tpl4">
          <div class="site tpl4"><div class="site-nav"><span class="s-logo">Quê Hương Xe Ghép</span><span class="s-links">Tuyến · Đặt xe · Liên hệ</span></div><div class="site-hero"><h4>Về nhà thật gần, thật vui</h4><p>Xe ghép thân thiện, giá tốt</p><span class="s-cta">Tìm chuyến</span></div><div class="site-search"><span class="si">📍 Điểm đi → Điểm đến</span><span class="sb">Tìm</span></div></div>
          <div class="open-hint"><span><svg class="ic"><use href="#i-eye"/></svg> Xem mẫu này</span></div>
        </div>
        <div class="tpl-meta"><div><h3>Mẫu Tươi Sáng <span class="tpl-tag tag-pro">Pro</span></h3><p>Nền sáng, bo tròn thân thiện, tông xanh ngọc – cam san hô.</p></div><button class="tpl-btn" data-tpl="tpl4">Xem mẫu</button></div>
      </div>
    </div>
  </div>
</section>

<section class="sec" id="tinh-nang">
  <div class="container">
    <div class="sec-head reveal"><span class="eyebrow">Tính năng nổi bật</span><h2>Mọi thứ cần để vận hành nhà xe ghép – gói gọn trong một website</h2></div>
    <div class="feat-grid">
      <div class="feat reveal"><span class="tile tile-blue"><svg class="ic"><use href="#i-route"/></svg></span><h3>Quản lý chuyến &amp; ghế</h3><p>Gán tài xế, đặt giá, số ghế, giờ khởi hành. Không còn trùng ghế, sót chuyến hay nhầm lịch.</p></div>
      <div class="feat reveal"><span class="tile tile-blue"><svg class="ic"><use href="#i-badge"/></svg></span><h3>Xác thực tài xế (KYC)</h3><p>Tài xế đăng ký, nộp giấy tờ, bạn duyệt hồ sơ — an toàn và minh bạch cho cả khách lẫn nhà xe.</p></div>
      <div class="feat reveal"><span class="tile tile-blue"><svg class="ic"><use href="#i-wallet"/></svg></span><h3>Tự tính hoa hồng 12%</h3><p>Hệ thống tự tính hoa hồng trên máy chủ cho từng giao dịch — bạn nắm rõ doanh thu, không tính tay.</p></div>
      <div class="feat reveal"><span class="tile tile-blue"><svg class="ic"><use href="#i-bell"/></svg></span><h3>Báo lead qua Telegram</h3><p>Có khách đặt xe là báo ngay về điện thoại. Phản hồi nhanh, không bỏ lỡ một đơn nào.</p></div>
      <div class="feat reveal"><span class="tile tile-blue"><svg class="ic"><use href="#i-search"/></svg></span><h3>Chuẩn SEO lên Google</h3><p>Tích hợp SEO, GA4, Search Console — khách tìm "xe ghép tuyến của bạn" trên Google là thấy ngay.</p></div>
      <div class="feat reveal"><span class="tile tile-blue"><svg class="ic"><use href="#i-ticket"/></svg></span><h3>Mã giảm giá &amp; khuyến mãi</h3><p>Tạo mã ưu đãi giữ chân khách quen, kích cầu mùa thấp điểm, tăng tỉ lệ quay lại.</p></div>
    </div>
  </div>
</section>

<section class="sec sec-light">
  <div class="container">
    <div class="sec-head reveal"><span class="eyebrow">Khách hàng nói gì</span><h2>Nhà xe ghép đã chuyên nghiệp hơn nhờ website riêng</h2></div>
    <div class="test-grid">
      <div class="test reveal"><div class="stars">★★★★★</div><p>"Trước đây tôi đăng chuyến tay trên Zalo cả buổi tối. Giờ khách tự vào web đặt, sáng dậy đã có lịch đầy."</p><div class="who"><div class="av">T</div><div><b>Anh Thành</b><small>Nhà xe ghép Hà Nội – Yên Bái</small></div></div></div>
      <div class="test reveal"><div class="stars">★★★★★</div><p>"Có website riêng nên khách tin hơn hẳn. Tài xế cũng tự nhận chuyến, tôi đỡ phải gọi điện sắp xếp."</p><div class="who"><div class="av">H</div><div><b>Chị Hương</b><small>Chủ xe tuyến Lào Cai</small></div></div></div>
      <div class="test reveal"><div class="stars">★★★★★</div><p>"Dựng xong trong buổi chiều, không cần thuê ai. Báo cáo hoa hồng rõ ràng nên không còn lăn tăn tiền nong."</p><div class="who"><div class="av">D</div><div><b>Anh Dũng</b><small>Nhà xe ghép Phú Thọ</small></div></div></div>
    </div>
  </div>
</section>

<section class="sec" id="bang-gia">
  <div class="container">
    <div class="sec-head reveal"><span class="eyebrow">Bảng giá</span><h2>Bắt đầu miễn phí – nâng cấp khi cần phát triển</h2><p>Gói Free đủ tốt để bạn vận hành thật. Khi việc kinh doanh tăng trưởng, nâng cấp Pro để mở khóa toàn bộ sức mạnh.</p></div>
    <div class="price-grid">
      <div class="price reveal">
        <h3>Gói Free</h3><p class="desc">Tặng kèm khi dùng MKT Software. Đủ để lên sóng kinh doanh ngay.</p>
        <div class="amt"><span class="free">Miễn phí</span></div><div class="year">Tặng kèm MKT Software</div>
        <ul><li>Website trên tên miền phụ MKT</li><li>1 giao diện mặc định</li><li>Quản lý tuyến / tài xế (có giới hạn)</li><li>Nhận đặt chỗ qua lead Telegram</li><li>SEO cơ bản</li><li class="off">Tên miền riêng</li><li class="off">Gỡ dòng "Powered by MKT"</li><li class="off">Báo cáo chi tiết, mã giảm giá</li></ul>
        <a href="#dang-ky" class="btn btn-outline">Nhận miễn phí</a>
      </div>
      <div class="price reco reveal">
        <span class="pop"><svg class="ic"><use href="#i-star"/></svg> Phổ biến nhất</span>
        <h3>Gói Pro</h3><p class="desc">Mở khóa toàn bộ để xây dựng thương hiệu nhà xe chuyên nghiệp.</p>
        <div class="amt">299.000<small>đ/tháng</small></div><div class="year">Hoặc 2.990.000đ/năm – tiết kiệm 2 tháng</div>
        <ul><li>Tên miền riêng của bạn</li><li>Gỡ hoàn toàn "Powered by MKT"</li><li>Chọn 1 trong 3 giao diện, đổi tùy ý</li><li>Không giới hạn tuyến &amp; tài xế</li><li>Cổng tài xế tự phục vụ</li><li>Mã giảm giá &amp; khuyến mãi</li><li>Báo cáo chi tiết theo tài xế/tuyến + xuất CSV</li><li>SEO / GA4 / Search Console đầy đủ</li></ul>
        <a href="#dang-ky" class="btn btn-primary">Nâng cấp Pro</a>
      </div>
    </div>
    <p style="text-align:center;color:var(--ink-faint);font-size:13.5px;margin-top:24px;font-weight:500">* Giá tham khảo, có thể điều chỉnh theo từng thời điểm. Trả năm để khóa ưu đãi tốt nhất.</p>
  </div>
</section>

<section class="funnel">
  <div class="funnel-inner">
    <h2>Website này được tặng kèm khi bạn dùng MKT Software</h2>
    <p>MKT Software giúp bạn tìm khách, chạy marketing đa kênh và bán hàng tự động. Mua MKT Software – nhận ngay website xe ghép thương hiệu riêng hoàn toàn miễn phí.</p>
    <a href="https://phanmemmkt.vn" target="_blank" rel="noopener" class="btn btn-white">Tìm hiểu MKT Software <svg class="ic"><use href="#i-arrow"/></svg></a>
  </div>
</section>

<section class="sec sec-light" id="cau-hoi">
  <div class="container">
    <div class="sec-head reveal"><span class="eyebrow">Câu hỏi thường gặp</span><h2>Bạn còn băn khoăn điều gì?</h2></div>
    <div class="faq">
      <div class="faq-item"><div class="faq-q">Tôi có cần biết kỹ thuật để dùng không? <span class="arr"><svg class="ic"><use href="#i-plus"/></svg></span></div><div class="faq-a"><p>Hoàn toàn không. Bạn chỉ cần đăng nhập, làm theo trình hướng dẫn nhập tên thương hiệu, logo, vài tuyến phổ biến là website chạy ngay — trong dưới 10 phút.</p></div></div>
      <div class="faq-item"><div class="faq-q">Website có miễn phí thật không? <span class="arr"><svg class="ic"><use href="#i-plus"/></svg></span></div><div class="faq-a"><p>Có. Gói Free được tặng kèm khi bạn dùng MKT Software và đủ để vận hành kinh doanh thật. Bạn chỉ trả phí khi muốn nâng cấp lên Pro để có tên miền riêng và các tính năng nâng cao.</p></div></div>
      <div class="faq-item"><div class="faq-q">Dữ liệu khách hàng có phải của riêng tôi không? <span class="arr"><svg class="ic"><use href="#i-plus"/></svg></span></div><div class="faq-a"><p>Đúng vậy. Mỗi nhà xe có không gian dữ liệu tách biệt hoàn toàn. Tuyến, tài xế, đơn đặt chỗ, khách hàng đều là tài sản riêng của bạn, không chia sẻ với nhà xe khác.</p></div></div>
      <div class="faq-item"><div class="faq-q">Nâng cấp Pro thì có mất dữ liệu đang có không? <span class="arr"><svg class="ic"><use href="#i-plus"/></svg></span></div><div class="faq-a"><p>Không. Khi đổi giao diện hay nâng cấp gói, toàn bộ nội dung — tuyến, tài xế, tin tức, banner — đều giữ nguyên. Nội dung tách riêng khỏi giao diện hiển thị.</p></div></div>
      <div class="faq-item"><div class="faq-q">Khác gì so với app đặt xe trung gian? <span class="arr"><svg class="ic"><use href="#i-plus"/></svg></span></div><div class="faq-a"><p>Đây là website mang thương hiệu riêng của bạn, không phải app của bên thứ ba. Bạn sở hữu khách hàng, kiểm soát giá và hoa hồng, không phải chia phần trăm cao cho nền tảng trung gian.</p></div></div>
      <div class="faq-item"><div class="faq-q">Tôi được hỗ trợ thế nào khi mới bắt đầu? <span class="arr"><svg class="ic"><use href="#i-plus"/></svg></span></div><div class="faq-a"><p>Đội ngũ MKT hỗ trợ bạn từ lúc khởi tạo website đến khi lên sóng. Để lại thông tin bên dưới, chúng tôi sẽ liên hệ và đồng hành cùng bạn.</p></div></div>
    </div>
  </div>
</section>

<section class="final" id="dang-ky">
  <div class="dot-grid"></div><div class="blob blob1" style="opacity:.24"></div>
  <div class="container">
    <h2>Sẵn sàng có website xe ghép <span class="gold">thương hiệu riêng?</span></h2>
    <p>Để lại thông tin – đội ngũ MKT liên hệ và dựng website miễn phí cho bạn.</p>
    <div class="lead-form">
      <input type="text" id="f-name" placeholder="Họ và tên của bạn" required>
      <input type="tel" id="f-phone" placeholder="Số điện thoại / Zalo" required>
      <input type="text" id="f-route" placeholder="Tuyến xe bạn đang chạy (ví dụ: Hà Nội → Yên Bái)">
      <button class="btn btn-primary cta-pulse" id="leadBtn">Nhận website miễn phí ngay <svg class="ic"><use href="#i-arrow"/></svg></button>
      <p class="form-note" id="formNote">🔒 Thông tin của bạn được bảo mật. Chúng tôi liên hệ trong vòng 24 giờ.</p>
    </div>
    <p class="guarantee">
      <span><svg class="ic"><use href="#i-check"/></svg> Miễn phí khi dùng MKT Software</span>
      <span><svg class="ic"><use href="#i-zap"/></svg> Dựng xong dưới 10 phút</span>
      <span><svg class="ic"><use href="#i-shield"/></svg> Không cần kỹ thuật</span>
    </p>
  </div>
</section>

<footer>
  <div class="container">
    <div class="foot-grid">
      <div class="foot-brand">
        <a href="#" class="logo"><span class="wm"><b>XEGHEP<span class="dot" style="color:var(--gold)">.INFO</span></b><small style="color:rgba(255,255,255,.6)">Sản phẩm của MKT Software</small></span></a>
        <p>Nền tảng website xe ghép thương hiệu riêng – sản phẩm của MKT Software, đồng hành cùng nhà xe Việt chuyển đổi số.</p>
        <div class="foot-socials">
          <span class="bub" style="background:var(--fb)"><img src="https://cdn.simpleicons.org/facebook/ffffff" alt="Facebook"></span>
          <span class="bub" style="background:var(--zalo)"><img src="https://cdn.simpleicons.org/zalo/ffffff" alt="Zalo"></span>
          <span class="bub" style="background:var(--youtube)"><img src="https://cdn.simpleicons.org/youtube/ffffff" alt="YouTube"></span>
          <span class="bub" style="background:#000"><img src="https://cdn.simpleicons.org/tiktok/ffffff" alt="TikTok"></span>
        </div>
      </div>
      <div><h4>Liên hệ</h4><p>Hotline: 0941 113 119</p><p>Email: phanmemmkt.vn@gmail.com</p><a href="https://phanmemmkt.vn" target="_blank" rel="noopener">phanmemmkt.vn</a><a href="https://mktsoftware.vn" target="_blank" rel="noopener">mktsoftware.vn</a></div>
      <div><h4>Liên kết</h4><a href="#tinh-nang">Tính năng</a><a href="#bang-gia">Bảng giá</a><a href="#cau-hoi">Câu hỏi thường gặp</a><a href="#dang-ky">Nhận website miễn phí</a></div>
    </div>
    <div class="foot-bot"><span>© 2026 MKT Software. Tất cả quyền được bảo lưu.</span><span>Bảo hành trọn đời · Hỗ trợ 24/7 · Cập nhật miễn phí</span></div>
  </div>
</footer>

<div class="float-cta"><a href="#dang-ky" class="btn btn-primary">Nhận website miễn phí <svg class="ic"><use href="#i-arrow"/></svg></a></div>

<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="i-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></symbol>
  <symbol id="i-eye" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></symbol>
  <symbol id="i-zap" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></symbol>
  <symbol id="i-rocket" viewBox="0 0 24 24"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></symbol>
  <symbol id="i-edit" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></symbol>
  <symbol id="i-phone-off" viewBox="0 0 24 24"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></symbol>
  <symbol id="i-store" viewBox="0 0 24 24"><path d="M3 9l1-5h16l1 5"/><path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M9 21v-6h6v6"/></symbol>
  <symbol id="i-trend-down" viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></symbol>
  <symbol id="i-users" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></symbol>
  <symbol id="i-car" viewBox="0 0 24 24"><path d="M5 17H3v-5l2-5h12l2 5v5h-2"/><path d="M5 12h14"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/></symbol>
  <symbol id="i-chart" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></symbol>
  <symbol id="i-route" viewBox="0 0 24 24"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></symbol>
  <symbol id="i-badge" viewBox="0 0 24 24"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z"/><polyline points="9 12 11 14 15 10"/></symbol>
  <symbol id="i-wallet" viewBox="0 0 24 24"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></symbol>
  <symbol id="i-bell" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></symbol>
  <symbol id="i-ticket" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="13" y1="5" x2="13" y2="19"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>
  <symbol id="i-x" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></symbol>
</defs></svg>

<div class="mkt-modal" id="tplModal">
  <div class="modal-box">
    <div class="modal-bar"><span class="d d1"></span><span class="d d2"></span><span class="d d3"></span><span class="url" id="mUrl">xeghep-cuaban.vn</span><button class="close" id="mClose" aria-label="Đóng"><svg class="ic"><use href="#i-x"/></svg></button></div>
    <div class="modal-scroll" id="mBody"></div>
    <div class="modal-foot"><div class="mf-name" id="mName">Mẫu giao diện<small id="mDesc"></small></div><a href="#dang-ky" class="btn btn-primary" id="mUse">Dùng mẫu này <svg class="ic"><use href="#i-arrow"/></svg></a></div>
  </div>
</div>
`;

export default function PlatformLanding() {
  useEffect(() => {
    const root = document.getElementById('mkt-landing');
    if (!root) return;
    const cleanups: Array<() => void> = [];

    // Sticky header
    const header = root.querySelector('#hdr');
    const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    onScroll();
    cleanups.push(() => window.removeEventListener('scroll', onScroll));

    // Mobile menu
    const ham = root.querySelector('#hamburger');
    const navLinks = root.querySelector('#navLinks');
    const toggleMenu = () => navLinks?.classList.toggle('open');
    ham?.addEventListener('click', toggleMenu);
    navLinks?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => navLinks.classList.remove('open')));

    // FAQ accordion
    root.querySelectorAll('.faq-item').forEach((item) => {
      const q = item.querySelector('.faq-q');
      q?.addEventListener('click', () => {
        const wasOpen = item.classList.contains('open');
        root.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });

    // Reveal on scroll
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    root.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    cleanups.push(() => obs.disconnect());

    // Counters
    const cObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = Number(el.dataset.target || '0');
        const suffix = el.dataset.suffix || '';
        let cur = 0;
        const step = Math.max(1, target / 40);
        const tick = () => { cur += step; if (cur >= target) { el.textContent = target + suffix; } else { el.textContent = Math.floor(cur) + suffix; requestAnimationFrame(tick); } };
        tick();
        cObs.unobserve(el);
      }),
      { threshold: 0.5 }
    );
    root.querySelectorAll('.count-up').forEach((c) => cObs.observe(c));
    cleanups.push(() => cObs.disconnect());

    // Lead form (demo). TODO: gửi {name,phone,route} về Telegram/CRM của MKT.
    const leadBtn = root.querySelector('#leadBtn');
    leadBtn?.addEventListener('click', () => {
      const name = (root.querySelector('#f-name') as HTMLInputElement)?.value.trim();
      const phone = (root.querySelector('#f-phone') as HTMLInputElement)?.value.trim();
      const note = root.querySelector('#formNote') as HTMLElement;
      if (!note) return;
      if (!name || !phone) { note.textContent = '⚠️ Vui lòng nhập họ tên và số điện thoại.'; note.style.color = '#FFD700'; return; }
      note.textContent = '✅ Cảm ơn ' + name + '! Chúng tôi sẽ liên hệ với bạn sớm nhất.';
      note.style.color = '#7CFC9A';
    });

    // Modal xem mẫu
    type Tpl = { name: string; tag: string; desc: string; logo: string; h: string; p: string; cta: string };
    const TPL: Record<string, Tpl> = {
      tpl1: { name: 'Mẫu Năng Động', tag: 'Free', desc: 'Phong cách trẻ trung, gradient xanh – cam đặc trưng MKT.', logo: 'Nhà Xe Năng Động', h: 'Đặt xe ghép nhanh, an toàn, đúng giờ', p: 'Tuyến phổ biến khắp miền Bắc', cta: 'Tìm chuyến ngay' },
      tpl2: { name: 'Mẫu Hiện Đại', tag: 'Pro', desc: 'Tông tối sang trọng, điểm nhấn xanh ngọc công nghệ.', logo: 'Xanh Express', h: 'Di chuyển hiện đại, kết nối tức thì', p: 'Công nghệ đặt xe thông minh', cta: 'Bắt đầu' },
      tpl3: { name: 'Mẫu Cao Cấp', tag: 'Pro', desc: 'Navy – vàng gold sang trọng, hợp xe limousine/VIP.', logo: 'Hoàng Gia Limousine', h: 'Trải nghiệm di chuyển đẳng cấp', p: 'Dịch vụ xe ghép cao cấp', cta: 'Đặt chỗ VIP' },
      tpl4: { name: 'Mẫu Tươi Sáng', tag: 'Pro', desc: 'Nền sáng, bo tròn thân thiện, tông xanh ngọc – cam san hô.', logo: 'Quê Hương Xe Ghép', h: 'Về nhà thật gần, thật vui', p: 'Xe ghép thân thiện, giá tốt', cta: 'Tìm chuyến' },
    };
    const modal = root.querySelector('#tplModal');
    const mBody = root.querySelector('#mBody');
    const mName = root.querySelector('#mName');
    const mDesc = root.querySelector('#mDesc');
    const mUrl = root.querySelector('#mUrl');

    const openTpl = (id: string) => {
      const t = TPL[id];
      if (!t || !modal || !mBody) return;
      if (mName && mName.childNodes[0]) mName.childNodes[0].nodeValue = t.name + ' ';
      if (mDesc) mDesc.textContent = (t.tag === 'Free' ? 'Gói Free · ' : 'Gói Pro · ') + t.desc;
      if (mUrl) mUrl.textContent = t.logo.toLowerCase().normalize('NFD').replace(/[^a-z]+/g, '') + '.vn';
      mBody.innerHTML =
        '<div class="site tpl-full ' + id + '">' +
        '<div class="site-nav"><span class="s-logo">' + t.logo + '</span><span class="s-links">Trang chủ · Tuyến xe · Đặt chỗ · Tin tức · Liên hệ</span></div>' +
        '<div class="site-hero"><h4>' + t.h + '</h4><p>' + t.p + '</p><span class="s-cta">' + t.cta + '</span></div>' +
        '<div class="site-search"><span class="si">📍 Điểm đi → Điểm đến · Ngày đi</span><span class="sb">Tìm chuyến</span></div>' +
        '<div class="tf-routes">' +
        '<div class="rt"><span><b>Hà Nội → Yên Bái</b><small>07:00 · còn 3 ghế</small></span><span class="p">180.000đ</span></div>' +
        '<div class="rt"><span><b>Yên Bái → Hà Nội</b><small>13:30 · còn 2 ghế</small></span><span class="p">180.000đ</span></div>' +
        '<div class="rt"><span><b>Hà Nội → Lào Cai</b><small>20:00 · còn 5 ghế</small></span><span class="p">250.000đ</span></div>' +
        '</div>' +
        '<div class="tf-feats">' +
        '<div class="ff"><svg class="ic" style="stroke:var(--s-acc)"><use href="#i-badge"/></svg><div>Tài xế xác thực</div></div>' +
        '<div class="ff"><svg class="ic" style="stroke:var(--s-acc)"><use href="#i-clock"/></svg><div>Đặt chỗ 24/7</div></div>' +
        '<div class="ff"><svg class="ic" style="stroke:var(--s-acc)"><use href="#i-star"/></svg><div>Đánh giá thật</div></div>' +
        '</div></div>';
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    };
    const closeTpl = () => { modal?.classList.remove('show'); document.body.style.overflow = ''; };

    root.querySelectorAll('[data-tpl]').forEach((el) => {
      el.addEventListener('click', () => openTpl((el as HTMLElement).dataset.tpl || ''));
    });
    root.querySelector('#mClose')?.addEventListener('click', closeTpl);
    root.querySelector('#mUse')?.addEventListener('click', closeTpl);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeTpl(); });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTpl(); };
    document.addEventListener('keydown', onKey);
    cleanups.push(() => document.removeEventListener('keydown', onKey));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div id="mkt-landing" dangerouslySetInnerHTML={{ __html: BODY }} />
    </>
  );
}
