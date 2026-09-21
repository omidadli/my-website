import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme, Page, CaseStudy } from './types';
import { ContentProvider, useContent } from './context/ContentContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { QuickActionDock } from './components/QuickActionDock';
import { CustomCursor } from './components/CustomCursor';
import { SplashScreen } from './components/SplashScreen';
import { AdminFloatingBar } from './components/cms/AdminFloatingBar';
import { AdminLoginModal } from './components/cms/AdminLoginModal';
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

function MainLayout() {
  const [theme] = useState<Theme>('dark');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [selectedBlogPostId, setSelectedBlogPostId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  const { isAdmin, setIsAdmin } = useContent();

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleReplaySplash = useCallback(() => {
    setShowSplash(true);
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
  }, []);

  // Lock document root to dark class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
  }, []);

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
    <div className="min-h-screen relative flex flex-col transition-colors duration-500 font-['Vazirmatn',sans-serif] bg-[#0a0624] text-[#eae6ff] overflow-x-hidden">
      {/* Animated Motion Graphic Preloader Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* Custom Interactive Floating Cursor */}
      <CustomCursor />

      {/* Background Interactive Beam & Grid */}
      <BackgroundBlobs theme="dark" />

      {/* Glassmorphic Navigation Header */}
      <Navbar
        theme="dark"
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onReplaySplash={handleReplaySplash}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
      />

      {/* Main Content Area with Cinematic Motion Page Transitions */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-8 relative z-10 pb-28">
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Admin Floating Toolbar */}
      <AdminFloatingBar />

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



