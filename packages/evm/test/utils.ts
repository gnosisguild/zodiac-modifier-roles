import { AddressZero } from "@ethersproject/constants";
import { Contract, utils, BigNumber, BigNumberish } from "ethers";
import { solidityPack } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getSingletonFactory } from "@gnosis.pm/zodiac/dist/src/factory/singletonFactory";

export const logGas = async (
  message: string,
  tx: Promise<any>
): Promise<any> => {
  return tx.then(async (result) => {
    const receipt = await result.wait();
    console.log(
      "           Used",
      receipt.gasUsed.toNumber(),
      `gas for >${message}<`
    );
    return result;
  });
};

export interface MetaTransaction {
  to: string;
  value: BigNumberish;
  data: string;
  operation: number;
}

export interface SafeTransaction extends MetaTransaction {
  safeTxGas: string | number;
  baseGas: string | number;
  gasPrice: string | number;
  gasToken: string;
  refundReceiver: string;
  nonce: string | number;
}

const encodeMetaTransaction = (tx: MetaTransaction): string => {
  const data = utils.arrayify(tx.data);
  const encoded = utils.solidityPack(
    ["uint8", "address", "uint256", "uint256", "bytes"],
    [tx.operation, tx.to, tx.value, data.length, data]
  );
  return encoded.slice(2);
};

export const encodeMultiSend = (txs: MetaTransaction[]): string => {
  return "0x" + txs.map((tx) => encodeMetaTransaction(tx)).join("");
};

export const buildMultiSendSafeTx = (
  multiSend: Contract,
  txs: MetaTransaction[],
  nonce: number,
  overrides?: Partial<SafeTransaction>
): SafeTransaction => {
  return buildContractCall(
    multiSend,
    "multiSend",
    [encodeMultiSend(txs)],
    nonce,
    true,
    overrides
  );
};

export const buildContractCall = (
  contract: Contract,
  method: string,
  params: any[],
  nonce: number,
  delegateCall?: boolean,
  overrides?: Partial<SafeTransaction>
): SafeTransaction => {
  const data = contract.interface.encodeFunctionData(method, params);
  return buildSafeTransaction(
    Object.assign(
      {
        to: contract.address,
        data,
        operation: delegateCall ? 1 : 0,
        nonce,
      },
      overrides
    )
  );
};

export const buildSafeTransaction = (template: {
  to: string;
  value?: BigNumber | number | string;
  data?: string;
  operation?: number;
  safeTxGas?: number | string;
  baseGas?: number | string;
  gasPrice?: number | string;
  gasToken?: string;
  refundReceiver?: string;
  nonce: number;
}): SafeTransaction => {
  return {
    to: template.to,
    value: template.value || 0,
    data: template.data || "0x",
    operation: template.operation || 0,
    safeTxGas: template.safeTxGas || 0,
    baseGas: template.baseGas || 0,
    gasPrice: template.gasPrice || 0,
    gasToken: template.gasToken || AddressZero,
    refundReceiver: template.refundReceiver || AddressZero,
    nonce: template.nonce,
  };
};

export enum ParameterType {
  None = 0,
  Static,
  Dynamic,
  Tuple,
  Array,
  AbiEncoded,
}

