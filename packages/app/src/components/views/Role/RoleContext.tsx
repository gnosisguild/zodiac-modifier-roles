import React, { PropsWithChildren, Reducer, useEffect, useMemo, useReducer } from "react"
import {
  ConditionType,
  ExecutionOption,
  FunctionCondition,
  ParamCondition,
  ParameterType,
  Role,
  Target,
  TargetConditions,
} from "../../../typings/role"
import { getRoleId } from "./RoleMenu"
import { useRootSelector } from "../../../store"
import { getRoles } from "../../../store/main/selectors"

export interface RoleContextState {
  id: string
  activeTarget?: string
  role?: Role
  members: {
    list: string[]
    add: string[]
    remove: string[]
  }
  targets: {
    list: Target[]
    add: Target[]
    remove: string[]
  }

  getActiveRole(): Target | undefined

  getTargetUpdate(targetId: string): UpdateEvent[]
}

enum RoleActionType {
  ADD_MEMBER,
  ADD_TARGET,
  REMOVE_MEMBER,
  REMOVE_TARGET,
  SET_ACTIVE_TARGET,
  SET_TARGET_EXECUTION_OPTION,
  SET_TARGET_CONDITIONS,
  SET_TARGET_CLEARANCE,
  RESET_STATE,
}

interface RoleAction {
  type: RoleActionType
  payload: any
}

export enum Level {
  SCOPE_TARGET, // Allowed, Scoped, Blocked
  SCOPE_FUNCTION, // Allowed, Scoped, Blocked
  SCOPE_PARAM,
  UPDATE_FUNCTION_EXECUTION_OPTION,
}

export type UpdateEvent =
  | {
      level: Level.SCOPE_TARGET
      value: Target
      old: Target
    }
  | {
      level: Level.SCOPE_FUNCTION | Level.UPDATE_FUNCTION_EXECUTION_OPTION
      value: FunctionCondition
      old: FunctionCondition
      targetAddress: string
    }
  | {
      level: Level.SCOPE_PARAM
      funcSighash: string
      targetAddress: string
      value: ParamCondition
      old: ParamCondition
    }

type RemoveTargetPayload = { target: Target; remove?: boolean }

type RemoveMemberPayload = { member: string; remove?: boolean }

type SetTargetExecutionOptionPayload = { targetId: string; option: ExecutionOption }

type SetTargetConditionsPayload = { targetId: string; conditions: TargetConditions }

type SetTargetClearancePayload = { targetId: string; option: ConditionType }

function handleRemoveTarget(state: RoleContextState, payload: RemoveTargetPayload): RoleContextState {
  const { target, remove = true } = payload

  if (state.activeTarget === target.id) {
    return handleRemoveTarget({ ...state, activeTarget: undefined }, payload)
  }

  if (!remove) {
    // Remove from delete queue
    return {
      ...state,
      targets: { ...state.targets, remove: state.targets.remove.filter((_target) => _target !== target.address) },
    }
  }
  if (state.targets.add.find((_target) => _target.address === target.address)) {
    return {
      ...state,
      targets: { ...state.targets, add: state.targets.add.filter((_target) => _target.address !== target.address) },
    }
  }
  if (state.targets.remove.includes(target.address)) {
    // Already in queue
    return state
  }

  return { ...state, targets: { ...state.targets, remove: [...state.targets.remove, target.address] } }
}

function handleAddTarget(state: RoleContextState, target: Target): RoleContextState {
  const currentTarget =
    state.targets.add.find((_target) => target.address.toLowerCase() === _target.address.toLowerCase()) ||
    state.targets.list.find((_target) => target.address.toLowerCase() === _target.address.toLowerCase())
  if (currentTarget) {
    return { ...state, activeTarget: currentTarget.id }
  }
  return {
    ...state,
    activeTarget: target.id,
    targets: { ...state.targets, add: [...state.targets.add, { ...target, address: target.address.toLowerCase() }] },
  }
}

const handleRemoveMember = (state: RoleContextState, payload: RemoveMemberPayload): RoleContextState => {
  const { member, remove = true } = payload
  if (!remove) {
    // Remove from delete queue
    return {
      ...state,
      members: { ...state.members, remove: state.members.remove.filter((_member) => _member !== member) },
    }
  }
  if (state.members.add.includes(member)) {
    return {
      ...state,
      members: { ...state.members, add: state.members.add.filter((_member) => _member !== member) },
    }
  }
  if (state.members.remove.includes(member)) {
    // Already in queue
    return state
  }
  return { ...state, members: { ...state.members, remove: [...state.members.remove, member] } }
}

