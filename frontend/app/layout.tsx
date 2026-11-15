import type { Metadata, Viewport } from "next";
import { Alegreya_Sans, Cormorant_SC, Grape_Nuts } from "next/font/google";
import Script from "next/script";
import { SessionRefresher } from "@/components/auth/session-refresher";
import { getMessages } from "@/lib/i18n/server";
import "./globals.css";

const cormorant = Cormorant_SC({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const grape = Grape_Nuts({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--font-grape",
  display: "swap",
});

const alegreya = Alegreya_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-alegreya",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getMessages();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t.meta.title,
      template: "%s | Better Memoire",
    },
    description: t.meta.description,
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      type: "website",
      locale: locale === "vi" ? "vi_VN" : "en_US",
      images: [
        {
          url: "/images/hero-polaroids.webp",
          width: 1200,
          height: 1500,
          alt: t.images.heroPolaroids,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
      images: ["/images/hero-polaroids.webp"],
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#2b2f36",
};

/**
 * Browser extensions (notably Bis / Hover Over) inject attributes such as
 * bis_skin_checked, bis_register and __processed_<uuid>__ before React hydrates.
 * Strip only those known extension attributes before and during hydration.
 * This does not hide application hydration bugs.
 */
const extensionHydrationGuardScript = `
  (function () {
    if (typeof MutationObserver === "undefined") return;

    var fixedAttributes = { bis_skin_checked: true, bis_register: true };

    function isExtensionAttribute(name) {
      return fixedAttributes[name] === true || name.indexOf("__processed_") === 0;
    }

    function cleanElement(element) {
      if (!element || element.nodeType !== 1 || !element.attributes) return;
      for (var i = element.attributes.length - 1; i >= 0; i--) {
        var name = element.attributes[i].name;
        if (isExtensionAttribute(name)) element.removeAttribute(name);
      }
    }

    function cleanSubtree(root) {
      if (!root) return;
      if (root.nodeType === 1) cleanElement(root);
      if (!root.querySelectorAll) return;
      var nodes = root.querySelectorAll("*");
      for (var i = 0; i < nodes.length; i++) cleanElement(nodes[i]);
    }

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        if (mutation.type === "attributes") {
          cleanElement(mutation.target);
          continue;
        }
        for (var j = 0; j < mutation.addedNodes.length; j++) {
          cleanSubtree(mutation.addedNodes[j]);
        }
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true
    });

    cleanSubtree(document.documentElement);
    window.setTimeout(function () {
      observer.disconnect();
    }, 15000);
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale } = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${cormorant.variable} ${grape.variable} ${alegreya.variable}`}
    >
      <body className="min-h-[100dvh] antialiased">
        <Script
          id="extension-hydration-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: extensionHydrationGuardScript }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-5 focus:top-5 focus:z-[70] focus:bg-yellow focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-yellow-ink focus:outline-none"
        >
          {locale === "vi" ? "Tới nội dung" : "Skip to content"}
        </a>
        <div className="board-texture" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <SessionRefresher />
        {children}
      </body>
    </html>
  );
}
