import React, { useState } from 'react';
import { Theme } from '../types';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

interface FAQSectionProps {
  theme: Theme;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'شرایط همکاری',
    question: 'حداقل بودجه‌ی تبلیغاتی ماهانه برای شروع همکاری چقدره؟',
    answer: 'برای اینکه بشه نتیجه‌ی تبلیغات رو درست سنجید و بهینه کرد، بودجه‌ی پیشنهادی حداقل ۲۵ میلیون تومان ماهانه است. برای مشاوره‌ی استراتژیک، بررسی سایت یا شروع از صفر (طراحی سایت، محتوا) هیچ محدودیت بودجه‌ای وجود نداره.'
  },
  {
    category: 'نحوه‌ی گزارش‌دهی',
    question: 'گزارش‌دهی و نتایج رو چطور می‌بینم؟',
    answer: 'همه‌چیز رو در یک داشبورد ساده و زنده می‌بینید — هر لحظه بخواید می‌تونید هزینه، بازدید و فروش رو چک کنید. علاوه بر این، هر هفته یا هر دو هفته یک جلسه‌ی کوتاه هم داریم تا نتیجه‌ها رو با هم مرور کنیم.'
  },
  {
    category: 'محرمانگی و قرارداد',
    question: 'اطلاعات کسب‌وکارم محرمانه می‌مونه؟',
    answer: 'بله، صد در صد. قبل از شروع هر همکاری‌ای، یک قرارداد رسمی می‌بندیم که تضمین می‌کنه اطلاعات فروش و مشتری‌های شما محرمانه بمونه.'
  },
  {
    category: 'نرخ تبدیل و CRO',
    question: 'افزایش نرخ خرید سایت (CRO) چقدر طول می‌کشه تا نتیجه بده؟',
    answer: 'معمولاً همون ۲ تا ۳ هفته‌ی اول، اولین بهبودها قابل مشاهده‌ست. برای نتیجه‌ی کامل‌تر، بسته به میزان بازدید سایتتون، بین ۱ تا ۳ ماه زمان می‌بره.'
  },
  {
    category: 'ترکینگ و تحلیل داده',
    question: 'اگه سایتم درست تحلیل رفتار کاربر رو ثبت نکنه چی می‌شه؟',
    answer: 'قبل از هر اقدامی، اول مطمئن می‌شم داده‌های سایتتون درست و دقیق ثبت می‌شن — تا مطمئن بشیم حتی یک تومان از بودجه‌تون بدون این‌که بدونیم نتیجه‌ش چی شده، خرج نمی‌شه.'
  }
];

export const FAQSection: React.FC<FAQSectionProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="space-y-8 my-4">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className={isDark ? 'nd-glass-dark inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold text-indigo-200' : 'nd-eyebrow inline-flex'}>
          <HelpCircle className="w-3.5 h-3.5" />
          <span>سوالات متداول</span>
        </span>
        <h2 className={`nd-h2 text-xl sm:text-3xl leading-tight ${isDark ? 'text-white' : ''}`}>
          سوالاتی که ممکنه قبل از شروع داشته باشید
        </h2>
        <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'nd-muted'}`}>
          شفافیت در مدل کاری و انتظارات متقابل، کلید موفقیت همکاری‌های بلندمدت است.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`nd-card overflow-hidden transition-all duration-300 ${isOpen ? (isDark ? 'shadow-2xl' : 'shadow-xl') : ''}`}
            >
              <button
                onClick={() => toggleIndex(index)}
                aria-expanded={isOpen}
                className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className={`nd-chip shrink-0 text-[10px] ${isOpen ? 'bg-[color:var(--nd-accent-soft)] text-[color:var(--nd-accent)] border-transparent' : ''}`}>
                    {faq.category}
                  </span>
                  <h3 className={`font-extrabold text-sm sm:text-base ${isDark ? 'text-white' : ''}`}>
                    {faq.question}
                  </h3>
                </span>
                <span
                  className={`p-2 rounded-full transition-transform duration-300 shrink-0 ${
                    isOpen ? 'rotate-180 bg-[color:var(--nd-accent)] text-white' : isDark ? 'text-slate-400 bg-white/5' : 'text-[color:var(--nd-muted)] bg-[color:var(--nd-bg-soft)]'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className={`px-6 pb-6 pt-1 border-t text-xs sm:text-sm leading-relaxed ${isDark ? 'border-white/10 text-slate-300' : 'border-[color:var(--nd-line)] nd-muted'}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
