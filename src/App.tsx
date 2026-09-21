import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme, Page, CaseStudy } from './types';
import { ContentProvider, useContent } from './context/ContentContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { QuickActionDock } from './components/QuickActionDock';
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
import { SEOHead } from './components/SEOHead';
import { ChatWidget } from './components/ChatWidget';

function MainLayout() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('nd-theme') as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  });
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [selectedBlogPostId, setSelectedBlogPostId] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  const { isAdmin, setIsAdmin, data } = useContent();

  const handleToggleTheme = useCallback(() => {
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

  // Read initial page & admin trigger from URL hash or pathname on load
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');
      const pathname = window.location.pathname;

      if (rawHash === 'admin' || pathname === '/admin' || pathname.startsWith('/admin')) {
        setCurrentPage('admin');
        return;
      }
      
      if (rawHash.startsWith('blog/')) {
        const pId = rawHash.replace('blog/', '');
        setCurrentPage('blog');
        setSelectedBlogPostId(pId);
        return;
      }

      const validPages: Page[] = [
        'home', 'services', 'portfolio', 'about', 'blog', 'contact', 
        'projects', 'products', 'admin'
      ];
      const customSlugs = (data.CUSTOM_PAGES || []).map((cp) => cp.slug);
      if (customSlugs.includes(rawHash)) {
        setCurrentPage(rawHash as Page);
        setSelectedBlogPostId(null);
        return;
      }
      if (validPages.includes(rawHash as Page)) {
        setCurrentPage(rawHash as Page);
        if (rawHash !== 'blog') {
          setSelectedBlogPostId(null);
        }
      } else if (!rawHash) {
        setCurrentPage('home');
        setSelectedBlogPostId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
    if (page !== 'blog') {
      setSelectedBlogPostId(null);
    }
    window.location.hash = page === 'home' ? '' : page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBlogPost = (postId: string) => {
    setSelectedBlogPostId(postId);
    setCurrentPage('blog');
    window.location.hash = `blog/${postId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCaseStudy = (study: CaseStudy | null) => {
    setSelectedCaseStudy(study);
    if (study && currentPage !== 'portfolio') {
      setCurrentPage('portfolio');
      window.location.hash = 'portfolio';
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col transition-colors duration-500 font-['Vazirmatn',sans-serif] nd-bg overflow-x-hidden">
      {/* SEO meta tags — driven by the CMS (global, per-page and per-post) */}
      <SEOHead currentPage={currentPage} blogPostId={selectedBlogPostId} />

      {/* Cinematic reading progress + filmic grain */}
      <ScrollProgress />
      <Grain />

      {/* Custom Interactive Floating Cursor */}
      <CustomCursor />

      {/* Background Interactive Beam & Grid */}
      <BackgroundBlobs theme={theme} />

      {/* Glassmorphic Navigation Header */}
      <Navbar
        theme={theme}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onToggleTheme={handleToggleTheme}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
      />

      {/* Main Content Area with Cinematic Motion Page Transitions */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-8 relative z-10 pb-10 pt-28 sm:pt-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            {currentPage === 'home' && (
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Admin Floating Toolbar */}
      <AdminFloatingBar />
      <ChatWidget theme={theme} />

      {/* Admin PIN Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Bottom Floating Quick Action Dock */}
      <QuickActionDock theme={theme} currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Footer */}
      <Footer
        theme={theme}
        onNavigate={handleNavigate}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ContentProvider>
      <MainLayout />
    </ContentProvider>
  );
}



