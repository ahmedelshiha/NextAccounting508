import StandardPage from '@/components/dashboard/templates/StandardPage'

export default function AdminShortcutsPage() {
  return (
    <StandardPage title="Keyboard Shortcuts" subtitle="Boost your productivity with quick actions">
      <div className="bg-white border rounded-lg p-4">
        <ul className="space-y-2 text-sm text-gray-700">
          <li><code className="font-mono">Ctrl / Cmd + B</code> — Toggle sidebar</li>
          <li><code className="font-mono">Ctrl / Cmd + [</code> — Collapse sidebar</li>
          <li><code className="font-mono">Ctrl / Cmd + ]</code> — Expand sidebar</li>
        </ul>
      </div>
    </StandardPage>
  )
}
