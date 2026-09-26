import React from 'react';

interface ErrorBoundaryProps {
  /** Rendered instead of the children after a crash. `null` hides the subtree silently (decorative widgets). */
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
  /** Label used in the console so the failing area is obvious. */
  name?: string;
  /** When any of these change the boundary retries rendering (e.g. on navigation). */
  resetKeys?: ReadonlyArray<unknown>;
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * React unmounts the WHOLE tree when a render error is not caught — a broken
 * mascot video or a malformed CMS field would otherwise turn the site into a
 * blank page. Wrap non-critical widgets with `fallback={null}` and page content
 * with a friendly message so the navbar/footer keep working.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info.componentStack);
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (!this.state.error) return;
    const a = prev.resetKeys || [];
    const b = this.props.resetKeys || [];
    if (a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]))) this.reset();
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { fallback } = this.props;
    if (typeof fallback === 'function') return fallback(error, this.reset);
    return fallback === undefined ? <PageErrorFallback reset={this.reset} /> : fallback;
  }
}

/** Default fallback for page content: keeps the visitor on the site with a way out. */
export const PageErrorFallback: React.FC<{ reset: () => void }> = ({ reset }) => (
  <div dir="rtl" role="alert" className="max-w-xl mx-auto my-24 px-6 py-10 text-center space-y-4 rounded-3xl border border-rose-500/30 bg-rose-500/5">
    <h2 className="text-lg font-black">این بخش با خطا مواجه شد</h2>
    <p className="text-sm opacity-80 leading-7">
      مشکلی در نمایش این صفحه پیش آمد. می‌توانید دوباره تلاش کنید یا صفحه را تازه‌سازی کنید؛ بقیهٔ سایت در دسترس است.
    </p>
    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
      <button type="button" onClick={reset} className="px-5 py-2.5 rounded-full text-xs font-bold border border-[color:var(--nd-line)] hover:border-[color:var(--nd-accent)] transition-colors cursor-pointer">
        تلاش دوباره
      </button>
      <a href="/" className="px-5 py-2.5 rounded-full text-xs font-bold border border-[color:var(--nd-line)] hover:border-[color:var(--nd-accent)] transition-colors">
        بازگشت به صفحهٔ اصلی
      </a>
    </div>
  </div>
);
