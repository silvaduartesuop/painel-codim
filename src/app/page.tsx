export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-5xl flex-col items-center justify-start py-16 px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
          Painel Déficit CODIM
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-8">
          Análise de execução orçamentária — CODIM/SUOP/SEFIN
        </p>
        <p className="text-zinc-500 text-sm">Dashboard em construção.</p>
      </main>
    </div>
  );
}
