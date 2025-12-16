// src/components/PeopleDropdown.tsx
'use client'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { PeopleSelector } from './PeopleSelector'

export function PeopleDropdown({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">{value} ppl</Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="p-4 w-32">
        <PeopleSelector min={1} max={20} value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}
