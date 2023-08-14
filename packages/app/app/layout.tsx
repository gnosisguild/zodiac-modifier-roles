import "./globals.css";
import classes from "./layout.module.css";
import { roboto_mono, spectral } from "./fonts";
import type { Metadata } from "next";
import Flex from "@/components/Flex";
import Box from "@/components/Box";
import ConnectWallet from "@/components/ConnectWallet";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Zodiac Roles",
  description: "Role-based access control for EVM calls",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={spectral.className}>
        <div className={classes.page}>
          <div className={classes.topBar}>
            <Flex gap={4} justifyContent="space-between" alignItems="center">
              <Box>
                <Flex gap={1}>
                  <Button className={classes.appName}>Zodiac Roles</Button>
                </Flex>
              </Box>
              <ConnectWallet />
            </Flex>
          </div>

          {children}
        </div>
      </body>
    </html>
  );
}
