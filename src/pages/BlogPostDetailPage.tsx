import React, { useState, useEffect } from 'react';
import { Theme, Page, BlogPost, BlogComment } from '../types';
import { useContent } from '../context/ContentContext';
import { 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Calendar, 
  User, 
  Share2, 
  Bookmark, 
  Copy, 
  Check, 
  MessageSquare, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Lightbulb, 
  CheckCircle2, 
  Send, 
  ShieldCheck,
  BookOpen,
  Eye,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { IconBadge3D } from '../components/3D/3DIconBadge';

interface BlogPostDetailPageProps {
  theme: Theme;
  postId: string;
  onNavigate: (page: Page) => void;
  onSelectPost: (postId: string) => void;
}

export const BlogPostDetailPage: React.FC<BlogPostDetailPageProps> = ({
  theme,
  postId,
  onNavigate,
  onSelectPost,
}) => {
  const isDark = theme === 'dark';
  const { data, addBlogComment } = useContent();
  const blogPosts = data.BLOG_POSTS || [];
  
  // Find current post by id or fallback to first post
  const post = blogPosts.find((p) => p.id === postId) || blogPosts[0];

  // Reading progress state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTocOpen, setIsTocOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>('');

  // Comment form state
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isCaptchaChecked, setIsCaptchaChecked] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Related articles: posts from same category or different from current
  const relatedPosts = blogPosts
    .filter((p) => p.id !== post?.id)
    .slice(0, 3);

  // Comments for this post
  const postComments = (data.BLOG_COMMENTS || []).filter(
    (c) => c.postId === post?.id && c.isApproved
  );

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Copy URL action
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Submit comment handler
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentEmail.trim() || !commentText.trim()) {
      setCommentError('لطفاً تمام فیلدهای نام، ایمیل و متن دیدگاه را تکمیل کنید.');
      return;
    }
    if (!isCaptchaChecked) {
      setCommentError('لطفاً تایید کنید که ربات نیستید.');
      return;
    }

    addBlogComment({
      postId: post.id,
      authorName: commentName.trim(),
      authorEmail: commentEmail.trim(),
      content: commentText.trim()
    });

    setCommentSuccess(true);
    setCommentError('');
    setCommentName('');
    setCommentEmail('');
    setCommentText('');
    setIsCaptchaChecked(false);

    setTimeout(() => setCommentSuccess(false), 5000);
  };

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveHeading(sectionId);
    }
  };

  if (!post) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold">مقاله‌ای یافت نشد</h2>
        <button
          onClick={() => onNavigate('blog')}
          className="px-6 py-2.5 rounded-full bg-amber-400 text-slate-950 font-bold text-sm"
        >
          بازگشت به مقالات
        </button>
      </div>
    );
  }

  // Cover image fallback
  const coverImg = post.coverImage || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="relative space-y-12 pb-16">
      {/* 1. Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-white/10 z-50">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-[#5ce1e6] transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. Breadcrumbs & Top Navigation */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex items-center gap-2 text-xs text-slate-400" aria-label="مسیر راهنما">
          <button 
            onClick={() => onNavigate('home')} 
            className="hover:text-white transition-colors cursor-pointer"
          >
            صفحه اصلی
          </button>
          <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
          <button 
            onClick={() => onNavigate('blog')} 
            className="hover:text-white transition-colors cursor-pointer"
          >
            وبلاگ و مقالات
          </button>
          <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
          <span className="text-amber-400 font-bold">
            {post.categoryFa}
          </span>
        </nav>

        {/* Back to blog button */}
        <button
          onClick={() => onNavigate('blog')}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark 
              ? 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10' 
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>بازگشت به مقالات</span>
        </button>
      </div>

      {/* 3. Article Hero Header */}
      <header className="max-w-4xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{post.categoryFa}</span>
          {post.pathCategory && (
            <>
              <span>•</span>
              <span>
                {post.pathCategory === 'start' ? 'مسیر: شروع کنیم' : post.pathCategory === 'sell' ? 'مسیر: بهتر بفروشیم' : 'مسیر: رشد کنیم'}
              </span>
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight sm:leading-snug text-white">
          {post.title}
        </h1>

        {/* Meta Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-300 pt-2">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-amber-400" />
            <span className="font-bold">{post.author || 'امید عدلی'}</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>تاریخ بروزرسانی: {post.updatedAt || post.date}</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Action Share Tools */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleCopyLink}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              copied 
                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                : 'bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'لینک کپی شد' : 'کپی لینک مقاله'}</span>
          </button>
        </div>
      </header>

      {/* 4. Large Featured Cover Banner (Image 3 Style) */}
      <div className="max-w-4xl mx-auto rounded-[36px] overflow-hidden border border-white/15 shadow-2xl relative group">
        <div className="relative aspect-[16/9] w-full bg-[#120a38] overflow-hidden">
          <img
            src={coverImg}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0624]/80 via-transparent to-transparent" />
        </div>
      </div>

      {/* 5. Article Main Content Container */}
      <article className="max-w-3xl mx-auto space-y-8 text-right font-['Vazirmatn',sans-serif]">
        {/* Excerpt Lead Box */}
        <div className="p-6 sm:p-7 rounded-3xl bg-amber-400/10 border border-amber-400/25 text-amber-100 text-base sm:text-lg leading-relaxed font-bold shadow-lg">
          {post.excerpt}
        </div>

        {/* 6. Table of Contents (فهرست مطالب - Image 4 Style) */}
        {post.tableOfContents && post.tableOfContents.length > 0 && (
          <div className="rounded-3xl bg-[#120a38]/90 border border-white/15 overflow-hidden shadow-xl">
            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-right font-black text-base text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-amber-400">
                <BookOpen className="w-5 h-5" />
                <span>فهرست مطالب</span>
              </div>
              <div className="p-1 rounded-full bg-white/10 text-slate-300">
                {isTocOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isTocOpen && (
              <div className="px-6 pb-6 pt-2 border-t border-white/10 space-y-2.5">
                {post.tableOfContents.map((toc, tIdx) => (
                  <button
                    key={toc.id || tIdx}
                    onClick={() => scrollToSection(toc.id)}
                    className="w-full flex items-center gap-3 text-right text-xs sm:text-sm text-slate-300 hover:text-amber-400 transition-colors py-1 cursor-pointer group"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#5ce1e6] group-hover:scale-125 transition-transform shrink-0" />
                    <span className="font-semibold">{toc.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. Structured Sections with Headings & Callouts */}
        {post.sections && post.sections.length > 0 ? (
          <div className="space-y-10 pt-4">
            {post.sections.map((sec, sIdx) => (
              <section 
                key={sec.id || sIdx} 
                id={sec.id} 
                className="space-y-4 scroll-mt-24"
              >
                {sec.heading && (
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-snug border-r-4 border-amber-400 pr-3.5">
                    {sec.heading}
                  </h2>
                )}

                <div className="text-slate-200 text-sm sm:text-base leading-loose whitespace-pre-line">
                  {sec.content}
                </div>

                {/* Callout box */}
                {sec.callout && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{sec.callout}</span>
                  </div>
                )}

                {/* Key takeaways bullet list */}
                {sec.keyPoints && sec.keyPoints.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>اقدامات پیشنهادی و نکات کلیدی:</span>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                      {sec.keyPoints.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-6 pt-4 text-slate-200 text-sm sm:text-base leading-loose whitespace-pre-line">
            {post.content}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">برچسب‌ها:</span>
            {post.tags.map((tag, tagIdx) => (
              <span 
                key={tagIdx}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 8. Author Bio Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#120a38] border border-white/15 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-right shadow-xl">
          <img
            src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt={post.author}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400/40 shadow-md shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-white">{post.author}</h3>
                <p className="text-xs text-amber-400 font-bold">{post.authorRole || 'مشاور ارشد رشد و دیجیتال مارکتینگ'}</p>
              </div>
              <button
                onClick={() => onNavigate('contact')}
                className="px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer self-center sm:self-auto"
              >
                درخواست مشاوره
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              متخصص پرفورمنس مارکتینگ، ترکینگ و بهینه‌سازی نرخ تبدیل (CRO) با سابقه بهینه‌سازی ده‌ها فروشگاه آنلاین و برندهای معتبر.
            </p>
          </div>
        </div>

        {/* 9. Comments & Feedback Section (Image 5 Style) */}
        <section className="space-y-6 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <span>دیدگاه‌ها و پرسش‌ها</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-amber-300">
                {postComments.length}
              </span>
            </h3>
          </div>

          {/* Comment Form */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#120a38]/80 border border-white/15 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-200">
              {postComments.length === 0 ? 'شما اولین نفری باشید که نظر می‌دهید!' : 'دیدگاه یا سوال خود را مطرح کنید:'}
            </h4>

            {commentSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>دیدگاه شما با موفقیت ثبت شد و پس از بررسی منتشر خواهد شد.</span>
              </div>
            )}

            {commentError && (
              <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                {commentError}
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div>
                <textarea
                  rows={4}
                  required
                  placeholder="متن دیدگاه یا سوال شما درباره این مقاله..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-[#0a0520] border border-white/20 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="نام و نام خانوادگی *"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <input
                  type="email"
                  required
                  placeholder="آدرس ایمیل (نمایش داده نمی‌شود) *"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors dir-ltr text-right"
                />
              </div>

              {/* Captcha Simulator */}
              <div className="p-3.5 rounded-2xl bg-[#0a0520] border border-white/10 flex items-center justify-between max-w-xs">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCaptchaChecked}
                    onChange={(e) => setIsCaptchaChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-400 border-white/30 bg-black/40 focus:ring-0 cursor-pointer"
                  />
                  <span>من ربات نیستم</span>
                </label>
                <ShieldCheck className="w-5 h-5 text-emerald-400 opacity-80" />
              </div>

              <button
                type="submit"
                className="px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-amber-400/20 transition-all cursor-pointer"
              >
                <span>ارسال دیدگاه</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Comments List */}
          {postComments.length > 0 && (
            <div className="space-y-4 pt-4">
              {postComments.map((comm) => (
                <div 
                  key={comm.id} 
                  className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold flex items-center justify-center text-xs">
                        {comm.authorName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-white">{comm.authorName}</div>
                        <div className="text-[10px] text-slate-400">{comm.date}</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {comm.content}
                  </p>

                  {/* Admin Reply */}
                  {comm.reply && (
                    <div className="mr-4 sm:mr-6 p-4 rounded-xl bg-amber-400/10 border-r-2 border-amber-400 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <span>پاسخ امید عدلی:</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {comm.reply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </article>

      {/* 10. Related Articles Section (Image 6 Style) */}
      {relatedPosts.length > 0 && (
        <section className="max-w-5xl mx-auto pt-12 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>مقالات مرتبط</span>
            </h3>
            <button
              onClick={() => onNavigate('blog')}
              className="text-xs text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده همه مقالات</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((rel) => (
              <article
                key={rel.id}
                onClick={() => onSelectPost(rel.id)}
                className="p-6 rounded-[28px] bg-[#120a38]/80 hover:bg-[#1a104c] border border-white/10 hover:border-amber-400/40 transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-4">
                  {/* Thumbnail / cover */}
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#0a0520] relative">
                    <img
                      src={rel.coverImage || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300">
                      {rel.categoryFa}
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors leading-snug line-clamp-2">
                    {rel.title}
                  </h4>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {rel.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{rel.author || 'امید عدلی'}</span>
                  <span>{rel.readTime}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
