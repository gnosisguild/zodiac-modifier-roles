import React, { ReactElement, ReactNode, useEffect } from "react";
import styles from "./styles.module.css";
import Tree from "../Tree";
import Node from "../Node/index";

enum Operator {
  // 00:    EMPTY EXPRESSION (default, always passes)
  //          paramType: Static / Dynamic
  //          🚫 children
  //          🚫 compValue
  Pass = 0,
  // ------------------------------------------------------------
  // 01-04: BOOLEAN EXPRESSIONS
  //          paramType: None
  //          ✅ children
  //          🚫 compValue
  And = 1,
  Or = 2,
  // Xor = 3, // not implemented
  // Not = 4, // not implemented
  // ------------------------------------------------------------
  // 05-16: COMPLEX EXPRESSIONS
  //          paramType: AbiEncoded / Tuple / Array,
  //          ✅ children
  //          🚫 compValue
  Matches = 5,
  ArraySome = 6,
  ArrayEvery = 7,
  ArraySubset = 8,

  // ------------------------------------------------------------
  // 17-31: COMPARISON EXPRESSIONS
  //          paramType: Static / Dynamic / Tuple / Array / AbiEncoded
  //          🚫 children
  //          ✅ compValue
  EqualTo = 17,
  GreaterThan = 18,
  LessThan = 19,
  Bitmask = 20,
  WithinAllowance = 29,
  EtherWithinAllowance = 30,
  CallWithinAllowance = 31,
}

const operatorNames = {
  [Operator.Pass]: "Pass",
  [Operator.And]: "And",
  [Operator.Or]: "Or",
  [Operator.Matches]: "Matches",
  [Operator.ArraySome]: "ArraySome",
  [Operator.ArrayEvery]: "ArrayEvery",
  [Operator.ArraySubset]: "ArraySubset",
  [Operator.EqualTo]: "EqualTo",
  [Operator.GreaterThan]: "GreaterThan",
  [Operator.LessThan]: "LessThan",
  [Operator.Bitmask]: "Bitmask",
  [Operator.WithinAllowance]: "WithinAllowance",
  [Operator.EtherWithinAllowance]: "EtherWithinAllowance",
  [Operator.CallWithinAllowance]: "CallWithinAllowance",
};

enum ParameterType {
  None = 0,
  Static = 1,
  Dynamic = 2,
  Tuple = 3,
  Array = 4,
  AbiEncoded = 5,
}

interface Condition {
  paramType: ParameterType;
  operator: Operator;
  compValue: string;
  children: Condition[];
}

interface Props {
  condition: Condition;
}

const ConditionTree: React.FC<Props> = ({ condition, ...rest }) => {
  // The id is NOT necessarily unique within a tree.
  // We use ABI type paths as IDs, so all nodes addressing a certain type path will share an ID.
  const recursivelyRender = (condition: Condition, path = "0") => {
    const isBooleanOperator = condition.operator > 0 && condition.operator < 5;
    const id = isBooleanOperator ? path + "-bool" : path;
    return (
      <Node key={id} id={id} head={<ConditionHead condition={condition} />}>
        {condition.children.map((child, index) =>
          recursivelyRender(
            child,
            isBooleanOperator ? path : path + "." + index
          )
        )}
      </Node>
    );
  };

  return <Tree {...rest}>{recursivelyRender(condition)}</Tree>;
};

export default ConditionTree;

const ConditionHead: React.FC<{ condition: Condition }> = ({ condition }) => (
  <div>
    {operatorNames[condition.operator]}
    {condition.compValue}
  </div>
);
