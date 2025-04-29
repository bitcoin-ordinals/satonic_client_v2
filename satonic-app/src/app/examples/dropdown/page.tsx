import { DropdownMenuExample } from "@/components/examples/dropdown-example"

export default function DropdownExamplePage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-8">Dropdown Menu Example</h1>
      <div className="flex flex-col items-start gap-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-medium mb-4">Basic Dropdown Menu</h2>
          <DropdownMenuExample />
        </div>
      </div>
    </div>
  )
} 