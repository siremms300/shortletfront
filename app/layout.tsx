// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { VendorProvider } from '@/contexts/VendorContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HolsApartment - Book Shortlet Apartments",
  description: "Find and book the perfect shortlet apartments for your stay",
  icons: {
    icon: [
      {
        url: "/logo.png",
        type: "image/jpeg",
      },
    ],
    apple: [
      {
        url: "/logo.png",
        type: "image/jpeg",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/jpeg" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <BookingProvider>
            <VendorProvider>
              <Navbar />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
            </VendorProvider>
          </BookingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}































































// // app/layout.tsx
// import type { Metadata } from "next";
// import { Inter } from "next/font/google";
// import "./globals.css";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
// import { AuthProvider } from "@/contexts/AuthContext";
// import { BookingProvider } from "@/contexts/BookingContext";

// const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "HolsApartment - Book Shortlet Apartments",
//   description: "Find and book the perfect shortlet apartments for your stay",
//   icons: {
//     icon: [
//       {
//         url: "/logo.jpg",
//         type: "image/jpeg",
//       },
//     ],
//     apple: [
//       {
//         url: "/logo.jpg",
//         type: "image/jpeg",
//       },
//     ],
//   },
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <head>
//         <link rel="icon" href="/logo.jpg" type="image/jpeg" />
//       </head>
//       <body className={inter.className}>
//         <AuthProvider>
//           <BookingProvider>
//             <Navbar />
//             <main className="min-h-screen">
//               {children}
//             </main>
//             <Footer />
//           <BookingProvider>
//         </AuthProvider>
//       </body>
//     </html>
//   );
// }














































































// // import type { Metadata } from "next";
// // import { Inter } from "next/font/google";
// // import "./globals.css";
// // import Navbar from "@/components/Navbar";
// // import Footer from "@/components/Footer";

// // const inter = Inter({ subsets: ["latin"] });

// // export const metadata: Metadata = {
// //   title: "HolsApartment - Book Shortlet Apartments",
// //   description: "Find and book the perfect shortlet apartments for your stay",
// //   icons: {
// //     icon: [
// //       {
// //         url: "/logo.jpg",
// //         type: "image/jpeg",
// //       },
// //     ],
// //     apple: [
// //       {
// //         url: "/logo.jpg",
// //         type: "image/jpeg",
// //       },
// //     ],
// //   },
// // };

// // export default function RootLayout({
// //   children,
// // }: Readonly<{
// //   children: React.ReactNode;
// // }>) {
// //   return (
// //     <html lang="en">
// //       <head>
// //         <link rel="icon" href="/logo.jpg" type="image/jpeg" />
// //       </head>
// //       <body className={inter.className}>
// //         <Navbar />
// //         <main className="min-h-screen">
// //           {children}
// //         </main>
// //         <Footer />
// //       </body>
// //     </html>
// //   );
// // }


















































// // import type { Metadata } from "next";
// // import { Inter } from "next/font/google";
// // import "./globals.css";
// // import Navbar from "@/components/Navbar";
// // import Footer from "@/components/Footer";

// // const inter = Inter({ subsets: ["latin"] });

// // export const metadata: Metadata = {
// //   title: "HolsApartment - Book Shortlet Apartments",
// //   description: "Find and book the perfect shortlet apartments for your stay",
// // };

// // export default function RootLayout({
// //   children,
// // }: Readonly<{
// //   children: React.ReactNode;
// // }>) {
// //   return (
// //     <html lang="en">
// //       <body className={inter.className}>
// //         <Navbar />
// //         <main className="min-h-screen">
// //           {children}
// //         </main>
// //         <Footer />
// //       </body>
// //     </html>
// //   );
// // }