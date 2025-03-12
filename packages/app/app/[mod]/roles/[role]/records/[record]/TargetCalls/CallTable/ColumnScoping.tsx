import Switch from "@/ui/Switch"
import classes from "./style.module.css"

interface Props {
  isWildcarded?: boolean
  disabled?: boolean
  onChange?: (isWildcarded: boolean) => void
}
const ColumnScoping: React.FC<Props> = ({
  isWildcarded,
  disabled,
  onChange,
}) => {
  return (
    <div>
      <Switch
        label={<span className={classes.columnScopingLabel}>allow any</span>}
        disabled={disabled}
        checked={!!isWildcarded}
        onChange={onChange}
      />
    </div>
  )
}

export default ColumnScoping
