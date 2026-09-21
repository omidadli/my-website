import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Briefcase, 
  Sparkles, 
  BookOpen, 
  ShoppingBag, 
  Clock, 
  Image as ImageIcon, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Lock, 
  Check, 
  X, 
  Eye, 
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Globe,
  Share2,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Star,
  ExternalLink,
  Search,
  History as HistoryIcon,
  ShieldAlert,
  Palette,
  Navigation,
  Link as LinkIcon,
  MessageSquare,
  CheckCircle2,
  ListTree
} from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { Page, CustomPage, CustomBlock } from '../types';
import { TreeEditor } from '../components/admin/TreeEditor';

interface AdminPageProps {
  onNavigate: (page: Page) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { 
    data, 
    isAdmin, 
    pinCode, 
    changePin, 
    loginAdmin, 
    logoutAdmin, 
    updateField, 
    addItem, 
    removeItem, 
    moveItem, 
    resetToDefaults, 
    exportJSON, 
    importJSON,
    saveChanges,
    hasUnsavedChanges,
    addMediaItem,
    removeMediaItem,
    updatePageSeo,
    toggleSectionVisibility,
    reorderPageSection,
    createSnapshot,
    rollbackSnapshot,
    toggleCommentApproval,
    deleteBlogComment,
    replyBlogComment
  } = useContent();

  // Login form state
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // CMS active tab
  const [activeTab, setActiveTab] = useState<
    'tree' | 'dashboard' | 'pages' | 'sections' | 'case-studies' | 'services' | 'blog' | 'products' | 'timeline' | 'media' | 'seo' | 'settings' | 'history'
  >('tree');

  // Snapshot form state
  const [snapshotDesc, setSnapshotDesc] = useState('');

  // Selected SEO page editing state
  const [selectedSeoPage, setSelectedSeoPage] = useState<string>('home');

