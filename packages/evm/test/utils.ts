import assert from "assert";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { EthereumProvider, HardhatRuntimeEnvironment } from "hardhat/types";
import {
  BigNumberish,
  BytesLike,
  ZeroHash,
  ethers,
  solidityPacked,
} from "ethers";
import {
  deployFactories,
  deployMastercopy,
  EIP1193Provider,
} from "@gnosis-guild/zodiac-core";

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
  const [signer] = await hre.ethers.getSigners();
  const provider = createEip1193(hre.network.provider, signer);

  await deployFactories({ provider });
  const integrity = await hre.artifacts.readArtifact("Integrity");
  const { address: integrityAddress } = await deployMastercopy({
    bytecode: integrity.bytecode,
    constructorArgs: { types: [], values: [] },
    salt: ZeroHash,
    provider,
  });
  const packer = await hre.artifacts.readArtifact("Packer");
  const { address: packerAddress } = await deployMastercopy({
    bytecode: packer.bytecode,
    constructorArgs: { types: [], values: [] },
    salt: ZeroHash,
    provider,
  });

  const Modifier = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      Integrity: integrityAddress,
      Packer: packerAddress,
    },
  });
  const modifier = await Modifier.deploy(owner, avatar, target);
  await modifier.waitForDeployment();
  return modifier;
}

export const encodeMultisendPayload = (txs: MetaTransaction[]): string => {
  return (
    "0x" +
    txs
      .map((tx) =>
        solidityPacked(
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
        compValue: node.compValue as ethers.BytesLike,
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

export function createEip1193(
  provider: EthereumProvider,
  signer: HardhatEthersSigner
): EIP1193Provider {
  return {
    request: async ({ method, params }) => {
      if (method == "eth_sendTransaction") {
        const { hash } = await signer.sendTransaction((params as any[])[0]);
        return hash;
      }

      return provider.request({ method, params });
    },
  };
}
