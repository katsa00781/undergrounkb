import React from 'react'

interface FMSScoreItemProps {
    title: string
    date: string
    score: number
    hasPain?: boolean
}

const FMSScoreItem = ({title, date, score, hasPain}: FMSScoreItemProps) => {
  return (
    <div className='bg-container flex items-center justify-between  w-3xl h-32 rounded-lg p-4'>
        <div>
            <p className='container text-h2'>{title}</p>
            <p className='container text-h3'>{date}</p>
            {hasPain && <p className='text-red-500'>Fájdalommal</p>}
        </div>
        <div>
            <p className='text-primary text-3xl font-semibold pl-8'>{score}/3</p>
        </div>
    </div>
  )
}

export default FMSScoreItem