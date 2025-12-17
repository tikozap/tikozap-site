'use client';

const ROW_GROUPS = [
  {
    label: 'Core assistant',
    rows: [
      {
        label: 'Full AI assistant',
        starter: '✓',
        pro: '✓',
        business: '✓',
        agency: '✓',
      },
      {
        label: 'Store-aware answers (orders, products, policies)',
        starter: '✓',
        pro: '✓',
        business: '✓',
        agency: '✓',
      },
      {
        label: 'Safe actions with guardrails',
        starter: 'Basic',
        pro: 'Standard',
        business: 'Advanced',
        agency: 'Advanced',
      },
    ],
  },
  {
    label: 'Volume & limits',
    rows: [
      {
        label: 'Included chats / month',
        starter: '1,000',
        pro: '5,000',
        business: '15,000',
        agency: 'Per workspace',
      },
      {
        label: 'Overage',
        starter: '$5 / extra 1,000',
        pro: '$5 / extra 1,000',
        business: '$5 / extra 1,000',
        agency: '$5 / extra 1,000',
      },
      {
        label: 'Included sites / widgets',
        starter: '1',
        pro: '3',
        business: '5',
        agency: 'Client workspaces',
      },
      {
        label: 'Included data sources',
        starter: '1',
        pro: '5',
        business: '15',
        agency: 'Shared pool',
      },
    ],
  },
  {
    label: 'Team & workflow',
    rows: [
      {
        label: 'Seats / agents',
        starter: '1',
        pro: '2',
        business: '5',
        agency: 'Per workspace',
      },
      {
        label: 'Workflows & automations',
        starter: '—',
        pro: '✓',
        business: '✓',
        agency: '✓',
      },
      {
        label: 'Routing & escalation rules',
        starter: '—',
        pro: 'Standard',
        business: 'Advanced',
        agency: 'Advanced',
      },
    ],
  },
  {
    label: 'Support',
    rows: [
      {
        label: 'Email support',
        starter: '24–48 hours',
        pro: 'Within 24 hours',
        business: 'Within 8 hours',
        agency: 'Within 4 hours',
      },
      {
        label: 'Onboarding help',
        starter: 'Self-serve docs',
        pro: 'Email guidance',
        business: 'Email + call (by request)',
        agency: 'White-glove onboarding',
      },
    ],
  },
  {
    label: 'Brand & agency',
    rows: [
      {
        label: 'Custom branding on widget',
        starter: '✓',
        pro: '✓',
        business: '✓',
        agency: '✓',
      },
      {
        label: 'Client workspaces',
        starter: '—',
        pro: '—',
        business: '—',
        agency: '5 included',
      },
      {
        label: 'White-label dashboard & domain',
        starter: '—',
        pro: '—',
        business: '—',
        agency: '✓',
      },
    ],
  },
];

export default function PricingCompare() {
  return (
    <section className="stack" aria-labelledby="compare-heading">
      <header className="stack">
        <h2 id="compare-heading">Compare plans</h2>
        <p className="small">
          All plans share the same core AI assistant. Higher tiers add more volume, seats,
          and control.
        </p>
      </header>

      <div className="pricing-compare">
        <table>
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">Starter</th>
              <th scope="col">Pro</th>
              <th scope="col">Business</th>
              <th scope="col">Agency</th>
            </tr>
          </thead>
          <tbody>
            {ROW_GROUPS.map((group) => (
              <Fragment key={group.label}>
                <tr className="group-row">
                  <th colSpan={5} scope="rowgroup">
                    {group.label}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{row.starter}</td>
                    <td className="highlight">{row.pro}</td>
                    <td>{row.business}</td>
                    <td>{row.agency}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .pricing-compare {
          overflow-x: auto;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }

        thead th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        thead th:not(:first-child) {
          text-align: center;
        }

        tbody th {
          text-align: left;
          padding: 0.6rem 1rem;
          font-weight: 500;
          color: #111827;
          width: 40%;
        }

        tbody td {
          text-align: center;
          padding: 0.6rem 0.75rem;
          color: #374151;
        }

        .group-row th {
          padding-top: 1rem;
          padding-bottom: 0.4rem;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9ca3af;
        }

        tbody tr:nth-child(even) td,
        tbody tr:nth-child(even) th[scope='row'] {
          background: #f9fafb;
        }

        .highlight {
          font-weight: 600;
          color: #111827;
        }

        @media (max-width: 640px) {
          tbody th {
            font-size: 0.82rem;
          }
        }
      `}</style>
    </section>
  );
}

import { Fragment } from 'react';
