declare module "@medusajs/admin-sdk" {
  export function defineWidgetConfig(config: { zone: string }): any
  export function defineRouteConfig(config: { label: string; icon?: any }): any
}

declare module "@medusajs/ui" {
  import { FC, ReactNode } from "react"
  
  export const Container: FC<{ children?: ReactNode; className?: string }>
  export const Heading: FC<{ children?: ReactNode; level?: string; className?: string }>
  export const Button: FC<{ 
    children?: ReactNode
    variant?: "primary" | "secondary" | "danger" | "transparent"
    size?: "small" | "base" | "large"
    onClick?: () => void
    disabled?: boolean
    className?: string
  }>
  export const Badge: FC<{ children?: ReactNode; color?: string; className?: string }>
  export const Table: FC<{ children?: ReactNode; className?: string }> & {
    Header: FC<{ children?: ReactNode; className?: string }>
    Body: FC<{ children?: ReactNode; className?: string }>
    Row: FC<{ children?: ReactNode; className?: string }>
    Cell: FC<{ children?: ReactNode; className?: string }>
    HeaderCell: FC<{ children?: ReactNode; className?: string }>
  }
}

declare module "@medusajs/icons" {
  import { FC } from "react"
  export const StarSolid: FC<any>
  export const ChatBubbleLeftRight: FC<any>
}
