export type Plan = {
  name: string;
  price: number;
  blurb: string;
  cta: string;
  highlight: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    name: "Starter",
    price: 19,
    blurb: "For small stores getting started",
    cta: "Start free trial",
    highlight: false,
    features: [
      "1,000 conversations / mo",
      "1 teammate seat",
      "Order tracking & status",
      "Quick replies & FAQ",
      "24/7 availability",
      "Basic analytics",
    ],
  },
  {
    name: "Pro",
    price: 49,
    blurb: "Best for growing e-commerce",
    cta: "Get Pro",
    highlight: true,
    features: [
      "10,000 conversations / mo",
      "3 teammate seats",
      "Returns & exchanges flow",
      "Human handoff to inbox",
      "Shopify / Woo plug-ins",
      "SLA & priority support",
    ],
  },
  {
    name: "Business",
    price: 129,
    blurb: "Advanced control & scale",
    cta: "Talk to sales",
    highlight: false,
    features: [
      "Unlimited conversations",
      "Unlimited seats",
      "Custom workflows & APIs",
      "SSO / SAML",
      "Audit logs & RBAC",
      "Dedicated success manager",
    ],
  },
];
