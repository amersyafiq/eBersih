import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Bounce, ToastContainer } from 'react-toastify';
import "./globals.css";
import Providers from "./providers";

const geistInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eBersih",
  description: "UiTM Cleaning Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${geistInter.className} h-full overflow-hidden antialiased`}
    >
      <body className="h-full overflow-hidden bg-background-gray-secondary_alt_2">
        <ThemeProvider defaultTheme="light" enableSystem>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
        
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          transition={Bounce}
        />
      </body>
    </html>
  );
}
