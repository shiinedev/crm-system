"use client"

import { useEffect, useRef, useCallback } from "react"
import { createContext, useContext, useState } from "react"

// Module-level singleton so open state survives across component mounts
// without needing an external state library
let _open = false
const _listeners = new Set<(open: boolean) => void>()

function setGlobal(next: boolean) {
    _open = next
    _listeners.forEach((fn) => fn(next))
}

export function useCommandPalette() {
    const [open, setLocalOpen] = useState(_open)

    useEffect(() => {
        _listeners.add(setLocalOpen)
        return () => { _listeners.delete(setLocalOpen) }
    }, [])

    const setOpen = useCallback((next: boolean) => setGlobal(next), [])

    // Register ⌘K / Ctrl+K globally — only one listener needed but safe to duplicate
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setGlobal(!_open)
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])

    return { open, setOpen }
}