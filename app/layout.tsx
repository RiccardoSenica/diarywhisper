import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DiaryWhisper',
  description: 'Siri-enabled diary tracker for expenses and day logs'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
