"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Upload,
  FileText,
  Shield,
  UserCheck,
  UserCog,
  CheckCircle2,
  Circle,
  Loader2,
  Clock,
  XCircle,
} from "lucide-react"

export type StepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "awaiting_approval"

export interface WorkflowStep {
  id: number
  name: string
  shortName: string
  description: string
  status: StepStatus
  icon: React.ComponentType<{ className?: string }>
}

const stepDefinitions: Omit<WorkflowStep, "status">[] = [
  {
    id: 1,
    name: "Upload & Parse",
    shortName: "Upload",
    description: "Upload client documents and extract content",
    icon: Upload,
  },
  {
    id: 2,
    name: "Generate SOA",
    shortName: "Generate",
    description: "AI generates Statement of Advice sections",
    icon: FileText,
  },
  {
    id: 3,
    name: "Regulatory Check",
    shortName: "Compliance",
    description: "Automated compliance and regulatory validation",
    icon: Shield,
  },
  {
    id: 4,
    name: "Paraplanner Review",
    shortName: "Paraplanner",
    description: "Paraplanner reviews and edits the SOA",
    icon: UserCheck,
  },
  {
    id: 5,
    name: "Financial Planner Review",
    shortName: "FP Review",
    description: "Financial planner final review and approval",
    icon: UserCog,
  },
  {
    id: 6,
    name: "Final Version",
    shortName: "Complete",
    description: "Generate final document and complete workflow",
    icon: CheckCircle2,
  },
]

interface WorkflowStepperProps {
  currentStep: number
  stepStatuses: Record<string, StepStatus>
  onStepClick?: (stepId: number) => void
  className?: string
}

export function WorkflowStepper({
  currentStep,
  stepStatuses,
  onStepClick,
  className,
}: WorkflowStepperProps) {
  const steps: WorkflowStep[] = stepDefinitions.map((step) => ({
    ...step,
    status: stepStatuses[`step${step.id}`] ?? "pending",
  }))

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border bg-card p-4",
          className
        )}
      >
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <StepItem
              step={step}
              isCurrent={currentStep === step.id}
              onClick={() => onStepClick?.(step.id)}
            />
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-8 lg:w-12",
                  step.status === "completed"
                    ? "bg-green-500"
                    : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}

function StepItem({
  step,
  isCurrent,
  onClick,
}: {
  step: WorkflowStep
  isCurrent: boolean
  onClick?: () => void
}) {
  const statusIcon = getStatusIcon(step.status)
  const StepIcon = step.icon
  const isCompleted = step.status === "completed"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isCurrent ? "default" : "ghost"}
          size="sm"
          className={cn(
            "flex flex-col items-center gap-1 h-auto py-2 px-3",
            isCompleted && !isCurrent && "text-green-600 hover:text-green-700",
            step.status === "failed" && "text-destructive"
          )}
          onClick={onClick}
        >
          <div className="relative">
            <StepIcon className={cn(
              "h-5 w-5",
              isCompleted && "text-green-400"
            )} />
            {statusIcon && (
              <div className="absolute -bottom-1 -right-1">{statusIcon}</div>
            )}
          </div>
          <span className={cn(
            "hidden text-xs lg:block",
            isCompleted && "text-green-400"
          )}>
            {step.shortName}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{step.name}</span>
            <StepStatusBadge status={step.status} />
          </div>
          <p className="text-xs text-muted-foreground">{step.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function getStatusIcon(status: StepStatus) {
  switch (status) {
    case "completed":
      // No overlay icon - the icon and text turn green instead
      return null
    case "in_progress":
      return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
    case "awaiting_approval":
      return <Clock className="h-3 w-3 text-amber-500" />
    case "failed":
      return <XCircle className="h-3 w-3 text-destructive" />
    default:
      return null
  }
}

function StepStatusBadge({ status }: { status: StepStatus }) {
  const config: Record<StepStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pending", variant: "secondary" },
    in_progress: { label: "In Progress", variant: "default" },
    completed: { label: "Completed", variant: "default" },
    failed: { label: "Failed", variant: "destructive" },
    awaiting_approval: { label: "Awaiting Approval", variant: "outline" },
  }

  const { label, variant } = config[status]
  return <Badge variant={variant} className="text-xs">{label}</Badge>
}

// Compact version for mobile or sidebar
export function WorkflowStepperCompact({
  currentStep,
  stepStatuses,
  onStepClick,
  className,
}: WorkflowStepperProps) {
  const steps: WorkflowStep[] = stepDefinitions.map((step) => ({
    ...step,
    status: stepStatuses[`step${step.id}`] ?? "pending",
  }))

  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((step) => {
        const StepIcon = step.icon
        const isCurrent = currentStep === step.id
        const isCompleted = step.status === "completed"

        return (
          <Button
            key={step.id}
            variant={isCurrent ? "default" : "ghost"}
            className={cn(
              "w-full justify-start",
              isCompleted && !isCurrent && "text-green-600 hover:text-green-700"
            )}
            onClick={() => onStepClick?.(step.id)}
          >
            <StepIcon className={cn(
              "mr-2 h-4 w-4",
              isCompleted && !isCurrent && "text-green-600"
            )} />
            <span className="flex-1 text-left">{step.name}</span>
            <StepStatusBadge status={step.status} />
          </Button>
        )
      })}
    </div>
  )
}
