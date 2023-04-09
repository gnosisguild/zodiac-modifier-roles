import { AddressZero } from "@ethersproject/constants";
import { Contract, utils, BigNumber, BigNumberish } from "ethers";
import { BytesLike, solidityPack } from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getSingletonFactory } from "@gnosis.pm/zodiac/dist/src/factory/singletonFactory";
import { ConditionFlatStruct } from "../typechain-types/contracts/Integrity";

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
  //          paramType: Static / Dynamic / Tuple / Array
  //          🚫 children
  //          ❓ children (only for paramType: Tuple / Array to describe their structure)
  /* 00: */ Pass = 0,
  // ------------------------------------------------------------
  // 01-04: LOGICAL EXPRESSIONS
  //          paramType: None
  //          ✅ children
  //          🚫 compValue
  /* 01: */ And,
  /* 02: */ Or,
  /* 03: */ Nor,
  /* 04: */ Xor,
  // ------------------------------------------------------------
  // 05-16: COMPLEX EXPRESSIONS
  //          paramType: AbiEncoded / Tuple / Array,
  //          ✅ children
  //          🚫 compValue
  /* 05: */ Matches,
  /* 06: */ ArraySome,
  /* 07: */ ArrayEvery,
  /* 08: */ ArraySubset,
  /* 09: */ _Placeholder09,
  /* 10: */ _Placeholder10,
  /* 11: */ _Placeholder11,
  /* 12: */ _Placeholder12,
  /* 13: */ _Placeholder13,
  /* 14: */ _Placeholder14,
  /* 15: */ EqualToAvatar,
  // ------------------------------------------------------------
  // 16-31: COMPARISON EXPRESSIONS
  //          paramType: Static / Dynamic / Tuple / Array
  //          ❓ children (only for paramType: Tuple / Array to describe their structure)
  //          ✅ compValue
  /* 16: */ EqualTo, // paramType: Static / Dynamic / Tuple / Array
  /* 17: */ GreaterThan, // paramType: Static
  /* 18: */ LessThan, // paramType: Static
  /* 19: */ SignedIntGreaterThan, // paramType: Static
  /* 20: */ SignedIntLessThan, // paramType: Static
  /* 21: */ Bitmask, // paramType: Static / Dynamic
  /* 22: */ Custom, // paramType: Static / Dynamic / Tuple / Array
  /* 23: */ _Placeholder23,
  /* 24: */ _Placeholder24,
  /* 25: */ _Placeholder25,
  /* 26: */ _Placeholder26,
  /* 27: */ _Placeholder27,
  /* 28: */ WithinAllowance, // paramType: Static
  /* 29: */ EtherWithinAllowance, // paramType: None
  /* 30: */ CallWithinAllowance, // paramType: None
  /* 31: */ _Placeholder31,
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

  const Packer = await hre.ethers.getContractFactory("Packer");
  const packer = await Packer.deploy();

  const Modifier = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      Integrity: integrity.address,
      Packer: packer.address,
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

type ConditionStruct = {
  paramType: ParameterType;
  operator: Operator;
  compValue: BytesLike;
  children?: ConditionStruct[];
};

export function toConditionsFlat(
  condition: ConditionStruct,
  index = 0,
  parent = 0
): ConditionFlatStruct[] {
  const { children = [], ...rest } = condition;

  return [
    { ...rest, parent },
    ...children.flatMap((child, j) =>
      toConditionsFlat(child, index + 1 + j, index)
    ),
  ].sort((a, b) => (a.parent < b.parent ? -1 : 1));
}
