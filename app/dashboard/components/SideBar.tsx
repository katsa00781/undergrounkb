'use client'

import React from 'react'
import { sidebarLinks } from '@/public/constans/link'
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import Image from 'next/image';


const SideBar = () => {

    const pathName = usePathname();
    
  return (
    <section className='fixed h-full w-64 bg-white border-r border-neutral-200 p-4 shaddow-lg'>
        <nav className='flex flex-col gap-4'>
            <Link href={'/dashboard'} className={`text-2xl font-[500] text-[#000000] ${pathName === '/dashboard' ? 'text-[#FF4D00]' : 'text-[#000000]'}`}>
            <h1 className='text-xl text-[#333333]'>UnderGround Kettlebell</h1>
            </Link>

            <ul>
                {sidebarLinks.map((link) => {
                    const isActive = pathName === link.route;
                    return (
                        <li key={link.name}>
                            <Link href={link.route} className={`flex items-center p-4 text-xl rounded-lg gap-4  ${isActive ? 'bg-[#FF6A00] text-[#ffffff] font-semibold' : 'text-[#000000]'}`}>
                            <Image src={link.icon} alt='icons' width={16} height={16} />
                                {link.name}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    </section>
  )
}

export default SideBar