export default function DataTable({ columns, rows, onDelete, onEdit }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/10 text-slate-200">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-semibold">
                {column.label}
              </th>
            ))}
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index} className="border-t border-white/10 text-slate-100">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3">
                  {row[column.key] ?? '-'}
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {onEdit ? (
                    <button
                      type="button"
                      className="rounded-lg bg-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30"
                      onClick={() => onEdit(row)}
                    >
                      Edit
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-100 hover:bg-red-500/30"
                    onClick={() => onDelete?.(row)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
