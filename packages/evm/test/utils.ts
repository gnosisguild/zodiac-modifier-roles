import { AddressZero } from "@ethersproject/constants";
import { Contract, utils, BigNumber } from "ethers";

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
  value: string | number | BigNumber;
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
  Whatever = 0,
  // ------------------------------------------------------------
  // 01-04: BOOLEAN EXPRESSIONS
  //          paramType: None
  //          ✅ children
  //          🚫 compValue
  /* 01: */ And = 1,
  /* 02: */ Or = 2,
  /* 03: */ Xor = 3,
  /* 04: */ Not = 4,
  // ------------------------------------------------------------
  // 05-16: COMPLEX TYPE EXPRESSIONS
  //          paramType: AbiEncoded / Tuple / Array,
  //          ✅ children
  //          🚫 compValue
  /* 05: */ Matches = 5,
  /* 06: */ Some = 6,
  /* 07: */ Every = 7,
  /* 08: */ SubsetOf = 8,
  // /* 09: */ _ComplexPlaceholder09,
  // /* 10: */ _ComplexPlaceholder10,
  // /* 11: */ _ComplexPlaceholder11,
  // /* 12: */ _ComplexPlaceholder12,
  // /* 13: */ _ComplexPlaceholder13,
  // /* 14: */ _ComplexPlaceholder14,
  // /* 15: */ _ComplexPlaceholder15,
  // /* 16: */ _ComplexPlaceholder16,
  // ------------------------------------------------------------
  // 17-31: BINARY COMPARISON EXPRESSIONS
  //          paramType: Static / Dynamic
  //          🚫 children
  //          ✅ compValue
  /* 17: */ EqualTo = 17,
  /* 18: */ GreaterThan = 18,
  /* 19: */ LessThan = 19,
  /* 20: */ Bitmask = 20,
  // /* 21: */ _BinaryPlaceholder21,
  // /* 22: */ _BinaryPlaceholder22,
  // /* 23: */ _BinaryPlaceholder23,
  // /* 24: */ _BinaryPlaceholder24,
  // /* 25: */ _BinaryPlaceholder25,
  // /* 26: */ _BinaryPlaceholder26,
  // /* 27: */ _BinaryPlaceholder27,
  // /* 28: */ _BinaryPlaceholder28,
  /* 29: */ WithinAllowance = 29,
  /* 30: */ EthWithinAllowance = 30,
  /* 31: */ CallWithinAllowance = 31,
}

export enum ExecutionOptions {
  None = 0,
  Send,
  DelegateCall,
  Both,
}

export function removeTrailingOffset(data: string) {
  return `0x${data.substring(66)}`;
}
