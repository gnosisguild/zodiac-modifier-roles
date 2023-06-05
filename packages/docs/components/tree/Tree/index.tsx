import React, { ReactElement, ReactNode, useEffect } from "react";
import styles from "./styles.module.css";
import { Props as NodeProps } from "../Node";

interface Props {
  children: ReactElement<NodeProps> | ReactElement<NodeProps>[];
  expanded?: string[];
  highlight?: { [id: string]: number };
  highlightOnSelect?: boolean;
  highlightOnHover?: boolean;
  //   expandOnHighlight?: boolean;
  onHighlight?(id: string): number; // return the highlight index
  onToggle?(id: string): void;
  onSelect?(id: string): void;
  onMouseEnter?(id: string): void;
  onMouseLeave?(id: string): void;
}

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
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          expanded: expanded.includes(child.props.id),
          highlight: highlight[child.props.id],
          onToggle: () => {
            child.props.onToggle?.();
            onToggle?.(child.props.id);
          },
          onSelect: () => {
            if (highlightOnSelect) {
              onHighlight?.(child.props.id);
            }
            child.props.onSelect?.();
            onSelect?.(child.props.id);
          },
          onMouseEnter: () => {
            child.props.onMouseEnter?.();
            onMouseEnter?.(child.props.id);
          },
          onMouseLeave: () => {
            child.props.onMouseLeave?.();
            onMouseLeave?.(child.props.id);
          },
        })
      )}
    </ul>
  );
};

export default Tree;

export const useTreesState = ({
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
          ? expanded.filter((id) => id !== id)
          : [...expanded, id]
      );
    },
    onHighlight: (id: string) => {
      setHighlight({ [id]: highlightColor(id) });
    },
  };
};
