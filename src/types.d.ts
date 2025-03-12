declare module 'formik' {
  import { FormikConfig, FormikValues, FormikProps } from 'formik';
  export function useFormik<Values extends FormikValues = FormikValues>(
    config: FormikConfig<Values>
  ): FormikProps<Values>;
  export * from 'formik';
}

declare module 'yup' {
  interface Schema<T> {
    required(message?: string): this;
    optional(): this;
  }

  interface StringSchema<T extends string | null | undefined = string> extends Schema<T> {
    matches(regex: RegExp, message?: string): this;
    email(message?: string): this;
    min(limit: number, message?: string): this;
    oneOf(enums: any[], message?: string): this;
    when(
      key: string,
      options: WhenOptions<this>
    ): this;
  }

  interface BooleanSchema<T extends boolean | null | undefined = boolean> extends Schema<T> {}

  interface ObjectSchema<T extends object = object> extends Schema<T> {
    shape<U extends { [key: string]: any }>(
      fields: U,
      noSortEdges?: Array<[string, string]>
    ): ObjectSchema<U>;
  }

  interface WhenOptions<T> {
    is: boolean | ((value: any) => boolean);
    then: (schema: T) => T;
    otherwise?: (schema: T) => T;
  }

  interface BaseSchema {
    context(context: object): this;
  }

  interface SchemaConstructor {
    new (): Schema<any>;
  }

  interface StringSchemaConstructor {
    new (): StringSchema;
  }

  interface ObjectSchemaConstructor {
    new (): ObjectSchema;
  }

  interface BooleanSchemaConstructor {
    new (): BooleanSchema;
  }

  export const string: () => StringSchema;
  export const object: () => ObjectSchema;
  export const boolean: () => BooleanSchema;
  export const ref: (path: string) => any;
  export function object(): ObjectSchema;
  export function string(): StringSchema;
  export function boolean(): BooleanSchema;
}

declare module '@mui/material' {
  import { ComponentType, ElementType, ReactNode } from 'react';

  export interface BoxProps {
    children?: ReactNode;
    sx?: any;
  }
  export const Box: ComponentType<BoxProps>;

  export interface ButtonProps {
    children?: ReactNode;
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    startIcon?: ReactNode;
    fullWidth?: boolean;
  }
  export const Button: ComponentType<ButtonProps>;

  export interface DialogProps {
    open: boolean;
    onClose?: () => void;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    fullWidth?: boolean;
    children?: ReactNode;
  }
  export const Dialog: ComponentType<DialogProps>;
  export const DialogTitle: ComponentType<{ children?: ReactNode }>;
  export const DialogContent: ComponentType<{ children?: ReactNode }>;
  export const DialogActions: ComponentType<{ children?: ReactNode }>;
  export const DialogContentText: ComponentType<{ children?: ReactNode }>;

  export interface TextFieldProps {
    fullWidth?: boolean;
    id?: string;
    name?: string;
    label?: string;
    value?: string;
    onChange?: (event: any) => void;
    error?: boolean;
    helperText?: string;
    type?: string;
  }
  export const TextField: ComponentType<TextFieldProps>;

  export interface FormControlProps {
    fullWidth?: boolean;
    error?: boolean;
    children?: ReactNode;
  }
  export const FormControl: ComponentType<FormControlProps>;
  export const FormHelperText: ComponentType<{ children?: ReactNode }>;

  export interface InputLabelProps {
    id?: string;
    children?: ReactNode;
  }
  export const InputLabel: ComponentType<InputLabelProps>;

  export interface SelectProps {
    labelId?: string;
    id?: string;
    name?: string;
    value?: any;
    onChange?: (event: any) => void;
    label?: string;
    children?: ReactNode;
  }
  export const Select: ComponentType<SelectProps>;

  export interface MenuItemProps {
    value?: any;
    children?: ReactNode;
  }
  export const MenuItem: ComponentType<MenuItemProps>;

  export interface SwitchProps {
    checked?: boolean;
    onChange?: (event: any) => void;
    name?: string;
  }
  export const Switch: ComponentType<SwitchProps>;

  export interface FormControlLabelProps {
    control: ReactNode;
    label?: string;
  }
  export const FormControlLabel: ComponentType<FormControlLabelProps>;

  export interface GridProps {
    container?: boolean;
    item?: boolean;
    xs?: number | boolean;
    sm?: number | boolean;
    spacing?: number;
    children?: ReactNode;
  }
  export const Grid: ComponentType<GridProps>;

  export interface TableProps {
    children?: ReactNode;
  }
  export const Table: ComponentType<TableProps>;
  export const TableBody: ComponentType<{ children?: ReactNode }>;
  export const TableCell: ComponentType<{ align?: 'left' | 'right' | 'center'; children?: ReactNode }>;
  export const TableContainer: ComponentType<{ component?: ElementType; children?: ReactNode }>;
  export const TableHead: ComponentType<{ children?: ReactNode }>;
  export const TableRow: ComponentType<{ children?: ReactNode }>;

  export interface TablePaginationProps {
    rowsPerPageOptions?: number[];
    component?: ElementType;
    count: number;
    rowsPerPage: number;
    page: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }
  export const TablePagination: ComponentType<TablePaginationProps>;

  export interface ChipProps {
    label?: string;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    size?: 'small' | 'medium';
  }
  export const Chip: ComponentType<ChipProps>;

  export interface IconButtonProps {
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    onClick?: () => void;
    size?: 'small' | 'medium' | 'large';
    children?: ReactNode;
  }
  export const IconButton: ComponentType<IconButtonProps>;

  export interface AlertProps {
    severity?: 'error' | 'warning' | 'info' | 'success';
    sx?: any;
    children?: ReactNode;
  }
  export const Alert: ComponentType<AlertProps>;

  export interface TypographyProps {
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2';
    component?: ElementType;
    children?: ReactNode;
  }
  export const Typography: ComponentType<TypographyProps>;

  export interface PaperProps {
    children?: ReactNode;
  }
  export const Paper: ComponentType<PaperProps>;
}

declare module '@mui/icons-material' {
  import { ComponentType } from 'react';

  interface IconProps {
    fontSize?: 'small' | 'medium' | 'large';
  }

  export const Add: ComponentType<IconProps>;
  export const Edit: ComponentType<IconProps>;
  export const Delete: ComponentType<IconProps>;
} 