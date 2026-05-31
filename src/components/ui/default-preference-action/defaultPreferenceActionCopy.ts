export interface DefaultPreferenceActionCopyInput {
  actionAriaLabel?: string;
  actionLabel?: string;
  isDefault: boolean;
  savedAriaLabel?: string;
  savedLabel?: string;
  targetLabel: string;
  valueLabel: string;
}

export interface DefaultPreferenceActionCopy {
  ariaLabel: string;
  label: string;
}

function lowerForSentence(value: string) {
  return value.toLocaleLowerCase();
}

export function getDefaultPreferenceActionCopy({
  actionAriaLabel,
  actionLabel,
  isDefault,
  savedAriaLabel,
  savedLabel,
  targetLabel,
  valueLabel,
}: DefaultPreferenceActionCopyInput): DefaultPreferenceActionCopy {
  if (isDefault) {
    const label = savedLabel ?? `Used for ${targetLabel}`;

    return {
      ariaLabel:
        savedAriaLabel ??
        `Default for ${lowerForSentence(targetLabel)}: ${valueLabel}`,
      label,
    };
  }

  const label = actionLabel ?? `Use ${valueLabel} for ${targetLabel}`;

  return {
    ariaLabel:
      actionAriaLabel ??
      `Use ${lowerForSentence(valueLabel)} for ${lowerForSentence(
        targetLabel,
      )}`,
    label,
  };
}
