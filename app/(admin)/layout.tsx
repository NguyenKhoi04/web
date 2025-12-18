import { ReactNode } from 'react';
import { requireSystemRole } from '@/lib/authz';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSystemRole(['SYS_ADMIN', 'SYS_SUPPORT']); // tuỳ chính sách
  return <>{children}</>;
}
