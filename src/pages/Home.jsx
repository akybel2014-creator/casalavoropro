import { useEffect, lazy, Suspense } from "react";
import Hero from "@/components/landing/Hero";
import CategoryGrid from "@/components/landing/CategoryGrid";
import LazySection from "@/components/LazySection";
import { scrollToSection } from "@/components/site/Header";

// Sezioni sotto la piega: caricate in chunk separati e montate solo quando servono (mobile-friendly).
const ValueBadges = lazy(() => import("@/components/landing/ValueBadges"));
const NoleggioUsato = lazy(() => import("@/components/landing/NoleggioUsato"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));
const Emergenze = lazy(() => import("@/components/landing/Emergenze"));
const CtaBoxes = lazy(() => import("@/components/landing/CtaBoxes"));
const FaqSection = lazy(() => import("@/components/landing/FaqSection"));

export default function Home() {
    useEffect(() => {
        if (window.location.hash) {
            setTimeout(() => scrollToSection(window.location.hash), 400);
        }
    }, []);

    return (
        <>
            <Hero />
            <LazySection minHeight={160}>
                <Suspense fallback={null}><ValueBadges /></Suspense>
            </LazySection>
            <CategoryGrid />
            <LazySection minHeight={600}>
                <Suspense fallback={null}><NoleggioUsato /></Suspense>
            </LazySection>
            <LazySection minHeight={500}>
                <Suspense fallback={null}><HowItWorks /></Suspense>
            </LazySection>
            <LazySection minHeight={400}>
                <Suspense fallback={null}><Emergenze /></Suspense>
            </LazySection>
            <LazySection minHeight={500}>
                <Suspense fallback={null}><CtaBoxes /></Suspense>
            </LazySection>
            <LazySection minHeight={500}>
                <Suspense fallback={null}><FaqSection /></Suspense>
            </LazySection>
        </>
    );
}
