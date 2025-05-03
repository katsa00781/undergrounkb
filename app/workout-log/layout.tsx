


export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
          <main className="flex max-w-screen h-screen ">
            <div>
            {children}
            </div>
        </main>

    );
  }