import React from "react";
import Hero from "../components/Hero";
import AboutArtist from "../components/AboutArtist";
import ServicesPricing from "../components/ServicesPricing";
import OzonioSection from "../components/OzonioSection";
import GalleryCuts from "../components/GalleryCuts";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import LocationHours from "../components/LocationHours";

export default function Home({ onOpenBooking, onSelectService }) {
  return (
    <main className="flex flex-col w-full">
      <Hero onOpenBooking={onOpenBooking} />
      <AboutArtist onOpenBooking={onOpenBooking} />
      <ServicesPricing onSelectService={onSelectService} />
      <OzonioSection onOpenBooking={onOpenBooking} />
      <GalleryCuts />
      <Testimonials />
      <FAQ />
      <LocationHours />
    </main>
  );
}
