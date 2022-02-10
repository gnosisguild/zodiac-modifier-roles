import React from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import RolesView from "./views/RolesList/RolesView"
import AttachRolesModifierView from "./views/AttachRolesModifier/AttachRolesModifierView"
import RoleView from "./views/Role/RoleView"
import { Root } from "./Root"

export const App = (): React.ReactElement => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />}>
          <Route index element={<AttachRolesModifierView />} />
          <Route path=":module" element={<RolesView />} />
          <Route path=":module/roles/:roleId" element={<RoleView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
