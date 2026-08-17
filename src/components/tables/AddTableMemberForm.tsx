"use client";

import { useTransition } from "react";
import { addExistingMember, addGuestMember } from "@/app/g/[groupId]/tables/actions";
import { MemberPicker, type AddedMember, type PickerCandidate } from "@/components/tables/MemberPicker";

export function AddTableMemberForm({
  groupId,
  tableId,
  candidates,
  addedMembers,
}: {
  groupId: string;
  tableId: string;
  candidates: PickerCandidate[];
  addedMembers: AddedMember[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <MemberPicker
      candidates={candidates}
      addedMembers={addedMembers}
      pending={isPending}
      onAddCandidate={(userId) => startTransition(() => addExistingMember(groupId, tableId, userId))}
      onAddGuest={(name) => startTransition(() => addGuestMember(groupId, tableId, name))}
    />
  );
}
