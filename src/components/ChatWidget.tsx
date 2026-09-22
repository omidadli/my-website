import React, { useEffect, useState } from 'react';
import { Theme } from '../types';
import { AssistantPanel } from './mascot/AssistantPanel';
import { mascot } from './mascot/mascotBus';

/**
 * AssistantChat — mounts the mascot's chat panel. The old standalone chat
 * launcher is gone: the corner avatar IS the launcher now (click → panel).
 */
export const ChatWidget: React.FC<{ theme: Theme }> = ({ theme }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openChat = () => {
      setOpen(true);
      mascot.scene('wave', 2200);
    };
    window.addEventListener('nd:open-chat', openChat);
    return () => window.removeEventListener('nd:open-chat', openChat);
  }, []);

  // Escape closes the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <AssistantPanel theme={theme} open={open} onClose={() => setOpen(false)} />
      {/* while the panel is open, the corner avatar "walks into" the chat — hide it */}
      <style>{open ? '.mascot-root{opacity:0;pointer-events:none;transform:translateY(8px);transition:all .25s ease}' : '.mascot-root{opacity:1;transition:all .25s ease}'}</style>
    </>
  );
};
