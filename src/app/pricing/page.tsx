import Pricing from '../../components/Pricing';
import PricingFAQ from '../../components/PricingFAQ';
import PricingCompare from '../../components/PricingCompare';

export default function PricingPage() {
  return (
    <main id="main" className="stack" style={{ padding: '2rem 0' }}>
      {/* Page hero (same as homepage hero text) */}
     <header className="container stack hero" style={{ marginBottom: '1.75rem' }}>
  <h1>Instant AI support for your online store</h1>
  <p className="sub">Easy setup. Affordable pricing. 24/7 on-call.</p>

<div className="helpers">
    <span>Free 14-day trial</span>
    <span className="dot" aria-hidden="true" />
    <span>No credit card</span>
    <span className="dot" aria-hidden="true" />
    <span>Cancel anytime</span>
  </div>
</header>

      <Pricing />
      <PricingCompare />
      <PricingFAQ />
    </main>
  );
}
