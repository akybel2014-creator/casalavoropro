export function Stars({ value, className = "h-4 w-4" }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <svg
                    key={i}
                    viewBox="0 0 24 24"
                    className={`${className} ${i <= value ? "fill-brand-amber" : "fill-slate-700"}`}
                    aria-hidden="true"
                >
                    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" />
                </svg>
            ))}
        </span>
    );
}

export function StarInput({ value, onChange, testPrefix = "review" }) {
    return (
        <div className="flex gap-1.5" data-testid={`${testPrefix}-stars`}>
            {[1, 2, 3, 4, 5].map((v) => (
                <button
                    key={v}
                    type="button"
                    data-testid={`${testPrefix}-star-${v}`}
                    onClick={() => onChange(v)}
                    aria-label={`${v} stelle`}
                    className={`text-3xl leading-none transition-all duration-150 hover:scale-125 ${
                        v <= value ? "text-brand-amber" : "text-slate-600 hover:text-brand-amber/60"
                    }`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}
