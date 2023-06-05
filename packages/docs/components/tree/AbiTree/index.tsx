import React, { ReactNode, useEffect } from "react";
import styles from "./styles.module.css";
import Tree, { TreeProps } from "../Tree";
import { ParamType } from "@ethersproject/abi";
import Node from "../Node/index";

interface Props {
  inputs: readonly ParamType[];
}

const AbiTree: React.FC<Props & TreeProps> = ({ inputs, ...rest }) => {
  const recursivelyRenderComponents = (
    inputs: readonly ParamType[] | null,
    pathPrefix = ""
  ) =>
    inputs?.map((input, index) => {
      const id = pathPrefix + index;
      return (
        <Node key={id} id={id} head={<AbiNodeHead input={input} />}>
          {recursivelyRenderComponents(
            input.arrayChildren ? [input.arrayChildren] : input.components,
            id + "."
          )}
        </Node>
      );
    }) ?? [];

  // prefix everything with 0. since the condition tree nests everything under a single root node and we want to have matching node IDs
  return <Tree {...rest}>{recursivelyRenderComponents(inputs, "0.")}</Tree>;
};

export default AbiTree;

const AbiNodeHead: React.FC<{ input: ParamType }> = ({ input }) => (
  <div className={styles.head}>
    <div className={styles.name}>{input.name}</div>
    <code className={styles.type}>{input.type}</code>
    {/* {input.comment && <div className={styles.comment}>{input.comment}</div>} */}
  </div>
);
