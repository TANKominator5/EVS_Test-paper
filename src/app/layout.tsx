import type { Metadata } from 'next';
import '@fontsource-variable/noto-sans-bengali';
import './globals.css';

export const metadata: Metadata = {
  title: 'পরিবেশ পাঠ · EVS Practice',
  description: 'প্রাথমিক টেটের পরিবেশ বিদ্যা অনুশীলন। সঙ্গে সঙ্গে উত্তর, বাংলা ব্যাখ্যা ও বিষয়ভিত্তিক ফলাফল।',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bn"><body>{children}</body></html>;
}
