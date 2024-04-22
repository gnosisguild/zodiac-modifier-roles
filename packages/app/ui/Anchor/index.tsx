"use client"
import { ReactNode, createContext, useContext } from "react"
import { RiLinkM } from "react-icons/ri"
import BlockLink from "../BlockLink"

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

const Anchor: React.FC<{
  name: string
}> = ({ name }) => {
  const context = useContext(AnchorContext)
  const uniqueName = context ? `${context}-${name}` : name
  return (
    <BlockLink id={uniqueName} href={"#" + uniqueName}>
      <RiLinkM />
    </BlockLink>
  )
}

export default Anchor
