// src/app/dashboard/assistant/identity/page.tsx

'use client';

import { useEffect, useState } from 'react';
import MobilePageHeader from '../../_components/MobilePageHeader';
import AssistantSectionMenu from '../_components/AssistantSectionMenu';
import { Orb } from '@/components/Orb';
import { OrbLarge } from '@/components/OrbLarge';

const DEFAULTS = {
  name: 'Tiko',
  role: 'Customer Support',
  iconDataUrl: '',
  launcherAppearance: 'orb',
  chatAppearance: 'orb',
  voiceAppearance: 'orb',
  greeting:
    "Hi! I'm here if you need help with products, orders, shipping, or returns.",
  tone: 'Friendly',
  responseStyle: 'Helpful',
  sellingStyle: 'Recommend when helpful',
  voiceStyle: 'Natural conversation',
};

function ChoiceGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="id-field">
      <div className="id-label">{label}</div>

      <div className="id-optionGrid">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`id-option ${value === option ? 'active' : ''}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

type LauncherAppearance = 'orb' | 'avatar' | 'bubble';
type AssistantAppearance = 'orb' | 'avatar';
type AppearanceValue = LauncherAppearance | AssistantAppearance;

function AppearancePreview({
  kind,
  size,
  avatarUrl,
}: {
  kind: AppearanceValue;
  size: 'launcher' | 'chat' | 'voice';
  avatarUrl: string;
}) {
  // Launcher and Chat use the same smaller preview.
  // Voice uses the former Launcher size.
  const boxSize = 32;

  if (kind === 'bubble') {
    return (
      <span
        className="id-appearanceBubble"
        aria-hidden="true"
        style={{
          width: boxSize,
          height: boxSize,
          flex: `0 0 ${boxSize}px`,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3.2a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 10h8M8 13.5h5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  if (kind === 'avatar' && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        aria-hidden="true"
        style={{
          width: boxSize,
          height: boxSize,
          flex: `0 0 ${boxSize}px`,
          borderRadius: '999px',
          objectFit: 'cover',
          display: 'block',
          border: '1px solid #e5e7eb',
          background: '#ffffff',
        }}
      />
    );
  }

  if (kind === 'avatar') {
    return (
      <span
        className="id-appearanceAvatarPlaceholder"
        aria-hidden="true"
        style={{
          width: boxSize,
          height: boxSize,
          flex: `0 0 ${boxSize}px`,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="8"
            r="4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M4.5 20c.8-4.1 3.3-6.2 7.5-6.2s6.7 2.1 7.5 6.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  const sourceSize = size === 'voice' ? 260 : 220;
const scale = boxSize / sourceSize;

  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: boxSize,
        height: boxSize,
        flex: `0 0 ${boxSize}px`,
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: sourceSize,
          height: sourceSize,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {size === 'voice' ? (
          <OrbLarge state="idle" />
        ) : (
          <Orb state="idle" tiltX={0} tiltY={0} />
        )}
      </span>
    </span>
  );
}

function AppearanceChoices({
  label,
  helper,
  value,
  options,
  avatarUrl,
  size,
  assistantName,
  onChange,
}: {
  label: string;
  helper: string;
  value: AppearanceValue;
  options: Array<{
    value: AppearanceValue;
    title: string;
  }>;
  avatarUrl: string;
  size: 'launcher' | 'chat' | 'voice';
  assistantName: string;
  onChange: (value: AppearanceValue) => void;
}) {
return (
  <div className="id-appearanceGroup">
    <div>
      <div className="id-label">{label}</div>

      {helper ? (
        <span className="id-helper">{helper}</span>
      ) : null}
    </div>

      <div className="id-appearanceList">
        {options.map((option) => {
          const disabled = option.value === 'avatar' && !avatarUrl;
          const selected = value === option.value;

          const displayTitle =
            option.value === 'avatar' && avatarUrl
              ? assistantName
              : option.title;

          return (
<button
  key={option.value}
  type="button"
  className={`id-appearanceRow ${
    selected ? 'active' : ''
  }`}
  disabled={disabled}
  aria-pressed={selected}
  onClick={() => onChange(option.value)}
>
  <AppearancePreview
    kind={option.value}
    size={size}
    avatarUrl={avatarUrl}
  />

  <span className="id-appearanceName">
    {displayTitle}
  </span>

  <span className="id-appearanceRadio" aria-hidden="true">
    {selected ? <span /> : null}
  </span>
</button>
          );
        })}
      </div>
    </div>
  );
}

export default function IdentityPage() {
  const [name, setName] = useState(DEFAULTS.name);
  const [role, setRole] = useState(DEFAULTS.role);
  const [greeting, setGreeting] = useState(DEFAULTS.greeting);
  const [tone, setTone] = useState(DEFAULTS.tone);
  const [responseStyle, setResponseStyle] = useState(DEFAULTS.responseStyle);
  const [sellingStyle, setSellingStyle] = useState(DEFAULTS.sellingStyle);
  const [voiceStyle, setVoiceStyle] = useState(DEFAULTS.voiceStyle);
  const [saving, setSaving] = useState(false);

  const assistantName = name.trim() || 'Your assistant';
  const assistantRole = role.trim() || 'Customer Support';
  const [iconDataUrl, setIconDataUrl] = useState(DEFAULTS.iconDataUrl);
  const [launcherAppearance, setLauncherAppearance] =
    useState<LauncherAppearance>('orb');
  const [chatAppearance, setChatAppearance] =
    useState<AssistantAppearance>('orb');
  const [voiceAppearance, setVoiceAppearance] =
    useState<AssistantAppearance>('orb');

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const settings = data?.settings || {};

        setName(settings.tz_assistant_name || DEFAULTS.name);
        setRole(settings.tz_assistant_role || DEFAULTS.role);
        setIconDataUrl(settings.tz_assistant_icon_data_url || DEFAULTS.iconDataUrl);
        setLauncherAppearance(
          settings.tz_launcher_appearance === 'avatar' ||
            settings.tz_launcher_appearance === 'bubble'
            ? settings.tz_launcher_appearance
            : 'orb'
        );
        setChatAppearance(
          settings.tz_chat_appearance === 'avatar' ? 'avatar' : 'orb'
        );
        setVoiceAppearance(
          settings.tz_voice_appearance === 'avatar' ? 'avatar' : 'orb'
        );
        setGreeting(settings.tz_assistant_greeting || DEFAULTS.greeting);
        setTone(settings.tz_ai_tone || DEFAULTS.tone);
        setResponseStyle(settings.tz_ai_response_style || DEFAULTS.responseStyle);
        setSellingStyle(settings.tz_ai_product_behavior || DEFAULTS.sellingStyle);
        setVoiceStyle(settings.tz_voice_response_style || DEFAULTS.voiceStyle);
      })
      .catch(() => {});
  }, []);

function handleIconUpload(file: File | null) {
  if (!file) return;

  const reader = new FileReader();

reader.onload = () => {
  const nextIcon = String(reader.result || '');

  setIconDataUrl(nextIcon);

  if (nextIcon) {
    setLauncherAppearance('avatar');
    setChatAppearance('avatar');
    setVoiceAppearance('avatar');
  }
};

  reader.readAsDataURL(file);
}

  async function saveIdentity() {
    setSaving(true);

    try {
      const raw = localStorage.getItem('tz_settings_cache');
      const cached = raw ? JSON.parse(raw) : {};

      const nextSettings = {
        ...cached,
        tz_assistant_name: name,
        tz_assistant_icon_data_url: iconDataUrl,
        tz_launcher_appearance: launcherAppearance,
        tz_chat_appearance: chatAppearance,
        tz_voice_appearance: voiceAppearance,
        tz_assistant_role: role,
        tz_assistant_greeting: greeting,
        tz_ai_tone: tone,
        tz_ai_response_style: responseStyle,
        tz_ai_product_behavior: sellingStyle,
        tz_voice_response_style: voiceStyle,
      };

      localStorage.setItem('tz_settings_cache', JSON.stringify(nextSettings));

      Object.entries(nextSettings).forEach(([key, value]) => {
        localStorage.setItem(key, String(value));
      });

const response = await fetch('/api/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ settings: nextSettings }),
});

if (!response.ok) {
  throw new Error('Could not save assistant identity.');
}

localStorage.setItem(
  'tz_assistant_name',
  name.trim() || 'Your assistant'
);

window.dispatchEvent(new Event('tz-settings-change'));

alert(`${assistantName}'s identity has been updated.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="db-container">
      <MobilePageHeader
  title="Identity"
  rightAction={<AssistantSectionMenu />}
