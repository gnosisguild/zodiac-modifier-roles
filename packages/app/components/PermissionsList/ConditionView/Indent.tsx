const Indent: React.FC<{ level: number; children: React.ReactNode }> = ({
  level,
  children,
}) => (
  <div
    style={{
      paddingLeft: `calc(${level} * (var(--condition-indent) + var(--spacing-2))`,
    }}
  >
    {children}
  </div>
)

export default Indent
