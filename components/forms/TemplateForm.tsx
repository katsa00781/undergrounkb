"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import CustomFormField, { FormFieldType } from "../items/CustomFormField"
import { WeekDay } from "@/public/constans/excersizes"
import { SelectItem } from "@radix-ui/react-select"


const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

const TemplateForm = () => {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-8">
        <CustomFormField
        fieldtype={FormFieldType.INPUT}
        control={form.control}
        name="Edzésterv"
        label="Edzésterv"
        placeholder="Edzésterv" />
        <CustomFormField
        fieldtype={FormFieldType.SELECT}
        control={form.control}
        name="Válassz edzésprogramot" 
        label="Edzésprogram"
        >
            {WeekDay.map((day) => (
                <SelectItem
                    key={day.value}
                    value={day.value}
                >
                    <p>{day.label}</p>
                </SelectItem>
            ))}
        </CustomFormField>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

export default TemplateForm