'use client';

import { Avatar, EmptyAvatar } from '@/components/ui/avatar';
import { Menu } from '@/components/ui/menu';
import { PriorityIcon, StatusIcon } from '@/features/issue/components/issue-glyphs';
import {
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
  type IssueAssignee,
  type IssuePriority,
  type IssueStatus,
} from '@/types/issue';
import type { User } from '@/types/user';

export function StatusSelect({ value, onSelect }: { value: IssueStatus; onSelect: (v: IssueStatus) => void }) {
  return (
    <Menu<IssueStatus>
      label="Change status"
      value={value}
      onSelect={onSelect}
      trigger={<StatusIcon status={value} />}
      options={STATUS_ORDER.map(s => ({ value: s, label: STATUS_META[s].label, icon: <StatusIcon status={s} size={13} /> }))}
    />
  );
}

export function PrioritySelect({ value, onSelect }: { value: IssuePriority; onSelect: (v: IssuePriority) => void }) {
  return (
    <Menu<IssuePriority>
      label="Change priority"
      value={value}
      onSelect={onSelect}
      trigger={<PriorityIcon priority={value} />}
      options={PRIORITY_ORDER.map(p => ({ value: p, label: PRIORITY_META[p].label, icon: <PriorityIcon priority={p} size={13} /> }))}
    />
  );
}

export function AssigneeSelect({
  value,
  teammates,
  onSelect,
}: {
  value: IssueAssignee | null;
  teammates: User[];
  onSelect: (id: string | null) => void;
}) {
  return (
    <Menu<string>
      label="Change assignee"
      align="end"
      value={value?.id ?? ''}
      onSelect={id => onSelect(id === '' ? null : id)}
      trigger={value ? <Avatar name={value.name} color={value.avatarColor} /> : <EmptyAvatar />}
      options={[
        { value: '', label: 'No assignee', icon: <EmptyAvatar size={16} /> },
        ...teammates.map(t => ({ value: t.id, label: t.name, icon: <Avatar name={t.name} color={t.avatarColor} size={16} /> })),
      ]}
    />
  );
}
