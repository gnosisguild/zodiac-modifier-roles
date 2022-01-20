import { createTheme } from '@material-ui/core'
import MUIShadows from '@material-ui/core/styles/shadows'
import createPalette from '@material-ui/core/styles/createPalette'

const palette = createPalette({
  type: 'dark',
  background: {
    default: 'rgba(224, 197, 173, 0.1)',
    paper: 'rgba(217, 212, 173, 0.1)',
  },
  text: {
    secondary: 'rgba(217, 212, 173, 1)',
  },
})

palette.primary = palette.augmentColor({
  '500': '#30312C',
})
palette.secondary = palette.augmentColor({
  '500': 'rgb(34, 50, 101)',
})

const shadows = MUIShadows
shadows[1] = '0px 2px 4px rgba(105, 112, 117, 0.2)'
shadows[2] = '0px 4px 4px rgba(0, 0, 0, 0.25)'
shadows[3] = '0px 4px 10px rgba(105, 112, 117, 0.2)'

export const ZODIAC_THEME = createTheme({
  palette,
  shadows,
  typography: {
    fontFamily: 'Spectral',
    h4: {
      fontSize: 24,
      fontWeight: 'normal',
    },
    h5: {
      fontSize: 20,
      fontWeight: 'normal',
    },
    h6: {
      fontSize: 14,
      fontWeight: 'normal',
    },
    body2: {
      fontSize: 12,
    },
    subtitle1: {
      fontSize: 12,
      color: palette.common.white,
    },
  },
  shape: {
    borderRadius: 0,
  },
  overrides: {
    MuiPaper: {
      root: {
        borderRadius: '0 !important',
        border: '1px solid',
        borderColor: 'rgba(217, 212, 173, 0.3)',
        position: 'relative',
        '&::before': {
          content: '" "',
          position: 'absolute',
          zIndex: 1,
          top: '2px',
          left: '2px',
          right: '2px',
          bottom: '2px',
          border: '1px solid rgba(217, 212, 173, 0.3)',
          pointerEvents: 'none',
        },
      },
    },
    MuiCssBaseline: {
      '@global': {
        body: {
          background:
            'linear-gradient(108.86deg, rgba(26, 33, 66, 1) 6.24%, rgba(12, 19, 8, 1) 53.08%, rgba(37, 6, 4, 1) 96.54%);',
        },
      },
    },
    MuiTypography: {
      gutterBottom: { marginBottom: 8 },
    },
    MuiChip: {
      root: {
        padding: '4px 8px',
        height: 'auto',
        backgroundColor: 'rgba(217, 212, 173, 0.1)',
        border: '1px solid rgba(217, 212, 173, 0.3)',
      },
      avatar: {
        display: 'contents !important',
      },
      label: {
        paddingLeft: 0,
        paddingRight: 0,
      },
    },
    MuiButton: {
      root: {
        lineHeight: 1.4,
        textTransform: 'none',
        position: 'relative',
        borderRadius: 0,
        '&::before': {
          content: '" "',
          position: 'absolute',
          zIndex: 1,
          top: -4,
          left: -4,
          right: -4,
          bottom: -4,
          border: '1px solid rgba(217, 212, 173, 0.3)',
          pointerEvents: 'none',
        },
      },
      contained: {
        boxShadow: 'none',
        border: '1px solid rgba(217, 212, 173, 0.3);',
      },
      containedSizeSmall: {
        padding: '4px 8px',
      },
    },
    MuiInputBase: {
      root: {
        borderRadius: 0,
        border: '1px solid rgba(217, 212, 173, 0.3)',
        padding: '8px 4px',
        position: 'relative',
        '&:after': {
          content: "''",
          border: '1px solid rgba(217, 212, 173, 0.3)',
          position: 'absolute',
          zIndex: 1,
          top: -4,
          bottom: -4,
          left: -4,
          right: -4,
          pointerEvents: 'none',
        },
      },
      input: {
        padding: 0,
      },
    },
    MuiPopover: {
      paper: {
        backgroundColor: 'rgb(16, 16, 16)',
      },
    },
    MuiInputLabel: {
      root: {
        fontSize: 16,
      },
    },
    MuiTableCell: {
      root: {
        fontSize: 16,
      },
      footer: {
        color: '',
      },
    },
    MuiLink: {
      root: {
        textDecoration: 'underline !important',
      },
    },
  },
})
