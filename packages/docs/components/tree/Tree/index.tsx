import React, { ReactElement, ReactNode, useEffect } from "react";
import styles from "./styles.module.css";
import { Props as NodeProps } from "../Node";

export interface TreeProps {
  expanded?: string[];
  highlight?: { [id: string]: number };
  highlightOnSelect?: boolean;
  highlightOnHover?: boolean;
  //   expandOnHighlight?: boolean;
  onHighlight?(id: string): void;
  onToggle?(id: string): void;
  onSelect?(id: string): void;
  onMouseEnter?(id: string): void;
  onMouseLeave?(id: string): void;
}

type Props = TreeProps & {
  children: ReactElement<NodeProps> | ReactElement<NodeProps>[];
};

const Tree: React.FC<Props> = ({
  children,
  expanded = [],
  highlight = {},
  highlightOnSelect,
  highlightOnHover,
  onHighlight,
  onToggle,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <ul className={styles.tree}>
      {deepMapChildrenProps(children, (childProps) => ({
        ...childProps,
        expanded: expanded.includes(childProps.id),
        highlight: highlight[childProps.id],
        onToggle: () => {
          childProps.onToggle?.();
          onToggle?.(childProps.id);
        },
        onSelect: () => {
          if (highlightOnSelect) {
            onHighlight?.(childProps.id);
          }
          childProps.onSelect?.();
          onSelect?.(childProps.id);
        },
        onMouseEnter: () => {
          childProps.onMouseEnter?.();
          onMouseEnter?.(childProps.id);
        },
        onMouseLeave: () => {
          childProps.onMouseLeave?.();
          onMouseLeave?.(childProps.id);
        },
      }))}
    </ul>
  );
};

export default Tree;

type NodeChildren =
  | React.ReactElement<NodeProps, string | React.JSXElementConstructor<any>>
  | React.ReactElement<NodeProps, string | React.JSXElementConstructor<any>>[];

const deepMapChildrenProps = (
  children: NodeChildren,
  mapProps: (props: NodeProps) => NodeProps
): React.ReactElement[] | undefined =>
  React.Children.map(
    children,
    (child) =>
      child &&
      React.cloneElement(child, {
        ...mapProps(child.props),
        children:
          child.props.children &&
          deepMapChildrenProps(child.props.children as NodeChildren, mapProps),
      })
  );

export const useTreeState = ({
  expanded,
  highlight,
  highlightColor,
}: {
  expanded: string[];
  highlight?: { [id: string]: number };
  highlightColor(id: string): number;
}) => {
  const [expandedState, setExpanded] = React.useState(expanded);
  useEffect(() => {
    setExpanded(expanded);
  }, [expanded]);

  const [highlightState, setHighlight] = React.useState(highlight);
  useEffect(() => {
    setHighlight(highlight);
  }, [highlight]);

  return {
    expanded: expandedState,
    highlight: highlightState,
    onToggle: (id: string) => {
      setExpanded((expanded) =>
        expanded.includes(id)
          ? expanded.filter((exId) => exId !== id)
          : [...expanded, id]
      );
    },
    onHighlight: (id: string) => {
      setHighlight({ [id]: highlightColor(id) });
    },
  };
};
