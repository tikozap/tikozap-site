// src/app/dashboard/widget/test/widget-test-client.tsx

'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import MobilePageHeader from '../../_components/MobilePageHeader';

type TestMessage = {
  id: string;
  role: 'customer' | 'assistant';
  content: string;
};

type PanelPosition = {
  x: number;
  y: number;
};

type DragState = {
  dragging: boolean;
  startX: number;
  startY: number;
  startPanelX: number;
  startPanelY: number;
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function WidgetTestClient({
  widgetPublicKey,
  allowedDomains,
  shopifyConnected,
}: {
  widgetPublicKey: string;
  allowedDomains: string[];
  shopifyConnected: boolean;
}) {
  const [origin, setOrigin] = useState('');

  const [domainsText, setDomainsText] = useState(
    (allowedDomains || []).join('\n')
  );
  const [savingDomains, setSavingDomains] = useState(false);
  const [domainsMsg, setDomainsMsg] = useState('');

  const [testOpen, setTestOpen] = useState(false);
  const [testMinimized, setTestMinimized] = useState(false);
  const [testText, setTestText] = useState('');
  const [testBusy, setTestBusy] = useState(false);
  const [testError, setTestError] = useState('');
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [assistantName, setAssistantName] = useState('Assistant');

  const [shopifyConnectOpen, setShopifyConnectOpen] =
  useState(false);

  const [shopifyShop, setShopifyShop] =
  useState("");
  const [shopifyConnectedSuccess, setShopifyConnectedSuccess] =
  useState(false);
  const [shopifyDisconnecting, setShopifyDisconnecting] =
  useState(false);

  const [shopifyDisconnectError, setShopifyDisconnectError] =
  useState("");

  const [testPanelPos, setTestPanelPos] = useState<PanelPosition>({
    x: 24,
    y: 110,
  });

  const dragRef = useRef<DragState>({
    dragging: false,
    startX: 0,
    startY: 0,
    startPanelX: 0,
    startPanelY: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  setOrigin(window.location.origin);

  const url = new URL(window.location.href);
  const shopifyResult = url.searchParams.get('shopify');

  if (shopifyResult === 'connected') {
    setShopifyConnectedSuccess(true);

    url.searchParams.delete('shopify');

    const cleanUrl = `${url.pathname}${url.search}${url.hash}`;

    window.history.replaceState(
      {},
      '',
      cleanUrl
    );
  }
}, []);

  useEffect(() => {
    if (!testOpen || testMinimized) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [testMessages, testBusy, testOpen, testMinimized]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', moveTestDrag);
      window.removeEventListener('mouseup', stopTestDrag);
    };
  }, []);

  const installScript = useMemo(() => {
    const src = origin
      ? `${origin}/widget.js`
      : 'https://js.tikozap.com/widget.js';

    return `<script
  src="${src}"
  data-tikozap-key="${widgetPublicKey}"
></script>`;
  }, [origin, widgetPublicKey]);

  const designerInstructions = `Please install TikoZap on our website.

Add this script to the website footer, just before the closing </body> tag:

${installScript}

If the website uses a builder, place it in Custom Code / Footer Code / Body End.

After publishing, please confirm the TikoZap chat bubble appears in the bottom-right corner of the website.`;

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert(message);
    } catch {
      alert('Could not copy.');
    }
  }

  async function saveAllowedDomains() {
    setSavingDomains(true);
    setDomainsMsg('');

    try {
      const res = await fetch('/api/widget/settings', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          allowedDomainsText: domainsText,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error || 'Could not save allowed domains.'
        );
      }

      const nextDomains = Array.isArray(data?.widget?.allowedDomains)
        ? data.widget.allowedDomains
        : [];

      setDomainsText(nextDomains.join('\n'));
      setDomainsMsg('Allowed domains saved.');
    } catch (error: any) {
      setDomainsMsg(
        error?.message || 'Could not save allowed domains.'
      );
    } finally {
      setSavingDomains(false);
    }
  }

