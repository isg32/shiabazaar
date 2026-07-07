import { Navbar } from "@/components/layout/Navbar";
import { NavOffset } from "@/components/layout/NavOffset";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { NavigationLoader } from "@/components/layout/NavigationLoader";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavigationLoader />
      <Navbar />
      <NavOffset />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
