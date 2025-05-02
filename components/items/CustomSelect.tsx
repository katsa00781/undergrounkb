import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


export interface CustomSelectProps {
    placeholder: string
    options: { value: string; label: string }[]
    onChange: (value: string[]) => void
    selectLabel?: string
}

export function CustomSelect({placeholder, options, onChange, selectLabel}: CustomSelectProps) {
    const handleValueChange = (newValue: string) => {
        onChange([newValue])
    }

    return (
        <Select>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{selectLabel}</SelectLabel>
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            onClick={() => handleValueChange(option.value)}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
