import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Image from "next/image"

interface CardWithFormProps {
    title: string;
    content?: string | React.ReactNode;
    description?: string;
    footer?: string | React.ReactNode;
    imgsrc?: string;
    className?: string;
}

export function CardWithForm({ title, content, description, footer, imgsrc, className}: CardWithFormProps) {
  return (
    <Card className={`w-[300px] h-[300px] bg-white shadow-lg border border-neutral-200 p-4 flex flex-col space-y-2 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
        <CardTitle className="text-title">{title}</CardTitle>
        <CardDescription className="flex items-center justify-between">
            <p className="text-muted-foreground">{description}</p>
            {imgsrc && <Image src={imgsrc} alt="fire" width={16} height={16}/>}
        </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="text-primary font-bold text-5xl">
        {content}
      </CardContent>
      <CardFooter className="flex justify-between text-subtitle">
        {footer}
      </CardFooter>
    </Card>
  )
}
