import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import BookingModal from "./components/BookingModal";
import WhatsAppButton from "./components/WhatsAppButton";
import FloatingCTA from "./components/FloatingCTA";
import CookieConsent from "./components/CookieConsent";
import LegalModals from "./components/LegalModals";

import AdminAgenda from "./pages/AdminAgenda";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

function MainLayout() {
  const { theme } = useTheme();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin") || location.pathname.startsWith("/agenda");

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [activeLegalModal, setActiveLegalModal] = useState(null);

  const handleOpenBooking = (service = null) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  const handleSelectService = (service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isAdmin
        ? "bg-[#0A0B0E] text-[#FAF8F5]"
        : theme === "dark"
          ? "bg-[#07080A] text-[#FAF8F5] selection:bg-[#C89B58] selection:text-black"
          : "bg-[#F6F4EE] text-[#1C1A17] selection:bg-[#C89B58] selection:text-white"
    }`}>
      <ScrollToTop />

      {/* Global Navigation Header (Hidden in Admin Dashboard) */}
      {!isAdmin && <Navbar onOpenBooking={handleOpenBooking} />}

      {/* Page Routing */}
      <div className="flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                onOpenBooking={handleOpenBooking}
                onSelectService={handleSelectService}
              />
            }
          />
          <Route
            path="/admin"
            element={<AdminAgenda />}
          />
          <Route
            path="/agenda"
            element={<AdminAgenda />}
          />
          <Route
            path="*"
            element={
              <Home
                onOpenBooking={handleOpenBooking}
                onSelectService={handleSelectService}
              />
            }
          />
        </Routes>
      </div>

      {/* Footer (Hidden in Admin Dashboard) */}
      {!isAdmin && (
        <Footer
          onOpenBooking={handleOpenBooking}
          onOpenPrivacy={() => setActiveLegalModal("privacy")}
          onOpenTerms={() => setActiveLegalModal("terms")}
        />
      )}

      {/* Floating Widgets (Hidden in Admin Dashboard and during active modals) */}
      {!isAdmin && !isBookingOpen && !activeLegalModal && <WhatsAppButton />}
      {!isAdmin && !isBookingOpen && !activeLegalModal && <FloatingCTA onOpenBooking={handleOpenBooking} />}

      {/* Modals & Consent */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        preselectedService={selectedService}
      />

      <LegalModals
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
      />

      <CookieConsent
        onOpenPrivacy={() => setActiveLegalModal("privacy")}
      />

      <SpeedInsights />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <MainLayout />
      </ThemeProvider>
    </LanguageProvider>
  );
}
