'use client';

type Status = 'all' | 'open' | 'waiting' | 'closed';

type Props = {
  aiDefault: boolean;
  showArchived: boolean;
  status: Status;
  q: string;
  onResetInbox: () => void;
  onNewTestChat: () => void;
  onToggleAiDefault: () => void;
  onToggleArchived: () => void;
  onStatusChange: (status: Status) => void;
  onQueryChange: (value: string) => void;
};

export default function ConversationsHeader({
  aiDefault,
  showArchived,
  status,
  q,
  onResetInbox,
  onNewTestChat,
  onToggleAiDefault,
  onToggleArchived,
  onStatusChange,
  onQueryChange,
}: Props) {
  return (
    <header className="cx-header">
      {/* Top row: title + subtitle + search */}
      <div className="cx-headerTop">
        <div className="cx-headerMain">
          <h1 className="db-title">Conversations</h1>
        </div>

        <div className="cx-searchWrap">
          <input
            className="cx-searchInput"
            type="search"
            placeholder="Search (name, subject, tag)…"
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
      </div>

      {/* Second row: controls */}
      <div className="cx-toolbar">
        <div className="cx-toolbarLeft">
          {/* Demo-only utilities – compact and left-aligned */}
          <button
            type="button"
            className="db-btn db-btn--sm"
            onClick={onResetInbox}
          >
            Reset inbox
          </button>

          <button
            type="button"
            className="db-btn db-btn--sm"
            onClick={onNewTestChat}
          >
            New test chat
          </button>

          <button
            type="button"
            className="db-btn db-btn--sm"
            onClick={onToggleAiDefault}
          >
            AI replies: {aiDefault ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="cx-toolbarRight">
          {/* Inbox filter by status */}
          <label className="cx-filter">
            Inbox filter:{' '}
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as Status)}
              className="db-btn db-btn--sm cx-statusSelect"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="waiting">Waiting</option>
              <option value="closed">Closed</option>
            </select>
          </label>

          {/* Toggle archived visibility */}
          <button
            type="button"
            className="db-btn db-btn--sm cx-archived"
            onClick={onToggleArchived}
          >
            {showArchived ? 'Showing: All including archived' : 'Showing: Active only'}
          </button>
        </div>
      </div>
    </header>
  );
}
