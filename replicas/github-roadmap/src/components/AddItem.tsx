import { useState } from 'react'
import { PlusIcon } from '@primer/octicons-react'
import type { ItemFields } from '../types'
import { useStore } from '../store'

/** "+ Add item" row that turns into the omnibar input; Enter creates a draft issue. */
export function AddItem({ preset, className = '', onCreated }: { preset: ItemFields; className?: string; onCreated?: (id: string) => void }) {
  const { addItem } = useStore()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  if (!editing)
    return (
      <button type="button" className={`AddItem ${className}`} onClick={() => setEditing(true)}>
        <PlusIcon />
        <span>Add item</span>
      </button>
    )
  return (
    <div className={`AddItem AddItem--editing ${className}`}>
      <PlusIcon />
      <input
        autoFocus
        className="AddItem-input"
        placeholder="Start typing to create a draft"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (!text.trim()) setEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setText('')
            setEditing(false)
          }
          if (e.key === 'Enter' && text.trim()) {
            const it = addItem(text.trim(), preset)
            setText('')
            onCreated?.(it.id)
          }
        }}
      />
    </div>
  )
}
