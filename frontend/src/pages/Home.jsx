import { useEffect } from "react";
import Hero from "@/components/landing/Hero";
import ValueBadges from "@/components/landing/ValueBadges";
import Marquee from "@/components/landing/Marquee";
import CategoryGrid from "@/components/landing/CategoryGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import CtaBoxes from "@/components/landing/CtaBoxes";
import FaqSection from "@/components/landing/FaqSection";
import { scrollToSection } from "@/components/site/Header";

export default function Home() {
    useEffect(() => {
        if (window.location.hash) {
            setTimeout(() => scrollToSection(window.location.hash), 400);
        }
    }, []);

    return (
        <>
            <Hero />
            <ValueBadges />
            <Marquee />
            <CategoryGrid />
            <HowItWorks />
            <CtaBoxes />
            <FaqSection />
        </>
    );
}
