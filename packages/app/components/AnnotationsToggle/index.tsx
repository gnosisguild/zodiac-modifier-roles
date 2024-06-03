import Link from "next/link"

const AnnotationsToggle: React.FC<{ on: boolean }> = ({ on }) => (
  <Link href={{ query: { annotations: !on } }}>
    {on ? "Hide annotations" : "Show annotations"}
  </Link>
)

export default AnnotationsToggle
