export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ASX Desk",
    url: "https://asxdesk.com",
    description: "Australia's AI-powered ASX stock research platform delivering instant analysis, sector insights, and screening tools.",
    logo: "https://asxdesk.com/logo.svg",
    sameAs: [],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function StockSchema({ ticker, name, description, price, sector }: {
  ticker: string; name: string; description: string; price: number; sector: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${ticker} - ${name}`,
    description,
    category: sector,
    offers: {
      "@type": "Offer",
      price: price.toString(),
      priceCurrency: "AUD",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ArticleSchema({ title, date, description }: {
  title: string; date: string; description: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    datePublished: date,
    description,
    publisher: {
      "@type": "Organization",
      name: "ASX Desk",
      url: "https://asxdesk.com",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
