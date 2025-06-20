"use client"

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SyncHistoryRow {
  id: string
  sync_type: string
  entity_type: string
  status: string
  items_processed: number
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export default function SyncHistoryPage() {
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<SyncHistoryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRows() {
      setLoading(true)
      const { data, error } = await supabase
        .from('sync_history')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50)
      if (!error && data) setRows(data as any)
      setLoading(false)
    }
    fetchRows()
  }, [supabase])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Sync Job History</h1>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin" /> Loading…</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Type</th>
              <th>Entity</th>
              <th>Status</th>
              <th>Items</th>
              <th>When</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-2">{r.sync_type}</td>
                <td>{r.entity_type}</td>
                <td className={r.status === 'failed' ? 'text-red-600' : 'text-green-600'}>{r.status}</td>
                <td>{r.items_processed}</td>
                <td>{formatDistanceToNow(new Date(r.started_at), { addSuffix: true })}</td>
                <td className="max-w-xs truncate" title={r.error_message || ''}>{r.error_message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
} 