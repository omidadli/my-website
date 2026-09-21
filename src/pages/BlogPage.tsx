import React, { useState } from 'react';
import { Theme, Page, BlogPost } from '../types';
import { useContent } from '../context/ContentContext';
import { EditableText } from '../components/cms/EditableText';
import { RepeaterControls } from '../components/cms/RepeaterControls';
import { IconBadge3D } from '../components/3D/3DIconBadge';
import { PageHeader } from '../components/PageHeader';
import { CinematicSection, CinematicStagger, CinematicItem } from '../components/motion/CinematicSection';
import { 
  Search, 
  Sparkles, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight,
  BookOpen, 
  Flame, 
  TrendingUp, 
  Mail, 
  CheckCircle2, 
  Layers,
  ArrowUpLeft,
  Eye
} from 'lucide-react';

interface BlogPageProps {
  theme: Theme;
  onNavigate: (page: Page) => void;
  onSelectPost: (postId: string) => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({ theme, onNavigate, onSelectPost }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const blogPosts = data.BLOG_POSTS || [];
  const blogPageData = data.BLOG_PAGE_DATA || {
    badge: 'مقالات و راهنماها',
    headline: 'نکته‌ها و راهنماهایی برای رشد فروشگاهتون',
    subheadline: 'از تجربه‌ی واقعی پروژه‌ها نوشته شده — ساده، عملی و بدون پیچیدگی‌های اضافه.',
    searchPlaceholder: 'جستجو در مقالات...',
    newsletterHeadline: 'عضویت در خبرنامه تخصصی رشد',
    newsletterSubheadline: 'نکته‌های عملی برای رشد فروشگاهتون، مستقیم توی ایمیلتون — بدون هیچ اصطلاح پیچیده‌ای.',
    newsletterPlaceholder: 'آدرس ایمیل شما...',
    newsletterCta: 'عضویت رایگان',
    newsletterSuccess: 'ایمیل شما با موفقیت ثبت شد. به‌زودی اولین ایمیل رو براتون می‌فرستم!'
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPath, setSelectedPath] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // 1. فیلتر بر اساس مسیر سه‌گانه
  const pathFilterOptions = [
    { key: 'All', label: 'همه مسیرها' },
    { key: 'start', label: 'شروع کنیم (راه‌اندازی)' },
    { key: 'sell', label: 'بهتر بفروشیم (CRO و تبلیغات)' },
    { key: 'grow', label: 'رشد کنیم (اسکیل و اتومیشن)' },
  ];

  // 2. فیلتر موضوعی
  const topicFilterOptions = [
    { key: 'All', label: 'همه موضوعات' },
    { key: 'طراحی وب و شروع آنلاین', label: 'طراحی و راه‌اندازی' },
    { key: 'پرفورمنس مارکتینگ', label: 'پرفورمنس مارکتینگ' },
    { key: 'بهینه‌سازی نرخ تبدیل', label: 'بهینه‌سازی نرخ تبدیل (CRO)' },
    { key: 'آنالیتیکس و ترکینگ', label: 'آنالیتیکس و ترکینگ' },
    { key: 'سئو و رشد ارگانیک', label: 'سئو و رشد ارگانیک' },
  ];

  // Featured popular post (Image 1 top right)
  const popularPost = blogPosts.find((p) => p.isPopular || p.featured) || blogPosts[0];
  
  // Recent posts list (Image 1 top left)
  const recentPosts = blogPosts.filter((p) => p.id !== popularPost?.id).slice(0, 4);

  // Filtered posts for grid
  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch = 
      !searchTerm ||
      (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (post.categoryFa && post.categoryFa.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPath = selectedPath === 'All' || post.pathCategory === selectedPath;
    const matchesTopic = selectedTopic === 'All' || post.categoryFa === selectedTopic;

    return matchesSearch && matchesPath && matchesTopic;
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 5000);
      setNewsletterEmail('');
    }
  };

