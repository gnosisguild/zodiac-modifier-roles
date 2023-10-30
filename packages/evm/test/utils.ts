import assert from "assert";
import { BigNumberish, Signer } from "ethers";
import {
  BytesLike,
  getAddress,
  parseEther,
  solidityPack,
} from "ethers/lib/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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

export enum ParameterType {
  None = 0,
  Static,
  Dynamic,
  Tuple,
  Array,
  Calldata,
  AbiEncoded,
}

export enum Operator {
  // 00:    EMPTY EXPRESSION (default, always passes)
  //          paramType: Static / Dynamic / Tuple / Array
  //          ❓ children (only for paramType: Tuple / Array to describe their structure)
  //          🚫 compValue
  /* 00: */ Pass = 0,
  // ------------------------------------------------------------
  // 01-04: LOGICAL EXPRESSIONS
  //          paramType: None
  //          ✅ children
  //          🚫 compValue
  /* 01: */ And,
  /* 02: */ Or,
  /* 03: */ Nor,
  /* 04: */ _Placeholder04,
  // ------------------------------------------------------------
  // 05-14: COMPLEX EXPRESSIONS
  //          paramType: Calldata / Tuple / Array,
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
  // ------------------------------------------------------------
  // 15:    SPECIAL COMPARISON (without compValue)
  //          paramType: Static
  //          🚫 children
  //          🚫 compValue
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
  /// Or condition not met
  OrViolation,
  /// Nor condition not met
  NorViolation,
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

export const encodeMultisendPayload = (txs: MetaTransaction[]): string => {
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

export function toConditionsFlat(root: ConditionStruct): ConditionFlatStruct[] {
  let queue = [{ node: root, parent: 0 }];
  let result: ConditionFlatStruct[] = [];

  for (let bfsOrder = 0; queue.length > 0; bfsOrder++) {
    const entry = queue.shift();
    assert(entry);

    const { node, parent } = entry;

    result = [
      ...result,
      {
        parent,
        paramType: node.paramType,
        operator: node.operator,
        compValue: node.compValue,
      },
    ];

    queue = [
      ...queue,
      ...(node.children || []).map((child) => ({
        node: child,
        parent: bfsOrder,
      })),
    ];
  }

  return result;
}

async function getSingletonFactory(signer: Signer) {
  const factoryAddress = getAddress(
    "0xce0042b868300000d44a59004da54a005ffdcf9f"
  );
  const deployerAddress = getAddress(
    "0xBb6e024b9cFFACB947A71991E386681B1Cd1477D"
  );

  const provider = signer.provider;
  assert(provider);

  // check if singleton factory is deployed.
  if ((await provider.getCode(factoryAddress)) === "0x") {
    // fund the singleton factory deployer account
    await signer.sendTransaction({
      to: deployerAddress,
      value: parseEther("0.0247"),
    });

    // deploy the singleton factory
    await (
      await provider.sendTransaction(
        "0xf9016c8085174876e8008303c4d88080b90154608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c634300060200331b83247000822470"
      )
    )?.wait();

    if ((await provider.getCode(factoryAddress)) == "0x") {
      throw Error("Singleton factory could not be deployed to correct address");
    }
  }
}
