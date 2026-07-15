import './globals.css';
import Script from 'next/script';
import { Be_Vietnam_Pro } from 'next/font/google';
import { SocketProvider } from '@/context/SocketContext';
import SoundProvider from '@/app/components/SoundProvider';

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap'
});

export const metadata = {
  title: 'Ma Sói - Nghi Thức Bóng Đêm',
  description: 'Trò chơi Ma Sói trực tuyến - Trải nghiệm nghi thức Gothic kỳ bí, đấu trí kịch tính cùng bạn bè.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0e0e0e'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`dark h-full ${beVietnamPro.variable}`}>
      <head>
        <Script
          id="remove-extension-hydration-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function shouldRemove(name) {
                  return name.indexOf('bis_') === 0 || name.indexOf('__processed_') === 0;
                }

                function cleanElement(element) {
                  if (!element || !element.attributes) return;
                  Array.prototype.slice.call(element.attributes).forEach(function (attribute) {
                    if (shouldRemove(attribute.name)) {
                      element.removeAttribute(attribute.name);
                    }
                  });
                }

                function cleanTree(root) {
                  if (!root) return;
                  cleanElement(root);
                  if (root.querySelectorAll) {
                    root.querySelectorAll('*').forEach(cleanElement);
                  }
                }

                cleanTree(document.documentElement);

                var observer = new MutationObserver(function (mutations) {
                  mutations.forEach(function (mutation) {
                    if (mutation.type === 'attributes') {
                      cleanElement(mutation.target);
                    }
                    mutation.addedNodes.forEach(function (node) {
                      if (node.nodeType === 1) {
                        cleanTree(node);
                      }
                    });
                  });
                });

                observer.observe(document.documentElement, {
                  attributes: true,
                  childList: true,
                  subtree: true
                });
              })();
            `,
          }}
        />
      </head>
      <body className={`${beVietnamPro.className} h-full bg-background text-on-background antialiased overflow-hidden`}>
        <SocketProvider>
          <SoundProvider>
            {children}
          </SoundProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
