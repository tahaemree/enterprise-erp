export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="w-full animate-in fade-in duration-500">
            {children}
        </div>
    )
}
