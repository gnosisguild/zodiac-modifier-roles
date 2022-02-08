import { Box, IconButton, makeStyles } from "@material-ui/core"
import { DeleteOutlineSharp, KeyboardArrowRightSharp } from "@material-ui/icons"
import classNames from "classnames"
import truncateEthAddress from "truncate-eth-address"
import { Target } from "../typings/role"

const useStyles = makeStyles((theme) => ({
  container: {
    alignItems: "center",
    border: "1px solid rgba(217, 212, 173, 0.3)",
    cursor: "pointer",
    display: "flex",
    fontFamily: "Roboto Mono, monospace",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: theme.spacing(1),
    position: "relative",
    "&::before": {
      content: '" "',
      backgroundColor: "rgba(217, 212, 173, 0.1)",
      border: "1px solid rgba(217, 212, 173, 0.3)",
      inset: -4,
      pointerEvents: "none",
      position: "absolute",
      zIndex: 1,
    },
    "&:hover::before": {
      backgroundColor: "rgba(217, 212, 173, 0.3)",
    },
    "&.isActive": {
      cursor: "initial",
      borderColor: "#fff",
    },
    "&.isActive::before": {
      backgroundColor: "transparent",
      borderColor: "#fff",
    },
  },
  address: {
    alignItems: "center",
    display: "flex",
  },
  targetIconContainer: {
    alignItems: "center",
    background: "rgba(217, 212, 173, 0.1)",
    border: "2px solid rgba(217, 212, 173, 0.3)",
    borderRadius: 999,
    display: "flex",
    height: 18,
    justifyContent: "center",
    marginRight: theme.spacing(1),
    minWidth: 18,
  },
  targetIcon: {
    background: "rgba(217, 212, 173, 1)",
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  iconButton: {
    borderRadius: 4,
    color: "rgba(217, 212, 173, 1)",
    width: 24,
    height: 24,
  },
  deleteButton: {
    backgroundColor: "rgba(217, 212, 173, 0.1)",
    border: "1px solid rgba(217, 212, 173, 0.3)",
    "&:hover": {
      opacity: 0.8,
    },
  },
  deleteIcon: {
    width: 12,
  },
  arrowIcon: {
    fill: "rgba(217, 212, 173, 1)",
    "&:hover": {
      opacity: 0.8,
    },
  },
}))

type RoleTargetProps = {
  target: Target
  onClickTarget: (target: RoleTargetProps["target"]) => void
  activeTarget: boolean
  onRemoveTarget: (targetToBeRemoved: string) => void
}

const RoleTarget = ({ target, onClickTarget, activeTarget, onRemoveTarget }: RoleTargetProps) => {
  const classes = useStyles()
  const { address } = target

  return (
    <Box className={classNames(classes.container, activeTarget && "isActive")} onClick={() => onClickTarget(target)}>
      <Box className={classes.address}>
        <Box className={classes.targetIconContainer}>
          <Box className={classes.targetIcon} width={16} height={16} />
        </Box>
        {truncateEthAddress(address)}
      </Box>
      <Box sx={{ alignItems: "center", display: "flex" }}>
        <IconButton
          size="small"
          aria-label="Remove target"
          className={classNames(classes.iconButton, classes.deleteButton)}
          onClick={() => onRemoveTarget(address)}
        >
          <DeleteOutlineSharp className={classes.deleteIcon} />
        </IconButton>
        <Box sx={{ ml: 1 }}>
          <IconButton size="small" aria-label="View and Edit Target configurations" className={classes.iconButton}>
            <KeyboardArrowRightSharp className={classes.arrowIcon} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default RoleTarget
