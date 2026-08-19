// src/app/dashboard/assistant/_components/AssistantSectionMenu.tsx

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const sections = [
  {
    icon: '⭐',
    label: 'Identity',
    href: '/dashboard/assistant/identity',
  },
  {
    icon: '💬',
    label: 'Test & Coach',
    href: '/dashboard/assistant/practice',
  },
  {
    icon: '📓',
    label: 'Memory',
    href: '/dashboard/assistant/memory',
  },
];

export default function AssistantSectionMenu() {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current =
    sections.find(
      (section) =>
        pathname === section.href || pathname.startsWith(`${section.href}/`)
    ) || sections[0];

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="assistant-switcher" ref={menuRef}>
      <button
        type="button"
        className="assistant-switcherButton"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch assistant section"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="assistant-switcherDesktop">
          Assistant
          <span className="assistant-switcherChevron" aria-hidden="true">
            ▾
          </span>
        </span>

        <span className="assistant-switcherMobile" aria-hidden="true">
          ⋮
        </span>
      </button>

      {open ? (
        <div className="assistant-switcherMenu" role="menu">
          <div className="assistant-switcherTitle">Assistant</div>

          {sections.map((section) => {
            const active = section.href === current.href;

            return (
              <Link
                key={section.href}
                href={section.href}
                role="menuitem"
                className={[
                  'assistant-switcherItem',
                  active ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="assistant-switcherIcon" aria-hidden="true">
                  {section.icon}
                </span>

                <span>{section.label}</span>

                {active ? (
                  <span className="assistant-switcherCheck" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}

      <style jsx>{`
        .assistant-switcher {
          position: relative;
          flex: 0 0 auto;
        }

.assistant-switcherButton {
  min-height: 34px;
  border: none;
  background: transparent;
  color: #374151;
  border-radius: 10px;
  padding: 6px 8px;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: none;
}

.assistant-switcherButton:hover {
  background: #f1f5f9;
  color: #111827;
}

        .assistant-switcherDesktop {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

.assistant-switcherChevron {
  color: #64748b;
  font-size: 15px;
  line-height: 1;
}

        .assistant-switcherMobile {
          display: none;
          font-size: 20px;
          line-height: 1;
          letter-spacing: 1px;
        }

.assistant-switcherMenu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  width: 190px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  padding: 8px;
  box-shadow: 0 20px 55px rgba(15, 23, 42, 0.16);
}

        .assistant-switcherTitle {
          padding: 7px 10px 8px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

.assistant-switcherItem {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 42px;
  box-sizing: border-box;
  border-radius: 11px;
  padding: 7px 9px;
  color: #475569;
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
}

.assistant-switcherItem > span:nth-child(2) {
  flex: 1;
  min-width: 0;
}

        .assistant-switcherItem:hover {
          background: #f8fafc;
          color: #111827;
        }

        .assistant-switcherItem.is-active {
          background: #f1f5f9;
          color: #111827;
        }

.assistant-switcherIcon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
}

.assistant-switcherCheck {
  margin-left: auto;
  color: #16a34a;
  font-size: 13px;
  font-weight: 900;
}

        @media (max-width: 900px) {
.assistant-switcherButton {
  width: 40px;
  height: 40px;
  min-height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 10px;
  transform: translateX(-10px);
}

          .assistant-switcherDesktop {
            display: none;
          }

.assistant-switcherMobile {
  display: block;
  font-size: 26px;
  line-height: 1;
  letter-spacing: 1px;
}

.assistant-switcherMenu {
  position: fixed;
  top: 54px;
  right: 16px;
  width: 190px;
}
        }
      `}</style>
    </div>
  );
}