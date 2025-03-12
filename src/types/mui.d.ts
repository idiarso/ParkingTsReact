import { Theme as MuiTheme, ThemeOptions as MuiThemeOptions } from '@mui/material/styles';
import { SxProps } from '@mui/system';

declare module '@mui/material/styles' {
  interface Theme extends MuiTheme {
    status: {
      danger: string;
    };
    palette: {
      mode: 'light' | 'dark';
      primary: {
        main: string;
      };
      secondary: {
        main: string;
      };
      background: {
        default: string;
        paper: string;
      };
    };
    typography: {
      fontFamily: string;
    };
  }

  interface ThemeOptions extends MuiThemeOptions {
    status?: {
      danger?: string;
    };
  }

  export interface ThemeProviderProps {
    theme: Theme;
    children?: React.ReactNode;
  }

  export const ThemeProvider: React.ComponentType<ThemeProviderProps>;
  export function createTheme(options: Partial<Theme>): Theme;
}

declare module '@mui/material/CssBaseline' {
  export interface CssBaselineProps {
    children?: React.ReactNode;
  }
  const CssBaseline: React.ComponentType<CssBaselineProps>;
  export default CssBaseline;
}

declare module '@mui/material/Button' {
  interface ButtonProps {
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    disabled?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
    disableElevation?: boolean;
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    poster: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    poster?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    poster: true;
  }

  interface TypographyProps {
    sx?: SxProps<Theme>;
    gutterBottom?: boolean;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'button' | 'overline' | 'inherit' | 'poster';
    component?: React.ElementType;
    children?: React.ReactNode;
    align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
    color?: string;
  }
}

declare module '@mui/material/Box' {
  interface BoxProps {
    sx?: SxProps<Theme>;
    component?: React.ElementType;
    children?: React.ReactNode;
    display?: string;
    justifyContent?: string;
    alignItems?: string;
    minHeight?: string;
    padding?: number | string;
  }
}

declare module '@mui/material/Paper' {
  interface PaperProps {
    sx?: SxProps<Theme>;
    elevation?: number;
    children?: React.ReactNode;
    variant?: 'elevation' | 'outlined';
  }
}

declare module '@mui/material/Grid' {
  interface GridProps {
    sx?: SxProps<Theme>;
    container?: boolean;
    item?: boolean;
    xs?: number | 'auto';
    sm?: number | 'auto';
    md?: number | 'auto';
    lg?: number | 'auto';
    xl?: number | 'auto';
    spacing?: number;
    children?: React.ReactNode;
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  }
}

declare module '@mui/material/DialogTitle' {
  interface DialogTitleProps {
    id?: string;
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }
}

declare module '@mui/material/DialogContentText' {
  interface DialogContentTextProps {
    id?: string;
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }
}

declare module '@mui/material/Badge' {
  interface BadgeProps {
    badgeContent?: React.ReactNode;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    sx?: SxProps<Theme>;
  }
}

declare module '@mui/material/List' {
  interface ListProps {
    sx?: SxProps<Theme>;
  }
}

declare module '@mui/material/ListItem' {
  interface ListItemProps {
    sx?: SxProps<Theme>;
  }
}

declare module '@mui/material/ListItemText' {
  interface ListItemTextProps {
    primary?: React.ReactNode;
    secondary?: React.ReactNode;
    sx?: SxProps<Theme>;
  }
}

declare module '@mui/material/ListItemSecondaryAction' {
  interface ListItemSecondaryActionProps {
    sx?: SxProps<Theme>;
  }
}

declare module '@mui/material/Alert' {
  interface AlertProps {
    severity?: 'error' | 'warning' | 'info' | 'success';
    children?: React.ReactNode;
    sx?: SxProps<Theme>;
  }
}

declare module '@mui/material/Divider' {
  interface DividerProps {
    sx?: SxProps<Theme>;
  }
}

declare module '@mui/material/IconButton' {
  interface IconButtonProps {
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    disabled?: boolean;
    onClick?: () => void;
    size?: 'small' | 'medium' | 'large';
    children?: React.ReactNode;
    sx?: SxProps<Theme>;
  }
}