function replaceTargetValue(targets: Target[], id: string, value: Partial<Target>): Target[] {
  return targets.map((target): Target => {
    if (target.id === id) {
      return { ...target, ...value }
    }
    return target
  })
}

function handleTargetExecutionOption(
  state: RoleContextState,
  payload: SetTargetExecutionOptionPayload,
): RoleContextState {
  const replaceValue = (targets: Target[]) =>
    replaceTargetValue(targets, payload.targetId, { executionOption: payload.option })

  if (state.targets.list.find((target) => target.id === payload.targetId)) {
    return { ...state, targets: { ...state.targets, list: replaceValue(state.targets.list) } }
  }
  return { ...state, targets: { ...state.targets, add: replaceValue(state.targets.add) } }
}

function handleTargetConditions(state: RoleContextState, payload: SetTargetConditionsPayload): RoleContextState {
  const replaceValue = (targets: Target[]) => {
    const conditionTypes = Object.values(payload.conditions).map((condition) => condition.type)
    const targetInState = targets.find((target) => target.id === payload.targetId)

    if (!targetInState) {
      throw Error("Target not found in state")
    }

    let type: ConditionType = targetInState.type
    if (type !== ConditionType.WILDCARDED) {
      const hasWildcardedFunction = conditionTypes.some((condition) => condition === ConditionType.WILDCARDED)
      const hasScopedFunction = conditionTypes.some((condition) => condition === ConditionType.SCOPED)

      type = ConditionType.SCOPED
      if (!hasScopedFunction && !hasWildcardedFunction) {
        type = ConditionType.BLOCKED
      }
    }

    return replaceTargetValue(targets, payload.targetId, { type, conditions: payload.conditions })
  }

  if (state.targets.list.find((target) => target.id === payload.targetId)) {
    return { ...state, targets: { ...state.targets, list: replaceValue(state.targets.list) } }
  }
  return { ...state, targets: { ...state.targets, add: replaceValue(state.targets.add) } }
}

function handleAddMember(state: RoleContextState, payload: string): RoleContextState {
  if (state.members.add.includes(payload.toLowerCase()) || state.members.list.includes(payload.toLowerCase())) {
    return state
  }
  return { ...state, members: { ...state.members, add: [...state.members.add, payload.toLowerCase()] } }
}

function handleSetTargetClearance(state: RoleContextState, payload: SetTargetClearancePayload): RoleContextState {
  const replaceOption = (target: Target): Target => {
    if (target.id !== payload.targetId) return target
    return { ...target, executionOption: ExecutionOption.NONE, type: payload.option }
  }

  return {
    ...state,
    targets: {
      ...state.targets,
      add: state.targets.add.map(replaceOption),
      list: state.targets.list.map(replaceOption),
    },
  }
}

const roleReducer: Reducer<RoleContextState, RoleAction> = (state, action) => {
  switch (action.type) {
    case RoleActionType.ADD_MEMBER:
      return handleAddMember(state, action.payload)
    case RoleActionType.ADD_TARGET:
      return handleAddTarget(state, action.payload)
    case RoleActionType.REMOVE_TARGET:
      return handleRemoveTarget(state, action.payload)
    case RoleActionType.REMOVE_MEMBER:
      return handleRemoveMember(state, action.payload)
    case RoleActionType.SET_ACTIVE_TARGET:
      return { ...state, activeTarget: action.payload }
    case RoleActionType.SET_TARGET_EXECUTION_OPTION:
      return handleTargetExecutionOption(state, action.payload)
    case RoleActionType.SET_TARGET_CONDITIONS:
      return handleTargetConditions(state, action.payload)
    case RoleActionType.SET_TARGET_CLEARANCE:
      return handleSetTargetClearance(state, action.payload)
    case RoleActionType.RESET_STATE:
      return initReducerState(action.payload)
  }
}

interface RoleContextWrapProps {
  id: string
  role?: Role
}

interface RoleContextValue {
  state: RoleContextState

  addMember(payload: string): void

  setActiveTarget(payload: string): void

  addTarget(payload: Target): void

  removeMember(payload: RemoveMemberPayload): void

  removeTarget(payload: RemoveTargetPayload): void

  setTargetExecutionOption(payload: SetTargetExecutionOptionPayload): void

