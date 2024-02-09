"use client"

import { Fragment } from "react"
import { Tab } from "@headlessui/react"

import classes from "./style.module.css"
import cn from "classnames"

interface TabGroupProps {
  tabs: string[]
  panels: React.ReactNode[]
}

const TabGroup: React.FC<TabGroupProps> = ({ tabs, panels }) => {
  return (
    <Tab.Group>
      <Tab.List className={classes.tabGroup}>
        {tabs.map((tab, index) => (
          <TabButton key={index}>{tab}</TabButton>
        ))}
      </Tab.List>
      <Tab.Panels>
        {panels.map((panel, index) => (
          <Tab.Panel key={index}>{panel}</Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  )
}

export default TabGroup

const TabButton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Tab as={Fragment}>
      {({ selected }) => (
        <button className={cn(selected && classes.selected)}>{children}</button>
      )}
    </Tab>
  )
}
