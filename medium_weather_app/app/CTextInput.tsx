import React from "react";
import { ReturnKeyTypeOptions } from "react-native";
import { TextInput } from "react-native-paper";

interface Props {
  onBlur?: (args: any) => void;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  returnKeyType?: ReturnKeyTypeOptions | undefined;
  label: string;
  msg: string;
  placeholder: string;
  variant: "flat" | "outlined";
  textColor: string;
  outlineColor: string;
  activeOutlineColor: string;
  underlineColor: string;
  activeUnderlineColor: string;
  selectionColor: string;
  contentStyle: {};
  style: {};
}

const _ = ({
  onBlur,
  onChangeText,
  onSubmitEditing,
  returnKeyType,
  label,
  msg,
  placeholder,
  variant,
  textColor,
  outlineColor,
  activeOutlineColor,
  underlineColor,
  activeUnderlineColor,
  selectionColor,
  contentStyle,
  style,
}: Props) => {
  return (
    <TextInput
      onBlur={onBlur}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      returnKeyType={returnKeyType}
      label={label}
      value={msg}
      placeholder={placeholder}
      mode={variant}
      textColor={textColor}
      outlineColor={outlineColor}
      underlineColor={underlineColor}
      activeUnderlineColor={activeUnderlineColor}
      selectionColor={selectionColor}
      contentStyle={contentStyle}
      style={style}
    />
  );
};

export default _;
