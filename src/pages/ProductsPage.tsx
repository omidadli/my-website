import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Lock, MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { IconBadge3D } from '../components/3D/3DIconBadge';
import { PageHero } from '../components/nd/Kit';
import { ToolChatModal } from '../components/tools/ToolChatModal';
import { AI_TOOLS, AiToolMeta } from '../data/tools';
import { startingPrice, resolveFreeTrial } from '../../lib/toolPlans';
import { Page, Theme } from '../types';

const toPersianDigits = (n: number | string) => String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

interface ProductsPageProps {
  theme?: Theme;
  onNavigate: (page: Page) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ theme = 'dark', onNavigate }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const pageData = data.PRODUCTS_PAGE_DATA;
  const cfg = data.AI_TOOLS_CONFIG;
  const [active, setActive] = useState<AiToolMeta | null>(null);

  const visibleTools = AI_TOOLS.filter((t) => cfg?.tools?.[t.id]?.enabled !== false);
  const freeTrial = resolveFreeTrial(data);

  return (
    <div className="space-y-14 py-4">
      <PageHero
        theme={theme}
        page="products"
        title={pageData.headline}
        subtitle={pageData.subheadline}
        badge={pageData.badge}
        onNavigate={onNavigate}
      />

      {cfg?.enabled === false || visibleTools.length === 0 ? (
        <section className="nd-card p-10 text-center space-y-3">
          <Sparkles className="w-8 h-8 mx-auto text-[color:var(--nd-accent)]" />
          <h2 className={`nd-h2 text-lg ${isDark ? 'text-white' : ''}`}>ابزارهای هوشمند به‌زودی</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'nd-muted'}`}>این بخش موقتاً در دسترس نیست. برای اطلاع از زمان راه‌اندازی با ما در تماس باش.</p>
          <button onClick={() => onNavigate('contact')} className="nd-btn nd-btn-accent px-6 py-3 text-sm mx-auto"><span>تماس با ما</span><ArrowLeft className="w-4 h-4" /></button>
        </section>
      ) : (
        <>
          {/* Value strip */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Sparkles, title: 'دستیارهای هوشمند', desc: 'هر ابزار یک هوش مصنوعیِ متخصص با شخصیت و مأموریتِ مشخص است.' },
              { icon: MessageCircle, title: 'گفتگوی واقعی', desc: 'همین‌جا در سایت چت می‌کنی؛ پاسخ‌ها فارسی، دقیق و کاربردی‌اند.' },
              { icon: ShieldCheck, title: 'دسترسی امن و شخصی', desc: 'دسترسی به شماره‌ی تو گره می‌خورد و روی دستگاه‌های محدود فعال می‌شود.' },
            ].map((f, i) => (
              <div key={i} className="nd-card p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8b5cf6] via-[#4c8dff] to-[#5ce1e6] flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className={`text-sm font-black ${isDark ? 'text-white' : ''}`}>{f.title}</h3>
                  <p className={`text-[12px] leading-relaxed ${isDark ? 'text-slate-400' : 'nd-muted'}`}>{f.desc}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Tools grid */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[color:var(--nd-accent)]" />
              <h2 className={`nd-h2 text-lg sm:text-xl ${isDark ? 'text-white' : ''}`}>ابزارهای هوش مصنوعی</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleTools.map((tool) => (
                <div key={tool.id} className="nd-card nd-card-hover p-7 sm:p-8 flex flex-col gap-5 h-full">
                  <div className="flex items-center justify-between">
                    <IconBadge3D iconName={tool.iconName} theme={theme} size="md" glowColor={tool.glow} floating={false} />
                    <span className="nd-chip flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {tool.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className={`nd-h2 text-lg sm:text-xl ${isDark ? 'text-white' : ''}`}>{tool.name}</h3>
                    <p className={`text-[13px] font-bold ${isDark ? 'text-slate-300' : 'text-[color:var(--nd-ink-2)]'}`}>{tool.tagline}</p>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'nd-muted'}`}>{tool.description}</p>
                  </div>

                  {/* How it works */}
                  <div className="flex flex-col gap-2">
                    {tool.how.map((step, si) => (
                      <div key={si} className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[color:var(--nd-accent)]/15 text-[color:var(--nd-accent)] text-[10px] font-black flex items-center justify-center shrink-0">{si + 1}</span>
                        <span className={`text-[12px] ${isDark ? 'text-slate-300' : 'text-[color:var(--nd-ink-2)]'}`}>{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className={`p-3.5 rounded-2xl border text-[12px] leading-relaxed ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-[color:var(--nd-bg-soft)] border-[color:var(--nd-line)] text-[color:var(--nd-ink-2)]'}`}>
                    <span className="text-[11px] font-extrabold text-[color:var(--nd-accent)] block mb-1">مناسب برای:</span>
                    {tool.audience}
                  </div>

                  <div className={`pt-4 mt-auto border-t space-y-3 ${isDark ? 'border-white/10' : 'border-[color:var(--nd-line)]'}`}>
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'nd-muted'}`}>شروع پلن‌ها از</span>
                        <span className={`text-base font-black ${isDark ? 'text-amber-300' : 'text-[#b45309]'}`}>{startingPrice(tool.id, data)}</span>
                      </div>
                      {freeTrial > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500">
                          <Sparkles className="w-3 h-3" /> {toPersianDigits(freeTrial)} پیام رایگان
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setActive(tool)}
                      className="nd-btn nd-btn-accent w-full py-3.5 text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{freeTrial > 0 ? 'رایگان امتحان کن' : 'شروع گفتگو'}</span>
                    </button>
                    <p className={`text-[10.5px] text-center flex items-center justify-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Lock className="w-3 h-3" /> بدون نیاز به کارت بانکی برای تست — پرداخت فقط برای ادامه
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How to buy band */}
          <section className="nd-card p-7 sm:p-9 space-y-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className={`nd-h2 text-lg ${isDark ? 'text-white' : ''}`}>چطور دسترسی بگیرم؟</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { n: '۱', t: 'پیام بده', d: 'در تلگرام، واتساپ یا بله برای ابزارِ موردنظرت پیام بفرست.' },
                { n: '۲', t: 'فیش را بفرست', d: 'فیش واریزی و شماره موبایلت را ارسال کن.' },
                { n: '۳', t: 'کد بگیر', d: 'دسترسی روی شماره‌ات باز و یک کد اختصاصی برایت ارسال می‌شود.' },
                { n: '۴', t: 'فعال کن', d: 'شماره و کد را داخل ابزار وارد کن تا همان‌جا فعال شود.' },
              ].map((s) => (
                <div key={s.n} className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-[color:var(--nd-bg-soft)] border-[color:var(--nd-line)]'}`}>
                  <div className="w-8 h-8 rounded-xl bg-[color:var(--nd-accent)] text-white font-black flex items-center justify-center mb-2">{s.n}</div>
                  <h4 className={`text-sm font-black mb-1 ${isDark ? 'text-white' : ''}`}>{s.t}</h4>
                  <p className={`text-[12px] leading-relaxed ${isDark ? 'text-slate-400' : 'nd-muted'}`}>{s.d}</p>
                </div>
              ))}
            </div>
            <p className={`text-[12px] leading-relaxed flex items-start gap-2 ${isDark ? 'text-slate-400' : 'nd-muted'}`}>
              <Lock className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              دسترسیِ هر خرید به شماره‌ی همان فرد گره می‌خورد و فقط روی تعداد محدودی دستگاه فعال می‌شود؛ بنابراین کد را نمی‌توان برای استفاده‌ی رایگانِ دیگران به اشتراک گذاشت.
            </p>
            <button onClick={() => onNavigate('contact')} className={`nd-btn w-full sm:w-auto py-3.5 px-6 text-sm ${isDark ? 'bg-white text-[#17171c] hover:bg-slate-200' : 'nd-btn-accent'}`}>
              <span>سوال دارم / تماس با پشتیبانی</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </section>
        </>
      )}

      {active && (
        <ToolChatModal
          tool={active}
          theme={theme}
          data={data}
          channels={cfg?.channels}
          purchaseNote={cfg?.purchaseNote}
          socialProof={cfg?.socialProof}
          urgency={cfg?.urgency}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
};