  setTargetConditions(payload: SetTargetConditionsPayload): void

  setTargetClearance(payload: SetTargetClearancePayload): void

  reset(payload: RoleContextWrapProps): void
}

export const RoleContext = React.createContext<RoleContextValue>({
  state: {
    id: "",
    targets: { add: [], remove: [], list: [] },
    members: { add: [], remove: [], list: [] },
    getActiveRole: (): Target => ({} as Target),
    getTargetUpdate: (): UpdateEvent[] => [],
  },
  addTarget() {},
  removeMember() {},
  removeTarget() {},
  addMember() {},
  setActiveTarget() {},
  setTargetConditions() {},
  setTargetExecutionOption() {},
  setTargetClearance() {},
  reset() {},
})

function initReducerState({ id, role }: RoleContextWrapProps): RoleContextState {
  return {
    id,
    role,
    members: {
      list: role?.members.map((member) => member.address) || [],
      add: [],
      remove: [],
    },
    targets: {
      list: role?.targets || [],
      add: [],
      remove: [],
    },
    getActiveRole(): Target | undefined {
      const inList = this.targets.list.find((target) => target.id === this.activeTarget)
      if (inList) {
        return inList
      }
      return this.targets.add.find((target) => target.id === this.activeTarget)
    },
    getTargetUpdate(targetId: string): UpdateEvent[] {
      const updatedTarget = [...this.targets.list, ...this.targets.add].find((_target) => _target.id === targetId)
      if (!updatedTarget) return []

      const originalTarget = this.role?.targets.find((_target) => _target.id === targetId)
      if (!originalTarget) {
        // Avoid creating block conditions as that's the default value
        if (updatedTarget.type === ConditionType.BLOCKED) return []

        // If original is not found, target will be created
        const functionEvents = Object.values(updatedTarget.conditions)
          .map((funcCondition) => getFunctionUpdate(updatedTarget, funcCondition))
          .flat()
        const createEvent: UpdateEvent = {
          level: Level.SCOPE_TARGET,
          value: updatedTarget,
          old: updatedTarget,
        }
        return [createEvent, ...functionEvents]
      }

      const isClearanceUpdated = originalTarget.type !== updatedTarget.type

      if (updatedTarget.type !== ConditionType.SCOPED) {
        /**
         * If Clearance if WILDCARDED or BLOCKED, only update clearance and execution option (if needed).
         */
        const isExecutionOptionUpdated = originalTarget.executionOption !== updatedTarget.executionOption

        if (!isClearanceUpdated && (updatedTarget.type === ConditionType.BLOCKED || !isExecutionOptionUpdated))
          return []

        return [{ level: Level.SCOPE_TARGET, value: updatedTarget, old: originalTarget }]
      }

      const events: UpdateEvent[] = []

      if (isClearanceUpdated) {
        events.push({ level: Level.SCOPE_TARGET, value: updatedTarget, old: originalTarget })
      }

      const functionEvents = Object.values(updatedTarget.conditions)
        .map((funcCondition) => {
          const originalFuncCondition = originalTarget.conditions[funcCondition.sighash]
          return getFunctionUpdate(updatedTarget, funcCondition, originalFuncCondition)
        })
        .flat()

      events.push(...functionEvents)

      return events
    },
  }
}

function getParamUpdate(
  targetAddress: string,
  funcCondition: FunctionCondition,
  original?: FunctionCondition,
): UpdateEvent[] {
  const updates = funcCondition.params.reduce((toUpdate, newParamConfig) => {
    // console.log("getParamUpdate - param:", newParamConfig)
    if (!newParamConfig) return toUpdate
    const originalParamConfig = original?.params.find((_param) => newParamConfig.index === _param?.index)
    // console.log("getParamUpdate - originalParam:", originalParamConfig)

    if (
      originalParamConfig &&
      newParamConfig.value === originalParamConfig.value &&
      newParamConfig.type === originalParamConfig.type &&
      newParamConfig.condition === originalParamConfig.condition
    ) {
      return toUpdate
    }

    return [
      ...toUpdate,
      {
        level: Level.SCOPE_PARAM,
        value: newParamConfig,
        old: newParamConfig,
        targetAddress,
        funcSighash: funcCondition.sighash,
      } as UpdateEvent,
    ]
  }, [] as UpdateEvent[])

  const removals = (original?.params ?? []).reduce((toRemove, originalParamConfig) => {
    const newParamConfig = funcCondition.params.find((_param) => originalParamConfig.index === _param?.index)

    if (
      newParamConfig == null &&
      updates.find((update: any) => update.value.index === originalParamConfig.index) == null // check if param was updated
    ) {
      // param was removed
      return [
        ...toRemove,
        {
          level: Level.SCOPE_PARAM,
          value: {
            ...originalParamConfig,
            type: ParameterType.NO_RESTRICTION, // remove restriction
          },
          old: originalParamConfig,
          targetAddress,
          funcSighash: funcCondition.sighash,
        },
      ] as UpdateEvent[]
    }
    return toRemove
  }, [] as UpdateEvent[])

  return [...updates, ...removals]
}

