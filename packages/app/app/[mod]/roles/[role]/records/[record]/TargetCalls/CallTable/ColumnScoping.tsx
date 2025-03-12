import Switch from "@/ui/Switch"
import classes from "./style.module.css"

interface Props {
  isWildcarded: boolean
  hide?: boolean
}
const ColumnScoping: React.FC<Props> = ({ isWildcarded, hide }) => {
  return (
    <div>
      <Switch
        label={<span className={classes.columnScopingLabel}>allow any</span>}
        checked={isWildcarded}
      />
    </div>
  )
}

export default ColumnScoping
