"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";

import api from "@/lib/api";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { DeleteTaskDialog } from "@/components/tasks/DeleteTaskDialog";

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

  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await api.get("/tasks");
      return res.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users", "active"],
    queryFn: async () => {
      const res = await api.get("/users?status=active");
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
          <TaskFormDialog
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            isEditMode={isEditMode}
            form={form}
            onSubmit={onSubmit}
            users={users}
            isLoading={
              createTaskMutation.isPending || updateTaskMutation.isPending
            }
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            filteredUsers={filteredUsers}
          />
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tasks?.data?.tasks?.map((task: any) => (
          <TaskCard
            key={task._id}
            task={task}
            currentUser={currentUser}
            updateStatusMutation={updateStatusMutation}
            onEdit={handleEditClick}
            onDelete={(t) => {
              setTaskToDelete(t);
              setIsDeleteAlertOpen(true);
            }}
            onView={(t) => {
              setSelectedTask(t);
              setIsDetailOpen(true);
            }}
          />
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

      <DeleteTaskDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        task={taskToDelete}
        onDelete={() => {
          if (taskToDelete) {
            deleteTaskMutation.mutate(taskToDelete._id);
            setIsDeleteAlertOpen(false);
            setTaskToDelete(null);
          }
        }}
      />
    </div>
  );
}
