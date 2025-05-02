import React from 'react'

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../components/ui/form";
import { Select, SelectContent, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Control,} from 'react-hook-form';
import Image from 'next/image';
import { DatePicker } from './DatePicker';

export enum FormFieldType {
    TEXT = "text",
    EMAIL = "email",
    INPUT = "input",
    PASSWORD = "password",
    SELECT = "select",
    TEXTAREA = "textarea",
    CHECKBOX = "checkbox",
    DATE_PICKER = "date-picker",
}

interface CustomdProps {
    control: Control<any>,
    fieldtype: FormFieldType,
    name: string,
    label?: string,
    placeholder?: string,
    iconsrc?: string,
    iconAlt?: string,
    children?: React.ReactNode,
    showTime?: boolean,
}

const RenderInput= ({ props, field }: { field: any; props: CustomdProps }) => {
    
    switch (props.fieldtype) {
        case FormFieldType.INPUT:
            return (
                <div>
                    {props.iconsrc && (
                        <Image
                            src={props.iconsrc as string}
                            alt={props.iconAlt as string || "icon"}
                            width={24}
                            height={24}
                            className='ml-2'
                        />
                    )}
                    <FormControl>
                        <Input
                            {...field}
                            placeholder={props.placeholder}
                            className="text-14-regular"
                        />
                    </FormControl>
                </div>
            )
        case FormFieldType.SELECT:
            return (
                <FormControl>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={props.placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {props.children}
            </SelectContent>
          </Select>
        </FormControl>
      );
      case FormFieldType.DATE_PICKER:
            return (
                <FormControl>
                  <DatePicker
                    {...field}
                    field={field}
                    showTime={props.showTime}
                    placeholder={props.placeholder}
                    className="text-14-regular"
                  />  
                </FormControl>
            )
    }

}


const CustomFormField = (props: CustomdProps) => {
    const { control, name, label } = props
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex-1 ">
                    {props.fieldtype !== FormFieldType.CHECKBOX && label && (
                        <FormLabel className="text-14-regular">{label}</FormLabel>
                    )}
                    <RenderInput field={field} props={props} />
                    <FormMessage className="shad-error" />
                </FormItem>

            )}
        />
    )
}

export default CustomFormField