'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

export default function PaginationControls({ hasMore, onLoadMore }: { hasMore: boolean; onLoadMore: () => void }) {
  return (
    <div className="flex items-center justify-center mt-4">
      <Button size="sm" onClick={onLoadMore} disabled={!hasMore}>
        {hasMore ? 'Load more' : 'No more tasks'}
      </Button>
    </div>
  )
}