function openWidgetTest() {
  window.location.href =
    '/dashboard/conversations?widgetTest=1';
}

  function closeWidgetTest() {
    setTestOpen(false);
    setTestMinimized(false);
    setTestText('');
    setTestError('');
    setTestBusy(false);
    setTestMessages([]);
    setAssistantName('Assistant');
  }

  async function sendWidgetTest(customText?: string) {
    const text = (customText ?? testText).trim();

    if (!text || testBusy) return;

    const existingHistory = testMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const customerMessage: TestMessage = {
      id: createMessageId(),
      role: 'customer',
      content: text,
    };

    setTestMessages((current) => [
      ...current,
      customerMessage,
    ]);
    setTestText('');
    setTestError('');
    setTestBusy(true);

    try {
      const res = await fetch('/api/widget/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          text,
          history: existingHistory,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error || 'Could not test the widget.'
        );
      }

      if (data?.assistantName) {
        setAssistantName(String(data.assistantName));
      }

      const assistantMessage: TestMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: String(data?.reply || '').trim(),
      };

      setTestMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error: any) {
      setTestError(
        error?.message || 'Could not test the widget.'
      );
    } finally {
      setTestBusy(false);
    }
  }

  function moveTestDrag(event: MouseEvent) {
    if (!dragRef.current.dragging) return;

    const nextX =
      dragRef.current.startPanelX +
      event.clientX -
      dragRef.current.startX;

    const nextY =
      dragRef.current.startPanelY +
      event.clientY -
      dragRef.current.startY;

    const panelWidth = Math.min(380, window.innerWidth - 32);
    const panelHeight = 300;

    setTestPanelPos({
      x: Math.min(
        Math.max(16, nextX),
        Math.max(16, window.innerWidth - panelWidth - 16)
      ),
      y: Math.min(
        Math.max(16, nextY),
        Math.max(16, window.innerHeight - panelHeight)
      ),
    });
  }

  function stopTestDrag() {
    dragRef.current.dragging = false;

    window.removeEventListener('mousemove', moveTestDrag);
    window.removeEventListener('mouseup', stopTestDrag);
  }

  function startTestDrag(event: ReactMouseEvent<HTMLDivElement>) {
    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startPanelX: testPanelPos.x,
      startPanelY: testPanelPos.y,
    };

    window.addEventListener('mousemove', moveTestDrag);
    window.addEventListener('mouseup', stopTestDrag);
  }

  function renderWidgetTest() {
    if (!testOpen) return null;

    if (testMinimized) {
      return (
        <button
          type="button"
          onClick={() => setTestMinimized(false)}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            zIndex: 9999,
            border: '1px solid rgba(255,255,255,.18)',
            borderRadius: 999,
            padding: '12px 16px',
            background: '#111827',
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
            boxShadow:
              '0 16px 40px rgba(15, 23, 42, 0.28)',
            cursor: 'pointer',
          }}
        >
          Test widget
        </button>
      );
    }

    return (
      <div
        style={{
          position: 'fixed',
          left: testPanelPos.x,
          top: testPanelPos.y,
          zIndex: 9999,
          width: 380,
          maxWidth: 'calc(100vw - 32px)',
maxHeight: 'calc(100vh - 32px)',
          overflow: 'hidden',
          borderRadius: 22,
          border: '1px solid #e5e7eb',
          background: '#fff',
          boxShadow:
            '0 24px 70px rgba(15, 23, 42, 0.22)',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          onMouseDown={startTestDrag}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              Test your widget
            </div>

            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                fontSize: 13,
                color: '#64748b',
                lineHeight: 1.55,
              }}
            >
              Ask a shopper-style question and preview
              exactly what customers will experience on
              your website.
            </p>
          </div>

          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={closeWidgetTest}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

{testMessages.length > 0 || testBusy ? (
  <div
    style={{
      marginTop: 14,
      height: 220,
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      background: '#f8fafc',
      padding: 12,
      flexShrink: 0,
    }}
  >
            {testMessages.map((message) => {
              const isCustomer = message.role === 'customer';

              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: isCustomer
                      ? 'flex-end'
                      : 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '86%',
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#64748b',
                        textAlign: isCustomer
                          ? 'right'
                          : 'left',
                      }}
                    >
                      {isCustomer
                        ? 'Customer'
                        : assistantName}
                    </div>

                    <div
                      style={{
                        borderRadius: 14,
                        padding: '10px 12px',
                        background: isCustomer
                          ? '#111827'
                          : '#ffffff',
                        color: isCustomer
                          ? '#ffffff'
                          : '#111827',
                        border: isCustomer
                          ? 'none'
                          : '1px solid #e5e7eb',
                        fontSize: 13,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {testBusy ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      marginBottom: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#64748b',
                    }}
                  >
                    {assistantName}
                  </div>

                  <div
                    style={{
                      borderRadius: 14,
                      padding: '10px 12px',
                      background: '#ffffff',
                      color: '#64748b',
                      border: '1px solid #e5e7eb',
                      fontSize: 13,
                    }}
                  >
                    Thinking…
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        ) : null}

        <textarea
          value={testText}
          onChange={(event) =>
            setTestText(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey
            ) {
              event.preventDefault();
              void sendWidgetTest();
            }
          }}
          placeholder="Type as a customer…"
          rows={2}
style={{
  marginTop: 14,
  height: 72,
  minHeight: 72,
  maxHeight: 72,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  background: '#f8fafc',
  padding: 12,
  flexShrink: 0,
}}
        />

        {testError ? (
          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              fontSize: 13,
              color: '#b91c1c',
            }}
          >
            {testError}
          </p>
        ) : null}

        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <button
            type="button"
            className="db-btn"
            onClick={() => setTestMinimized(true)}
          >
            Minimize
          </button>

          <button
            type="button"
            className="db-btn primary"
            disabled={testBusy || !testText.trim()}
            onClick={() => sendWidgetTest()}
          >
            {testBusy
              ? 'Sending…'
              : testMessages.length > 0
                ? 'Send'
                : 'Start test'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MobilePageHeader title="Widget" />

      <div className="db-top">
        <div>
          <h1 className="db-title">Widget</h1>

          <p className="db-sub">
            Add web chat widget to your website.
          </p>
        </div>
      </div>

      <div className="db-pageStack">
        <section className="db-card">
          <div className="db-cardTitle">
            Option 1 - Add widget by yourself
          </div>

          <p className="db-cardText">
            Copy the script below and paste it into your
            website footer, just before the closing
            &lt;/body&gt; tag.
          </p>

          <p
            className="db-cardText"
            style={{
              marginTop: 8,
            }}
          >
            If you use Shopify, WordPress, Wix,
            Squarespace, or another website builder, look
            for Custom Code, Footer Code, or Body End.
          </p>

          <pre
            style={{
              marginTop: 14,
              overflow: 'auto',
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 12,
              fontSize: 12,
              whiteSpace: 'pre-wrap',
            }}
          >
            {installScript}
          </pre>

          <div
            style={{
              marginTop: 14,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              className="db-btn primary"
              onClick={() =>
                copyText(
                  installScript,
                  'Install script copied.'
                )
              }
            >
              Copy install script
            </button>
          </div>

          <p
            className="db-cardText"
            style={{
              marginTop: 12,
            }}
          >
            Need help? Send the installation instructions
            to your web designer below.
          </p>
        </section>

        <section className="db-card">
          <div className="db-cardTitle">
            Option 2 - Send to your web designer
          </div>

          <p className="db-cardText">
            Copy simple instructions you can forward to
            the person who manages your website.
          </p>

          <button
            className="db-btn primary"
            style={{
              marginTop: 14,
            }}
            onClick={() =>
              copyText(
                designerInstructions,
                'Instructions copied.'
              )
            }
          >
            Copy instructions
          </button>
        </section>

<section className="db-card">
  <div className="db-cardTitle">Shopify</div>

  <p className="db-cardText">
    Connect your Shopify store so your assistant can
    answer product questions using your live catalog.
  </p>

  {shopifyConnected ? (
<div
  role="status"
  aria-live="polite"
  style={{
    marginTop: 14,
    padding: '12px 14px',
    border: '1px solid #bbf7d0',
    borderRadius: 10,
    background: '#f0fdf4',
    color: '#166534',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.45,
  }}
>
  {shopifyConnectedSuccess
    ? 'Shopify connected successfully!'
    : 'Shopify connected'}

  <div
    style={{
      marginTop: 3,
      fontWeight: 400,
    }}
  >
    Your assistant can answer questions using
    your live Shopify catalog.
  </div>

  <button
    type="button"
    className="db-btn db-btnSecondary"
    style={{ marginTop: 12 }}
    disabled={shopifyDisconnecting}
    onClick={async () => {
      const confirmed = window.confirm(
        "Disconnect Shopify from this TikoZap store?"
      );

      if (!confirmed) return;

      setShopifyDisconnecting(true);
      setShopifyDisconnectError("");

      try {
        const response = await fetch(
          "/api/shopify/disconnect",
          {
            method: "POST",
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error || "Unable to disconnect Shopify."
          );
        }

        window.location.reload();
      } catch (error) {
        setShopifyDisconnectError(
          error instanceof Error
            ? error.message
            : "Unable to disconnect Shopify."
        );
        setShopifyDisconnecting(false);
      }
    }}
  >
    {shopifyDisconnecting
      ? "Disconnecting…"
      : "Disconnect Shopify"}
  </button>

  {shopifyDisconnectError ? (
    <div
      style={{
        marginTop: 8,
        fontWeight: 400,
        color: "#b91c1c",
      }}
    >
      {shopifyDisconnectError}
    </div>
  ) : null}
</div>
  ) : (
    <button
      type="button"
      className="db-btn"
      style={{
        marginTop: 14,
      }}
      onClick={() => setShopifyConnectOpen(true)}
    >
      Connect Shopify
    </button>
  )}
</section>

        <section className="db-card">
          <div className="db-cardTitle">
            Allowed domains
          </div>

          <p className="db-cardText">
            Add the websites where this widget is allowed
            to run. Use one domain per line.
          </p>

          <textarea
            value={domainsText}
            onChange={(event) =>
              setDomainsText(event.target.value)
            }
            rows={4}
            placeholder={`yourstore.com\nwww.yourstore.com`}
            style={{
              marginTop: 14,
              width: '100%',
            }}
          />

          <div
            style={{
              marginTop: 12,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className="db-btn primary"
              onClick={saveAllowedDomains}
              disabled={savingDomains}
            >
              {savingDomains
                ? 'Saving…'
                : 'Save domains'}
            </button>

            <button
              type="button"
              className="db-btn"
              onClick={openWidgetTest}
            >
              Test widget
            </button>
          </div>

          {domainsMsg ? (
            <p className="db-cardText">
              {domainsMsg}
            </p>
          ) : null}
        </section>
      </div>

      {renderWidgetTest()}

{shopifyConnectOpen ? (
  <div
    role="presentation"
    onClick={() => setShopifyConnectOpen(false)}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      background: "rgba(15,23,42,.45)",
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: 460,
        borderRadius: 16,
        background: "#fff",
        padding: 24,
        boxShadow:
          "0 24px 60px rgba(15,23,42,.22)",
      }}
    >
      <div className="db-cardTitle">
        Connect Shopify
      </div>

      <p
        className="db-cardText"
        style={{ marginTop: 12 }}
      >
        Enter your Shopify store domain.
      </p>

      <input
        value={shopifyShop}
        onChange={(e) =>
          setShopifyShop(e.target.value)
        }
        placeholder="your-store.myshopify.com"
        autoFocus
        style={{
          width: "100%",
          marginTop: 16,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 22,
        }}
      >
        <button
          className="db-btn db-btnSecondary"
          onClick={() =>
            setShopifyConnectOpen(false)
          }
        >
          Cancel
        </button>

        <button
          className="db-btn"
          onClick={() => {
            const shop = shopifyShop.trim();

            if (!shop) return;

            window.location.href =
              `/api/shopify/connect?shop=${encodeURIComponent(
                shop
              )}`;
          }}
        >
          Continue
        </button>
      </div>
    </div>
  </div>
) : null}
    </div>
  );
}