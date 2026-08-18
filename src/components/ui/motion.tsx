'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export function Aparecer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reducir = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reducir ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function PasoAnimado({ id, children }: { id: string; children: React.ReactNode }) {
  const reducir = useReducedMotion()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={reducir ? false : { opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reducir ? undefined : { opacity: 0, x: -10 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
