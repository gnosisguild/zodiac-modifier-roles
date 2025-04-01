import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Footer, Layout, Navbar, useConfig } from "nextra-theme-docs";
import { Banner, Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
// Required for theme styles, previously was imported under the hood
import "nextra-theme-docs/style.css";
import styles from "./theme.module.css";

export const metadata: Metadata = {
  title: {
    default: "Zodiac Roles Modifier",
    template: "%s - Zodiac Roles Modifier",
  },
  description: "Role-based access control for EVM calls",
  twitter: {
    card: "summary_large_image",
    images: ["/logo.png"],
  },
  openGraph: {
    title: {
      default: "Zodiac Roles Modifier",
      template: "%s - Zodiac Roles Modifier",
    },
    description: "Role-based access control for EVM calls",
    images: "/logo.png",
    siteName: "Zodiac Roles Modifier",
    locale: "en",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f3f4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// const banner = <Banner storageKey="some-key">Nextra 4.0 is released 🎉</Banner>;
const navbar = (
  <Navbar
    logo={
      <div className={styles.header}>
        <Image src="/logo.png" alt="Zodiac Roles Logo" width={30} height={30} />
        Zodiac Roles Modifier
      </div>
    }
    projectLink="https://github.com/gnosisguild/zodiac-modifier-roles"
  />
);
const footer = (
  <Footer className="flex-col items-center md:items-start">
    <div className={styles.footer}>
      <a
        href="https://discord.gg/2jnnJx3Y"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src="/discordicon.svg"
          alt="Gnosis Guild Discord"
          width="16"
          height="16"
        />
      </a>
      <a
        href="https://twitter.com/gnosisguild"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src="/twittericon.svg"
          alt="Gnosis Guild Twitter"
          width="16"
          height="16"
        />
      </a>
      <div className={styles.divider}></div>

      <a
        className={styles.builtBy}
        href="https://www.gnosisguild.org/"
        target="_blank"
      >
        Built by Gnosis Guild
        <Image
          src="/gnosisguild.png"
          alt="Gnosis Guild Logo"
          className={styles.logo}
          width={32}
          height={32}
        />
      </a>
    </div>
  </Footer>
);

export default async function RootLayout({ children }) {
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head
        backgroundColor={{
          dark: "rgb(15, 23, 42)",
          light: "#f6f3f4",
        }}
        color={{
          hue: { dark: 120, light: 0 },
          saturation: { dark: 100, light: 100 },
        }}
      ></Head>
      <body>
        <Layout
          //   banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/gnosisguild/zodiac-modifier-roles/tree/main/packages/docs"
          editLink="Edit this page on GitHub"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          footer={footer}
          // ...Your additional theme config options
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
