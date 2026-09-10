interface ReceiptCardProps {
  receipt: any
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const isSupporting = receipt.supportsClaim
  
  return (
    <div className={`p-4 rounded-xl border ${isSupporting ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-red-950/20 border-red-900/40'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-200">
            {receipt.type.replace('_', ' ')}
          </span>
          <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${isSupporting ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/60 text-red-400'}`}>
            {isSupporting ? 'Corroborates' : 'Challenges'}
          </span>
        </div>
        
        {receipt.credibility && receipt.credibility !== 'UNKNOWN' && (
          <span className="text-xs text-zinc-500">
            Credibility: <span className="font-medium text-zinc-400">{receipt.credibility}</span>
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
        {receipt.description}
      </p>

      {receipt.sourceUrl && (
        <a 
          href={receipt.sourceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Source ↗
        </a>
      )}

      {receipt.storageKey && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500/80 mt-2 block">
          📎 Attached File (Encrypted)
        </span>
      )}
    </div>
  )
}