/>

      <div className="db-pageStack id-page">
<div className="id-pageHeader">
  <div>
    <h1 className="db-title">Identity</h1>
    <p className="db-sub">Where your assistant begins.</p>
  </div>

  <div className="id-desktopSwitcher">
    <AssistantSectionMenu />
  </div>
</div>

        <section className="id-card id-meetCard">
          <h2>Meet {assistantName}</h2>

{iconDataUrl ? (
  <img
    className="id-customIcon"
    src={iconDataUrl}
    alt={`${assistantName} icon`}
  />
) : (
<div className="id-orbPreview" aria-hidden="true">
  <Orb state="idle" tiltX={0} tiltY={0} />
</div>
)}

          <strong>{assistantName}</strong>
          <p>{assistantRole}</p>
        </section>

        <section className="id-card">
          <h2>Identity</h2>

          <label className="id-field">
            <span className="id-label">Name</span>
            <span className="id-helper">Customers will see this name.</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

<div className="id-field">
  <span className="id-label">Profile photo</span>
  <span className="id-helper">
    Your customers will see this photo when talking to {assistantName}.
  </span>

<div className="id-photoBox">
  <div className="id-photoPreview">
    {iconDataUrl ? (
      <img
        className="id-photoImage"
        src={iconDataUrl}
        alt={`${assistantName} profile photo`}
      />
    ) : (
      <div className="id-photoOrbPreview" aria-hidden="true">
        <Orb state="idle" tiltX={0} tiltY={0} />
      </div>
    )}
  </div>

  <div className="id-photoText">
    <strong>{iconDataUrl ? assistantName : 'Default'}</strong>
    <span>
      {iconDataUrl
        ? 'Custom profile photo is active.'
        : 'Use the default Orb, or upload your own image.'}
    </span>
  </div>

  <label className="id-uploadButton">
    {iconDataUrl ? 'Change photo' : 'Upload photo'}
    <input
      type="file"
      accept="image/png,image/jpeg,image/webp,image/svg+xml"
      onChange={(e) => handleIconUpload(e.target.files?.[0] || null)}
    />
  </label>
