"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Maximize2,
  Edit,
  MoreVertical,
  Eye,
  Trash2,
  Paperclip,
  X,
  Upload,
  Search,
} from "lucide-react";

import api from "@/lib/api";
import { TaskDetailModal } from "@/components/TaskDetailModal";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const taskSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  dueDate: z.date().optional(),
  assignedUsers: z.array(z.string()).optional(),
});

export default function TasksPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Delete mode state
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [userSearch, setUserSearch] = useState("");

  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await api.get("/tasks");
      return res.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data;
    },
  });

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
      assignedUsers: [],
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        title: "",
        description: "",
        priority: "Medium",
        assignedUsers: [],
        dueDate: undefined,
      });
      setIsEditMode(false);
      setEditingTaskId(null);
      setSelectedFiles([]);
      setUserSearch("");
    }
  }, [isOpen, form]);

  const createTaskMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.post("/tasks", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsOpen(false);
      toast.success("Task created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create task");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      return await api.put(`/tasks/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsOpen(false);
      toast.success("Task updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update task");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await api.patch(`/tasks/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task status updated");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete task");
    },
  });

  const onSubmit = (values: z.infer<typeof taskSchema>) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === "assignedUsers" && Array.isArray(value)) {
        value.forEach((id) => formData.append("assignedUsers", id));
      } else if (key === "dueDate" && value) {
        formData.append("dueDate", (value as Date).toISOString());
      } else if (value !== undefined) {
        formData.append(key, value as string);
      }
    });

    selectedFiles.forEach((file) => {
      formData.append("attachments", file);
    });

    if (isEditMode && editingTaskId) {
      updateTaskMutation.mutate({ id: editingTaskId, data: formData });
    } else {
      createTaskMutation.mutate(formData);
    }
  };

  const handleEditClick = (task: any) => {
    setIsEditMode(true);
    setEditingTaskId(task._id);
    form.reset({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      assignedUsers: task.assignedUsers?.map((u: any) => u._id) || [],
    });
    setIsOpen(true);
  };

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

  const [role, setRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.roles ? user.roles[0] : null);
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
  }, []);

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

  const filteredUsers = users?.data?.users?.filter(
    (user: any) =>
      user.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          {role !== "Employee" && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Task
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Task" : "Create New Task"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update task details."
                  : "Add a new task to the board."}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] px-1">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 py-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Task title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Task details..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[200]">
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 z-[200]"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date() && !isEditMode
                                } // Allow past dates if editing? Maybe not.
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="assignedUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To (Select Multiple)</FormLabel>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {field.value?.map((userId: string) => {
                            const user = users?.data?.users?.find(
                              (u: any) => u._id === userId
                            );
                            return (
                              <Badge
                                key={userId}
                                variant="secondary"
                                className="flex items-center gap-1 px-2 py-1"
                              >
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[8px]">
                                    {user?.fullName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">
                                  {user?.fullName}
                                </span>
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                                  onClick={() => {
                                    const currentValue =
                                      (field.value as string[]) || [];
                                    field.onChange(
                                      currentValue.filter(
                                        (id: string) => id !== userId
                                      )
                                    );
                                  }}
                                />
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="relative mb-2">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search users to assign..."
                            className="pl-8"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                          />
                        </div>
                        {userSearch && (
                          <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1 bg-background shadow-sm">
                            {filteredUsers?.length > 0 ? (
                              filteredUsers.map((user: any) => (
                                <div
                                  key={user._id}
                                  className="flex items-center justify-between p-2 hover:bg-secondary/50 rounded-md transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`search-${user._id}`}
                                      checked={
                                        (field.value as string[])?.includes(
                                          user._id
                                        ) || false
                                      }
                                      onCheckedChange={(checked) => {
                                        const currentValue =
                                          (field.value as string[]) || [];
                                        if (checked) {
                                          field.onChange([
                                            ...currentValue,
                                            user._id,
                                          ]);
                                        } else {
                                          field.onChange(
                                            currentValue.filter(
                                              (id: string) => id !== user._id
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">
                                        {user.fullName}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {user.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-center py-2 text-muted-foreground">
                                No users found.
                              </div>
                            )}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormLabel>Attachments</FormLabel>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("file-upload")?.click()
                        }
                      >
                        <Upload className="h-4 w-4 mr-2" /> Upload Files
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setSelectedFiles((prev) => [...prev, ...files]);
                        }}
                      />
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedFiles.map((file, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Paperclip className="h-3 w-3" />
                            <span className="max-w-[150px] truncate text-xs">
                              {file.name}
                            </span>
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-red-500"
                              onClick={() =>
                                setSelectedFiles((prev) =>
                                  prev.filter((_, i) => i !== index)
                                )
                              }
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={
                        createTaskMutation.isPending ||
                        updateTaskMutation.isPending
                      }
                    >
                      {createTaskMutation.isPending ||
                      updateTaskMutation.isPending
                        ? "Saving..."
                        : isEditMode
                        ? "Update Task"
                        : "Create Task"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tasks?.data?.tasks?.map((task: any) => (
          <Card key={task._id} className="flex flex-col">
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
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      {canEditTask(task) && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(task)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Update Task
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                              setTaskToDelete(task);
                              setIsDeleteAlertOpen(true);
                            }}
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
                onClick={() => {
                  setSelectedTask(task);
                  setIsDetailOpen(true);
                }}
              >
                {task.title}
              </CardTitle>
              <CardDescription
                className="line-clamp-2 cursor-pointer"
                onClick={() => {
                  setSelectedTask(task);
                  setIsDetailOpen(true);
                }}
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
        ))}
        {tasks?.data?.tasks?.length === 0 && (
          <div className="col-span-3 text-center text-muted-foreground py-12">
            No tasks found. Create one to get started!
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        currentUser={currentUser}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task "{taskToDelete?.title}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (taskToDelete) {
                  deleteTaskMutation.mutate(taskToDelete._id);
                  setIsDeleteAlertOpen(false);
                  setTaskToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
