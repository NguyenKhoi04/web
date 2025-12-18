import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProjectHubHomepage from './homepage';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.systemRole ?? 'STANDARD';

  if (role === 'SYS_ADMIN') {
    redirect('/system'); // app/(admin)/system/page.tsx
  }

  // Nếu không phải SYS_ADMIN, hiển thị homepage
  return <ProjectHubHomepage />;
}