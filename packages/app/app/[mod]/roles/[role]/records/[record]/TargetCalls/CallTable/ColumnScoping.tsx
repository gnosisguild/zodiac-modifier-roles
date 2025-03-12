import Switch from "@/ui/Switch"
import classes from "./style.module.css"

interface Props {
  isWildcarded?: boolean
  hide?: boolean
  disabled?: boolean
}
const ColumnScoping: React.FC<Props> = ({ isWildcarded, hide, disabled }) => {
  if (hide) return null

  return (
    <div>
      <Switch
        label={<span className={classes.columnScopingLabel}>allow any</span>}
        disabled={disabled}
        checked={!!isWildcarded}
      />
    </div>
  )
}

export default ColumnScoping
