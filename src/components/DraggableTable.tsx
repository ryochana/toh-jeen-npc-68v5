'use client'

import { useState, useRef } from 'react'

interface DraggableTableProps {
  tableNumber: number
  table: any
  isAdmin: boolean
  onTableClick: (tableNumber: number) => void
  position: { x: number; y: number }
  onPositionChange: (tableNumber: number, newPosition: { x: number; y: number }) => void
}

export default function DraggableTable({ 
  tableNumber, 
  table, 
  isAdmin, 
  onTableClick, 
  position,
  onPositionChange 
}: DraggableTableProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const tableRef = useRef<HTMLButtonElement>(null)

  const getTableColor = () => {
    if (!table?.is_booked) return 'bg-purple-400 hover:bg-purple-500'
    if (table.booking?.payment_status === 'paid') return 'bg-green-500 hover:bg-green-600'
    return 'bg-orange-500 hover:bg-orange-600'
  }

  const getStatusText = () => {
    if (!table?.is_booked) return 'ว่าง'
    if (table.booking?.payment_status === 'paid') return 'จ่ายแล้ว'
    return 'จองแล้ว'
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAdmin) return
    
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isAdmin) return
    
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    onPositionChange(tableNumber, { x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onTableClick(tableNumber)
    }
  }

  return (
    <button
      ref={tableRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      className={`
        absolute w-18 h-14 sm:w-20 sm:h-16 text-white font-bold text-xs 
        transition-all border border-white/20 flex flex-col items-center justify-center p-1
        ${getTableColor()}
        ${isAdmin ? 'cursor-move hover:scale-105' : 'cursor-pointer'}
        ${isDragging ? 'z-50 scale-110 shadow-2xl' : 'z-10'}
        ${!isAdmin && 'hover:opacity-80'}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: 'none'
      }}
      title={table?.is_booked ? 
        `${table.booking?.payment_status === 'paid' ? 'จ่ายแล้ว' : 'จองแล้ว'}: ${table.booking?.guest_name}` : 
        isAdmin ? 'คลิกเพื่อจอง หรือลากเพื่อย้าย' : 'ดูข้อมูลการจอง'
      }
    >
      <div className="text-xs font-bold">โต๊ะ {tableNumber}</div>
      <div className="text-xs text-center leading-tight overflow-hidden">
        {table?.is_booked ? table.booking?.guest_name?.slice(0, 7) || 'ไม่ระบุ' : 'ว่าง'}
      </div>
      <div className="text-xs opacity-80">{getStatusText()}</div>
      {isAdmin && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full text-xs flex items-center justify-center">
          📌
        </div>
      )}
    </button>
  )
}
