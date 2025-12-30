"use client";

export function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-white">
            {/* Clean white base */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30" />

            {/* Subtle animated shapes - very minimal */}
            <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 left-20 w-[32rem] h-[32rem] bg-indigo-500/5 rounded-full blur-3xl animate-float-delayed" />

            {/* Very subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(100,116,139,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>
    );
}
