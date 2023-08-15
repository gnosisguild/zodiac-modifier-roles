import { SelectHTMLAttributes } from "react";
import { CHAINS, ChainId } from "../../app/chains";

const chains = Object.values(CHAINS);

export default function ChainSelect({
  value,
  onChange,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
  value: ChainId;
  onChange: (chainId: ChainId) => void;
}) {
  return (
    <select
      {...rest}
      value={value}
      onChange={(ev) => onChange(parseInt(ev.target.value) as ChainId)}
    >
      {chains.map((chain) => (
        <option value={chain.id} key={chain.id}>
          {chain.name}
        </option>
      ))}
    </select>
  );
}
