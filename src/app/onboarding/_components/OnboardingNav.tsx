import Link from 'next/link';

export default function OnboardingNav({
  backHref,
  nextHref,
  backLabel = 'Back',
  nextLabel = 'Next',
}: {
  backHref?: string;
  nextHref: string;
  backLabel?: string;
  nextLabel?: string;
}) {
  return (
    <div className="ob-actions">
      {backHref ? (
        <Link href={backHref} className="ob-btn">
          {backLabel}
        </Link>
      ) : (
        <span />
      )}

      <Link href={nextHref} className="ob-btn primary">
        {nextLabel}
      </Link>
    </div>
  );
}
