import React from 'react'
import { fmsData } from '@/public/constans/values'
import FMSScoreItem from './FMSScoreItem'

interface FMSErteekelesProps {
  personId: string
}

const FMSErtekeles = ({ personId }: FMSErteekelesProps) => {
  const person = fmsData.find(p => p.id === personId) || fmsData[0]

  const scoreItems = [
    { title: 'Mély guggolás', key: 'deepSquat' },
    { title: 'Kitörés', key: 'hurdleStep' },
    { title: 'Átlépés', key: 'inlineLunge' },
    { title: 'Váll mobilitás', key: 'shoulderMobility' },
    { title: 'Aktív lábemelés', key: 'activeStraightLegRaise' },
    { title: 'Törzs stabilitás', key: 'trunkStabilityPushUp' },
    { title: 'Rotációs stabilitás', key: 'rotaryStability' }
  ]

  return (
    <section className='flex flex-col items-center w-full m-4 p-8 space-y-4 bg-white'>
      <div className='flex flex-col items-center w-full h-full p-4 space-y-4'>
        <p className='text-h3'>A FMS vizsgálat során a következő mozgásmintákat vizsgáltuk:</p>
        <ul className='list-disc list-inside'>
          {scoreItems.map(item => (
            <li key={item.key}>{item.title}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className='text-h2'>Részletes Értékelés - {person.name}</h2>
      </div>
      {scoreItems.map(item => (
        <FMSScoreItem
          key={item.key}
          title={item.title}
          date={person.lastAssessment}
          score={person.assessments[item.key].score}
          hasPain={person.assessments[item.key].pain}
        />
      ))}
    </section>
  )
}

export default FMSErtekeles