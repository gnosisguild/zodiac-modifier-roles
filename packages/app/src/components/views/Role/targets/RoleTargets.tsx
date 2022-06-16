import { MenuEntity } from "../MenuEntity"
import { EntityStatus, Target } from "../../../../typings/role"
import RoleTarget from "./RoleTarget"
import AddTargetModal from "../../../modals/AddTargetModal"
import { useContext, useState } from "react"
import { RoleContext } from "../RoleContext"

export const RoleTargets = () => {
  const { state, addTarget, removeTarget, setActiveTarget } = useContext(RoleContext)

  const [addTargetModalIsOpen, setAddTargetModalIsOpen] = useState(false)
  const handleOpenAddTargetModal = () => setAddTargetModalIsOpen(true)

  const targets = [...state.targets.list, ...state.targets.add]
  const renderTarget = targets.filter((target) => target.type !== "None")

  const getStatus = (target: Target) => {
    if (state.targets.remove.includes(target.address)) return EntityStatus.REMOVE
    if (state.targets.add.find((_target) => _target.id === target.id)) return EntityStatus.PENDING
    return EntityStatus.NONE
  }

  const handleRemoveTarget = (target: Target, remove?: boolean) => {
    removeTarget({ target, remove })
  }

  return (
    <>
      <MenuEntity
        list={renderTarget}
        name={{ singular: "Target", plural: "Targets" }}
        tutorialLink="https://gnosis.github.io/zodiac/docs/tutorial-modifier-roles/add-role#targets"
        onAdd={handleOpenAddTargetModal}
        renderItem={(target) => (
          <RoleTarget
            key={target.address}
            status={getStatus(target)}
            target={target}
            onClickTarget={(target) => setActiveTarget(target.id)}
            activeTarget={!!(state.activeTarget && state.activeTarget === target.id)}
            onRemoveTarget={handleRemoveTarget}
          />
        )}
      />

      <AddTargetModal
        isOpen={addTargetModalIsOpen}
        onAddTarget={addTarget}
        onClose={() => setAddTargetModalIsOpen(false)}
      />
    </>
  )
}
