import React, { ReactNode } from "react";
import { VscChevronRight } from "react-icons/vsc";
import clsx from "clsx";
import styles from "./styles.module.css";

export interface Props {
  id: string;
  head: ReactNode;
  highlight?: number; // 0 = no highlight, other numbers cycle through the highlight colors
  children?: ReactNode | ReactNode[];
  expanded?: boolean;
  onToggle?(): void;
  onSelect?(): void;
  onMouseEnter?(): void;
  onMouseLeave?(): void;
}

const Node: React.FC<Props> = ({
  id,
  head,
  highlight,
  children,
  expanded,
  onToggle,
  onSelect,
}) =>
  React.Children.count(children) > 0 ? (
    <ParentNode
      id={id}
      head={head}
      highlight={highlight}
      expanded={expanded}
      onToggle={onToggle}
      onSelect={onSelect}
    >
      {children}
    </ParentNode>
  ) : (
    <LeafNode head={head} highlight={highlight} onSelect={onSelect} />
  );

export default Node;

const ParentNode: React.FC<Props> = ({
  head,
  highlight,
  children,
  expanded,
  onToggle,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}) => (
  <li className={clsx(styles.node, styles.parentNode)}>
    <div className={styles.headWrap}>
      <div
        className={styles.chevron}
        role="checkbox"
        aria-checked={expanded}
        tabIndex={-1}
        onChange={onToggle}
      >
        <VscChevronRight />
      </div>

      <div
        className={styles.head}
        role="checkbox"
        aria-checked={!!highlight}
        onFocus={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onToggle?.();
          }
        }}
      >
        {head}
      </div>
    </div>
    <ul className={clsx(styles.children, expanded && styles.expanded)}>
      {children}
    </ul>
  </li>
);

const LeafNode: React.FC<{
  head: ReactNode;
  highlight?: number;
  onSelect?(): void;
  onMouseEnter?(): void;
  onMouseLeave?(): void;
}> = ({ head, highlight, onSelect, onMouseEnter, onMouseLeave }) => (
  <li className={clsx(styles.node, styles.leafNode)}>
    <div className={styles.headWrap}>
      <div
        className={styles.chevron}
        role="checkbox"
        tabIndex={-1}
        aria-checked={false}
        aria-disabled
      />

      <div
        className={styles.head}
        role="checkbox"
        aria-checked={!!highlight}
        onFocus={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {head}
      </div>
    </div>
  </li>
);
