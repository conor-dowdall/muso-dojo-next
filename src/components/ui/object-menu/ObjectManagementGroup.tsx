"use client";

import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import {
  DisclosureListAction,
  DisclosureListConfirmAction,
  DisclosureListGroup,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  getObjectManagementActions,
  type ManagedObjectKind,
} from "./objectMenuCopy";

interface ObjectManagementGroupBaseProps {
  kind: ManagedObjectKind;
  objectName?: string;
  onDanger?: () => void;
  onDuplicate?: () => void;
}

interface ControlledDangerConfirmationProps {
  isDangerConfirming: boolean;
  onCancelDangerConfirm: () => void;
  onRequestDangerConfirm: () => void;
}

interface UncontrolledDangerConfirmationProps {
  isDangerConfirming?: undefined;
  onCancelDangerConfirm?: undefined;
  onRequestDangerConfirm?: undefined;
}

type ObjectManagementGroupProps = ObjectManagementGroupBaseProps &
  (ControlledDangerConfirmationProps | UncontrolledDangerConfirmationProps);

export function ObjectManagementGroup({
  isDangerConfirming,
  kind,
  objectName,
  onCancelDangerConfirm,
  onDanger,
  onDuplicate,
  onRequestDangerConfirm,
}: ObjectManagementGroupProps) {
  const [localIsDangerConfirming, setLocalIsDangerConfirming] = useState(false);
  const [duplicateCopy, dangerCopy] = getObjectManagementActions(kind, {
    objectName,
  });
  const isConfirming = isDangerConfirming ?? localIsDangerConfirming;

  if (!onDuplicate && !onDanger) {
    return null;
  }

  const requestDangerConfirm = () => {
    if (onRequestDangerConfirm) {
      onRequestDangerConfirm();
      return;
    }

    setLocalIsDangerConfirming(true);
  };

  const cancelDangerConfirm = () => {
    if (onCancelDangerConfirm) {
      onCancelDangerConfirm();
      return;
    }

    setLocalIsDangerConfirming(false);
  };

  const confirmDanger = () => {
    onDanger?.();
    setLocalIsDangerConfirming(false);
  };

  return (
    <DisclosureListGroup>
      {onDuplicate ? (
        <DisclosureListAction
          aria-label={duplicateCopy.ariaLabel}
          icon={<Copy />}
          label={duplicateCopy.label}
          preventConcurrentClicks
          onClick={onDuplicate}
        />
      ) : null}
      {onDanger ? (
        <DisclosureListConfirmAction
          actionAriaLabel={dangerCopy.actionAriaLabel}
          confirmAriaLabel={dangerCopy.confirmAriaLabel}
          confirmButtonLabel={dangerCopy.confirmButtonLabel}
          confirmLabel={dangerCopy.confirmLabel}
          icon={<Trash2 />}
          isConfirming={isConfirming}
          label={dangerCopy.label}
          onCancel={cancelDangerConfirm}
          onConfirm={confirmDanger}
          onRequestConfirm={requestDangerConfirm}
          tone="danger"
        />
      ) : null}
    </DisclosureListGroup>
  );
}
