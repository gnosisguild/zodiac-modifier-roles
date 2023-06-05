import { Condition, Operator, ParameterType } from "zodiac-roles-sdk";
import AbiTree from "@/components/tree/AbiTree";
import ConditionTree, { gatherNodeIds } from "@/components/tree/ConditionTree";
import { ParamType } from "@ethersproject/abi";
import styles from "./styles.module.css";
import { useTreeState } from "@/components/tree/Tree";
import CallData from "@/components/CallData";

export const BalancerSwapExample = () => {
  const treeState = useTreeState({
    expanded: allNodeIds,
    highlightColor(id) {
      return 1;
    },
  });
  return (
    <div className={styles.grid}>
      <div className={styles.box}>
        <div className={styles.boxLabel}>ABI inputs</div>
        <AbiTree inputs={balancerSwapInputs} {...treeState} />
      </div>
      <div className={styles.box}>
        <div className={styles.boxLabel}>condition</div>
        <ConditionTree condition={balancerSwapCondition} {...treeState} />
      </div>
      <div className={styles.box}>
        <div className={styles.boxLabel}>✅ example call data (valid)</div>
        <CallData
          data="0x52bbbe2900000000000000000000000000000000000000000000000000000000000000e00000000000000000000000004F2083f5fBede34C2714aFfb3105539775f7FE6400000000000000000000000000000000000000000000000000000000000000000000000000000000000000004F2083f5fBede34C2714aFfb3105539775f7FE640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
          comments={{
            [2]: "sender: avatar address",
            [4]: "recipient: avatar address",
            [8]: "WETH/DAI pool ID",
            [10]: "WETH token address",
            [11]: "DAI token address",
          }}
        />
      </div>
      <div className={styles.box}>
        <div className={styles.boxLabel}>⛔ example call data (violation)</div>
        <CallData
          data="0x52bbbe2900000000000000000000000000000000000000000000000000000000000000e00000000000000000000000004F2083f5fBede34C2714aFfb3105539775f7FE640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000098B716B8Aaf21512996dC57EB0615e2383E2f960000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
          comments={{
            [2]: "sender: avatar address",
            [4]: "recipient: Lazarus group ☠️",
            [8]: "WETH/DAI pool ID",
            [10]: "WETH token address",
            [11]: "DAI token address",
          }}
          invalid={[4]}
        />
      </div>
    </div>
  );
};

const balancerSwapInputs = [
  ParamType.from({
    components: [
      { internalType: "bytes32", name: "poolId", type: "bytes32" },
      {
        internalType: "enum IVault.SwapKind",
        name: "kind",
        type: "uint8",
      },
      {
        internalType: "contract IAsset",
        name: "assetIn",
        type: "address",
      },
      {
        internalType: "contract IAsset",
        name: "assetOut",
        type: "address",
      },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    internalType: "struct IVault.SingleSwap",
    name: "singleSwap",
    type: "tuple",
  }),
  ParamType.from({
    components: [
      { internalType: "address", name: "sender", type: "address" },
      {
        internalType: "bool",
        name: "fromInternalBalance",
        type: "bool",
      },
      {
        internalType: "address payable",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "bool",
        name: "toInternalBalance",
        type: "bool",
      },
    ],
    internalType: "struct IVault.FundManagement",
    name: "funds",
    type: "tuple",
  }),
  ParamType.from({ internalType: "uint256", name: "limit", type: "uint256" }),
  ParamType.from({
    internalType: "uint256",
    name: "deadline",
    type: "uint256",
  }),
];

const balancerSwapCondition: Condition = {
  paramType: ParameterType.AbiEncoded,
  operator: Operator.Matches,
  children: [
    {
      paramType: ParameterType.Tuple,
      operator: Operator.Matches,
      children: [
        {
          // poolId
          paramType: ParameterType.Static,
          operator: Operator.EqualTo,
          compValue:
            "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
        },
        {
          // kind
          paramType: ParameterType.Static,
          operator: Operator.Pass,
        },
        {
          // assetIn
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            }, // WETH
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: "0x6b175474e89094c44da98b954eedeac495271d0f",
            }, // DAI
          ],
        },
        {
          // assetOut
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            }, // WETH
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: "0x6b175474e89094c44da98b954eedeac495271d0f",
            }, // DAI
          ],
        },
      ],
    },
    {
      paramType: ParameterType.Tuple,
      operator: Operator.Matches,
      children: [],
    },
  ],
};

const allNodeIds = gatherNodeIds(balancerSwapCondition);
