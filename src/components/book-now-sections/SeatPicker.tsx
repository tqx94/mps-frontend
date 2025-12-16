// frontend\src\components\book-now-sections\SeatPicker.tsx
'use client'

import React, { useState } from 'react'

export type SeatMeta = {
  id: string
  x: number
  y: number
  shape: 'rect' | 'circle'
  size: number       // radius for circle, half-width for rect
}

export type OverlayMeta = {
  id: string
  src: string         // path to your PNG/SVG
  x: number
  y: number
  width: number
  height: number
}

export type TableMeta = {
  id: string
  shape: 'rect' | 'circle'
  x: number
  y: number
  width?: number   // for rect
  height?: number  // for rect
  radius?: number  // for circle
  fill?: string    // optional override
}

export type LabelMeta = {
  id: string
  text: string
  x: number
  y: number
  fontSize?: number
  fill?: string
}

export interface SeatPickerProps {
  layout: SeatMeta[]
  tables?: TableMeta[]
  labels?: LabelMeta[]
  bookedSeats?: string[]
  overlays?: OverlayMeta[]
  maxSeats?: number  // maximum num of seats that can be selected
  onSelectionChange?: (selectedIds: string[]) => void
  initialSelectedSeats?: string[]  // pre-selected seats for reschedule/extend
}

export const SeatPicker: React.FC<SeatPickerProps> = ({
  layout,
  bookedSeats = [],
  tables = [],    // default to empty
  labels = [],    // default to empty
  overlays = [],
  // maxSeats = 15,  // Default to 15 if not specified 
  maxSeats = Infinity,  // Default to unlimited if not specified
  onSelectionChange,
  initialSelectedSeats = [],  // pre-selected seats for reschedule/extend
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedSeats))

  const toggleSeat = (id: string) => {
    if (bookedSeats.includes(id)) return
    setSelected((prev) => {
      const next = new Set(prev)

      if (next.has(id)) {
        // Deselecting - always allowed
        next.delete(id)
      }
      else {
        // Selecting - check if we reached the limit
        if (next.size >= maxSeats) {
          return prev // Do not allow selection, return previous state
        }
        next.add(id)

      }
      onSelectionChange?.([...next])
      return next
    })
  }

  const isMaxReached = selected.size >= maxSeats


  return (
    <div className="space-y-4">
      {/* Status message */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">
          Selected: {selected.size} of {maxSeats} seats
        </span>
        {isMaxReached && (
          <span className="text-orange-600 font-medium">
            Maximum seats selected
          </span>
        )}
      </div>
      <svg
        viewBox="0 0 400 600"
        style={{ width: '100%', height: 'auto', maxWidth: '100%', border: '1px solid #eee' }}
        className="overflow-hidden"
      >
        {/* Overlays */}
        {overlays.map(img => (
          <image
            key={img.id}
            href={img.src}
            x={img.x}
            y={img.y}
            width={img.width}
            height={img.height}
          />
        ))}

        {/* 3) Tables */}
        {tables.map(tbl => {
          const fill = tbl.fill || '#D4C9AA'  // default red
          return tbl.shape === 'circle' ? (
            <circle
              key={tbl.id}
              cx={tbl.x}
              cy={tbl.y}
              r={tbl.radius}
              fill={fill}
            />
          ) : (
            <rect
              key={tbl.id}
              x={tbl.x - tbl.width! / 2}
              y={tbl.y - tbl.height! / 2}
              width={tbl.width}
              height={tbl.height}
              rx={4}
              fill={fill}
            />
          )
        })}

        {/* Seats */}
        {layout.map((seat) => {
          const isBooked = bookedSeats.includes(seat.id)
          const isSelected = selected.has(seat.id)
          const isDisabled = isBooked || (isMaxReached && !isSelected)

          const fill = isBooked
            ? '#FF0000'  // Pure red color for booked seats
            : isSelected
              ? '#f97316'
              : isDisabled
                ? '#e5e7eb'  // Light gray for disabled unselected seats
                : '#10b981'

          const opacity = isDisabled && !isSelected ? 0.5 : 1

          if (seat.shape === 'circle') {
            return (
              <circle
                key={seat.id}
                cx={seat.x}
                cy={seat.y}
                r={seat.size}
                fill={fill}
                stroke="#0003"
                strokeWidth={1}
                opacity={opacity}
                style={{
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s ease, fill 0.2s ease'
                }}
                onClick={() => !isDisabled && toggleSeat(seat.id)}
              />
            )
          } else {
            return (
              <rect
                key={seat.id}
                x={seat.x - seat.size}
                y={seat.y - seat.size}
                width={seat.size * 2}
                height={seat.size * 2}
                rx={4}
                fill={fill}
                stroke="#0003"
                strokeWidth={1}
                opacity={opacity}
                style={{
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s ease, fill 0.2s ease'
                }}
                onClick={() => !isDisabled && toggleSeat(seat.id)}
              />
            )
          }
        })}
        {/* 5) Labels - Only show seat labels, hide table labels */}
        {labels.map(lbl => {
          // Check if this is a seat label (starts with 'S' followed by numbers)
          const isSeatLabel = lbl.text.match(/^S\d+$/)
          
          if (isSeatLabel) {
            // For seat labels, make them clickable
            const seatId = lbl.text // S1, S2, etc.
            const isBooked = bookedSeats.includes(seatId)
            const isSelected = selected.has(seatId)
            const isDisabled = isBooked || (isMaxReached && !isSelected)
            
            return (
              <text
                key={lbl.id}
                x={lbl.x}
                y={lbl.y}
                fontSize={lbl.fontSize || 14}
                fill={isBooked ? '#000' : isSelected ? '#000' : '#000'}
                textAnchor="middle"
                alignmentBaseline="middle"
                style={{
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  fontWeight: isSelected ? 'normal' : 'normal',
                  transition: 'fill 0.2s ease, font-weight 0.2s ease'
                }}
                onClick={() => !isDisabled && toggleSeat(seatId)}
              >
                {lbl.text}
              </text>
            )
          }
          // Don't render table labels (T1, T2, T3, etc.) - return null
          return null
        })}
      </svg>
    </div>
  )
}
