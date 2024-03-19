import {
  defaultAbiCoder,
  getCreate2Address,
  keccak256,
  solidityKeccak256,
} from "ethers/lib/utils"

import {
  Roles__factory,
  ModuleProxyFactory__factory,
} from "../../evm/typechain-types"

import { extendAnnotations } from "./annotations"
import { POSTER_ADDRESS, encodeAnnotationsPost } from "./annotations/poster"
import { encodeCalls, grant } from "./calls"
import { Permission, PermissionSet, processPermissions } from "./permissions"
import { encodeRoleKey } from "./roleKey"

const ROLES_MASTERCOPY_ADDRESS = "0x9646fDAD06d3e24444381f44362a3B0eB343D337"
const PROXY_FACTORY_ADDRESS = "0x000000000000aDdB49795b0f9bA5BC298cDda236"
// https://github.com/safe-global/safe-deployments/blob/5ec81e8d7a85d66a33adbe0c098068c0a96d917c/src/assets/v1.4.1/multi_send.json
const DEFAULT_MULTISEND_ADDRESS = "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526"

const RolesInterface = Roles__factory.createInterface()
interface RoleConfig {
  key: string
  members: `0x${string}`[]
  permissions: readonly (Permission | PermissionSet)[]
}

/**
 * Applies the given `roles` configurations to the Roles mod at `address`.
 *
 * **Warning:** This function does not check if any of the roles are already configured on the Roles mod. It will not revoke any permissions or members from existing roles.
 **/
export const setUpRoles = ({
  address,
  roles,
}: {
  address: `0x${string}`
  roles: RoleConfig[]
}) => {
  // calls for configuring roles permissions
  const applyPermissionsCalls = roles.flatMap(({ key, permissions }) => {
    const { targets, annotations } = processPermissions(permissions)
    return [
      ...encodeCalls(encodeRoleKey(key), grant(targets)).map((data) => ({
        to: address,
        data,
        value: "0",
      })),
      ...(annotations.length > 0
        ? [
            {
              to: POSTER_ADDRESS,
              data: encodeAnnotationsPost(
                address,
                encodeRoleKey(key),
                extendAnnotations([], annotations)
              ),
              value: "0",
            },
          ]
        : []),
    ]
  })

  // calls for setting up role members
  const rolesByMember = roles.reduce((acc, { key, members }) => {
    members.forEach((member) => {
      acc[member] = acc[member] || []
      acc[member].push(key)
    })
    return acc
  }, {} as { [member: `0x${string}`]: string[] })
  const assignRolesCalls = Object.entries(rolesByMember).map(
    ([member, roleKeys]) => ({
      to: address,
      data: RolesInterface.encodeFunctionData("assignRoles", [
        member,
        roleKeys.map(encodeRoleKey),
        roleKeys.map(() => true),
      ]),
      value: "0",
    })
  )

  return [...applyPermissionsCalls, ...assignRolesCalls]
}

interface Config {
  avatar: `0x${string}`
  target?: `0x${string}`
  owner?: `0x${string}`

  roles?: RoleConfig[]

  multiSendAddresses?: `0x${string}`[]
  enableOnTarget?: boolean
  saltNonce?: `0x${string}`
}

export const setUpRolesMod = ({
  avatar,
  target = avatar,
  owner = avatar,
  roles = [],

  multiSendAddresses = [DEFAULT_MULTISEND_ADDRESS],
  enableOnTarget = true,
  saltNonce = "0x0000000000000000000000000000000000000000000000000000000000000000",
}: Config) => {
  // call for deploying the Roles mod proxy instance
  const setUpCalldata = Roles__factory.createInterface().encodeFunctionData(
    "setUp",
    [
      defaultAbiCoder.encode(
        ["address", "address", "address"],
        [owner, avatar, target]
      ),
    ]
  )
  const deployModuleCalldata =
    ModuleProxyFactory__factory.createInterface().encodeFunctionData(
      "deployModule",
      [ROLES_MASTERCOPY_ADDRESS, setUpCalldata, saltNonce]
    )
  const deployModuleCall = {
    to: PROXY_FACTORY_ADDRESS,
    data: deployModuleCalldata,
    value: "0",
  }

  // calculate deterministic proxy address for extra config calls
  const proxyAddress = calculateProxyAddress(setUpCalldata, saltNonce)

  // calls for setting up multiSend transaction unwrapping
  const MULTISEND_SELECTOR = "0x8d80ff0a"
  const MULTISEND_UNWRAPPER = "0x93B7fCbc63ED8a3a24B59e1C3e6649D50B7427c0"
  const setTransactionUnwrapperCalls = multiSendAddresses.map((address) => ({
    to: proxyAddress,
    data: RolesInterface.encodeFunctionData("setTransactionUnwrapper", [
      address,
      MULTISEND_SELECTOR,
      MULTISEND_UNWRAPPER,
    ]),
    value: "0",
  }))

  // calls for configuring members and permissions for all roles
  const setUpRolesCalls = setUpRoles({ address: proxyAddress, roles })

  const enableOnTargetCall = {
    to: target,
    data: RolesInterface.encodeFunctionData("enableModule", [proxyAddress]),
    value: "0",
  }

  return [
    deployModuleCall,
    ...setTransactionUnwrapperCalls,
    ...setUpRolesCalls,
    ...(enableOnTarget ? [enableOnTargetCall] : []),
  ]
}

const calculateProxyAddress = (initData: string, saltNonce: string) => {
  const byteCode =
    "0x602d8060093d393df3363d3d373d3d3d363d73" +
    ROLES_MASTERCOPY_ADDRESS.toLowerCase().slice(2) +
    "5af43d82803e903d91602b57fd5bf3"

  const salt = solidityKeccak256(
    ["bytes32", "uint256"],
    [solidityKeccak256(["bytes"], [initData]), saltNonce]
  )

  return getCreate2Address(
    PROXY_FACTORY_ADDRESS,
    salt,
    keccak256(byteCode)
  ) as `0x${string}`
}
