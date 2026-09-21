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
    <section className="space-y-8 my-16">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-[#4c8dff]/20 border border-[#8b5cf6]/30 text-xs font-black text-[#8b5cf6]">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>سوالات متداول</span>
        </div>
        <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
          سوالاتی که ممکنه قبل از شروع داشته باشید
        </h2>
        <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          شفافیت در مدل کاری و انتظارات متقابل، کلید موفقیت همکاری‌های بلندمدت است.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                isDark 
                  ? isOpen ? 'bg-white/10 border-[#5ce1e6]/40 shadow-xl' : 'bg-white/5 border-white/10 hover:border-white/20' 
                  : isOpen ? 'bg-white border-indigo-300 shadow-md' : 'bg-white/80 border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                onClick={() => toggleIndex(index)}
                className="w-full p-6 text-right flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#8b5cf6]/20 text-[#8b5cf6]">
                    {faq.category}
                  </span>
                  <h3 className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                    {faq.question}
                  </h3>
                </div>

                <div className={`p-2 rounded-full transition-transform duration-300 ${
                  isOpen ? 'rotate-180 bg-[#5ce1e6]/20 text-[#5ce1e6]' : 'text-slate-400'
                }`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 text-xs sm:text-sm leading-relaxed text-slate-300 border-t border-white/10 pt-4">
                  <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
