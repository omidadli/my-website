import React, { useEffect, useState } from 'react';
import { Theme } from '../types';
import { AssistantPanel } from './mascot/AssistantPanel';
import { mascot } from './mascot/mascotBus';

/**
 * AssistantChat — mounts the mascot's chat panel. The old standalone chat
 * launcher is gone: the corner avatar IS the launcher (click → panel).
 * While the panel is open the corner mascot hides (body.chat-open) — it has
 * "walked into" the chat's video bar — and waves goodbye on close.
 */
export const ChatWidget: React.FC<{ theme: Theme; isHidden?: boolean }> = ({ theme, isHidden = false }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openChat = () => {
      setOpen(true);
      mascot.scene('wave', 2200);
    };
    window.addEventListener('nd:open-chat', openChat);
    return () => window.removeEventListener('nd:open-chat', openChat);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('chat-open', open);
    if (!open) mascot.scene('greet');
    return () => document.body.classList.remove('chat-open');
  }, [open]);

  // Escape closes the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (isHidden) return null;
  return <AssistantPanel theme={theme} open={open} onClose={() => setOpen(false)} />;
};
