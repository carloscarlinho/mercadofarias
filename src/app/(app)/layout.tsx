import BottomNav from "@/components/BottomNav";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <main className="flex-1 pb-[80px]">{children}</main>
            <BottomNav />
        </div>
    );
}
