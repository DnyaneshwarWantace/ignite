import "@/app/globals.css";

export default function ImageEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen w-full">
          {children}
        </div>
      </body>
    </html>
  );
}
