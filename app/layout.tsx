import './globals.css';
import Providers from './providers';
import AIHelpWidget from '@/app/components/AIHelpWidget';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body><Providers>{children}
        <AIHelpWidget orgId={undefined} projectId={undefined} />
        </Providers>
        </body>
    </html>
  );
}