export enum Operator {
  // 00:    EMPTY EXPRESSION (default, always passes)
  //          paramType: Static / Dynamic
  //          🚫 children
  //          🚫 compValue
  /* 00: */ Pass = 0,
  // ------------------------------------------------------------
  // 01-04: LOGICAL EXPRESSIONS
  //          paramType: None
  //          ✅ children
  //          🚫 compValue
  /* 01: */ And = 1,
  /* 02: */ Or = 2,
  /* 03: */ Nor = 3,
  /* 04: */ Xor = 4,
  // ------------------------------------------------------------
  // 05-16: COMPLEX EXPRESSIONS
  //          paramType: AbiEncoded / Tuple / Array,
  //          ✅ children
  //          🚫 compValue
  /* 05: */ Matches = 5,
  /* 06: */ ArraySome = 6,
  /* 07: */ ArrayEvery = 7,
  /* 08: */ ArraySubset = 8,
  /* 09: */ _ComplexPlaceholder09,
  /* 10: */ _ComplexPlaceholder10,
  /* 11: */ _ComplexPlaceholder11,
  /* 12: */ _ComplexPlaceholder12,
  /* 13: */ _ComplexPlaceholder13,
  /* 14: */ _ComplexPlaceholder14,
  /* 15: */ _ComplexPlaceholder15,
  /* 16: */ _ComplexPlaceholder16,
  // ------------------------------------------------------------
  // 17-31: COMPARISON EXPRESSIONS
  //          paramType: Static / Dynamic
  //          🚫 children
  //          ✅ compValue
  /* 17: */ EqualTo = 17,
  /* 18: */ GreaterThan = 18,
  /* 19: */ LessThan = 19,
  /* 20: */ SignedIntGreaterThan = 20,
  /* 21: */ SignedIntLessThan = 21,
  /* 22: */ Bitmask = 22,
  /* 23: */ Custom = 23,
  /* 24: */ EqualToAvatar = 24,
  /* 25: */ _BinaryPlaceholder25,
  /* 26: */ _BinaryPlaceholder26,
  /* 27: */ _BinaryPlaceholder27,
  /* 28: */ _BinaryPlaceholder28,
  /* 29: */ WithinAllowance = 29,
  /* 30: */ EtherWithinAllowance = 30,
  /* 31: */ CallWithinAllowance = 31,
}

export enum ExecutionOptions {
  None = 0,
  Send,
  DelegateCall,
  Both,
}

export enum PermissionCheckerStatus {
  Ok,
  /// Role not allowed to delegate call to target address
  DelegateCallNotAllowed,
  /// Role not allowed to call target address
  TargetAddressNotAllowed,
  /// Role not allowed to call this function on target address
  FunctionNotAllowed,
  /// Role not allowed to send to target address
  SendNotAllowed,
  /// Or conition not met
  OrViolation,
  /// Nor conition not met
  NorViolation,
  /// Xor conition not met
  XorViolation,
  /// Parameter value is not equal to allowed
  ParameterNotAllowed,
  /// Parameter value less than allowed
  ParameterLessThanAllowed,
  /// Parameter value greater than maximum allowed by role
  ParameterGreaterThanAllowed,
  /// Parameter value does not match
  ParameterNotAMatch,
  /// Array elements do not meet allowed criteria for every element
  NotEveryArrayElementPasses,
  /// Array elements do not meet allowed criteria for at least one element
  NoArrayElementPasses,
  /// Parameter value not a subset of allowed
  ParameterNotSubsetOfAllowed,
  /// Bitmask exceeded value length
  BitmaskOverflow,
  /// Bitmask not an allowed value
  BitmaskNotAllowed,
  CustomConditionViolation,
  ParameterNotEqualToAvatar,
  /// TODO
  AllowanceExceeded,
  /// TODO
  CallAllowanceExceeded,
  /// TODO
  EtherAllowanceExceeded,
}

export function removeTrailingOffset(data: string) {
  return `0x${data.substring(66)}`;
}

export async function deployRolesMod(
  hre: HardhatRuntimeEnvironment,
  owner: string,
  avatar: string,
  target: string
) {
  await getSingletonFactory(hre.ethers.provider.getSigner());

  const Integrity = await hre.ethers.getContractFactory("Integrity");
  const integrity = await Integrity.deploy();

  const PermissionPacker = await hre.ethers.getContractFactory(
    "PermissionPacker"
  );
  const permissionPacker = await PermissionPacker.deploy();

  const Modifier = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      Integrity: integrity.address,
      PermissionPacker: permissionPacker.address,
    },
  });
  const modifier = await Modifier.deploy(owner, avatar, target);

  return modifier;
}

export const multisendPayload = (txs: MetaTransaction[]): string => {
  return (
    "0x" +
    txs
      .map((tx) =>
        solidityPack(
          ["uint8", "address", "uint256", "uint256", "bytes"],
          [tx.operation, tx.to, tx.value, (tx.data.length - 2) / 2, tx.data]
        ).slice(2)
      )
      .join("")
  );
};

export const BYTES32_ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
