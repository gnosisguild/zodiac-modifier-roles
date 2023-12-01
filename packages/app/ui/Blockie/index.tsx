import classNames from "classnames";
import makeBlockie from "ethereum-blockies-base64";
import React, { useMemo } from "react";

import classes from "./style.module.css";

interface Props {
  address: string;
  className?: string;
}

const Blockie: React.FC<Props> = ({ address, className }) => {
  const blockie = useMemo(() => address && makeBlockie(address), [address]);
  return (
    <div className={classNames(classes.container, className)}>
      <img src={blockie} alt={address} />
    </div>
  );
};

export default Blockie;