  return (
    <div className="space-y-12 py-4">
      {/* 1. Page Header */}
      <PageHeader
        theme={theme}
        page="blog"
        title={blogPageData.headline}
        subtitle={blogPageData.subheadline}
        badgeText={blogPageData.badge}
        onNavigate={onNavigate}
      />

      {/* 2. Top Split Hero Grid (محبوب‌ترین مقاله + جدیدترین‌ها - مطابق تصویر ۱ و ۲) */}
      {!searchTerm && selectedPath === 'All' && selectedTopic === 'All' && popularPost && (
        <CinematicSection variant="fade-up" showGlowBeam glowColor="amber">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Right Side (7 Cols): Most Popular Article Hero Card */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <h2 className="text-base font-black text-white">محبوب‌ترین مقاله</h2>
              </div>

              <article
                onClick={() => onSelectPost(popularPost.id)}
                className="flex-1 p-6 sm:p-8 rounded-[36px] bg-[#120a38]/90 hover:bg-[#1a104c] border border-white/15 hover:border-amber-400/50 transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-2xl relative overflow-hidden"
              >
                {/* Top Banner Cover */}
                <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-[#0a0520] relative mb-6">
                  <img
                    src={popularPost.coverImage || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'}
                    alt={popularPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-lg">
                    {popularPost.categoryFa}
                  </div>
                </div>

                {/* Title & Excerpt */}
                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-400 transition-colors leading-snug">
                    {popularPost.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
                    {popularPost.excerpt}
                  </p>
                </div>

                {/* Card Meta Footer */}
                <div className="pt-6 border-t border-white/10 mt-6 flex flex-wrap items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">نویسنده: {popularPost.author || 'امید عدلی'}</span>
                    <span>•</span>
                    <span>{popularPost.readTime}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-bold group-hover:translate-x-[-4px] transition-transform">
                    <span>مطالعه مقاله</span>
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                </div>
              </article>
            </div>

            {/* Left Side (5 Cols): Recent Articles List (جدیدترین‌ها) */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#5ce1e6]" />
                  <h2 className="text-base font-black text-white">جدیدترین‌ها</h2>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between gap-3.5">
                {recentPosts.map((rec) => (
                  <article
                    key={rec.id}
                    onClick={() => onSelectPost(rec.id)}
                    className="p-4 sm:p-4.5 rounded-2xl bg-[#120a38]/80 hover:bg-[#1a104c] border border-white/10 hover:border-[#5ce1e6]/40 transition-all duration-200 cursor-pointer flex items-center gap-4 group shadow-md"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#0a0520] shrink-0 relative">
                      <img
                        src={rec.coverImage || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80'}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#5ce1e6]/15 text-[#5ce1e6] border border-[#5ce1e6]/30">
                          {rec.categoryFa}
                        </span>
                        <span className="text-[10px] text-slate-400">{rec.readTime}</span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#5ce1e6] transition-colors line-clamp-2 leading-snug">
                        {rec.title}
                      </h4>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </CinematicSection>
      )}

      {/* 3. Search & Category Filters */}
      <CinematicSection variant="fade-up" delay={0.05} className="space-y-6 pt-4">
        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative">
          <input
            type="text"
            placeholder={blogPageData.searchPlaceholder || "جستجو در مقالات..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full py-4 pr-12 pl-4 rounded-full text-xs font-bold border transition-all focus:outline-none ${
              isDark 
                ? 'bg-[#120a38] border-white/20 text-white placeholder-slate-400 focus:border-amber-400 shadow-xl' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 shadow-md'
            }`}
          />
          <Search className="w-5 h-5 text-amber-400 absolute top-1/2 right-4 -translate-y-1/2" />
        </div>

        {/* Pathway & Topic Filters */}
        <div className="space-y-3 max-w-4xl mx-auto">
          {/* Path Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className={`text-xs font-medium pl-2 hidden sm:inline-block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              مسیر یادگیری:
            </span>
            {pathFilterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedPath(opt.key)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedPath === opt.key
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-105'
                    : isDark 
                      ? 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10' 
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Topic Filters */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <span className={`text-xs font-medium pl-2 hidden sm:inline-block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              موضوع:
            </span>
            {topicFilterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedTopic(opt.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedTopic === opt.key
                    ? 'bg-[#5ce1e6] text-slate-950 font-black shadow-md'
                    : isDark 
                      ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CinematicSection>

      {/* 4. Section Title & All Articles Grid (Images 1, 2 Style) */}
      <CinematicSection variant="fade-up" delay={0.1} className="space-y-6 pt-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-black text-white">
              {selectedTopic !== 'All' 
                ? `مقالات بخش ${selectedTopic}` 
                : selectedPath !== 'All' 
                  ? `مقالات مسیر ${pathFilterOptions.find(p => p.key === selectedPath)?.label}`
                  : 'تمام مقالات و راهنماهای کاربردی'}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {filteredPosts.length} مقاله
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="p-12 rounded-3xl text-center border border-white/10 bg-[#120a38] max-w-xl mx-auto space-y-3">
            <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-bold text-sm text-slate-300">مقاله‌ای با این فیلترها پیدا نشد.</p>
            <button
              onClick={() => { setSelectedPath('All'); setSelectedTopic('All'); setSearchTerm(''); }}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              مشاهده همه‌ی مقالات
            </button>
          </div>
        ) : (
          <CinematicStagger staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredPosts.map((post, idx) => (
              <CinematicItem key={post.id || idx}>
                <article
                  onClick={() => onSelectPost(post.id)}
                  className="h-full p-6 rounded-[32px] bg-[#120a38]/80 hover:bg-[#1a104c] border border-white/10 hover:border-amber-400/40 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative shadow-xl overflow-hidden"
                >
                  <RepeaterControls arrayPath="BLOG_POSTS" index={idx} totalCount={blogPosts.length} className="absolute top-3 left-3 z-10" />

                  <div>
                    {/* Card Graphic/Cover Container */}
                    <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#0a0520] relative mb-5">
                      <img
                        src={post.coverImage || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-amber-300">
                        <EditableText path={`BLOG_POSTS.${idx}.categoryFa`}>{post.categoryFa}</EditableText>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-black mb-3 text-white group-hover:text-amber-400 transition-colors leading-snug line-clamp-2">
                      <EditableText path={`BLOG_POSTS.${idx}.title`}>{post.title}</EditableText>
                    </h3>

                    <p className="text-xs leading-relaxed mb-6 line-clamp-2 text-slate-300">
                      <EditableText path={`BLOG_POSTS.${idx}.excerpt`} multiline>{post.excerpt}</EditableText>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>{post.author || 'امید عدلی'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </article>
              </CinematicItem>
            ))}
          </CinematicStagger>
        )}
      </CinematicSection>

      {/* 5. Newsletter Section */}
      <CinematicSection
        variant="scale-up"
        delay={0.1}
        showGlowBeam
        glowColor="purple"
        className="relative max-w-3xl mx-auto pt-8"
      >
        <div className="p-8 sm:p-12 rounded-[36px] border border-white/20 bg-gradient-to-r from-[#1a1240] to-[#2d1b5e] text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center mx-auto text-slate-950 shadow-lg font-black">
            <Mail className="w-7 h-7" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-2xl font-black text-white">
              <EditableText 
                path="BLOG_PAGE_DATA.newsletterHeadline" 
                defaultValue={blogPageData.newsletterHeadline} 
                label="تیتر خبرنامه" 
              />
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
              <EditableText 
                path="BLOG_PAGE_DATA.newsletterSubheadline" 
                defaultValue={blogPageData.newsletterSubheadline} 
                label="زیرتیتر خبرنامه" 
                multiline
              />
            </p>
          </div>

          {newsletterSubscribed ? (
            <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2 max-w-md mx-auto">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{blogPageData.newsletterSuccess}</span>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder={blogPageData.newsletterPlaceholder || "آدرس ایمیل شما..."}
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 py-3.5 px-5 rounded-full text-xs font-bold border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-6 py-3.5 rounded-full text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shrink-0 cursor-pointer shadow-lg transition-all"
              >
                {blogPageData.newsletterCta || "عضویت رایگان"}
              </button>
            </form>
          )}
        </div>
      </CinematicSection>
    </div>
  );
};
