"use client"
 
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
 
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { CustomSelect } from "../items/CustomSelect"
import React from "react"
import { sets ,Ismetlesek, time, weights, } from "@/public/constans/values"
import Image from "next/image"
import DatePicker from "../items/DatePicker"





 
const formSchema = z.object({
  date: z.date(),
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
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="w-1/2">
              <FormLabel>Dátum</FormLabel>
              <FormControl>
               <DatePicker value={field.value} selected={field.value} onSelect={field.onChange} />
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
        <div className="flex flex-col w-full rounded-2xl border-1 border-gray-300 p-4">
            <p className="text-subtitle">Edzéstervező</p>
            <div className="flex space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Gyakorlatcsopor neve</FormLabel>
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
            <div className="flex space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Szettek száma</FormLabel>
              <FormControl>
                <CustomSelect
                    placeholder="Szettek száma"
                    options={sets}
                    onChange={(value) => field.onChange(value)}
                    selectLabel="Szettek száma"
                />
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
              <FormLabel>Ismétlések száma</FormLabel>
              <FormControl>
                <CustomSelect
                    placeholder="Ismétlések száma"
                    options={Ismetlesek}
                    onChange={(value) => field.onChange(value)}
                    selectLabel="Ismétlések száma"
                />
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
              <FormLabel>Súly</FormLabel>
              <FormControl>
                <CustomSelect
                    placeholder="Súly"
                    options={weights}
                    onChange={(value) => field.onChange(value)}
                    selectLabel="Súly"
                />
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
              <FormLabel>Pihenő</FormLabel>
              <FormControl>
                <CustomSelect
                    placeholder="Pihenő"
                    options={time}
                    onChange={(value) => field.onChange(value)}
                    selectLabel="Pihenő"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
            </div>
            <div>
              <Button className="w-full ">
                <Image src="/icons/positive.svg" alt="PlusIcon" width={20} height={20} className="mr-2 text-white"  />
                Új gyakorlat hozzáadása
              </Button>
            </div>
            <div className="flex space-x-4 pt-2 items-center justify-end">
              <Button className="w-[195px] rounded-md border-1 border-gray-300 bg-[#E5E7EB] text-black">
               Mentés sablonként
              </Button>
              <Button className="w-[195px] btn-orange text-white">
               Mentés edzéstervként
              </Button>
            </div>
        </div>
      </form>
    </Form>
    </div>
  )
}

export default NewWorkoutForm