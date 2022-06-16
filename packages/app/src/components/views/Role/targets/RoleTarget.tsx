import React from "react"
import { Box, ButtonBaseProps, IconButton, makeStyles } from "@material-ui/core"
import { DeleteOutlineSharp, KeyboardArrowRightSharp } from "@material-ui/icons"
import { CopyToClipboardBtn } from "@gnosis.pm/safe-react-components"
import classNames from "classnames"
import { truncateEthAddress } from "../../../../utils/address"
import { EntityStatus, Target } from "../../../../typings/role"
import RemovedAddress from "../RemovedAddress"
import { colors, doubleBorder, ZodiacPaper } from "zodiac-ui-components"

const useStyles = makeStyles((theme) => ({
  container: {
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    fontFamily: "Roboto Mono, monospace",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: theme.spacing(1),
    "&::before": doubleBorder(-4, colors.tan[300]),
    "&:hover::before": {
      backgroundColor: colors.tan[300],
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
  targetIconContainer: {
    alignItems: "center",
    borderWidth: 2,
    display: "flex",
    height: 18,
    justifyContent: "center",
    marginRight: theme.spacing(1),
    minWidth: 18,
  },
  targetIcon: {
    background: colors.tan[1000],
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  iconButton: {
    borderRadius: 4,
    color: colors.tan[1000],
    width: 24,
    height: 24,
  },
  filledButton: {
    backgroundColor: colors.tan[100],
    border: `1px solid ${colors.tan[300]}`,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: colors.tan[300],
      opacity: 0.8,
    },
  },
  copyButton: {
    marginLeft: theme.spacing(1),
    "&:hover": {
      backgroundColor: `${colors.tan[100]} !important`,
      opacity: 0.8,
    },
  },
  deleteIcon: {
    width: 12,
  },
  arrowIcon: {
    fill: colors.tan[1000],
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
    const handleUndo: ButtonBaseProps["onClick"] = (event) => {
      event.preventDefault()
      onRemoveTarget(target, false)
    }
    return <RemovedAddress onUndo={handleUndo} address={target.address} />
  }

  const handleRemove: ButtonBaseProps["onClick"] = (event) => {
    event.stopPropagation()
    onRemoveTarget(target)
  }

  return (
    <ZodiacPaper
      className={classNames(classes.container, {
        [classes.active]: activeTarget,
        [classes.pending]: status === EntityStatus.PENDING,
      })}
      onClick={() => onClickTarget(target)}
    >
      <ZodiacPaper borderStyle="single" variant="outlined" rounded="full" className={classes.targetIconContainer}>
        <Box className={classes.targetIcon} width={16} height={16} />
      </ZodiacPaper>
      {truncateEthAddress(address)}
      <CopyToClipboardBtn textToCopy={address} className={classNames(classes.copyButton, "btn")} />

      <Box sx={{ flexGrow: 1 }} />

      <IconButton
        size="small"
        aria-label="Remove target"
        className={classNames(classes.iconButton, classes.filledButton)}
        onClick={handleRemove}
      >
        <DeleteOutlineSharp className={classes.deleteIcon} />
      </IconButton>
      <Box sx={{ ml: 1 }}>
        <IconButton size="small" aria-label="View and Edit Target configurations" className={classes.iconButton}>
          <KeyboardArrowRightSharp className={classes.arrowIcon} />
        </IconButton>
      </Box>
    </ZodiacPaper>
  )
}

export default RoleTarget
