import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/buttons/Button";
import { DisclosureListAction } from "@/components/ui/disclosure-list/DisclosureList";
import {
  getDefaultPreferenceActionCopy,
  type DefaultPreferenceActionCopyInput,
} from "./defaultPreferenceActionCopy";

type DefaultPreferenceActionVariant = "footer" | "row";

interface DefaultPreferenceActionBaseProps extends DefaultPreferenceActionCopyInput {
  onClick: () => void;
  variant: DefaultPreferenceActionVariant;
}

interface DefaultPreferenceActionRowProps extends DefaultPreferenceActionBaseProps {
  preview?: ButtonProps["accessory"];
  subtitle?: ButtonProps["subtitle"];
  variant: "row";
}

interface DefaultPreferenceActionFooterProps extends DefaultPreferenceActionBaseProps {
  size?: ButtonProps["size"];
  variant: "footer";
}

export type DefaultPreferenceActionProps =
  | DefaultPreferenceActionRowProps
  | DefaultPreferenceActionFooterProps;

export function DefaultPreferenceAction(props: DefaultPreferenceActionProps) {
  const { ariaLabel, label } = getDefaultPreferenceActionCopy(props);
  const icon = props.isDefault ? <BookmarkCheck /> : <BookmarkPlus />;

  if (props.variant === "row") {
    return (
      <DisclosureListAction
        aria-label={ariaLabel}
        disabled={props.isDefault}
        icon={icon}
        label={label}
        preview={props.preview}
        selected={props.isDefault}
        subtitle={props.subtitle}
        onClick={props.onClick}
      />
    );
  }

  return (
    <Button
      aria-label={ariaLabel}
      disabled={props.isDefault}
      icon={icon}
      label={label}
      selected={props.isDefault}
      selectionSemantics="visual"
      size={props.size ?? "sm"}
      variant="ghost"
      onClick={props.onClick}
    />
  );
}
