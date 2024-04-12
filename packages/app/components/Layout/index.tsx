import { ReactNode } from "react"
import cn from "classnames"
import Flex from "@/ui/Flex"
import ConnectWallet from "@/components/ConnectWallet"
import classes from "./style.module.css"
import Image from "next/image"
import BreadcrumbDivider from "@/ui/BreadcrumbDivider"
import Link from "next/link"

const Layout: React.FC<{
  head?: ReactNode
  children: ReactNode
  noScroll?: true
}> = ({ head, children, noScroll }) => (
  <div className={classes.page}>
    <div>
      <div className={classes.topBar}>
        <Flex gap={4} justifyContent="space-between" alignItems="center">
          <Flex gap={2} alignItems="center">
            <Breadcrumb href="/" className={classes.homeBreadcrumb}>
              <div className={classes.appLogo}>
                <Image
                  src="/logo.svg"
                  alt="Zodiac Roles Icon"
                  width={40}
                  height={40}
                />
              </div>
            </Breadcrumb>
            {head && <BreadcrumbDivider />}
            {head}
          </Flex>
          <ConnectWallet />
        </Flex>
      </div>
      <div className={cn(classes.main, noScroll && classes.noScroll)}>
        {children}
      </div>
    </div>
    <footer className={classes.footer}>
      <Flex gap={2} justifyContent="space-between" alignItems="center">
        <Link href="https://github.com/gnosisguild/zodiac-modifier-roles">
          <Flex gap={2} alignItems="center">
            <Image src="/github.svg" alt="github logo" width={20} height={20} />
            View on GitHub
          </Flex>
        </Link>
        <Link href="https://gnosisguild.org">
          <Flex gap={2} alignItems="center">
            <Image
              src="/gnosisguild.png"
              alt="guild logo"
              width={20}
              height={20}
            />
            Built by Gnosis Guild
          </Flex>
        </Link>
      </Flex>
    </footer>
  </div>
)

export default Layout

export const Breadcrumb: React.FC<{
  href?: string
  children: ReactNode
  className?: string
  isLink?: boolean
}> = ({ href, children, className }) => {
  if (href) {
    return (
      <Link className={cn(classes.breadcrumb, className)} href={href}>
        {children}
      </Link>
    )
  }
  return <div className={cn(classes.breadcrumb, className)}>{children}</div>
}
