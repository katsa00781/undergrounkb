'use client'

import { CustomSelect } from '@/components/items/CustomSelect'
import { clients } from '@/public/constans/values'
import Image from 'next/image'
import React from 'react'

import { CardWithForm } from '@/components/items/CustomCard'
import { CustomBarChart } from '@/components/charts/CustomBarChart'
import { ChartConfig } from '@/components/ui/chart'

const chartData = [
  { month: "January", desktop: 6 },
  { month: "February", desktop: 4 },
  { month: "March", desktop: 6 },
  { month: "April", desktop: 2 },
  { month: "May", desktop: 4 },
  { month: "June", desktop: 6 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig



const WorkoutLog = () => {
  return (
    <main className='flex flex-col h-screen bg-secondary'>
      <header className='flex max-w-screen min-w-[80vw] bg-white justify-between h-[72px] p-4'>
        <div className='flex items-center space-x-8'>
          <div>
            <h1 className='text-h1'>Edzésnapló</h1>
          </div>
          <div className='flex items-center'>
            <CustomSelect
              placeholder='Válassz ügyfelet...'
              options={clients}
              onChange={(value) => console.log(value)}
              selectLabel='Ügyfél'
            />
          </div>
        </div>
        <div>
          <Image src='/images/user.jpg' alt='User' width={40} height={40} className='rounded-full' />
        </div>
      </header>
      <section className='flex justify-between p-4 '>
        <div className='flex flex-col items-center space-y-8'>
          <CardWithForm
            title='2025.04.19'
            content='Mell'
            description='Edzésnapló'
            footer='Edzésnapló'
            imgsrc='/icons/positive.svg'
            className='flex w-[362px]'
          />
          <CardWithForm
            title='2025.04.19'
            content='Mell'
            description='Edzésnapló'
            footer='Edzésnapló'
            imgsrc='/icons/positive.svg'
            className='flex w-[362px]'
          />
        </div>
        <section className='flex flex-col items-center justify-between space-y-8 bg-white'>
          <div className='flex flex-col items-center  w-[794px] h-[350px]'>
            <h2 className='text-h2 '>EdzésNApok </h2>
            <div className='flex items-center justify-center w-[794px] h-[350px] bg-white'>
              <CustomBarChart
              title='Edzésszámok'
              data={chartData.map((item) => ({
                month: item.month,
                desktop: item.desktop,
              }))}
              description='Edzésnapló'
              footer='Edzésnapló'
              imgsrc='/icons/positive.svg'
              className='flex w-full'
              comment='Edzésnapló'
              config={chartConfig}
               />
            </div>

          </div>
          <div className='flex w-[794px] h-[350px] bg-amber-700'>

          </div>
        </section>
      </section>
    </main>
  )
}

export default WorkoutLog