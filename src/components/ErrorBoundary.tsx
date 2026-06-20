import React, { useState, useEffect, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function ErrorBoundary({ children }: Props) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error || new Error(event.message));
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 font-sans">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />
          <h1 className="text-xl font-bold text-red-400 mb-2 font-mono uppercase tracking-wider">
            ⚠️ Ocorreu um Erro no Aplicativo
          </h1>
          <p className="text-xs text-slate-400 mb-4 font-mono">
            Ocorreu um erro inesperado que fez a tela ficar branca. Por favor, tire um print ou nos envie o erro abaixo:
          </p>
          <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-left mb-4 overflow-auto max-h-60">
            <p className="text-sm font-bold text-red-300 font-mono">
              {error.name}: {error.message}
            </p>
            {error.stack && (
              <pre className="text-[10px] text-slate-400 font-mono mt-2 whitespace-pre-wrap leading-relaxed">
                {error.stack}
              </pre>
            )}
          </div>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold rounded-xl transition-all cursor-pointer font-mono text-xs uppercase"
          >
            Recarregar Aplicativo
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ErrorBoundary;
