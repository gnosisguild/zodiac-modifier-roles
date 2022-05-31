import { Box, makeStyles } from "@material-ui/core"

const useStyles = makeStyles(() => ({
  viewRolesLink: {
    alignItems: "center",
    color: "rgb(217,212,173)",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 16,
    textDecoration: "none !important",
    textUnderlineOffset: "2px",
    "&:hover": {
      textDecoration: "underline !important",
    },
  },
}))

type Props = {
  icon?: any
  text: string
}

const ButtonLink = ({ text, icon }: Props) => {
  const classes = useStyles()

  return (
    <Box className={classes.viewRolesLink}>
      {icon}
      <Box sx={{ ml: icon && 1 }}>{text}</Box>
    </Box>
  )
}

export default ButtonLink
