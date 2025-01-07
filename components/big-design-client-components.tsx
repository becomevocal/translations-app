"use client";

import * as BigDesignComponent from "@bigcommerce/big-design";
import * as BigDesignIcon from "@bigcommerce/big-design-icons";
import * as BigDesignPattern from "@bigcommerce/big-design-patterns";
import { theme } from "@bigcommerce/big-design-theme";
import { ThemeProvider } from "styled-components";

// BigDesign Pattern exports
export const Header = BigDesignPattern.Header;
export const Page = BigDesignPattern.Page;
export const ActionBar = BigDesignPattern.ActionBar;

export const GlobalStyles = BigDesignComponent.GlobalStyles;
export const StatefulTable = BigDesignComponent.StatefulTable;
export const Badge = BigDesignComponent.Badge;
export const FlexItem = BigDesignComponent.FlexItem;
export const Flex = BigDesignComponent.Flex;
export const InlineMessage = BigDesignComponent.InlineMessage;
export const Small = BigDesignComponent.Small;
export const Box = BigDesignComponent.Box;
export const Message = BigDesignComponent.Message;
export const Grid = BigDesignComponent.Grid;
export const GridItem = BigDesignComponent.GridItem;
export const Panel = BigDesignComponent.Panel;
export const Text = BigDesignComponent.Text;
export const Textarea = BigDesignComponent.Textarea;
export const Button = BigDesignComponent.Button;
export const Form = BigDesignComponent.Form;
export const FormGroup = BigDesignComponent.FormGroup;
export const HR = BigDesignComponent.HR;
export const FormControlLabel = BigDesignComponent.FormControlLabel;
export const FormControlDescription = BigDesignComponent.FormControlDescription;
export const Input = BigDesignComponent.Input;
export const Modal = BigDesignComponent.Modal;
export const Radio = BigDesignComponent.Radio;
export const Tooltip = BigDesignComponent.Tooltip;
export const Link = BigDesignComponent.Link;
export const Dropdown = BigDesignComponent.Dropdown;
export const FileUploader = BigDesignComponent.FileUploader;
export const Toggle = BigDesignComponent.Toggle;

export const ArrowDropDownIcon = BigDesignIcon.ArrowDropDownIcon;
export const AlertsManager = BigDesignComponent.AlertsManager;
export const ArrowBackIcon = BigDesignIcon.ArrowBackIcon;
export const createAlertsManager = BigDesignComponent.createAlertsManager;
export const OpenInNewIcon = BigDesignIcon.OpenInNewIcon;
export const DeleteIcon = BigDesignIcon.DeleteIcon;
export const ProgressCircle = BigDesignComponent.ProgressCircle;
export const Switch = BigDesignComponent.Switch;

export const H0 = BigDesignComponent.H0;
export const H1 = BigDesignComponent.H1;
export const H2 = BigDesignComponent.H2;
export const H3 = BigDesignComponent.H3;
export const H4 = BigDesignComponent.H4;

export const BigDesignTheme = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);