function getFunctionUpdate(
  target: Target,
  funcCondition: FunctionCondition,
  original?: FunctionCondition,
): UpdateEvent[] {
  if (!original && funcCondition.type === ConditionType.BLOCKED) return []

  const isClearanceUpdated = original?.type !== funcCondition.type
  const isExecutionOptionUpdated = original?.executionOption !== funcCondition.executionOption

  if (funcCondition.type !== ConditionType.SCOPED) {
    /**
     * If Clearance if WILDCARDED or BLOCKED, only update clearance and execution option (if needed).
     */

    if (!isClearanceUpdated && isExecutionOptionUpdated)
      return [
        {
          level: Level.UPDATE_FUNCTION_EXECUTION_OPTION,
          value: funcCondition,
          old: original,
          targetAddress: target.address,
        },
      ]

    if (!isClearanceUpdated && (funcCondition.type === ConditionType.BLOCKED || !isExecutionOptionUpdated)) return []

    return [
      {
        level: Level.SCOPE_FUNCTION,
        value: funcCondition,
        old: original || funcCondition,
        targetAddress: target.address,
      },
    ]
  }

  const events: UpdateEvent[] = []

  if (isClearanceUpdated) {
    events.push({
      level: Level.SCOPE_FUNCTION,
      value: funcCondition,
      old: original || funcCondition,
      targetAddress: target.address,
    })
  } else if (isExecutionOptionUpdated) {
    events.push({
      level: Level.UPDATE_FUNCTION_EXECUTION_OPTION,
      value: funcCondition,
      old: original,
      targetAddress: target.address,
    })
  }

  // Function is SCOPED
  const paramsEvents = getParamUpdate(target.address, funcCondition, original)
  events.push(...paramsEvents)

  return events
}

export const RoleContextWrap = ({ id, role, children }: PropsWithChildren<RoleContextWrapProps>) => {
  const roles = useRootSelector(getRoles)

  const [state, dispatch] = useReducer(roleReducer, { id: getRoleId(id, roles), role }, initReducerState)

  const methods = useMemo((): Omit<RoleContextValue, "state"> => {
    return {
      addMember(payload: string) {
        return dispatch({ type: RoleActionType.ADD_MEMBER, payload })
      },
      addTarget(payload: Target) {
        return dispatch({ type: RoleActionType.ADD_TARGET, payload })
      },
      removeMember(payload: RemoveMemberPayload) {
        return dispatch({ type: RoleActionType.REMOVE_MEMBER, payload })
      },
      removeTarget(payload: RemoveTargetPayload) {
        return dispatch({ type: RoleActionType.REMOVE_TARGET, payload })
      },
      setActiveTarget(payload: string) {
        return dispatch({ type: RoleActionType.SET_ACTIVE_TARGET, payload })
      },
      setTargetExecutionOption(payload: SetTargetExecutionOptionPayload) {
        return dispatch({ type: RoleActionType.SET_TARGET_EXECUTION_OPTION, payload })
      },
      setTargetConditions(payload: SetTargetConditionsPayload) {
        return dispatch({ type: RoleActionType.SET_TARGET_CONDITIONS, payload })
      },
      setTargetClearance(payload: SetTargetClearancePayload) {
        return dispatch({ type: RoleActionType.SET_TARGET_CLEARANCE, payload })
      },
      reset(payload: RoleContextWrapProps) {
        return dispatch({ type: RoleActionType.RESET_STATE, payload })
      },
    }
  }, [dispatch])

  useEffect(() => {
    methods.reset({ role, id: getRoleId(id, roles) })
  }, [id, methods, role, roles])

  const value: RoleContextValue = {
    state,
    ...methods,
  }
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}