</div>

{iconDataUrl ? (
  <button
    type="button"
    className="id-useOrbButton"
    onClick={() => {
      setIconDataUrl('');
      setLauncherAppearance('orb');
      setChatAppearance('orb');
      setVoiceAppearance('orb');
    }}
  >
    Use Tiko Orb instead
  </button>
) : null}

  <span className="id-helper">
    Recommended: square image, PNG/JPG/WEBP, 512×512 or larger.
  </span>
</div>

<ChoiceGroup
  label="Role"
  value={role}
  options={[
    'Customer Support',
    'Sales Assistant',
  ]}
  onChange={setRole}
/>

          <label className="id-field">
            <span className="id-label">First greeting</span>
            <span className="id-helper">
              The first message customers receive.
            </span>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
            />
          </label>
        </section>

        <section className="id-card">
          <h2>Appearance</h2>
          <p className="id-cardIntro">
            Choose what customers see when they chat and speak with
            your assistant.
          </p>

<AppearanceChoices
  label="Launcher"
  helper=""
  value={launcherAppearance}
  options={[
    {
      value: 'orb',
      title: 'Default',
    },
    {
      value: 'avatar',
      title: 'Assistant photo',
    },
    {
      value: 'bubble',
      title: 'Chat bubble',
    },
  ]}
  avatarUrl={iconDataUrl}
  size="launcher"
  assistantName={assistantName}
  onChange={(value) =>
    setLauncherAppearance(value as LauncherAppearance)
  }
/>

<AppearanceChoices
  label="Chat"
  helper=""
  value={chatAppearance}
  options={[
    {
      value: 'orb',
      title: 'Default',
    },
    {
      value: 'avatar',
      title: 'Assistant photo',
    },
  ]}
  avatarUrl={iconDataUrl}
  size="chat"
  assistantName={assistantName}
  onChange={(value) =>
    setChatAppearance(value as AssistantAppearance)
  }
/>

<AppearanceChoices
  label="Voice"
  helper=""
  value={voiceAppearance}
  options={[
    {
      value: 'orb',
      title: 'Default',
    },
    {
      value: 'avatar',
      title: 'Assistant photo',
    },
  ]}
  avatarUrl={iconDataUrl}
  size="voice"
  assistantName={assistantName}
  onChange={(value) =>
    setVoiceAppearance(value as AssistantAppearance)
  }
