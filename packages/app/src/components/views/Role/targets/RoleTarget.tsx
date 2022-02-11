import { Box, IconButton, makeStyles } from "@material-ui/core"
import { DeleteOutlineSharp, KeyboardArrowRightSharp } from "@material-ui/icons"
import classNames from "classnames"
import { truncateEthAddress } from "../../../../utils/address"
import { EntityStatus, Target } from "../../../../typings/role"
import RemovedAddress from "../RemovedAddress"

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
  },
  active: {
    cursor: "initial",
    borderColor: "#fff",
    "&::before": {
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
  pending: {
    "&:before": {
      borderStyle: "dashed",
    },
  },
}))

type RoleTargetProps = {
  target: Target
  activeTarget: boolean
  status: EntityStatus
  onClickTarget: (target: Target) => void
  onRemoveTarget: (target: Target, remove?: boolean) => void
}

const RoleTarget = ({ target, onClickTarget, activeTarget, onRemoveTarget, status }: RoleTargetProps) => {
  const classes = useStyles()
  const { address } = target

  if (status === EntityStatus.REMOVE) {
    return <RemovedAddress onUndo={() => onRemoveTarget(target, false)} address={target.address} />
  }

  return (
    <Box
      className={classNames(classes.container, {
        [classes.active]: activeTarget,
        [classes.pending]: status === EntityStatus.PENDING,
      })}
      onClick={() => onClickTarget(target)}
    >
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
          onClick={() => onRemoveTarget(target)}
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
