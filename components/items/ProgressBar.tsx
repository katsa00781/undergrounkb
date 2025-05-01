"use client"
 
import * as React from "react"
 
import { Progress } from "@/components/ui/progress"

interface ProgressBarProps {
    value: number 
    label: string
}
 
const ProgressBar= ({value, label} : ProgressBarProps) => {
    
  const [progress, setProgress] = React.useState(0)
 
  React.useEffect(() => {
    const progressValue = typeof value === "string" ? parseInt(value) : value
    const timer = setTimeout(() => setProgress(progressValue), 800)
    return () => clearTimeout(timer)
  }, [])
 
  return (
      <div className="flex flex-col items-center space-y-1">
        <div className="flex items-center justify-between w-full">
        <p className="text-title">{label}</p>
        <p className="text-subtitle">{value}%</p>
        </div>
        <div className=" flex w-full">
        <Progress value={progress} className="w-[100%]" />
        </div>
      </div>
  )
};

export default ProgressBar