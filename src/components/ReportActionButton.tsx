
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useReports } from "../contexts/ReportContext";
import { toast } from "sonner";
import { Report, ReportStatus } from "../types/report";
import { Loader2, MoreHorizontal } from "lucide-react";

interface ReportActionButtonProps {
  report: Report;
  onStatusChange?: () => void;
}

export default function ReportActionButton({
  report,
  onStatusChange,
}: ReportActionButtonProps) {
  const { updateStatus } = useReports();
  const [isLoading, setIsLoading] = useState(false);

  // Define valid status transitions based on current status
  const getValidStatusTransitions = (currentStatus: ReportStatus) => {
    switch (currentStatus) {
      case "submitted":
        return ["under_review", "rejected"] as ReportStatus[];
      case "under_review":
        return ["investigating", "rejected"] as ReportStatus[];
      case "investigating":
        return ["resolved", "closed"] as ReportStatus[];
      case "resolved":
        return ["closed"] as ReportStatus[];
      default:
        return [] as ReportStatus[];
    }
  };

  const validTransitions = getValidStatusTransitions(report.status);

  const handleStatusChange = async (newStatus: ReportStatus) => {
    try {
      setIsLoading(true);
      await updateStatus(report.id, newStatus);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update report status");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format status for display
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isLoading || validTransitions.length === 0}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {validTransitions.length > 0 ? (
          validTransitions.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
            >
              {status === "rejected" || status === "closed"
                ? `Mark as ${formatStatus(status)}`
                : `Move to ${formatStatus(status)}`}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
