//. src/app/demo-product/[id]/page.tsx

type DemoProductPageProps = {
  params: {
    id: string;
  };
};

type DemoProduct = {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  details: string[];
};

const DEMO_PRODUCTS: Record<string, DemoProduct> = {
  "demo-snow-1": {
    id: "demo-snow-1",
    title: "All-Mountain Snowboard",
    price: 149,
    image:
      "https://images.unsplash.com/photo-1517825738774-7de9363ef735?auto=format&fit=crop&w=1200&q=80",
    description:
      "A versatile snowboard designed for riders who want one board for groomers, mixed terrain, and all-around performance.",
    details: [
      "Great for all-mountain riding",
      "Balanced flex for control and comfort",
      "Good choice for beginners to intermediate riders",
    ],
  },
  "demo-snow-2": {
    id: "demo-snow-2",
    title: "Freestyle Snowboard",
    price: 129,
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    description:
      "A lighter, playful snowboard built for park laps, quick turns, and riders who enjoy a more agile feel.",
    details: [
      "Playful freestyle feel",
      "Easy to maneuver",
      "Good for jumps and side hits",
    ],
  },
  "demo-snow-3": {
    id: "demo-snow-3",
    title: "Powder Snowboard",
    price: 179,
    image:
      "https://images.unsplash.com/photo-1548778052-311f4bc2b502?auto=format&fit=crop&w=1200&q=80",
    description:
      "A snowboard designed for float and stability in softer snow and deeper conditions.",
    details: [
      "Built for powder days",
      "Stable feel in soft snow",
      "Directional shape",
    ],
  },
  "demo-snow-4": {
    id: "demo-snow-4",
    title: "Beginner Snowboard",
    price: 119,
    image:
      "https://images.unsplash.com/photo-1516569422861-93a0e83e3f46?auto=format&fit=crop&w=1200&q=80",
    description:
      "A friendly snowboard for new riders who want something easy to control and confidence-building.",
    details: [
      "Beginner-friendly flex",
      "Easy turn initiation",
      "Comfortable learning board",
    ],
  },
  "demo-dress-1": {
    id: "demo-dress-1",
    title: "Classic Midi Dress",
    price: 89,
    image:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80",
    description:
      "A polished midi dress for dinners, events, and everyday elevated style.",
    details: [
      "Midi length",
      "Elegant classic silhouette",
      "Easy dress-up or dress-down styling",
    ],
  },
  "demo-dress-2": {
    id: "demo-dress-2",
    title: "Evening Satin Dress",
    price: 119,
    image:
      "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=1200&q=80",
    description:
      "A satin dress designed for evening occasions, celebrations, and more formal looks.",
    details: [
      "Smooth satin finish",
      "Dressier occasion style",
      "Elegant evening look",
    ],
  },
  "demo-dress-3": {
    id: "demo-dress-3",
    title: "Summer Floral Dress",
    price: 79,
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    description:
      "A light floral dress for warm weather, casual outings, and easy daytime styling.",
    details: [
      "Lightweight feel",
      "Soft floral look",
      "Great for spring and summer",
    ],
  },
  "demo-dress-4": {
    id: "demo-dress-4",
    title: "Elegant Black Dress",
    price: 99,
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
    description:
      "A versatile black dress for dinners, events, and timeless wardrobe styling.",
    details: [
      "Timeless black color",
      "Easy occasion styling",
      "Clean, elegant shape",
    ],
  },
  "demo-jacket-1": {
    id: "demo-jacket-1",
    title: "Insulated Winter Jacket",
    price: 129,
    image:
      "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1200&q=80",
    description:
      "A warm insulated jacket built for colder days and comfortable winter wear.",
    details: [
      "Warm insulated design",
      "Cold-weather ready",
      "Practical everyday outerwear",
    ],
  },
  "demo-jacket-2": {
    id: "demo-jacket-2",
    title: "Lightweight Puffer Jacket",
    price: 99,
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80",
    description:
      "A lighter puffer jacket for layering, travel, and everyday cool-weather use.",
    details: [
      "Lightweight comfort",
      "Easy layering piece",
      "Clean casual look",
    ],
  },
  "demo-jacket-3": {
    id: "demo-jacket-3",
    title: "Wool Blend Coat",
    price: 149,
    image:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80",
    description:
      "A polished wool-blend coat for dressier outerwear and city styling.",
    details: [
      "Wool-blend fabric",
      "Dressier silhouette",
      "Great for colder city wear",
    ],
  },
  "demo-jacket-4": {
    id: "demo-jacket-4",
    title: "City Rain Jacket",
    price: 89,
    image:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1200&q=80",
    description:
      "A lightweight rain jacket for everyday city wear and light wet-weather protection.",
    details: [
      "Light rain protection",
      "City-friendly styling",
      "Easy everyday layer",
    ],
  },

"demo-generic-1": {
    id: "demo-generic-1",
    title: "Featured Product",
    price: 79,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    description:
      "A featured demo item used to preview how TikoZap can present products in chat.",
    details: [
      "Demo showcase item",
      "Clean card presentation",
      "Useful for product discovery flows",
    ],
  },

  "demo-generic-2": {
    id: "demo-generic-2",
    title: "Popular Pick",
    price: 99,
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    description:
      "A popular demo product used for previewing recommendations and product cards.",
    details: [
      "Demo recommendation item",
      "Good for card-based suggestions",
      "Designed for preview flows",
    ],
  },

  "demo-generic-3": {
    id: "demo-generic-3",
    title: "Best Seller",
    price: 69,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    description:
      "A best-seller style demo item used to simulate featured products in the TikoZap preview.",
    details: [
      "Demo best-seller card",
      "Useful for category showcases",
      "Supports realistic preview browsing",
    ],
  },
};

export default function DemoProductPage({ params }: DemoProductPageProps) {
  const product = DEMO_PRODUCTS[params.id];

  if (!product) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 28 }}>Demo product not found</h1>
          <p style={{ marginTop: 12, color: "#475569", lineHeight: 1.6 }}>
            This is a demo product page for the TikoZap preview experience.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
          gap: 24,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
          }}
        >
          <img
            src={product.image}
            alt={product.title}
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              objectFit: "cover",
              borderRadius: 18,
              display: "block",
            }}
          />
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 28,
              padding: "0 10px",
              borderRadius: 9999,
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            Demo product page
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.15,
              color: "#0f172a",
            }}
          >
            {product.title}
          </h1>

          <div
            style={{
              marginTop: 12,
              fontSize: 26,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            ${product.price.toFixed(2)}
          </div>

          <p
            style={{
              marginTop: 18,
              color: "#475569",
              lineHeight: 1.7,
              fontSize: 15,
            }}
          >
            {product.description}
          </p>

          <div style={{ marginTop: 18 }}>
            {product.details.map((detail: any) => (
              <div
                key={detail}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginTop: 10,
                  color: "#334155",
                  fontSize: 14,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    background: "#2563eb",
                    marginTop: 6,
                    flex: "0 0 auto",
                  }}
                />
                <span>{detail}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 26,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                height: 44,
                padding: "0 18px",
                borderRadius: 14,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add to cart
            </button>

            <button
              style={{
                height: 44,
                padding: "0 18px",
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#0f172a",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save for later
            </button>
          </div>

          <p
            style={{
              marginTop: 18,
              fontSize: 12,
              color: "#64748b",
            }}
          >
            This is a preview product page for the TikoZap demo.
          </p>
        </div>
      </div>
    </main>
  );
}