export function LogoMark({ size = 36 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="#0B132B" stroke="rgba(255,255,255,0.14)" />
            <path d="M14 33 L32 15 L50 33" fill="none" stroke="#FF5A1F" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 31 V49 H42 V31" fill="none" stroke="#F8FAFC" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="28.5" y="38" width="7" height="11" rx="1.5" fill="#FF5A1F" />
        </svg>
    );
}

export function Logo({ size = 36, className = "" }) {
    return (
        <span className={`inline-flex items-center gap-2.5 ${className}`}>
            <LogoMark size={size} />
            <span className="font-display font-extrabold tracking-tight text-xl leading-none">
                <span className="text-white">CasaLavori</span>
                <span className="text-brand">PRO</span>
            </span>
        </span>
    );
}

export default Logo;
