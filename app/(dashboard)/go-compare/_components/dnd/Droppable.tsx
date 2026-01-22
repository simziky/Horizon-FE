"use client"

import { useDroppable } from "@dnd-kit/core"
import type { ReactNode } from "react"

interface DroppableProps {
  id: string
  children: ReactNode
  className?: string
}

export function Droppable({ id, children, className = "" }: DroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? "ring-2 ring-[#18cb96] ring-inset" : ""}`}>
      {children}
    </div>
  )
}

