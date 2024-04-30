import cn from "classnames"
import styles from "./style.module.css"
import { Fragment } from "react"

const CallData: React.FC<{ children: `0x${string}`; className?: string }> = ({
  children,
  className,
}) => {
  const selector = children.slice(0, 10)
  const words = [...Array(Math.ceil((children.length - 10) / 64))].map((_, i) =>
    children.slice(10 + i * 64, 10 + (i + 1) * 64)
  )
  return (
    <div className={cn(styles.calldata, className)}>
      {selector}
      <wbr />
      {words.map((word, i) => (
        <Fragment key={i}>
          <wbr />
          {word}
        </Fragment>
      ))}
    </div>
  )
}

export default CallData
