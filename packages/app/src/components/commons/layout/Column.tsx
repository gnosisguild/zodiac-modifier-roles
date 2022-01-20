import React from "react";
import { Box, BoxProps } from "@material-ui/core";

type ColumnProps = Omit<BoxProps, "display" | "flexDirection">;

export const Column = (props: ColumnProps) => {
  return <Box display="flex" flexDirection="column" {...props} />;
};
