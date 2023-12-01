import { ReactNode } from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

interface Props {
  data: `0x${string}`;
  comments?: { [line: number]: ReactNode };
  highlight?: { [line: number]: number };
  invalid?: number[];
}

const CallData: React.FC<Props> = ({
  data,
  comments = {},
  highlight = {},
  invalid = [],
}) => {
  const words = [...Array(Math.ceil((data.length - 10) / 64))].map((_, i) =>
    data.slice(10 + i * 64, 10 + (i + 1) * 64)
  );

  return (
    <div className={styles.wrapper}>
      <pre className={styles.zerox}>
        <code>0x</code>
      </pre>
      <pre className={styles.data}>
        <code>
          <span className={styles.sighash}>{data.slice(2, 10)}</span>
          {words.map((word, i) => (
            <span
              key={i}
              className={clsx(styles.word, {
                [styles.highlight]: highlight[i + 1],
                [styles.invalid]: invalid.includes(i + 1),
              })}
            >
              {word}
            </span>
          ))}
        </code>
      </pre>
      <pre className={styles.comments}>
        <code>
          {["", ...words].map((_, i) => (
            <span key={i}>
              &nbsp;&nbsp;
              <span className={styles.comment}>{comments[i]}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
};

export default CallData;
