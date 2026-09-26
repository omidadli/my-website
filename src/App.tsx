import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme, Page, CaseStudy } from './types';
import { ContentProvider, useContent } from './context/ContentContext';
import { StatePreserverProvider } from './utils/statePreserver';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { CustomCursor } from './components/CustomCursor';
import { AdminFloatingBar } from './components/cms/AdminFloatingBar';
import { AdminLoginModal } from './components/cms/AdminLoginModal';
import { ScrollProgress, Grain } from './components/motion/Cinematic';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { AboutPage } from './pages/AboutPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostDetailPage } from './pages/BlogPostDetailPage';
import { ContactPage } from './pages/ContactPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProductsPage } from './pages/ProductsPage';
import { AdminPage } from './pages/AdminPage';
import { CustomPageView } from './pages/CustomPageView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';
import { SEOHead } from './components/SEOHead';
import { ChatWidget } from './components/ChatWidget';
import { MascotAvatar } from './components/mascot/MascotAvatar';
import { MascotWelcomeOverlay } from './components/mascot/MascotWelcomeOverlay';
import { useMascotEvents } from './components/mascot/useMascotEvents';
import { NAVIGATE_EVENT, currentRoute, navigate, pathForPage, postPath, routeToPath } from './utils/router';

function MainLayout({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  // Start on the page the URL points at (no flash of the home page on deep links /
  // shared post URLs). Custom CMS pages are resolved by the URL effect below once
  // the content is available.
  const [initialRoute] = useState(() => currentRoute([]).route);
  const [currentPage, setCurrentPage] = useState<Page>(() => initialRoute?.page ?? 'home');
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [selectedBlogPostId, setSelectedBlogPostId] = useState<string | null>(() =>
    initialRoute?.page === 'blog' ? initialRoute.postId : null,
  );
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState<boolean>(false);
  /** URL matched no route. Rendered as a 404 view only once the content is loaded (custom CMS pages may still arrive). */
  const [routeNotFound, setRouteNotFound] = useState<boolean>(() => initialRoute === null);

  const { isAdmin, setIsAdmin, data, contentReady } = useContent();
  // Re-check against the freshest custom-page slugs during render so a cloud-only
  // CMS page never flashes the 404 view in the frame its content arrives.
  const showNotFound =
    routeNotFound && contentReady && currentRoute((data.CUSTOM_PAGES || []).map((cp) => cp.slug)).route === null;

  // Wire the avatar assistant to real site events (greetings, idle nudges, …)
  useMascotEvents(currentPage);

  const handleToggleTheme = useCallback(() => {
    // Add temporary transitioning class for smooth CSS token interpolation
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-transitioning');
    }
    setIsThemeTransitioning(true);

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        onToggleTheme();
      });
    } else {
      onToggleTheme();
    }

    setTimeout(() => {
      setIsThemeTransitioning(false);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('theme-transitioning');
      }
    }, 480);
  }, [onToggleTheme]);

  // URL → page state. Real paths (/services, /blog/<slug>, /<custom-slug>); legacy
  // hash links (/#/blog/<slug>) are upgraded to the path form on arrival.
  useEffect(() => {
    const customSlugs = (data.CUSTOM_PAGES || []).map((cp) => cp.slug);
    const syncFromUrl = () => {
      const { route, upgradedFromHash } = currentRoute(customSlugs);
      if (!route) {
        // Unknown path (the server already answered 404 for crawlers): 404 view.
        setRouteNotFound(true);
        setCurrentPage('home');
        setSelectedBlogPostId(null);
        return;
      }
      setRouteNotFound(false);
      if (upgradedFromHash) {
        try { window.history.replaceState(null, '', routeToPath(route)); } catch { /* ignore */ }
      }
      setCurrentPage(route.page);
      // bare /blog = the article LIST — always drop the selected post so
      // clicking the "آموزش" nav while reading a post goes back to the list.
      setSelectedBlogPostId(route.page === 'blog' ? route.postId : null);
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener(NAVIGATE_EVENT, syncFromUrl);
    // Old in-page links of the form href="#/blog/…" (e.g. in a saved chat transcript).
    window.addEventListener('hashchange', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener(NAVIGATE_EVENT, syncFromUrl);
      window.removeEventListener('hashchange', syncFromUrl);
    };
  }, [data.CUSTOM_PAGES]);

  // Theme root attributes — drives the ND token system + legacy branches
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    document.body.style.backgroundColor = theme === 'dark' ? '#0b0b12' : '#f6f6f4';
    document.body.style.color = theme === 'dark' ? '#f2f1fa' : '#17171c';
  }, [theme]);


  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSelectedCaseStudy(null);
    // Navigating to 'blog' always means the article LIST — drop the selected
    // post even when coming from a post detail page.
    setSelectedBlogPostId(null);
    navigate(pathForPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBlogPost = (postId: string) => {
    // Public URL prefers the slug; the detail page accepts id or slug.
    const post = (data.BLOG_POSTS || []).find((p) => p.id === postId || (!!p.slug && p.slug === postId)) || null;
    const key = postId ? (post ? post.slug || post.id : postId) : null;
    setSelectedBlogPostId(key);
    setCurrentPage('blog');
    navigate(key ? postPath(post || { id: key }) : '/blog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCaseStudy = (study: CaseStudy | null) => {
    setSelectedCaseStudy(study);
    if (study && currentPage !== 'portfolio') {
      setCurrentPage('portfolio');
      navigate('/portfolio');
    }
  };

  return (
    <motion.div
      animate={
        isThemeTransitioning
          ? {
              scale: [0.993, 1],
              opacity: [0.86, 1],
            }
          : {
              scale: 1,
              opacity: 1,
            }
      }
      transition={{
        duration: 0.46,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="min-h-screen relative flex flex-col transition-colors duration-500 font-['Vazirmatn',sans-serif] nd-bg overflow-x-hidden origin-center"
    >
      {/* Subtle Premium Ambient Theme Wash Overlay */}
      <AnimatePresence>
        {isThemeTransitioning && (
          <motion.div
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.48, ease: 'easeOut' }}
            className="pointer-events-none fixed inset-0 z-[9998]"
            style={{
              background:
                theme === 'dark'
                  ? 'radial-gradient(circle at 50% 12%, rgba(129, 140, 248, 0.16), transparent 75%)'
                  : 'radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.45), transparent 75%)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* SEO meta tags — driven by the CMS (global, per-page and per-post) */}
      <SEOHead currentPage={currentPage} blogPostId={selectedBlogPostId} notFound={showNotFound} />

      {/* Cinematic reading progress + filmic grain */}
      <ScrollProgress />
      <Grain />

      {/* Custom Interactive Floating Cursor */}
      <ErrorBoundary name="CustomCursor" fallback={null}><CustomCursor /></ErrorBoundary>

      {/* Background Interactive Beam & Grid */}
      <ErrorBoundary name="BackgroundBlobs" fallback={null}><BackgroundBlobs theme={theme} /></ErrorBoundary>

      {/* Glassmorphic Navigation Header */}
      <Navbar
        theme={theme}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onToggleTheme={handleToggleTheme}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
      />

      {/* Main Content Area with Cinematic Motion Page Transitions */}
      <main
        className={`flex-grow w-full relative z-10 pb-28 sm:pb-24 ${
          currentPage === 'home' && !showNotFound ? '' : 'max-w-6xl mx-auto px-4 sm:px-8 pt-28 sm:pt-32'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={showNotFound ? '__not_found__' : currentPage}
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <ErrorBoundary name="page" resetKeys={[currentPage, selectedBlogPostId, showNotFound]}>
            {showNotFound && (
              <NotFoundPage theme={theme} onNavigate={handleNavigate} onSelectPost={handleSelectBlogPost} />
            )}
            {!showNotFound && currentPage === 'home' && (
              <HomePage
                theme={theme}
                onNavigate={handleNavigate}
                onSelectCaseStudy={handleSelectCaseStudy}
                onSelectPost={handleSelectBlogPost}
              />
            )}

            {currentPage === 'services' && (
              <ServicesPage
                theme={theme}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'portfolio' && (
              <PortfolioPage
                theme={theme}
                onNavigate={handleNavigate}
                selectedCaseStudy={selectedCaseStudy}
                onSelectCaseStudy={setSelectedCaseStudy}
              />
            )}

            {currentPage === 'about' && (
              <AboutPage
                theme={theme}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'blog' && (
              selectedBlogPostId ? (
                <BlogPostDetailPage
                  theme={theme}
                  postId={selectedBlogPostId}
                  onNavigate={handleNavigate}
                  onSelectPost={handleSelectBlogPost}
                />
              ) : (
                <BlogPage
                  theme={theme}
                  onNavigate={handleNavigate}
                  onSelectPost={handleSelectBlogPost}
                />
              )
            )}

            {currentPage === 'contact' && (
              <ContactPage
                theme={theme}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'projects' && (
              <ProjectsPage
                theme={theme}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'products' && (
              <ProductsPage
                theme={theme}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'admin' && (
              <AdminPage
                onNavigate={handleNavigate}
              />
            )}

            {currentPage !== 'admin' &&
              (data.CUSTOM_PAGES || []).some((cp) => cp.slug === (currentPage as string)) && (
                <CustomPageView
                  customPage={(data.CUSTOM_PAGES || []).find((cp) => cp.slug === (currentPage as string))!}
                  theme={theme}
                  onNavigate={handleNavigate}
                />
              )}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Admin Floating Toolbar */}
      <ErrorBoundary name="AdminFloatingBar" fallback={null}><AdminFloatingBar /></ErrorBoundary>
      {currentPage !== 'admin' && (
        <ErrorBoundary name="ChatWidget" fallback={null}>
          <ChatWidget theme={theme} />
        </ErrorBoundary>
      )}

      {/* Mascot assistant — avatar reacts to site events, clicks open the chat */}
      {currentPage !== 'admin' && (
        <ErrorBoundary name="MascotAvatar" fallback={null}>
          <MascotAvatar />
        </ErrorBoundary>
      )}

      {/* Cinematic Welcome & Waiting Experience */}
      {currentPage !== 'admin' && (
        <ErrorBoundary name="MascotWelcomeOverlay" fallback={null}>
          <MascotWelcomeOverlay theme={theme} />
        </ErrorBoundary>
      )}

      {/* Admin PIN Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Footer */}
      <Footer
        theme={theme}
        onNavigate={handleNavigate}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
      />
    </motion.div>
  );
}

export default function App() {
  return (
    <ContentProvider>
      <StatePreserverWrapper />
    </ContentProvider>
  );
}

function StatePreserverWrapper() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('nd-theme') as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('nd-theme', next);
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);

  return (
    <StatePreserverProvider theme={theme}>
      <MainLayout theme={theme} onToggleTheme={toggleTheme} />
    </StatePreserverProvider>
  );
}



