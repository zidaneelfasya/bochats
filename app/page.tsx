import Navbar from "@/components/navbar"
import HeroModern from "@/components/landing/hero-modern"
import StatsModern from "@/components/landing/stats-modern"
import FeaturesModern from "@/components/landing/features-modern"
import ChatPreview from "@/components/landing/chat-preview"
import PricingModern from "@/components/landing/pricing-modern"
import CTAModern from "@/components/landing/cta-modern"
import Footer from "@/components/footer-landing"
import ProductJourneySection from "@/components/landing/ProductJourneySection"

export default function Home() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <HeroModern />
      <StatsModern />
      <FeaturesModern />
      <ChatPreview />
      {/* <VideoTutorial /> */}
      {/* <ProductDemoSection /> */}
      
      <ProductJourneySection />
      <PricingModern />
      <CTAModern />
      <Footer />
    </main>
  )
}
