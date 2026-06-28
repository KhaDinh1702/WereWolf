import './globals.css';
import { SocketProvider } from '@/context/SocketContext';
import SoundProvider from '@/app/components/SoundProvider';

export const metadata = {
  title: 'Ma Sói - Nghi Thức Bóng Đêm',
  description: 'Trò chơi Ma Sói trực tuyến - Trải nghiệm nghi thức Gothic kỳ bí, đấu trí kịch tính cùng bạn bè.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="dark h-full">
      <body className="h-full bg-background text-on-background antialiased overflow-hidden">
        <SocketProvider>
          <SoundProvider>
            {children}
          </SoundProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
