

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <main className="flex w-screen h-screen">
          {children}
      </main>
  );
}