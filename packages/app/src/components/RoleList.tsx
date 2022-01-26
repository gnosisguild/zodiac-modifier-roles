import { List, ListItem, ListItemText } from "@material-ui/core"
import React  from "react"
import { useGetRolesForRolesModifier } from "../hooks/useSubgraph"

type Props = {
  modifierAddress: string
}

const RoleList = ({ modifierAddress }: Props): React.ReactElement => {
  const roles = useGetRolesForRolesModifier(modifierAddress)

	console.log(roles)

  return (
    <List>
      {roles.map((role) => (
        <ListItem key={role.id}>
          <ListItemText primary={role.id} />
        </ListItem>
      ))}
    </List>
  )
}

export default RoleList
