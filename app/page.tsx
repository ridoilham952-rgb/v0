import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import mockDataJson from "@/mock.json"
import type { MockData } from "@/types/dashboard"
import RealtimeDashboard from "@/components/somnia/realtime-dashboard"

const mockData = mockDataJson as MockData

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

export default function DashboardOverview() {
  return <RealtimeDashboard />
}
