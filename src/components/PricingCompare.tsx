// src/components/PricingCompare.tsx

'use client';

import { Fragment } from 'react';
import { PRICING_PLANS } from '@/lib/pricingPlans';

const ROW_GROUPS = [
  {
    label: 'Core platform',
    rows: [
      {
        label: 'AI store assistant',
        starter: '✓',
        pro: '✓',
        business: '✓',
        agency: '✓',
      },
      {
        label: 'Website widget',
        starter: '✓',
        pro: '✓',
        business: '✓',
        agency: '✓',
      },
      {
        label: 'Inbox / conversations',
        starter: '✓',
        pro: '✓',
        business: '✓',
        agency: '✓',
      },
      {
        label: 'Store-aware answers',
        starter: '✓',
        pro: '✓',
        business: '✓',
        agency: '✓',
      },
    ],
  },

  {
    label: 'Starter Link & products',
    rows: [
      {
        label: 'Starter Link storefront',
        starter: '✓',
        pro: '✓',
        business: '✓',
        agency: '✓',
      },
{
  label: 'Starter Link products',
  starter: `Up to ${PRICING_PLANS.starter.starterLinkProducts}`,
  pro: `Up to ${PRICING_PLANS.pro.starterLinkProducts}`,
  business: 'Custom',
  agency: 'Per client',
},
      {
        label: 'Custom branding',
        starter: 'Basic',
        pro: 'Advanced',
        business: 'Advanced',
        agency: 'White-label',
      },
    ],
  },

  {
    label: 'Usage & scale',
    rows: [
      {
        label: 'Included AI usage',
        starter: 'Standard',
        pro: 'Higher',
        business: 'Higher',
        agency: 'Per workspace',
      },
      {
        label: 'Heavy usage add-ons',
        starter: 'Optional',
        pro: 'Optional',
        business: 'Optional',
        agency: 'Optional',
      },
      {
        label: 'Realtime voice add-on',
        starter: 'Later',
        pro: 'Later',
        business: 'Available',
        agency: 'Available',
      },
    ],
  },

  {
    label: 'Team & support',
    rows: [
      {
        label: 'Seats',
        starter: '1',
        pro: '2',
        business: '5',
        agency: 'Per workspace',
      },
      {
        label: 'Email support',
        starter: '24–48 hrs',
        pro: 'Within 24 hrs',
        business: 'Within 8 hrs',
        agency: 'Within 4 hrs',
      },
      {
        label: 'Onboarding help',
        starter: 'Docs',
        pro: 'Email',
        business: 'Priority',
        agency: 'White-glove',
      },
    ],
  },

  {
    label: 'Agency',
    rows: [
      {
        label: 'Client workspaces',
        starter: '—',
        pro: '—',
        business: '—',
        agency: '5 included',
      },
      {
        label: 'White-label dashboard',
        starter: '—',
        pro: '—',
        business: '—',
        agency: '✓',
      },
      {
        label: 'Custom domain',
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
          All plans include the AI storefront foundation. Higher tiers add more products, usage, and growth tools.
        </p>
      </header>

      <div className="pricing-compare">
        <table>
          <thead>
            <tr>
<th scope="col">{PRICING_PLANS.starter.name}</th>
<th scope="col">{PRICING_PLANS.pro.name}</th>
<th scope="col">{PRICING_PLANS.business.name}</th>
<th scope="col">{PRICING_PLANS.agency.name}</th>
            </tr>
          </thead>
          <tbody>
            {ROW_GROUPS.map((group: any) => (
              <Fragment key={group.label}>
                <tr className="group-row">
                  <th colSpan={5} scope="rowgroup">
                    {group.label}
                  </th>
                </tr>
                {group.rows.map((row: any) => (
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
