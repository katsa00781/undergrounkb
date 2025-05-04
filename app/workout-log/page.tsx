'use client'

import { CustomSelect } from '@/components/items/CustomSelect'
import { clients } from '@/public/constans/values'
import Image from 'next/image'
import React from 'react'

import { CardWithForm } from '@/components/items/CustomCard'
import { CustomBarChart } from '@/components/charts/CustomBarChart'
import { ChartConfig } from '@/components/ui/chart'
import DiaryCardElement from '@/components/items/DiaryCardElement'
import { Button } from '@/components/ui/button'

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
    label: "Edzések Száma",
    color: "#007AFF"
  },
} satisfies ChartConfig



const WorkoutLog = () => {
  return (
    <main className='flex flex-col items-center h-screen bg-secondary'>
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
      <section className='flex p-4 space-x-8 '>
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
        <section className='flex flex-col items-center justify-center space-y-8'>
          <div className='flex items-center justify-center w-3xl bg-white rounded-2xl border-1 border-s-[#E5E7EB] shadow-md'>
            <CustomBarChart
              title='Edzésszámok'
              data={chartData.map((item) => ({
                month: item.month,
                desktop: item.desktop,
              }))}
              description='Edzésnapló'
              footer='Idei edzések számai havi bontásban'
              config={chartConfig}
              className='border-none'

            />
          </div>

          <div className='flex flex-col  w-3xl bg-white rounded-2xl border-1 border-s-[#E5E7EB] shadow-md p-4 space-y-4'>
            <span className='flex items-center'>
              <h2 className='text-h3 p-4'>Gyakorlatok</h2>
            </span>
            {/* A gyakorlatok konténerének headingje */}
            <DiaryCardElement />
            <div className='pb-4' >
              <Button>
                <Image src='/icons/plus.svg' alt='ok' width={14} height={16} />
                <span className='text-button w-48 '>Új edzés rögzítése</span>
              </Button>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default WorkoutLog