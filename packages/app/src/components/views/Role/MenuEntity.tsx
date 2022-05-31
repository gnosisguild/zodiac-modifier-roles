import React from "react"
import { Box, Button, Link, makeStyles, Typography } from "@material-ui/core"
import ButtonLink from "../../commons/input/ButtonLink"
import { AddSharp } from "@material-ui/icons"

type MenuEntityProps<T> = {
  name: { singular: string; plural: string }
  tutorialLink: string
  list: T[]

  renderItem(entity: T, index: number): React.ReactElement
  onAdd(): void
}

const useStyles = makeStyles((theme) => ({
  label: {
    color: theme.palette.text.primary,
    lineHeight: 1,
  },
  labelLink: {
    color: "rgba(217,212,173, 0.6)",
    cursor: "pointer",
    lineHeight: 1,
    "&:hover": {
      color: "rgba(217,212,173, 0.3)",
    },
  },
  labelWrapper: {
    alignItems: "flex-end",
    display: "flex",
    justifyContent: "space-between",
  },
}))

export function MenuEntity<T>({ name, tutorialLink, list, renderItem, onAdd }: MenuEntityProps<T>) {
  const classes = useStyles()

  return (
    <>
      <Box className={classes.labelWrapper}>
        <Typography variant="body1" className={classes.label}>
          {name.plural}
        </Typography>
        <Link href={tutorialLink} target="_blank" rel="noredirect">
          <Typography variant="body2" className={classes.labelLink}>
            What's a {name.singular.toLowerCase()}?
          </Typography>
        </Link>
      </Box>
      <Box sx={{ mt: 1, mb: 2 }}>
        {list.length ? (
          <>
            {list.map(renderItem)}
            <Link onClick={onAdd} underline="none">
              <ButtonLink text={`Add a ${name.singular}`} icon={<AddSharp fontSize="small" />} />
            </Link>
          </>
        ) : (
          <Button fullWidth color="secondary" size="large" variant="contained" onClick={onAdd} startIcon={<AddSharp />}>
            Add a {name.singular}
          </Button>
        )}
      </Box>
    </>
  )
}
