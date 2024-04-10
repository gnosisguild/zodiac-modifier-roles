"use client"

import { Disclosure as HeadlessDisclosure } from "@headlessui/react"
import { SlArrowDown } from "react-icons/sl"
import classes from "./style.module.css"
import classNames from "classnames"

interface DisclosureProps {
  button: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

const Disclosure: React.FC<DisclosureProps> = ({
  button,
  children,
  defaultOpen = false,
}) => {
  return (
    <HeadlessDisclosure defaultOpen={defaultOpen}>
      {({ open }) => (
        <>
          <HeadlessDisclosure.Button
            className={classNames(classes.button, open && classes.open)}
            as="div"
            onMouseDown={(e) => e.preventDefault()} // Prevent text selection when toggling the panel
          >
            {button}
            <SlArrowDown size={24} className={classes.buttonIcon} />
          </HeadlessDisclosure.Button>
          <HeadlessDisclosure.Panel>{children}</HeadlessDisclosure.Panel>
        </>
      )}
    </HeadlessDisclosure>
  )
}

export default Disclosure
