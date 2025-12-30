import "@/app/globals.css";

export default function VideoEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="fixed inset-0 w-full h-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
