import { Box, Button, Typography } from "@material-ui/core"
import { AddSharp } from "@material-ui/icons"
import { useNavigate, useParams } from "react-router-dom"

export const RolesEmpty = () => {
  const navigate = useNavigate()
  const { module } = useParams()

  const handleCreateRole = () => navigate(`/${module}/roles/new`)

  return (
    <Box
      style={{
        maxWidth: 500,
      }}
    >
      <Typography style={{ marginBottom: 8 }}>You currently have no roles associated with this safe.</Typography>
      <Button
        fullWidth
        color="secondary"
        size="large"
        variant="contained"
        onClick={handleCreateRole}
        startIcon={<AddSharp />}
      >
        Create Role
      </Button>
    </Box>
  )
}
