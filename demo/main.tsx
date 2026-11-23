import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Header } from "@/components/layout/Header";
import { CatalogApp } from "@/components/catalog/CatalogApp";
import Home from "@/app/page";
import LoginPage from "@/app/login/page";
import SampleOrdersPage from "@/app/sample-orders/page";
import { useHashPath } from "./router";

function DemoApp() {
  const path = useHashPath();
  useEffect(() => {
    // Braces matter: newer browsers return a Promise from scrollTo().
    window.scrollTo(0, 0);
  }, [path]);
  return (
    <>
      <Header />
      {path === "/3d-catalog" ? (
        <main>
          <h1 className="sr-only">BOXES 3D Catalog</h1>
          <CatalogApp />
        </main>
      ) : path === "/sample-orders" ? (
        <SampleOrdersPage />
      ) : path === "/login" ? (
        <LoginPage />
      ) : (
        <Home />
      )}
    </>
  );
}

createRoot(document.getElementById("boxes-root")!).render(<DemoApp />);
