const Indent: React.FC<{ indent?: number; children: React.ReactNode }> = ({
  indent = 0,
  children,
}) => (
  <div
    style={{
      paddingLeft: `calc(${indent} * (var(--condition-indent) + var(--spacing-2))`,
    }}
  >
    {children}
  </div>
)

export default Indent
