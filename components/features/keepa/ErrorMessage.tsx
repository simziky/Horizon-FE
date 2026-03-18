"use client"

import { VscError } from "react-icons/vsc"

interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null

  return (
    <div className="border border-red-200 bg-red-50 rounded-xl p-6">
      <div className="flex items-center gap-4">
        <VscError className="text-red-500 size-8" />
        <div>
          <h4 className="font-semibold text-red-800 text-lg">Search Failed</h4>
          <p className="text-red-700">{message}</p>
        </div>
      </div>
    </div>
  )
}