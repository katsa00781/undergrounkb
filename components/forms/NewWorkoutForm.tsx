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
import { DatePicker } from "../items/DatePicker"
 
const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})


const NewWorkoutForm = () => {

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
    <div>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex w-full items-center space-x-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-1/2">
              <FormLabel>Dátum</FormLabel>
              <FormControl>
               <DatePicker />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-1/2">
              <FormLabel>Edzésterv Neve</FormLabel>
              <FormControl>
                <Input 
                type="text"
                {...field}
                placeholder="Edzésterv neve" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
        <div className="flex flex-col w-full rounded-2xl border-1 border-gray-300 p-4">
            <p className="text-subtitle">Edz</p>
            <div className="flex space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Gyakorlatcsoport neve</FormLabel>
              <FormControl>
                <Input 
                type="text"
                {...field}
                placeholder="Gyakorlatcsoport neve" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Gyakorlat neve</FormLabel>
              <FormControl>
                <Input 
                type="text"
                {...field}
                placeholder="Gyakorlat neve" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
            </div>
        
        </div>
      </form>
    </Form>
    </div>
  )
}

export default NewWorkoutForm