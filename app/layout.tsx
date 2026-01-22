import type { Metadata } from 'next';
 import Script from 'next/script';

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
      	<Script
          defer
          src="https://analytics.frompixels.com/script.js"
          data-website-id="922dfc50-84ea-4e4e-a421-a03a00a4421c"
        />
    </html>
  );
}
