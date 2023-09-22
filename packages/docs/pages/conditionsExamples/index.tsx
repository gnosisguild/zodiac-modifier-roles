import { Condition, Operator, ParameterType } from "zodiac-roles-sdk";
import AbiTree from "@/components/tree/AbiTree";
import ConditionTree, { gatherNodeIds } from "@/components/tree/ConditionTree";
import { ParamType } from "@ethersproject/abi";
import clsx from "clsx";
import { useState } from "react";
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

  const callDataHighlight = Object.fromEntries(
    Object.entries(treeState.highlight || {}).flatMap(
      ([id, color]) => wordsByNodeId[id]?.map((word) => [word, color]) || []
    )
  );

  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={styles.grid}>
      <div className={styles.box}>
        <div className={styles.boxLabel}>ABI inputs</div>
        <AbiTree inputs={balancerSwapInputs} {...treeState} highlightOnHover />
      </div>
      <div className={styles.box}>
        <div className={styles.boxLabel}>condition</div>
        <ConditionTree
          condition={balancerSwapCondition}
          {...treeState}
          highlightOnHover
        />
      </div>
      <div className={clsx(styles.box, styles.fullWidth, styles.tabs)}>
        <div className={styles.tabLabels}>
          <div
            className={clsx(styles.boxLabel, activeTab === 0 && styles.active)}
            onClick={() => setActiveTab(0)}
          >
            ✅ example call data (valid)
          </div>
          <div
            className={clsx(styles.boxLabel, activeTab === 1 && styles.active)}
            onClick={() => setActiveTab(1)}
          >
            ⛔ example call data (violation)
          </div>
        </div>

        {activeTab === 0 ? (
          <CallData
            data="0x52bbbe2900000000000000000000000000000000000000000000000000000000000000e00000000000000000000000004f2083f5fbede34c2714affb3105539775f7fe6400000000000000000000000000000000000000000000000000000000000000000000000000000000000000004f2083f5fbede34c2714affb3105539775f7fe640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            comments={{
              [2]: "sender: avatar address",
              [4]: "recipient: avatar address",
              [8]: "WETH/DAI pool ID",
              [10]: "WETH token address",
              [11]: "DAI token address",
            }}
            highlight={callDataHighlight}
          />
        ) : (
          <CallData
            data="0x52bbbe2900000000000000000000000000000000000000000000000000000000000000e00000000000000000000000004f2083f5fbede34c2714affb3105539775f7fe640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000098b716b8aaf21512996dc57eb0615e2383e2f960000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            comments={{
              [2]: "sender: avatar address",
              [4]: "recipient: Lazarus group ☠️",
              [8]: "WETH/DAI pool ID",
              [10]: "WETH token address",
              [11]: "DAI token address",
            }}
            invalid={[4]}
            highlight={callDataHighlight}
          />
        )}
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
  paramType: ParameterType.Calldata,
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
        {
          // amount
          paramType: ParameterType.Static,
          operator: Operator.Pass,
        },
        {
          // userDatq
          paramType: ParameterType.Dynamic,
          operator: Operator.Pass,
        },
      ],
    },
    {
      paramType: ParameterType.Tuple,
      operator: Operator.Matches,
      children: [
        {
          // sender
          paramType: ParameterType.Static,
          operator: Operator.EqualToAvatar,
        },
        {
          // fromInternalBalance
          paramType: ParameterType.Static,
          operator: Operator.Pass,
        },
        {
          // recipient
          paramType: ParameterType.Static,
          operator: Operator.EqualToAvatar,
        },
        {
          // toInternalBalance
          paramType: ParameterType.Static,
          operator: Operator.Pass,
        },
      ],
    },
  ],
};

const allNodeIds = gatherNodeIds(balancerSwapCondition);

const wordsByNodeId: Record<string, number[]> = {
  "0": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  "0.0": [1, 8, 9, 10, 11, 12, 13, 14, 15],
  "0.0.0": [8],
  "0.0.1": [9],
  "0.0.2": [10],
  "0.0.3": [11],
  "0.0.4": [12],
  "0.0.5": [13, 14, 15],
  "0.1": [2, 3, 4, 5],
  "0.1.0": [2],
  "0.1.1": [3],
  "0.1.2": [4],
  "0.1.3": [5],
  "0.2": [6],
  "0.3": [7],
};
