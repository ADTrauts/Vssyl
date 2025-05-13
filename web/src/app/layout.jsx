import './globals.css';
import { Inter } from 'next/font/google';
import ClientLayout from '@/components/layout/ClientLayout';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { ChatTrigger } from '@/components/chat/ChatTrigger';
import { ChatProvider } from '@/contexts/chat-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Block on Block',
  description: 'A marketplace for blockchain modules',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ChatProvider>
          <ClientLayout>
            {children}
            <ChatPopup />
            <ChatTrigger />
          </ClientLayout>
        </ChatProvider>
      </body>
    </html>
  );
}