/>
        </section>

        <section className="id-card">
          <h2>Personality</h2>

          <ChoiceGroup
            label="Tone"
            value={tone}
            options={['Friendly', 'Professional', 'Warm', 'Luxury boutique', 'Casual']}
            onChange={setTone}
          />

          <ChoiceGroup
            label="Response style"
            value={responseStyle}
            options={['Helpful', 'Concise', 'Natural', 'Detailed when helpful']}
            onChange={setResponseStyle}
          />

          <ChoiceGroup
            label="Selling style"
            value={sellingStyle}
            options={[
              'Only answer questions',
              'Recommend when helpful',
              'Soft recommendation',
              'Actively recommend products',
            ]}
            onChange={setSellingStyle}
          />

          <ChoiceGroup
            label="Voice style"
            value={voiceStyle}
            options={[
              'Short & concise',
              'Natural conversation',
              'Calm and supportive',
              'Detailed & supportive',
            ]}
            onChange={setVoiceStyle}
          />
        </section>

        <div className="id-footerActions">
          <button
            type="button"
            className="id-save"
            onClick={saveIdentity}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <p>
            Your assistant will continue to grow through Store Knowledge,
            Learning Bank, Experience Bank, and Memory.
          </p>
        </div>
      </div>

      <style jsx>{`
        .id-page {
          max-width: 760px;
          margin: 0 auto;
        }

        .id-pageHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.id-desktopSwitcher {
  flex: 0 0 auto;
}
        .id-principle {
          display: grid;
          grid-template-columns: 46px 1fr;
          gap: 14px;
          align-items: start;
          background: #111827;
          color: #ffffff;
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
        }

        .id-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 18px;
          display: grid;
          gap: 16px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }

        .id-card h2 {
          margin: 0;
          font-size: 18px;
          color: #111827;
        }

.id-meetCard {
  text-align: center;
  justify-items: center;
  gap: 8px;
  padding: 18px;
}

.id-meetCard h2 {
  justify-self: start;
  text-align: left;
}

.id-customIcon {
  width: 86px;
  height: 86px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12);
}

.id-photoBox {
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 18px;
  padding: 14px;
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 12px;
  align-items: center;
}

.id-photoPreview {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.id-photoImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.id-photoOrb {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 35% 28%, rgba(255,255,255,.95), rgba(255,255,255,.18) 24%, transparent 36%),
    radial-gradient(circle at 62% 68%, rgba(59,130,246,.72), transparent 36%),
    linear-gradient(135deg, #7c3aed, #2563eb 54%, #06b6d4);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22);
  position: relative;
}

.id-photoOrb span {
  position: absolute;
  inset: 12%;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.32);
}

.id-photoText {
  min-width: 0;
}

.id-photoText strong {
  display: block;
  color: #111827;
  font-size: 14px;
  font-weight: 900;
}

.id-photoText span {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.id-useOrbButton {
  width: fit-content;
  border: none;
  background: transparent;
  color: #64748b;
  padding: 2px 0;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.id-useOrbButton:hover {
  color: #111827;
  text-decoration: underline;
}

.id-uploadButton,
  border: none;
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}

.id-uploadButton {
  background: #111827;
  color: #ffffff;
}

.id-uploadButton input {
  display: none;
}

.id-resetButton {
  background: #ffffff;
  color: #475569;
  border: 1px solid #e5e7eb;
}

        .id-orb {
          width: 86px;
          height: 86px;
          border-radius: 999px;
          background:
            radial-gradient(circle at 35% 28%, rgba(255,255,255,.95), rgba(255,255,255,.18) 24%, transparent 36%),
            radial-gradient(circle at 62% 68%, rgba(59,130,246,.72), transparent 36%),
            linear-gradient(135deg, #7c3aed, #2563eb 54%, #06b6d4);
          box-shadow:
            0 18px 34px rgba(37, 99, 235, 0.28),
            inset 0 0 18px rgba(255, 255, 255, 0.35);
          position: relative;
          margin: 2px 0 4px;
        }

        .id-orb span {
          position: absolute;
          inset: 12%;
          border-radius: inherit;
          border: 1px solid rgba(255, 255, 255, 0.32);
        }

        .id-meetCard strong {
          color: #111827;
          font-size: 26px;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .id-meetCard p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
        }

        .id-field {
          display: grid;
          gap: 8px;
        }

        .id-label {
          display: block;
          font-size: 12px;
          font-weight: 900;
          color: #475569;
        }

        .id-helper {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.35;
        }

        input,
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          background: #ffffff;
          border-radius: 14px;
          padding: 12px;
          font-size: 14px;
          color: #111827;
          outline: none;
        }

        textarea {
          min-height: 120px;
          resize: vertical;
          line-height: 1.5;
        }

        input:focus,
        textarea:focus {
          border-color: #111827;
        }

        :global(.id-optionGrid) {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

.id-option {
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 14px;
  padding: 10px 12px;
  color: #475569;
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;
  text-align: left;
  min-height: 42px;
}

.id-option:hover {
  border-color: #cbd5e1;
  color: #111827;
  background: #ffffff;
}

.id-option.active {
  background: #111827;
  border-color: #111827;
  color: #ffffff;
}


        .id-cardIntro {
          margin: -6px 0 2px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.55;
        }

:global(.id-appearanceGroup) {
  display: grid;
  gap: 8px;
  padding-top: 4px;
}

:global(.id-appearanceGroup + .id-appearanceGroup) {
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid #eef2f7;
}

:global(.id-appearanceList) {
  width: 100%;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
}

:global(.id-appearanceRow) {
  width: 100% !important;
  min-width: 0 !important;
  min-height: 52px !important;
  box-sizing: border-box !important;

  display: grid !important;
  grid-template-columns: 26px minmax(0, 1fr) 18px !important;
  align-items: center !important;
  gap: 10px !important;

  padding: 9px 12px !important;
  border: none !important;
  border-bottom: 1px solid #eef2f7 !important;
  border-radius: 0 !important;

  background: #ffffff !important;
  color: #475569 !important;
  text-align: left !important;
  box-shadow: none !important;
  cursor: pointer !important;
}

:global(.id-appearanceRow:last-child) {
  border-bottom: none !important;
}

:global(.id-appearanceRow:hover:not(:disabled)) {
  background: #f8fafc !important;
  color: #111827 !important;
}

:global(.id-appearanceRow.active) {
  background: #f8fafc !important;
  color: #111827 !important;
}

:global(.id-appearanceRow:disabled) {
  cursor: not-allowed !important;
  opacity: 0.52 !important;
}

:global(.id-appearanceName) {
  min-width: 0;
  color: inherit;
  font-size: 13px;
  font-weight: 850;
  line-height: 1.3;
}

:global(.id-appearanceRadio) {
  width: 16px;
  height: 16px;
  box-sizing: border-box;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border: 1.5px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
}

:global(.id-appearanceRow.active .id-appearanceRadio) {
  border-color: #6366f1;
}

:global(.id-appearanceRadio span) {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #6366f1;
}

:global(.id-appearanceAvatar),
:global(.id-appearanceAvatarPlaceholder),
:global(.id-appearanceBubble) {
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  box-sizing: border-box;
}

:global(.id-appearanceAvatar) {
  display: block;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  object-fit: cover;
}

:global(.id-appearanceAvatarPlaceholder) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #cbd5e1;
  border-radius: 999px;
  background: #f8fafc;
  color: #94a3b8;
}

:global(.id-appearanceAvatarPlaceholder svg) {
  width: 18px;
  height: 18px;
}

:global(.id-appearanceBubble) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
  box-shadow: none;
}

:global(.id-appearanceBubble svg) {
  width: 19px;
  height: 19px;
  display: block;
}
        .id-footerActions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .id-save {
          width: fit-content;
          border: none;
          background: #111827;
          color: #ffffff;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .id-save:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .id-footerActions p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .db-pageStack.id-page {
            padding: 0 12px 24px;
          }

          .id-desktopSwitcher {
  display: none;
}
          .id-principle {
            grid-template-columns: 1fr;
          }

          :global(.id-optionGrid) {
  grid-template-columns: 1fr;
}

.id-photoBox {
  grid-template-columns: 64px 1fr;
}

.id-uploadButton {
  grid-column: 1 / -1;
  width: 100%;
  text-align: center;
}

          .id-footerActions {
            display: grid;
          }
        }

:global(.id-option) {
  border: 1px solid #e5e7eb !important;
  background: #f8fafc !important;
  color: #475569 !important;
  border-radius: 14px !important;
  padding: 10px 12px !important;
  font-size: 13px !important;
  font-weight: 850 !important;
  cursor: pointer !important;
  text-align: left !important;
  min-height: 42px !important;
}

:global(.id-option:hover) {
  border-color: #cbd5e1 !important;
  background: #ffffff !important;
  color: #111827 !important;
}

:global(.id-option.active) {
  background: #111827 !important;
  border-color: #111827 !important;
  color: #ffffff !important;
}

.id-orbPreview {
  width: 86px;
  height: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.id-orbPreview :global(*) {
  max-width: 100%;
  max-height: 100%;
}

.id-photoOrbPreview {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.id-photoOrbPreview :global(*) {
  max-width: 100%;
  max-height: 100%;
}
      `}</style>
    </div>
  );
}