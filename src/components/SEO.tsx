import Script from "next/script";

export default function SEO({
  jsonLd,
  id
}: {
  jsonLd: Record<string, unknown>;
  id: string;
}) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
