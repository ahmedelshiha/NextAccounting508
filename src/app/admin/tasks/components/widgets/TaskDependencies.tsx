import React from 'react'

export default function TaskDependencies({ dependencies }: { dependencies: string[] }) {
  if (!Array.isArray(dependencies) || dependencies.length === 0) {
    return <div className="text-sm text-gray-500">No dependencies</div>
  }
  return (
    <ul className="list-disc list-inside text-sm text-gray-700">
      {dependencies.map((id) => (
        <li key={id} className="truncate">{id}</li>
      ))}
    </ul>
  )
}
