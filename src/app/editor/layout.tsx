export default function EditorLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="overflow-hidden">
				{children}
			</body>
		</html>
	);
}
