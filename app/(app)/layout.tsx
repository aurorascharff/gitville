export default function AppLayout({ children }: LayoutProps<'/'>) {
  return <main className="fixed inset-0 h-[100dvh] w-full overflow-hidden overscroll-none">{children}</main>;
}
