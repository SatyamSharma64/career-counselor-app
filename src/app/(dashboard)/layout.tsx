import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardSidebar from './_components/DashboardSidebar'
import DashboardHeader from './_components/DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}





// import { redirect } from 'next/navigation'
// import { auth } from '@/lib/auth'
// import { Navigation } from '@/components/layout/Navigation'

// export default async function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   const session = await auth()

//   if (!session) {
//     redirect('/signin')
//   }

//   return (
//     <div className="h-screen flex overflow-hidden bg-gray-100">
//       <Navigation />
//       <main className="flex-1 relative overflow-y-auto focus:outline-none">
//         {children}
//       </main>
//     </div>
//   )
// }