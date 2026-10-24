import React, { useRef, useState } from 'react';

export interface NavigationTabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface NavigationTabsProps {
  items: NavigationTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
  size?: 'sm' | 'md';
  rounded?: boolean;
}

/**
 * NavigationTabs v4 — animated segmented control.
 * The active tab renders a sliding pill that glides between items,
 * with an animated gradient, a soft glow and a spring-like ease.
 */
export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  items,
  activeKey,
  onChange,
  className = '',
  size = 'md',
  rounded = false,
}) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [slider, setSlider] = useState<{ left: number; width: number } | null>(null);

  const updateSlider = (key: string) => {
    const list = listRef.current;
    if (!list) return;
    const index = items.findIndex((it) => it.key === key);
    const child = list.children[index] as HTMLElement | undefined;
    if (!child) return;
    setSlider({ left: child.offsetLeft, width: child.offsetWidth });
  };

  const activeIndex = items.findIndex((it) => it.key === activeKey);
  const pillWidth = slider?.width;
  const pillLeft = slider?.left;

  const isMd = size === 'md';

  return (
    <div
      ref={listRef}
      className={`kova-navtabs relative flex w-full select-none ${
        rounded ? 'rounded-full' : 'rounded-2xl'
      } bg-[#141824] border border-white/[0.06] ${isMd ? 'p-1' : 'p-0.5'} ${className}`}
    >
      {pillWidth !== undefined && pillLeft !== undefined && activeIndex >= 0 && (
        <div
          className={`kova-navtabs-pill absolute top-0.5 bottom-0.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 shadow-lg shadow-purple-500/30 ${
            rounded ? 'rounded-full' : 'rounded-xl'
          }`}
          style={{
            width: pillWidth,
            transform: `translateX(${pillLeft}px)`,
          }}
        />
      )}

      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onMouseEnter={() => !active && updateSlider(item.key)}
            onFocus={() => updateSlider(item.key)}
            onClick={() => {
              onChange(item.key);
              updateSlider(item.key);
            }}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 overflow-hidden text-xs font-bold whitespace-nowrap transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              rounded ? 'rounded-full' : 'rounded-xl'
            } ${isMd ? 'py-2' : 'py-1.5'} ${
              active ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};