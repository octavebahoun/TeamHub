/** Données du graphique sous forme de tableau, repliées par défaut (accès sans survol ni couleur). */
export function DataTable({ caption, columns, rows }: { caption: string; columns: [string, string]; rows: [string, string][] }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Afficher les données</summary>
      <table className="mt-3 w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b">
          <tr>
            <th scope="col" className="py-1.5 font-semibold">{columns[0]}</th>
            <th scope="col" className="py-1.5 text-right font-semibold">{columns[1]}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(([a, b]) => (
            <tr key={a}>
              <th scope="row" className="py-1.5 font-normal">{a}</th>
              <td className="py-1.5 text-right tabular-nums">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
