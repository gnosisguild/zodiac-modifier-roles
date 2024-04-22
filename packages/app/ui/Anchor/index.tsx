"use client"
import { ReactNode, createContext, useContext, useEffect } from "react"
import { RiLinkM } from "react-icons/ri"
import { IconLinkButton } from "../IconButton"

const AnchorContext = createContext<string>("")

/** All <Anchor/> elements inside children will be prefixed with the given `namespace` so they are unique on this page */
export const SpawnAnchorContext: React.FC<{
  namespace: string
  children: ReactNode
}> = ({ namespace, children }) => {
  const context = useContext(AnchorContext)
  const uniqueNameSpace = context ? `${context}-${namespace}` : namespace
  return (
    <AnchorContext.Provider value={uniqueNameSpace}>
      {children}
    </AnchorContext.Provider>
  )
}

let handledInitialPageLoad = false

const Anchor: React.FC<{
  name: string
  className: string
}> = ({ name, className }) => {
  const context = useContext(AnchorContext)
  const uniqueName = context ? `${context}-${name}` : name
  const isActive =
    typeof window !== "undefined" && window.location.hash === "#" + uniqueName

  // Scroll into view
  // We cannot rely on the browser-native behavior of scrolling into view if the anchor is only mounted after the page has loaded,
  // e.g., when inside a <Suspense> block.
  useEffect(() => {
    if (
      isActive &&
      !handledInitialPageLoad &&
      typeof window !== "undefined" &&
      window.screenTop === 0
    ) {
      handledInitialPageLoad = true
      document.getElementById(uniqueName)?.scrollIntoView()
      return
    }
  }, [isActive, uniqueName])

  return (
    <IconLinkButton
      id={uniqueName}
      href={"#" + uniqueName}
      className={className}
    >
      <RiLinkM />
    </IconLinkButton>
  )
}

export default Anchor