  // Custom page creation state
  const [newCustomPageTitle, setNewCustomPageTitle] = useState('');
  const [newCustomPageSlug, setNewCustomPageSlug] = useState('');

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Change PIN state
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);

  // File upload state for Media Library
  const [mediaList, setMediaList] = useState<string[]>([
    data.PERSONAL_INFO.avatar || '',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
  ]);

  // Blog management sub-tabs and expanded post index
  const [blogSubTab, setBlogSubTab] = useState<'posts' | 'page-info' | 'comments'>('posts');
  const [expandedPostIdx, setExpandedPostIdx] = useState<number | null>(0);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(pinInput)) {
      setLoginError(false);
      setPinInput('');
      showToast('خوش آمدید! ورود به پیشخوان مدیریت با موفقیت انجام شد.');
    } else {
      setLoginError(true);
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPinInput !== pinCode) {
      setPinChangeMsg('پین‌کد فعلی اشتباه است.');
      return;
    }
    if (newPinInput.length < 4) {
      setPinChangeMsg('پین‌کد جدید باید حداقل ۴ رقم باشد.');
      return;
    }
    changePin(newPinInput);
    setPinChangeMsg('پین‌کد با موفقیت تغییر کرد! ✨');
    setOldPinInput('');
    setNewPinInput('');
  };

  const handleAddCustomPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomPageTitle.trim() || !newCustomPageSlug.trim()) {
      alert('لطفاً عنوان و آدرس برگه را وارد کنید.');
      return;
    }
    const cleanSlug = newCustomPageSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const newPage: CustomPage = {
      id: 'custom-' + Date.now(),
      title: newCustomPageTitle,
      slug: cleanSlug,
      showInMenu: true,
      blocks: [
        {
          id: 'b-' + Date.now(),
          type: 'text',
          title: 'خوش آمدید به برگه ' + newCustomPageTitle,
          content: 'این برگه اختصاصی جدید به سیستم مدیریت محتوای سایت اضافه گردیده است.'
        }
      ]
    };
    const currentPages = data.CUSTOM_PAGES || [];
    updateField('CUSTOM_PAGES', [...currentPages, newPage]);
    setNewCustomPageTitle('');
    setNewCustomPageSlug('');
    showToast(`برگه جدید "${newPage.title}" با موفقیت ایجاد شد.`);
  };

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMediaList([reader.result, ...mediaList]);
          showToast('تصویر جدید با موفقیت به کتابخانه رسانه اضافه شد.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // If NOT logged in, show WordPress Login Box
  if (!isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 dir-rtl font-sans">
        <div className="max-w-md w-full bg-[#120a38]/90 border-2 border-[#8b5cf6] rounded-3xl p-8 shadow-[0_0_50px_rgba(139,92,246,0.3)] backdrop-blur-2xl text-white space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-[#5ce1e6] p-0.5 mx-auto shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#0e072b] rounded-[14px] flex items-center justify-center text-amber-400">
                <Lock className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-black gradient-text">ورود به سیستم مدیریت وب‌سایت (CMS)</h1>
            <p className="text-xs text-slate-300">
              لطفاً پین‌کد مدیریتی را وارد کنید (پین‌کد پیش‌فرض: <code className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">1234</code>)
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">پین‌کد ورود:</label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setLoginError(false);
                }}
                placeholder="• • • •"
                className="w-full bg-[#0a0520] border-2 border-white/20 focus:border-amber-400 rounded-2xl px-4 py-3 text-center text-xl tracking-[0.5em] font-mono text-white focus:outline-none transition-all dir-ltr"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold text-center animate-bounce">
                پین‌کد وارد شده اشتباه است. پین‌کد پیش‌فرض 1234 می‌باشد.
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl hover:shadow-amber-400/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>ورود به پیشخوان مدیریت</span>
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center">
            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              بازگشت به صفحه اصلی سایت
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN: WordPress-like Admin Dashboard
  return (
    <div className="min-h-screen py-6 px-2 sm:px-6 dir-rtl font-sans text-white space-y-6">
      {/* Toast popup */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[12000] bg-emerald-500 text-slate-950 font-extrabold px-6 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-sm animate-bounce border-2 border-emerald-300">
          <Check className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Top Header Banner */}
      <div className="bg-[#120a38]/90 border-2 border-[#8b5cf6] rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-lg">
            <Settings className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">پیشخوان مدیریت محتوای وب‌سایت (CMS)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/40">
                فعال و آنلاین
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              مدیریت کامل تمامی متون، عکس‌ها، آمارها، پروژه‌ها، برگه‌ها و تنظیمات عمومی مثل وردپرس
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>ویرایش بصری مستقیم روی سایت</span>
          </button>

          <button
            onClick={() => {
              saveChanges();
              showToast('تغییرات با موفقیت ذخیره شدند.');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 animate-pulse'
                : 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تغییرات</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Main CMS Layout: Sidebar Tabs + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-[#120a38]/80 border border-white/10 rounded-3xl p-3 space-y-1">
            {[
              { id: 'tree', label: 'ویرایشگر ساختاریافته (Tree Editor ✏️)', icon: Layers },
              { id: 'dashboard', label: 'داشبورد خلاصه', icon: LayoutDashboard },
              { id: 'pages', label: 'مدیریت برگه‌ها و صفحات', icon: FileText },
              { id: 'sections', label: 'مدیریت سکشن‌های سایت', icon: Layers },
              { id: 'media', label: 'کتابخانه رسانه (Media)', icon: ImageIcon },
              { id: 'seo', label: 'سئو و متاتگ‌ها (SEO)', icon: Search },
              { id: 'settings', label: 'تنظیمات عمومی، منو و تم', icon: Settings },
              { id: 'history', label: 'تاریخچه تغییرات و لاگ‌ها', icon: HistoryIcon },
              { id: 'case-studies', label: 'نمونه‌کارها (کیس‌استادی)', icon: Briefcase },
              { id: 'services', label: 'خدمات و پکیج‌ها', icon: Sparkles },
              { id: 'blog', label: 'مقالات و آموز‌ش‌ها', icon: BookOpen },
              { id: 'products', label: 'محصولات و دوره‌ها', icon: ShoppingBag },
              { id: 'timeline', label: 'سوابق و تایم‌لاین', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-right px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#8b5cf6] to-[#4c8dff] text-white shadow-lg font-black'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>راهنمای سیستم CMS:</span>
            </div>
            <p className="leading-relaxed">
              شما می‌توانید تمامی فیلدها را به شکل دستی ویرایش کنید یا با کلیک روی دکمه ویرایش بصری، مستقیماً روی هر صفحه با آیکون مداد ✏️ تغییرات را اعمال نمایید.
            </p>
          </div>
        </div>

        {/* Content View Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 0: STRUCTURED TREE EDITOR */}
          {activeTab === 'tree' && <TreeEditor />}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { title: 'کیس‌استادی‌ها', count: data.CASE_STUDIES?.length || 0, color: 'from-[#2563eb] to-[#3b82f6]' },
                  { title: 'خدمات تخصصی', count: data.SERVICES?.length || 0, color: 'from-[#8b5cf6] to-[#a855f7]' },
                  { title: 'مقالات بلاگ', count: data.BLOG_POSTS?.length || 0, color: 'from-[#06b6d4] to-[#3b82f6]' },
                  { title: 'برگه‌های اختصاصی', count: data.CUSTOM_PAGES?.length || 0, color: 'from-amber-500 to-orange-500' },
                ].map((stat, i) => (
                  <div key={i} className={`p-5 rounded-3xl bg-gradient-to-br ${stat.color} text-white shadow-xl space-y-1`}>
                    <div className="text-3xl font-black dir-ltr text-right">{stat.count}</div>
                    <div className="text-xs font-bold text-white/90">{stat.title}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions Card */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <h3 className="text-base font-black text-amber-400 border-r-4 border-amber-400 pr-3">
                  میانبرهای سریع مدیریت
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab('pages')}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-right space-y-1 transition-all cursor-pointer"
                  >
                    <FileText className="w-6 h-6 text-[#5ce1e6]" />
                    <div className="font-black text-sm text-white">افزودن برگه جدید</div>
                    <p className="text-[11px] text-slate-400">ساخت صفحه جدید با slug و بلاک‌های اختصاصی</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('case-studies')}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-right space-y-1 transition-all cursor-pointer"
                  >
                    <Briefcase className="w-6 h-6 text-[#8b5cf6]" />
                    <div className="font-black text-sm text-white">مدیریت نمونه‌کارها</div>
                    <p className="text-[11px] text-slate-400">افزودن یا ویرایش پروژه‌ها و آمار ROAS</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-right space-y-1 transition-all cursor-pointer"
                  >
                    <Settings className="w-6 h-6 text-amber-400" />
                    <div className="font-black text-sm text-white">تنظیمات اصلی و پین‌کد</div>
                    <p className="text-[11px] text-slate-400">تغییر اطلاعات تماس، پین‌کد و دریافت بکاپ</p>
                  </button>
                </div>
              </div>

              {/* Personal Info Quick Overview */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <h3 className="text-base font-black text-white border-r-4 border-[#8b5cf6] pr-3">
                  مشخصات صاحب سایت
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      value={data.PERSONAL_INFO.name}
                      onChange={(e) => updateField('PERSONAL_INFO.name', e.target.value)}
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">عنوان شغلی:</label>
                    <input
                      type="text"
                      value={data.PERSONAL_INFO.title}
                      onChange={(e) => updateField('PERSONAL_INFO.title', e.target.value)}
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">ایمیل کاری:</label>
                    <input
                      type="text"
                      value={data.PERSONAL_INFO.email}
                      onChange={(e) => updateField('PERSONAL_INFO.email', e.target.value)}
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl px-3 py-2 text-white font-mono dir-ltr text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">شماره تماس / واتساپ:</label>
                    <input
                      type="text"
                      value={data.PERSONAL_INFO.phoneFormatted}
                      onChange={(e) => updateField('PERSONAL_INFO.phoneFormatted', e.target.value)}
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl px-3 py-2 text-white font-mono dir-ltr text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAGES & MENU MANAGER */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              {/* Create Custom Page Form */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border-2 border-amber-400/50 space-y-4">
                <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span>ساخت برگه / صفحه جدید (WordPress Page Builder)</span>
                </h3>

                <form onSubmit={handleAddCustomPage} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">عنوان برگه جدید:</label>
                    <input
                      type="text"
                      value={newCustomPageTitle}
                      onChange={(e) => setNewCustomPageTitle(e.target.value)}
                      placeholder="مثال: مشاوره تخصصی گوگل ادز"
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">آدرس URL / Slug:</label>
                    <input
                      type="text"
                      value={newCustomPageSlug}
                      onChange={(e) => setNewCustomPageSlug(e.target.value)}
                      placeholder="google-ads-consulting"
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono dir-ltr focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ایجاد برگه اختصاصی</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Standard Site Pages List */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <h3 className="text-base font-black text-white border-r-4 border-[#8b5cf6] pr-3">
                  صفحات پیش‌فرض وب‌سایت
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    { id: 'home', label: 'صفحه اصلی', slug: '/' },
                    { id: 'services', label: 'خدمات تخصصی', slug: '/services' },
                    { id: 'portfolio', label: 'نمونه‌کارها و کیس‌استادی', slug: '/portfolio' },
                    { id: 'about', label: 'درباره من', slug: '/about' },
                    { id: 'blog', label: 'آموزش و بلاگ', slug: '/blog' },
                    { id: 'contact', label: 'تماس و مشاوره', slug: '/contact' },
                    { id: 'projects', label: 'پروژه‌ها', slug: '/projects' },
                    { id: 'products', label: 'محصولات', slug: '/products' },
                  ].map((p, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{p.label}</div>
                        <div className="text-[11px] font-mono text-slate-400 dir-ltr">{p.slug}</div>
                      </div>
                      <button
                        onClick={() => onNavigate(p.id as Page)}
                        className="px-3 py-1.5 rounded-xl bg-[#8b5cf6]/20 hover:bg-[#8b5cf6] text-[#8b5cf6] hover:text-white transition-all font-bold text-[11px]"
                      >
                        مشاهده برگه
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Pages List */}
              {data.CUSTOM_PAGES && data.CUSTOM_PAGES.length > 0 && (
                <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                  <h3 className="text-base font-black text-amber-400 border-r-4 border-amber-400 pr-3">
                    برگه‌های اختصاصی ساخته‌شده توسط شما
                  </h3>

                  <div className="space-y-3">
                    {data.CUSTOM_PAGES.map((cp, idx) => (
                      <div key={cp.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-black text-white text-base">{cp.title}</span>
                            <span className="font-mono text-xs text-amber-300 block dir-ltr">/{cp.slug}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeItem('CUSTOM_PAGES', idx)}
                              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all text-xs"
                              title="حذف برگه"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Custom Blocks for this page */}
                        <div className="pt-2 border-t border-white/10 space-y-2">
                          <span className="text-xs font-bold text-slate-400 block">بلاک‌های محتوایی برگه:</span>
                          {cp.blocks?.map((block, bIdx) => (
                            <div key={block.id} className="p-3 rounded-xl bg-[#0a0520] border border-white/10 space-y-2 text-xs">
                              <input
                                type="text"
                                value={block.title || ''}
                                onChange={(e) => updateField(`CUSTOM_PAGES.${idx}.blocks.${bIdx}.title`, e.target.value)}
                                placeholder="عنوان بلاک"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-bold text-white"
                              />
                              <textarea
                                value={block.content || ''}
                                onChange={(e) => updateField(`CUSTOM_PAGES.${idx}.blocks.${bIdx}.content`, e.target.value)}
                                placeholder="متن کامل بلاک..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-slate-200 min-h-[60px]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SECTIONS & CONTENT MANAGER */}
          {activeTab === 'sections' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <h3 className="text-base font-black text-white border-r-4 border-[#8b5cf6] pr-3">
                  ویرایش متون و محتوای بخش‌های اصلی
                </h3>

                {/* Section Selector */}
                <div className="space-y-6">
                  {/* HERO SECTION */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="font-black text-amber-400 text-sm">۱. بنر اصلی (Hero Section)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">نام اصلی:</label>
                        <input
                          type="text"
                          value={data.PERSONAL_INFO.name}
                          onChange={(e) => updateField('PERSONAL_INFO.name', e.target.value)}
                          className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">عنوان تخصصی:</label>
                        <input
                          type="text"
                          value={data.PERSONAL_INFO.title}
                          onChange={(e) => updateField('PERSONAL_INFO.title', e.target.value)}
                          className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 mb-1">بیوگرافی و توضیحات اصلی:</label>
                        <textarea
                          value={data.PERSONAL_INFO.bio}
                          onChange={(e) => updateField('PERSONAL_INFO.bio', e.target.value)}
                          className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white min-h-[80px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* STATS SECTION */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-black text-amber-400 text-sm">۲. آمار و دستاوردها (Stats)</div>
                      <button
                        onClick={() => addItem('STATS')}
                        className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                      >
                        + افزودن آمار جدید
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.STATS?.map((stat, sIdx) => (
                        <div key={sIdx} className="p-3 rounded-xl bg-[#0a0520] border border-white/10 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-amber-300 font-bold">آمار #{sIdx + 1}</span>
                            <button
                              onClick={() => removeItem('STATS', sIdx)}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => updateField(`STATS.${sIdx}.value`, e.target.value)}
                            placeholder="عدد (مثلا +200%)"
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-white font-bold font-mono dir-ltr text-right"
                          />
                          <input
                            type="text"
                            value={stat.label}
                            onChange={(e) => updateField(`STATS.${sIdx}.label`, e.target.value)}
                            placeholder="عنوان آمار"
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-white font-bold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CASE STUDIES / PORTFOLIO */}
          {activeTab === 'case-studies' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-base font-black text-amber-400">
                    مدیریت کیس‌استادی‌ها و نمونه‌کارها ({data.CASE_STUDIES?.length || 0})
                  </h3>
                  <button
                    onClick={() => addItem('CASE_STUDIES')}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن نمونه‌کار جدید</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {data.CASE_STUDIES?.map((cs, idx) => (
                    <div key={cs.id || idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-black text-white text-sm">
                          #{idx + 1} - {cs.title} ({cs.client})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeItem('CASE_STUDIES', idx)}
                            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all"
                            title="حذف این نمونه‌کار"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">عنوان کیس‌استادی:</label>
                          <input
                            type="text"
                            value={cs.title}
                            onChange={(e) => updateField(`CASE_STUDIES.${idx}.title`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">نام مشتری / برند:</label>
                          <input
                            type="text"
                            value={cs.client}
                            onChange={(e) => updateField(`CASE_STUDIES.${idx}.client`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">بازگشت سرمایه (ROAS):</label>
                          <input
                            type="text"
                            value={cs.metrics?.roas || ''}
                            onChange={(e) => updateField(`CASE_STUDIES.${idx}.metrics.roas`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-amber-300 font-bold font-mono dir-ltr text-right"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">نرخ تبدیل (Conversion Rate):</label>
                          <input
                            type="text"
                            value={cs.metrics?.conversionRate || ''}
                            onChange={(e) => updateField(`CASE_STUDIES.${idx}.metrics.conversionRate`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-emerald-300 font-bold font-mono dir-ltr text-right"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-slate-400 mb-1">خلاصه توضیحات کیس‌استادی:</label>
                          <textarea
                            value={cs.summary}
                            onChange={(e) => updateField(`CASE_STUDIES.${idx}.summary`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white min-h-[60px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-base font-black text-amber-400">
                    مدیریت خدمات تخصصی ({data.SERVICES?.length || 0})
                  </h3>
                  <button
                    onClick={() => addItem('SERVICES')}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن خدمت جدید</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {data.SERVICES?.map((srv, idx) => (
                    <div key={srv.id || idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-black text-white text-sm">
                          #{idx + 1} - {srv.title}
                        </span>
                        <button
                          onClick={() => removeItem('SERVICES', idx)}
                          className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">عنوان خدمت (فارسی):</label>
                          <input
                            type="text"
                            value={srv.title}
                            onChange={(e) => updateField(`SERVICES.${idx}.title`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">عنوان انگلیسی:</label>
                          <input
                            type="text"
                            value={srv.titleEn}
                            onChange={(e) => updateField(`SERVICES.${idx}.titleEn`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-mono dir-ltr text-right"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-slate-400 mb-1">توضیحات کوتاه:</label>
                          <textarea
                            value={srv.shortDesc}
                            onChange={(e) => updateField(`SERVICES.${idx}.shortDesc`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white min-h-[50px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BLOG & CONTENT STRATEGY */}
          {activeTab === 'blog' && (
            <div className="space-y-6">
              {/* Blog Sub-Tabs */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#120a38]/90 border border-white/10">
                <button
                  onClick={() => setBlogSubTab('posts')}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    blogSubTab === 'posts'
                      ? 'bg-amber-400 text-slate-950 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>مقالات و محتوا ({data.BLOG_POSTS?.length || 0})</span>
                </button>
                <button
                  onClick={() => setBlogSubTab('page-info')}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    blogSubTab === 'page-info'
                      ? 'bg-amber-400 text-slate-950 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>استراتژی و هدر وبلاگ</span>
                </button>
                <button
                  onClick={() => setBlogSubTab('comments')}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    blogSubTab === 'comments'
                      ? 'bg-amber-400 text-slate-950 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>مدیریت دیدگاه‌ها ({data.BLOG_COMMENTS?.length || 0})</span>
                </button>
              </div>

              {/* Sub-Tab 1: POSTS */}
              {blogSubTab === 'posts' && (
                <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-base font-black text-amber-400">
                        لیست و ویرایش کامل مقالات
                      </h3>
                      <p className="text-xs text-slate-400">
                        امکان تنظیم سرفصل‌ها (H2)، فهرست مطالب، نکات طلایی و کاور اختصاصی
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        addItem('BLOG_POSTS');
                        setExpandedPostIdx(data.BLOG_POSTS?.length || 0);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>مقاله جدید</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {data.BLOG_POSTS?.map((post, idx) => {
                      const isExpanded = expandedPostIdx === idx;
                      return (
                        <div key={post.id || idx} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden text-xs">
                          {/* Accordion Bar */}
                          <div 
                            onClick={() => setExpandedPostIdx(isExpanded ? null : idx)}
                            className="p-4 flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.07] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 font-black flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="font-black text-white text-sm">{post.title || 'مقاله بدون عنوان'}</h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span>{post.categoryFa}</span>
                                  <span>•</span>
                                  <span>{post.readTime}</span>
                                  {post.isPopular && <span className="text-amber-400 font-bold">★ محبوب‌ترین</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeItem('BLOG_POSTS', idx);
                                }}
                                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all cursor-pointer"
                                title="حذف مقاله"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="p-1.5 rounded-lg bg-white/10 text-slate-300">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Post Editor */}
                          {isExpanded && (
                            <div className="p-5 border-t border-white/10 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="sm:col-span-2 md:col-span-3">
                                  <label className="block text-slate-400 mb-1 font-bold">عنوان کامل مقاله:</label>
                                  <input
                                    type="text"
                                    value={post.title}
                                    onChange={(e) => updateField(`BLOG_POSTS.${idx}.title`, e.target.value)}
                                    className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white font-bold text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-slate-400 mb-1">دسته‌بندی موضوعی:</label>
                                  <select
                                    value={post.categoryFa}
                                    onChange={(e) => updateField(`BLOG_POSTS.${idx}.categoryFa`, e.target.value)}
                                    className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white"
                                  >
                                    <option value="پرفورمنس مارکتینگ">پرفورمنس مارکتینگ</option>
                                    <option value="بهینه‌سازی نرخ تبدیل">بهینه‌سازی نرخ تبدیل (CRO)</option>
                                    <option value="آنالیتیکس و ترکینگ">آنالیتیکس و ترکینگ</option>
                                    <option value="سئو و رشد ارگانیک">سئو و رشد ارگانیک</option>
                                    <option value="طراحی وب و شروع آنلاین">طراحی وب و شروع آنلاین</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-slate-400 mb-1">مسیر سه‌گانه کاربر:</label>
                                  <select
                                    value={post.pathCategory || 'sell'}
                                    onChange={(e) => updateField(`BLOG_POSTS.${idx}.pathCategory`, e.target.value)}
                                    className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white"
                                  >
                                    <option value="start">شروع کنیم (راه‌اندازی)</option>
                                    <option value="sell">بهتر بفروشیم (CRO و تبلیغات)</option>
                                    <option value="grow">رشد کنیم (اسکیل و اتومیشن)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-slate-400 mb-1">مدت زمان مطالعه:</label>
                                  <input
                                    type="text"
                                    value={post.readTime}
                                    onChange={(e) => updateField(`BLOG_POSTS.${idx}.readTime`, e.target.value)}
                                    className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-slate-400 mb-1">آدرس تصویر کاور مقاله:</label>
                                  <input
                                    type="text"
                                    value={post.coverImage || ''}
                                    onChange={(e) => updateField(`BLOG_POSTS.${idx}.coverImage`, e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-mono dir-ltr text-right"
                                  />
                                </div>

                                <div>
                                  <label className="block text-slate-400 mb-1">تاریخ بروزرسانی:</label>
                                  <input
                                    type="text"
                                    value={post.updatedAt || post.date || '۱۴۰۴'}
                                    onChange={(e) => updateField(`BLOG_POSTS.${idx}.updatedAt`, e.target.value)}
                                    className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white"
                                  />
                                </div>

                                <div className="sm:col-span-2 md:col-span-3 flex items-center gap-6 p-3 rounded-xl bg-white/5 border border-white/10">
                                  <label className="flex items-center gap-2 text-white cursor-pointer select-none font-bold">
                                    <input
                                      type="checkbox"
                                      checked={!!post.isPopular}
                                      onChange={(e) => updateField(`BLOG_POSTS.${idx}.isPopular`, e.target.checked)}
                                      className="w-4 h-4 rounded text-amber-400 focus:ring-0"
                                    />
                                    <span>محبوب‌ترین مقاله (نمایش در هدر صفحه وبلاگ)</span>
                                  </label>

                                  <label className="flex items-center gap-2 text-white cursor-pointer select-none font-bold">
                                    <input
                                      type="checkbox"
                                      checked={!!post.featured}
                                      onChange={(e) => updateField(`BLOG_POSTS.${idx}.featured`, e.target.checked)}
                                      className="w-4 h-4 rounded text-amber-400 focus:ring-0"
                                    />
                                    <span>مقاله ویژه (Featured)</span>
                                  </label>
                                </div>

                                <div className="sm:col-span-2 md:col-span-3">
                                  <label className="block text-slate-400 mb-1 font-bold">چکیده / لید مقاله (نمایش در کارت‌ها و بالای صفحه مقاله):</label>
                                  <textarea
                                    rows={2}
                                    value={post.excerpt}
                                    onChange={(e) => updateField(`BLOG_POSTS.${idx}.excerpt`, e.target.value)}
                                    className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white"
                                  />
                                </div>
                              </div>

                              {/* Sections Management */}
                              <div className="pt-4 border-t border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-black text-amber-300 text-xs flex items-center gap-1.5">
                                    <ListTree className="w-4 h-4" />
                                    <span>سرفصل‌های ساختاریافته مقاله ({post.sections?.length || 0})</span>
                                  </h5>
                                  <button
                                    onClick={() => {
                                      const currentSections = post.sections || [];
                                      const newSec = {
                                        id: `sec-${Date.now()}`,
                                        heading: `${currentSections.length + 1}. سرفصل جدید`,
                                        content: 'متن توضیحات این بخش...',
                                        callout: 'نکته کلیدی این بخش'
                                      };
                                      updateField(`BLOG_POSTS.${idx}.sections`, [...currentSections, newSec]);
                                      // also update table of contents
                                      const currentToc = post.tableOfContents || [];
                                      updateField(`BLOG_POSTS.${idx}.tableOfContents`, [
                                        ...currentToc,
                                        { id: newSec.id, title: newSec.heading }
                                      ]);
                                    }}
                                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>افزودن سرفصل H2</span>
                                  </button>
                                </div>

                                {post.sections?.map((sec, sIdx) => (
                                  <div key={sec.id || sIdx} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-amber-400 text-xs">سرفصل #{sIdx + 1}</span>
                                      <button
                                        onClick={() => {
                                          const filtered = post.sections?.filter((_, i) => i !== sIdx);
                                          updateField(`BLOG_POSTS.${idx}.sections`, filtered);
                                          const filteredToc = post.tableOfContents?.filter((_, i) => i !== sIdx);
                                          updateField(`BLOG_POSTS.${idx}.tableOfContents`, filteredToc);
                                        }}
                                        className="p-1 text-rose-400 hover:text-rose-200 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={sec.heading}
                                      onChange={(e) => updateField(`BLOG_POSTS.${idx}.sections.${sIdx}.heading`, e.target.value)}
                                      placeholder="عنوان سرفصل (مثلا: ۱. روش اجرای کمپین)"
                                      className="w-full bg-[#0a0520] border border-white/20 rounded-lg p-2 text-white font-bold text-xs"
                                    />
                                    <textarea
                                      rows={3}
                                      value={sec.content}
                                      onChange={(e) => updateField(`BLOG_POSTS.${idx}.sections.${sIdx}.content`, e.target.value)}
                                      placeholder="متن کامل این بخش..."
                                      className="w-full bg-[#0a0520] border border-white/20 rounded-lg p-2 text-white text-xs"
                                    />
                                    <input
                                      type="text"
                                      value={sec.callout || ''}
                                      onChange={(e) => updateField(`BLOG_POSTS.${idx}.sections.${sIdx}.callout`, e.target.value)}
                                      placeholder="باکس نکته طلایی / کال اوت (اختیاری)"
                                      className="w-full bg-[#0a0520] border border-white/20 rounded-lg p-2 text-cyan-300 text-xs"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: PAGE INFO & CONTENT STRATEGY */}
              {blogSubTab === 'page-info' && (
                <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                  <h3 className="text-base font-black text-amber-400 border-b border-white/10 pb-3">
                    تنظیمات استراتژی محتوا و هدر وبلاگ
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">نشان بالای هدر (Badge):</label>
                      <input
                        type="text"
                        value={data.BLOG_PAGE_DATA?.badge || ''}
                        onChange={(e) => updateField('BLOG_PAGE_DATA.badge', e.target.value)}
                        className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">متن پیش‌فرض جستجو:</label>
                      <input
                        type="text"
                        value={data.BLOG_PAGE_DATA?.searchPlaceholder || ''}
                        onChange={(e) => updateField('BLOG_PAGE_DATA.searchPlaceholder', e.target.value)}
                        className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">تیتر اصلی صفحه وبلاگ (Headline):</label>
                      <input
                        type="text"
                        value={data.BLOG_PAGE_DATA?.headline || ''}
                        onChange={(e) => updateField('BLOG_PAGE_DATA.headline', e.target.value)}
                        className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">زیرتیتر توضیحی (Subheadline):</label>
                      <textarea
                        rows={2}
                        value={data.BLOG_PAGE_DATA?.subheadline || ''}
                        onChange={(e) => updateField('BLOG_PAGE_DATA.subheadline', e.target.value)}
                        className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-4 border-t border-white/10">
                      <h4 className="font-bold text-amber-300 mb-3">تنظیمات سکشن خبرنامه وبلاگ</h4>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">تیتر خبرنامه:</label>
                      <input
                        type="text"
                        value={data.BLOG_PAGE_DATA?.newsletterHeadline || ''}
                        onChange={(e) => updateField('BLOG_PAGE_DATA.newsletterHeadline', e.target.value)}
                        className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">متن دکمه خبرنامه:</label>
                      <input
                        type="text"
                        value={data.BLOG_PAGE_DATA?.newsletterCta || ''}
                        onChange={(e) => updateField('BLOG_PAGE_DATA.newsletterCta', e.target.value)}
                        className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">زیرتیتر خبرنامه:</label>
                      <input
                        type="text"
                        value={data.BLOG_PAGE_DATA?.newsletterSubheadline || ''}
                        onChange={(e) => updateField('BLOG_PAGE_DATA.newsletterSubheadline', e.target.value)}
                        className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: COMMENTS MODERATION */}
              {blogSubTab === 'comments' && (
                <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-base font-black text-amber-400">
                      مدیریت دیدگاه‌ها و نظرات کاربران ({data.BLOG_COMMENTS?.length || 0})
                    </h3>
                  </div>

                  {(!data.BLOG_COMMENTS || data.BLOG_COMMENTS.length === 0) ? (
                    <div className="p-8 rounded-2xl bg-white/5 text-center text-slate-400 text-xs">
                      هنوز دیدگاهی ثبت نشده است.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.BLOG_COMMENTS.map((comm) => (
                        <div key={comm.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-black text-white text-sm">{comm.authorName}</span>
                              <span className="text-slate-400 dir-ltr font-mono">{comm.authorEmail}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">{comm.date}</span>
                              <span className="text-amber-400">برای مقاله: {comm.postId}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleCommentApproval(comm.id)}
                                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                  comm.isApproved
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {comm.isApproved ? '✓ تایید شده' : '⏳ در انتظار تایید'}
                              </button>

                              <button
                                onClick={() => deleteBlogComment(comm.id)}
                                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all cursor-pointer"
                                title="حذف دیدگاه"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <p className="text-slate-200 leading-relaxed bg-[#0a0520] p-3 rounded-xl">
                            {comm.content}
                          </p>

                          {/* Reply Section */}
                          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                            <input
                              type="text"
                              placeholder="پاسخ ادمین به این دیدگاه..."
                              value={replyTextMap[comm.id] !== undefined ? replyTextMap[comm.id] : (comm.reply || '')}
                              onChange={(e) => setReplyTextMap({ ...replyTextMap, [comm.id]: e.target.value })}
                              className="flex-1 w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white text-xs"
                            />
                            <button
                              onClick={() => {
                                const text = replyTextMap[comm.id] !== undefined ? replyTextMap[comm.id] : (comm.reply || '');
                                replyBlogComment(comm.id, text);
                                showToast('پاسخ با موفقیت ثبت شد.');
                              }}
                              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-md"
                            >
                              ثبت پاسخ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <h3 className="text-base font-black text-amber-400 border-b border-white/10 pb-3">
                  تنظیمات هدر صفحه محصولات و ابزارها
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">نشان بالای هدر (Badge):</label>
                    <input
                      type="text"
                      value={data.PRODUCTS_PAGE_DATA?.badge || ''}
                      onChange={(e) => updateField('PRODUCTS_PAGE_DATA.badge', e.target.value)}
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">تیتر اصلی صفحه:</label>
                    <input
                      type="text"
                      value={data.PRODUCTS_PAGE_DATA?.headline || ''}
                      onChange={(e) => updateField('PRODUCTS_PAGE_DATA.headline', e.target.value)}
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">زیرتیتر توضیحی:</label>
                    <textarea
                      rows={2}
                      value={data.PRODUCTS_PAGE_DATA?.subheadline || ''}
                      onChange={(e) => updateField('PRODUCTS_PAGE_DATA.subheadline', e.target.value)}
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-base font-black text-amber-400">
                    مدیریت محصولات و ابزارها ({data.PRODUCTS?.length || 0})
                  </h3>
                  <button
                    onClick={() => addItem('PRODUCTS')}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>محصول جدید</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {data.PRODUCTS?.map((prod, idx) => (
                    <div key={prod.id || idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-black text-white text-sm">
                          #{idx + 1} - {prod.title}
                        </span>
                        <button
                          onClick={() => removeItem('PRODUCTS', idx)}
                          className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-slate-400 mb-1 font-bold">عنوان محصول:</label>
                          <input
                            type="text"
                            value={prod.title}
                            onChange={(e) => updateField(`PRODUCTS.${idx}.title`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">نشان (Badge):</label>
                          <input
                            type="text"
                            value={prod.badge || ''}
                            onChange={(e) => updateField(`PRODUCTS.${idx}.badge`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">قیمت / تعرفه:</label>
                          <input
                            type="text"
                            value={prod.price || ''}
                            onChange={(e) => updateField(`PRODUCTS.${idx}.price`, e.target.value)}
                            placeholder="مثلا: رایگان یا ۲۰۰ هزار تومان"
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-amber-400 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">متن دکمه (CTA):</label>
                          <input
                            type="text"
                            value={prod.actionText || ''}
                            onChange={(e) => updateField(`PRODUCTS.${idx}.actionText`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">آیکون (target, chart, laptop, rocket):</label>
                          <input
                            type="text"
                            value={prod.iconName || 'target'}
                            onChange={(e) => updateField(`PRODUCTS.${idx}.iconName`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-slate-400 mb-1">مناسب برای (مخاطبان هدف):</label>
                          <input
                            type="text"
                            value={prod.targetAudience}
                            onChange={(e) => updateField(`PRODUCTS.${idx}.targetAudience`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white"
                          />
                        </div>

                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-slate-400 mb-1">توضیحات محصول:</label>
                          <textarea
                            value={prod.description}
                            onChange={(e) => updateField(`PRODUCTS.${idx}.description`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white min-h-[50px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-base font-black text-amber-400">
                    مدیریت تایم‌لاین و سوابق کاری ({data.TIMELINE?.length || 0})
                  </h3>
                  <button
                    onClick={() => addItem('TIMELINE')}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>سوابق جدید</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {data.TIMELINE?.map((item, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-black text-white text-sm">
                          {item.year} - {item.title} ({item.company})
                        </span>
                        <button
                          onClick={() => removeItem('TIMELINE', idx)}
                          className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">سال / دوره:</label>
                          <input
                            type="text"
                            value={item.year}
                            onChange={(e) => updateField(`TIMELINE.${idx}.year`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">سمت / عنوان:</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateField(`TIMELINE.${idx}.title`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">نام شرکت:</label>
                          <input
                            type="text"
                            value={item.company}
                            onChange={(e) => updateField(`TIMELINE.${idx}.company`, e.target.value)}
                            className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: MEDIA LIBRARY */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-black text-amber-400">کتابخانه رسانه و مدیریت فایل‌ها (Media Library)</h3>
                    <p className="text-xs text-slate-400">آپلود و ذخیره تصاویر متصل به پایگاه داده مرکزی CMS</p>
                  </div>

                  <label className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>آپلود تصویر جدید</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              addMediaItem({
                                url: reader.result,
                                title: file.name,
                                alt: file.name
                              });
                              showToast('تصویر جدید با موفقیت ذخیره گردید.');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(data.MEDIA_LIBRARY || []).map((media) => (
                    <div key={media.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 group/m relative">
                      <div className="h-32 rounded-xl overflow-hidden border border-white/10 bg-black/40 relative">
                        <img
                          src={media.url}
                          alt={media.alt || media.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            removeMediaItem(media.id);
                            showToast('تصویر از کتابخانه رسانه حذف شد.');
                          }}
                          className="absolute top-2 left-2 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-600 transition-all shadow-md opacity-80 hover:opacity-100"
                          title="حذف تصویر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] font-bold text-white truncate">{media.title}</div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(media.url);
                            showToast('لینک مستقیم تصویر کپی شد!');
                          }}
                          className="w-full py-1.5 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-[10px] font-bold transition-all text-center"
                        >
                          کپی لینک
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SEO & META TAGS */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {/* Global SEO Settings */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <h3 className="text-base font-black text-amber-400 flex items-center gap-2 border-r-4 border-amber-400 pr-3">
                  <Globe className="w-5 h-5" />
                  <span>تنظیمات عمومی سئو (Global SEO)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">عنوان اصلی سایت (Site Title):</label>
                    <input
                      type="text"
                      value={data.GLOBAL_SEO?.siteTitle || ''}
                      onChange={(e) => updateField('GLOBAL_SEO.siteTitle', e.target.value)}
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">الگوی پسوند عنوان (Title Template):</label>
                    <input
                      type="text"
                      value={data.GLOBAL_SEO?.titleTemplate || ''}
                      onChange={(e) => updateField('GLOBAL_SEO.titleTemplate', e.target.value)}
                      placeholder="%s | امید عدلی"
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white font-bold dir-ltr text-right"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-bold mb-1">توضیحات متای پیش‌فرض (Default Meta Description):</label>
                    <textarea
                      value={data.GLOBAL_SEO?.defaultDescription || ''}
                      onChange={(e) => updateField('GLOBAL_SEO.defaultDescription', e.target.value)}
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white min-h-[70px] text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-bold mb-1">کلمات کلیدی اصلی (Keywords - جداشده با کاما):</label>
                    <input
                      type="text"
                      value={(data.GLOBAL_SEO?.keywords || []).join(', ')}
                      onChange={(e) => updateField('GLOBAL_SEO.keywords', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Per-Page SEO Settings */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#5ce1e6]" />
                    <span>تنظیمات سئو به تفکیک صفحات</span>
                  </h3>

                  <select
                    value={selectedSeoPage}
                    onChange={(e) => setSelectedSeoPage(e.target.value)}
                    className="bg-[#0a0520] border border-white/20 text-white font-bold text-xs rounded-xl px-3 py-2"
                  >
                    <option value="home">صفحه اصلی (Home)</option>
                    <option value="services">خدمات (Services)</option>
                    <option value="portfolio">نمونه‌کارها (Portfolio)</option>
                    <option value="about">درباره من (About)</option>
                    <option value="blog">بلاگ (Blog)</option>
                    <option value="contact">تماس (Contact)</option>
                  </select>
                </div>

                {(() => {
                  const pSeo = (data.PAGE_SEO && data.PAGE_SEO[selectedSeoPage]) || { title: '', description: '', keywords: [] };
                  return (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">عنوان این برگه در گوگل (Meta Title):</label>
                        <input
                          type="text"
                          value={pSeo.title}
                          onChange={(e) => updatePageSeo(selectedSeoPage, { ...pSeo, title: e.target.value })}
                          className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">توضیحات این برگه (Meta Description):</label>
                        <textarea
                          value={pSeo.description}
                          onChange={(e) => updatePageSeo(selectedSeoPage, { ...pSeo, description: e.target.value })}
                          className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white min-h-[60px]"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">کلمات کلیدی برگه (Keywords):</label>
                        <input
                          type="text"
                          value={(pSeo.keywords || []).join(', ')}
                          onChange={(e) => updatePageSeo(selectedSeoPage, { ...pSeo, keywords: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-white"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS (Navigation Menu, Theme, PIN, Backup) */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Navigation Menu Manager */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                    <Navigation className="w-5 h-5" />
                    <span>مدیریت منوی ناوبری بالای سایت (Navigation Menu)</span>
                  </h3>
                  <button
                    onClick={() => addItem('NAVIGATION_MENU')}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    + افزودن ایتم به منو
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {(data.NAVIGATION_MENU || []).map((nav, nIdx) => (
                    <div key={nav.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <input
                          type="text"
                          value={nav.title}
                          onChange={(e) => updateField(`NAVIGATION_MENU.${nIdx}.title`, e.target.value)}
                          className="bg-[#0a0520] border border-white/20 rounded-xl px-3 py-1.5 font-bold text-white text-xs w-36"
                        />
                        <input
                          type="text"
                          value={nav.path}
                          onChange={(e) => updateField(`NAVIGATION_MENU.${nIdx}.path`, e.target.value)}
                          className="bg-[#0a0520] border border-white/20 rounded-xl px-3 py-1.5 font-mono text-slate-300 text-xs dir-ltr w-36"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateField(`NAVIGATION_MENU.${nIdx}.isVisible`, !nav.isVisible)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                            nav.isVisible ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-700/50 text-slate-400'
                          }`}
                        >
                          {nav.isVisible ? 'نمایش در منو' : 'مخفی'}
                        </button>

                        <button
                          onClick={() => moveItem('NAVIGATION_MENU', nIdx, nIdx - 1)}
                          disabled={nIdx === 0}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => moveItem('NAVIGATION_MENU', nIdx, nIdx + 1)}
                          disabled={nIdx === (data.NAVIGATION_MENU.length - 1)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => removeItem('NAVIGATION_MENU', nIdx)}
                          className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme & Design Customizer */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <h3 className="text-base font-black text-white border-r-4 border-[#8b5cf6] pr-3 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[#8b5cf6]" />
                  <span>تنظیمات قالب و رنگ‌بندی (Theme Config)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رنگ اصلی برند (Primary Color):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={data.THEME_CONFIG?.primaryColor || '#8b5cf6'}
                        onChange={(e) => updateField('THEME_CONFIG.primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={data.THEME_CONFIG?.primaryColor || '#8b5cf6'}
                        onChange={(e) => updateField('THEME_CONFIG.primaryColor', e.target.value)}
                        className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 font-mono text-white dir-ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">رنگ ثانویه / اکسنت (Accent Color):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={data.THEME_CONFIG?.accentColor || '#5ce1e6'}
                        onChange={(e) => updateField('THEME_CONFIG.accentColor', e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={data.THEME_CONFIG?.accentColor || '#5ce1e6'}
                        onChange={(e) => updateField('THEME_CONFIG.accentColor', e.target.value)}
                        className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2 font-mono text-white dir-ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PIN Code Manager */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border-2 border-amber-400/50 space-y-4">
                <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>تغییر پین‌کد ورود به مدیریت</span>
                </h3>

                <form onSubmit={handleChangePin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">پین‌کد فعلی:</label>
                    <input
                      type="password"
                      value={oldPinInput}
                      onChange={(e) => setOldPinInput(e.target.value)}
                      placeholder="• • • •"
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-center text-white font-mono dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">پین‌کد جدید:</label>
                    <input
                      type="password"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      placeholder="• • • •"
                      className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 text-center text-white font-mono dir-ltr"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer"
                    >
                      تغییر پین‌کد
                    </button>
                  </div>
                </form>

                {pinChangeMsg && (
                  <div className="p-3 rounded-xl bg-white/10 text-amber-300 text-xs font-bold">
                    {pinChangeMsg}
                  </div>
                )}
              </div>

              {/* Data Import & Export & Reset */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <h3 className="text-base font-black text-white border-r-4 border-[#8b5cf6] pr-3">
                  پشتیبان‌گیری و بازنشانی اطلاعات
                </h3>

                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <button
                    onClick={exportJSON}
                    className="px-4 py-3 rounded-2xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>دانلود خروجی کامل JSON (پشتیبان)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('آیا مطمئن هستید که می‌خواهید تمام محتوا را به حالت اولیه بازگردانید؟')) {
                        resetToDefaults();
                        showToast('محتوا به حالت اولیه بازنشانی شد.');
                      }
                    }}
                    className="px-4 py-3 rounded-2xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>بازنشانی به داده‌های اولیه اول سایت</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HISTORY, SNAPSHOTS & AUDIT LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Snapshot creation card */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <h3 className="text-base font-black text-amber-400 border-r-4 border-amber-400 pr-3 flex items-center gap-2">
                  <HistoryIcon className="w-5 h-5" />
                  <span>ثبت و بازیابی نسخه پشتیبان لحظه‌ای (Version Snapshots)</span>
                </h3>

                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <input
                    type="text"
                    value={snapshotDesc}
                    onChange={(e) => setSnapshotDesc(e.target.value)}
                    placeholder="توضیحات نقطه بازیابی (مثلا: قبل از تغییر خدمات)"
                    className="flex-1 min-w-[240px] bg-[#0a0520] border border-white/20 rounded-xl px-3 py-2 text-white font-bold"
                  />
                  <button
                    onClick={() => {
                      createSnapshot(snapshotDesc || 'نسخه پشتیبان دستی');
                      setSnapshotDesc('');
                      showToast('نسخه پشتیبان با موفقیت ثبت شد!');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition-all"
                  >
                    + ثبت نسخه فعلی (Snapshot)
                  </button>
                </div>

                <div className="space-y-2 pt-3">
                  {(data.VERSION_HISTORY || []).map((snap) => (
                    <div key={snap.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{snap.description}</span>
                        <span className="text-[10px] text-slate-400 font-mono dir-ltr">{new Date(snap.timestamp).toLocaleString('fa-IR')}</span>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`آیا مطمئن هستید که می‌خواهید به این نسخه بازگردید؟`)) {
                            rollbackSnapshot(snap.id);
                            showToast('نسخه با موفقیت بازیابی شد!');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#8b5cf6]/20 hover:bg-[#8b5cf6] text-[#8b5cf6] hover:text-white transition-all font-bold text-xs"
                      >
                        بازگردانی این نسخه
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Logs list */}
              <div className="p-6 rounded-3xl bg-[#120a38]/80 border border-white/10 space-y-4">
                <h3 className="text-base font-black text-white border-r-4 border-[#8b5cf6] pr-3 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#8b5cf6]" />
                  <span>لاگ فعالیت‌های سیستم (Audit Logs)</span>
                </h3>

                <div className="space-y-2 text-xs max-h-[300px] overflow-y-auto pr-1">
                  {(data.AUDIT_LOGS || []).map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-[#0a0520] border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#5ce1e6]" />
                        <span className="font-bold text-white">{log.action}</span>
                        {log.details && <span className="text-slate-400 text-[11px]">({log.details})</span>}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 dir-ltr">
                        {new Date(log.timestamp).toLocaleTimeString('fa-IR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
