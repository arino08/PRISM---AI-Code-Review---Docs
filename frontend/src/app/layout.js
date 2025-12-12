import './globals.css';
import CustomCursor from '@/components/CustomCursor';
import Background3D from '@/components/Background3D';
import { SettingsProvider } from '@/context/SettingsContext';

export const metadata = {
  title: 'Prism - AI Automated Code Review & Documentation',
  description: 'AI-powered code review, security analysis, and documentation generation platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>
          {/* Custom Cursor */}
          <CustomCursor />

          {/* 3D Animated Background */}
          <Background3D />

          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
