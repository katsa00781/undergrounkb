import DashBoardOverview from "./dashboard/components/DashBoardOverview";
import Hero from "./dashboard/components/Hero";
import SideBar from "./dashboard/components/SideBar";


export default function Home() {
  return (
   <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
    <SideBar />
   <DashBoardOverview />
   <Hero />
   </main>
  );
}