declare module '@mui/material/TextField' {
  interface TextFieldProps {
    fullWidth?: boolean;
    label?: string;
    type?: 'text' | 'number' | 'password' | 'email' | 'tel' | 'url' | 'search';
    value?: string | number;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    error?: boolean;
    helperText?: React.ReactNode;
    required?: boolean;
    disabled?: boolean;
    size?: 'small' | 'medium';
    variant?: 'standard' | 'filled' | 'outlined';
    sx?: SxProps<Theme>;
    InputProps?: {
      startAdornment?: React.ReactNode;
      endAdornment?: React.ReactNode;
      [key: string]: unknown;
    };
  }
}

declare module '@mui/material/Switch' {
  interface SwitchProps {
    checked?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    disabled?: boolean;
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default';
  }
}

declare module '@mui/material/FormControlLabel' {
  interface FormControlLabelProps {
    control: React.ReactElement;
    label: React.ReactNode;
    disabled?: boolean;
  }
}

declare module '@mui/x-data-grid' {
  interface DataGridProps {
    disableRowSelectionOnClick?: boolean;
    initialState?: {
      pagination?: {
        paginationModel?: {
          pageSize?: number;
        };
      };
    };
    pageSizeOptions?: number[];
  }
}

declare module '@mui/x-date-pickers/TimePicker' {
  interface TimePickerProps {
    label?: string;
    value?: Date | null;
    onChange?: (value: Date | null) => void;
  }
}

declare module '@mui/material' {
  export interface BoxProps {
    sx?: SxProps<Theme>;
    display?: string;
    justifyContent?: string;
    alignItems?: string;
    minHeight?: string;
    padding?: number | string;
    p?: number;
    mt?: number;
    mb?: number;
    my?: number;
  }

  export interface PaperProps {
    sx?: SxProps<Theme>;
    elevation?: number;
    children?: React.ReactNode;
    variant?: 'elevation' | 'outlined';
  }

  export interface TypographyProps {
    sx?: SxProps<Theme>;
    gutterBottom?: boolean;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'button' | 'overline' | 'inherit' | 'poster';
    component?: React.ElementType;
    children?: React.ReactNode;
    align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
    color?: 'initial' | 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'text.primary' | 'text.secondary' | 'text.disabled';
  }

  export interface GridProps {
    sx?: SxProps<Theme>;
    container?: boolean;
    item?: boolean;
    xs?: number | 'auto';
    sm?: number | 'auto';
    md?: number | 'auto';
    lg?: number | 'auto';
    xl?: number | 'auto';
    spacing?: number;
    children?: React.ReactNode;
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  }

  export interface ButtonProps {
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    disabled?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }

  export interface IconButtonProps {
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    disabled?: boolean;
    onClick?: () => void;
    size?: 'small' | 'medium' | 'large';
    children?: React.ReactNode;
    sx?: SxProps<Theme>;
  }

  export interface ChipProps {
    label?: React.ReactNode;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    size?: 'small' | 'medium';
    variant?: 'filled' | 'outlined';
    onClick?: () => void;
    onDelete?: () => void;
    deleteIcon?: React.ReactNode;
    icon?: React.ReactNode;
    sx?: SxProps<Theme>;
  }

  export interface ButtonGroupProps extends React.ComponentProps<'div'> {
    size?: 'small' | 'medium' | 'large';
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    children?: React.ReactNode;
    sx?: SxProps<Theme>;
  }

  export const ButtonGroup: React.ComponentType<ButtonGroupProps>;

  export interface TooltipProps {
    title: React.ReactNode;
    children: React.ReactElement;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    content?: React.ReactElement;
    sx?: SxProps<Theme>;
  }
  export const Tooltip: React.ComponentType<TooltipProps>;

  export interface MenuProps {
    open: boolean;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    children?: React.ReactNode;
  }
  export const Menu: React.ComponentType<MenuProps>;

  export interface TabProps {
    label?: React.ReactNode;
    value?: any;
  }
  export const Tab: React.ComponentType<TabProps>;

  export interface TabsProps {
    value: any;
    onChange: (event: React.SyntheticEvent, value: any) => void;
    children?: React.ReactNode;
  }
  export const Tabs: React.ComponentType<TabsProps>;

  export interface SvgIconProps extends React.SVGProps<SVGSVGElement> {
    sx?: SxProps<Theme>;
  }

  export interface DrawerProps {
    open?: boolean;
    variant?: 'permanent' | 'persistent' | 'temporary';
    anchor?: 'left' | 'top' | 'right' | 'bottom';
    onClose?: (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void;
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }
  export const Drawer: React.ComponentType<DrawerProps>;

