import React, { ReactElement, ReactNode, useEffect } from "react";
import styles from "./styles.module.css";
import Tree from "../Tree";
import { ParamType } from "ethers";
import Node from "../Node/index";

interface Props {
  inputs: readonly ParamType[];
}

const AbiTree: React.FC<Props> = ({ inputs, ...rest }) => {
  const recursivelyRenderComponents = (
    inputs: readonly ParamType[],
    pathPrefix = ""
  ) =>
    inputs.map((input, index) => {
      const id = pathPrefix + index;
      return (
        <Node key={id} id={id} head={input.name}>
          {recursivelyRenderComponents(
            input.isArray ? [input.arrayChildren] : input.components,
            id + "."
          )}
        </Node>
      );
    });

  return <Tree {...rest}>{recursivelyRenderComponents(inputs)}</Tree>;
};

export default AbiTree;
