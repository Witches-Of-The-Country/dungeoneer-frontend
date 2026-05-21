"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Evita erro de hidratação renderizando apenas no lado do cliente
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} title="Alternar tema">
      {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />}
      {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />}
      {theme === "system" && <Monitor className="h-[1.2rem] w-[1.2rem] transition-all" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
