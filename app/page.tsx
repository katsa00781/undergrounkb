import DashBoardOverview from "./dashboard/components/DashBoardOverview";


export default function Home() {
  return (
   <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
   <DashBoardOverview />
   </main>
  );
}
