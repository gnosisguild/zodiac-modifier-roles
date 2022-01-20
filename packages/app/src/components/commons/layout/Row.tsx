import React from "react";
import { Box, BoxProps } from "@material-ui/core";

type RowProps = Omit<BoxProps, "display" | "flexDirection">;

export const Row = (props: RowProps) => {
  return <Box display="flex" flexDirection="row" {...props} />;
};
