import Image from "next/image";
import { useConfig } from "nextra-theme-docs";
import { useRouter } from "next/router";
import styles from "./theme.module.css";

const themeConfig = {
  logo: <span>Zodiac Roles</span>,
  project: {
    link: "https://github.com/gnosis/zodiac-modifier-roles",
  },
  docsRepositoryBase:
    "https://github.com/gnosis/zodiac-modifier-roles/tree/main/docs/pages",
  useNextSeoProps() {
    const { asPath } = useRouter();
    if (asPath !== "/") {
      return {
        titleTemplate: "%s – Zodiac Roles",
      };
    }
  },
  head: function useHead() {
    const { title } = useConfig();

    return (
      <>
        <meta name="msapplication-TileColor" content="#eeeded" />
        <meta name="theme-color" content="#eeeded" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Language" content="en" />
        <meta
          name="description"
          content="Role-based access control for EVM calls"
        />
        <meta
          name="og:description"
          content="Role-based access control for EVM calls"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/logo.png" />
        <meta name="og:title" content={title} />
        <meta name="og:image" content="/logo.png" />
        <meta name="apple-mobile-web-app-title" content="Zodiac Roles" />
        <link href="/favicon.ico" rel="icon" type="image/x-ico"></link>
        <link href="/logo.png" rel="apple-touch-icon"></link>
      </>
    );
  },
  footer: {
    text: (
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
    ),
  },
};

export default themeConfig;
