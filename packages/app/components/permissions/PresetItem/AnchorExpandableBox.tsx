"use client"

import { SpawnAnchorContext, useAnchor } from "@/ui/Anchor"
import ExpandableBox, { Props } from "@/ui/ExpandableBox"
import { useEffect, useState } from "react"

const InnerAnchorExpandableBox: React.FC<Props> = (props) => {
  const [hashOnMount, setHashOnMount] = useState<string | undefined>(undefined)

  const anchorPrefix = useAnchor("")
  useEffect(() => {
    setHashOnMount(typeof window !== "undefined" ? window.location.hash : "")
  }, [])

  return hashOnMount !== undefined ? (
    <ExpandableBox
      {...props}
      defaultExpanded={
        props.defaultExpanded || hashOnMount.startsWith("#" + anchorPrefix)
      }
    />
  ) : null
}

const AnchorExpandableBox: React.FC<Props & { namespace: string }> = ({
  namespace,
  ...props
}) => (
  <SpawnAnchorContext namespace={namespace}>
    <InnerAnchorExpandableBox {...props} />
  </SpawnAnchorContext>
)

export default AnchorExpandableBox
