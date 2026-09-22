import React, { useEffect, useRef, useState } from 'react';
import { Theme } from '../types';
import { AssistantPanel } from './mascot/AssistantPanel';
import { mascotController, soulSetChatOpen } from './mascot/soul';

/**
 * AssistantChat — owns the open/closed lifecycle of the panel.
 *
 * The old standalone launcher is gone: the corner avatar IS the launcher
 * (click → panel). While the panel is open the corner mascot hides
 * (body.chat-open) because the character has "walked into" the chat's bar.
 * Opening and closing are reported to the controller like any other event.
 */
export const ChatWidget: React.FC<{ theme: Theme; isHidden?: boolean }> = ({ theme, isHidden = false }) => {
  const [open, setOpen] = useState(false);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const openChat = () => {
      restoreFocusTo.current = (document.activeElement as HTMLElement) ?? null;
      setOpen(true);
    };
    window.addEventListener('nd:open-chat', openChat);
    return () => window.removeEventListener('nd:open-chat', openChat);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('chat-open', open);
    soulSetChatOpen(open);
    if (open) {
      mascotController.dispatch({ type: 'CHAT_OPENED' });
    } else {
      mascotController.dispatch({ type: 'CHAT_CLOSED' });
      // hand focus back to whatever opened the panel (keyboard users)
      const target = restoreFocusTo.current;
      restoreFocusTo.current = null;
      if (target && document.contains(target)) target.focus?.();
    }
    return () => document.body.classList.remove('chat-open');
  }, [open]);

  // Escape closes the panel
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // leaving the page entirely (e.g. → /admin) must not leave a request open
  useEffect(() => {
    if (isHidden && open) setOpen(false);
  }, [isHidden, open]);

  if (isHidden) return null;
  return <AssistantPanel theme={theme} open={open} onClose={() => setOpen(false)} />;
};
