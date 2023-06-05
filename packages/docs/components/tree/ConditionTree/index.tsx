import React, { ReactElement, ReactNode, useEffect } from "react";
import { Condition, Operator, ParameterType } from "zodiac-roles-sdk";
import styles from "./styles.module.css";
import Tree, { TreeProps } from "../Tree";
import Node from "../Node/index";

interface Props {
  condition: Condition;
}

const ConditionTree: React.FC<Props & TreeProps> = ({ condition, ...rest }) => {
  // The id is NOT necessarily unique within a tree.
  // We use ABI type paths as IDs, so all nodes addressing a certain type path will share an ID.
  const recursivelyRender = (
    condition: Condition,
    path = "0",
    abiPath = "0"
  ) => {
    const isNotPlucking = condition.paramType === ParameterType.None;
    const id = isNotPlucking ? "none:" + path : abiPath;
    return (
      <Node key={path} id={id} head={<ConditionHead condition={condition} />}>
        {condition.children?.map((child, index) =>
          recursivelyRender(
            child,
            path + "." + index,
            isNotPlucking ? abiPath : abiPath + "." + index
          )
        )}
      </Node>
    );
  };

  return <Tree {...rest}>{recursivelyRender(condition)}</Tree>;
};

export default ConditionTree;

const ConditionHead: React.FC<{ condition: Condition }> = ({ condition }) => (
  <div className={styles.head}>
    <div className={styles.operator}>{Operator[condition.operator]}</div>
    <code className={styles.type}>{ParameterType[condition.paramType]}</code>
  </div>
);

export const gatherNodeIds = (
  condition: Condition,
  path = "0",
  abiPath = "0"
): string[] => {
  const isNotPlucking = condition.paramType === ParameterType.None;
  const id = isNotPlucking ? "none:" + path : abiPath;
  return [
    id,
    ...(condition.children?.flatMap((child, index) =>
      gatherNodeIds(
        child,
        path + "." + index,
        isNotPlucking ? abiPath : abiPath + "." + index
      )
    ) ?? []),
  ];
};
