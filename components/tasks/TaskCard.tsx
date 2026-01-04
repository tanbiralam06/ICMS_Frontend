import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Edit,
  MoreVertical,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: any;
  currentUser: any;
  updateStatusMutation: any;
  onEdit: (task: any) => void;
  onDelete: (task: any) => void;
  onView: (task: any) => void;
}

export function TaskCard({
  task,
  currentUser,
  updateStatusMutation,
  onEdit,
  onDelete,
  onView,
}: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500 hover:bg-red-600";
      case "High":
        return "bg-orange-500 hover:bg-orange-600";
      case "Medium":
        return "bg-blue-500 hover:bg-blue-600";
      case "Low":
        return "bg-slate-500 hover:bg-slate-600";
      default:
        return "bg-slate-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "Review":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Circle className="h-4 w-4 text-slate-500" />;
    }
  };

  const canUpdateTaskStatus = (task: any) => {
    if (!currentUser) return false;

    // Admin can update any task
    if (currentUser.roles && currentUser.roles.includes("Admin")) {
      return true;
    }

    // Creator can update their own task
    if (task.createdBy?._id === currentUser.id) {
      return true;
    }

    // Assigned users can update the task
    if (task.assignedUsers?.some((user: any) => user._id === currentUser.id)) {
      return true;
    }

    return false;
  };

  const canEditTask = (task: any) => {
    if (!currentUser) return false;
    // Admin can edit any task
    if (currentUser.roles && currentUser.roles.includes("Admin")) {
      return true;
    }
    // Creator can edit their own task
    return task.createdBy?._id === currentUser.id;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge className={cn("mb-2", getPriorityColor(task.priority))}>
            {task.priority}
          </Badge>
          <div className="flex gap-2">
            <Select
              defaultValue={task.status}
              onValueChange={(val) =>
                updateStatusMutation.mutate({ id: task._id, status: val })
              }
              disabled={!canUpdateTaskStatus(task)}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <div className="flex items-center">
                  {getStatusIcon(task.status)}
                  <span className="ml-2">{task.status}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todo">Todo</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(task)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                {canEditTask(task) && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Update Task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onDelete(task)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Task
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardTitle
          className="text-lg cursor-pointer hover:underline"
          onClick={() => onView(task)}
        >
          {task.title}
        </CardTitle>
        <CardDescription
          className="line-clamp-2 cursor-pointer"
          onClick={() => onView(task)}
        >
          {task.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <CalendarIcon className="h-4 w-4" />
          <span>
            {task.dueDate
              ? format(new Date(task.dueDate), "MMM do")
              : "No due date"}
          </span>
        </div>
        <div className="space-y-1">
          {task.assignedUsers?.map((user: any) => (
            <div key={user._id} className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {user.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{user.fullName}</span>
            </div>
          ))}
          {task.assignedUsers?.length === 0 && (
            <span className="text-sm text-muted-foreground italic">
              Unassigned
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t text-xs text-muted-foreground flex flex-col items-start gap-1">
        <div className="flex justify-between w-full">
          <span>Created by {task.createdBy?.fullName}</span>
          <span>{format(new Date(task.createdAt), "MMM d, yy")}</span>
        </div>
        {task.updatedAt && task.updatedAt !== task.createdAt && (
          <div className="w-full text-right italic text-[10px] opacity-70">
            Updated: {format(new Date(task.updatedAt), "MMM d, h:mm a")}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
