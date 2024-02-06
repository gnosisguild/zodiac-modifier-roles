"use client"

import { Fragment } from "react"
import { Tab } from "@headlessui/react"

import classes from "./style.module.css"
import cn from "classnames"

interface RoleViewProps {
  PermissionsChildren: React.ReactNode
  MembersChildren: React.ReactNode
}

const RoleView: React.FC<RoleViewProps> = ({
  PermissionsChildren,
  MembersChildren,
}) => {
  return (
    <Tab.Group>
      <Tab.List className={classes.tabGroup}>
        <TabButton>Permissions</TabButton>
        <TabButton>Members</TabButton>
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel>{PermissionsChildren}</Tab.Panel>
        <Tab.Panel>{MembersChildren}</Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  )
}

export default RoleView

const TabButton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Tab as={Fragment}>
      {({ selected }) => (
        <button className={cn(selected && classes.selected)}>{children}</button>
      )}
    </Tab>
  )
}