  export interface AppBarProps {
    position?: 'fixed' | 'absolute' | 'sticky' | 'static' | 'relative';
    color?: 'default' | 'inherit' | 'primary' | 'secondary' | 'transparent';
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }
  export const AppBar: React.ComponentType<AppBarProps>;

  export interface ToolbarProps {
    variant?: 'regular' | 'dense';
    disableGutters?: boolean;
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }
  export const Toolbar: React.ComponentType<ToolbarProps>;

  export interface ListProps {
    component?: React.ElementType;
    dense?: boolean;
    disablePadding?: boolean;
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }
  export const List: React.ComponentType<ListProps>;

  export interface ListItemProps {
    disablePadding?: boolean;
    dense?: boolean;
    divider?: boolean;
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }
  export const ListItem: React.ComponentType<ListItemProps>;

  export interface ListItemButtonProps {
    selected?: boolean;
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }
  export const ListItemButton: React.ComponentType<ListItemButtonProps>;

  export interface ListItemIconProps {
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }
  export const ListItemIcon: React.ComponentType<ListItemIconProps>;

  export interface ListItemTextProps {
    primary?: React.ReactNode;
    secondary?: React.ReactNode;
    sx?: SxProps<Theme>;
  }
  export const ListItemText: React.ComponentType<ListItemTextProps>;

  export interface CollapseProps {
    in?: boolean;
    timeout?: number | 'auto';
    unmountOnExit?: boolean;
    children?: React.ReactNode;
  }
  export const Collapse: React.ComponentType<CollapseProps>;

  export interface DividerProps {
    light?: boolean;
    orientation?: 'horizontal' | 'vertical';
    sx?: SxProps<Theme>;
  }
  export const Divider: React.ComponentType<DividerProps>;

  export interface BadgeProps {
    badgeContent?: React.ReactNode;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    sx?: SxProps<Theme>;
    children?: React.ReactNode;
  }
  export const Badge: React.ComponentType<BadgeProps>;

  export interface IconButtonProps {
    edge?: 'start' | 'end' | false;
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    disabled?: boolean;
    onClick?: () => void;
    size?: 'small' | 'medium' | 'large';
    children?: React.ReactNode;
    sx?: SxProps<Theme>;
  }

  export interface TypographyProps {
    noWrap?: boolean;
  }
}

declare module '@mui/material/DialogActions' {
  interface DialogActionsProps {
    children?: React.ReactNode;
    sx?: SxProps<Theme>;
  }
}

declare module '@mui/icons-material' {
  export const Menu: React.ComponentType<SvgIconProps>;
  export const ChevronLeft: React.ComponentType<SvgIconProps>;
  export const Dashboard: React.ComponentType<SvgIconProps>;
  export const Settings: React.ComponentType<SvgIconProps>;
  export const Person: React.ComponentType<SvgIconProps>;
  export const Receipt: React.ComponentType<SvgIconProps>;
  export const Assessment: React.ComponentType<SvgIconProps>;
  export const ExpandLess: React.ComponentType<SvgIconProps>;
  export const ExpandMore: React.ComponentType<SvgIconProps>;
  export const DirectionsCar: React.ComponentType<SvgIconProps>;
  export const Timer: React.ComponentType<SvgIconProps>;
  export const AttachMoney: React.ComponentType<SvgIconProps>;
  export const TrendingUp: React.ComponentType<SvgIconProps>;
  export const ArrowUpward: React.ComponentType<SvgIconProps>;
  export const ArrowDownward: React.ComponentType<SvgIconProps>;
  export const Refresh: React.ComponentType<SvgIconProps>;
  export const ZoomIn: React.ComponentType<SvgIconProps>;
  export const Download: React.ComponentType<SvgIconProps>;
  export const CompareArrows: React.ComponentType<SvgIconProps>;
  export const CloudSync: React.ComponentType<SvgIconProps>;
  export const CloudOff: React.ComponentType<SvgIconProps>;
  export const Sync: React.ComponentType<SvgIconProps>;
  export const Error: React.ComponentType<SvgIconProps>;
  export const Backup: React.ComponentType<SvgIconProps>;
  export const Restore: React.ComponentType<SvgIconProps>;
  export const Group: React.ComponentType<SvgIconProps>;
  export const PhotoCamera: React.ComponentType<SvgIconProps>;
  export const Cameraswitch: React.ComponentType<SvgIconProps>;
  export const Edit: React.ComponentType<SvgIconProps>;
  export const Delete: React.ComponentType<SvgIconProps>;
} 