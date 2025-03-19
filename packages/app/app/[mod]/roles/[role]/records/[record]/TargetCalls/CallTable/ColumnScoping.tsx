import Switch from "@/ui/Switch"
import classes from "./style.module.css"

interface Props {
  label: string
  isWildcarded?: boolean
  disabled?: boolean
  onChange?: (isWildcarded: boolean) => void
}
const ColumnScoping: React.FC<Props> = ({
  label,
  isWildcarded,
  disabled,
  onChange,
}) => {
  return (
    <div>
      <Switch
        label={<span className={classes.columnScopingLabel}>{label}</span>}
        disabled={disabled}
        checked={!!isWildcarded}
        onChange={onChange}
      />
    </div>
  )
}

export default ColumnScoping
