import React from 'react';
import { Theme, Page } from '../types';
import { useContent } from '../context/ContentContext';
import { linkProps, pathForPage, postPath } from '../utils/router';
import { Home, BookOpen, MessageCircle, Compass } from 'lucide-react';

interface NotFoundPageProps {
  theme: Theme;
  onNavigate: (page: Page) => void;
  onSelectPost: (postId: string) => void;
}

/**
 * Shown for URLs that match no route (the edge already answers 404 + noindex
 * for crawlers). Keeps the visitor inside the site with real links instead of
 * silently rendering the home page under a wrong URL.
 */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({ theme, onNavigate, onSelectPost }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const posts = (data.BLOG_POSTS || []).filter((p) => p.status !== 'draft').slice(0, 3);
  const attempted = typeof window !== 'undefined' ? window.location.pathname : '';

  const quick: Array<{ page: Page; label: string; icon: React.ElementType }> = [
    { page: 'home', label: 'صفحهٔ اصلی', icon: Home },
    { page: 'services', label: 'خدمات', icon: Compass },
    { page: 'blog', label: 'مقالات', icon: BookOpen },
    { page: 'contact', label: 'تماس و مشاوره', icon: MessageCircle },
  ];

  return (
    <div className="max-w-3xl mx-auto text-center space-y-10 py-10 sm:py-16">
      <div className="space-y-4">
        <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest bg-[color:var(--nd-accent-soft)] text-[color:var(--nd-accent)]">۴۰۴</span>
        <h1 className={`nd-h1 text-3xl sm:text-4xl ${isDark ? 'text-white' : ''}`}>این صفحه پیدا نشد</h1>
        <p className={`${isDark ? 'text-slate-400' : 'nd-muted'} text-sm sm:text-base leading-8 max-w-xl mx-auto`}>
          آدرسی که باز کردی وجود ندارد یا جابه‌جا شده است
          {attempted && attempted !== '/' ? (
            <>
              {' '}
              (<code dir="ltr" className="text-xs px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">{attempted}</code>)
            </>
          ) : null}
          . از لینک‌های زیر می‌توانی مسیرت را ادامه بدهی.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {quick.map(({ page, label, icon: Icon }) => (
          <a
            key={page}
            {...linkProps(pathForPage(page), () => onNavigate(page))}
            className={`nd-btn px-5 py-3 text-xs ${page === 'home' ? (isDark ? 'bg-white text-[#17171c] hover:bg-slate-200' : 'nd-btn-accent') : 'nd-btn-ghost'}`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </a>
        ))}
      </div>

      {posts.length > 0 && (
        <div className="space-y-4 text-right">
          <h2 className={`nd-h2 text-base ${isDark ? 'text-white' : ''}`}>شاید این مقاله‌ها به کارت بیاید</h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <a
                  {...linkProps(postPath(post), () => onSelectPost(post.id))}
                  className={`block nd-card p-4 text-xs font-extrabold leading-6 hover:border-[color:var(--nd-accent)] transition-colors ${isDark ? 'text-slate-200' : ''}`}
                >
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
