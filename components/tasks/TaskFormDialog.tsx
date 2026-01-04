import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar as CalendarIcon,
  Upload,
  X,
  Paperclip,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UseFormReturn } from "react-hook-form";

interface TaskFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isEditMode: boolean;
  form: UseFormReturn<any>;
  onSubmit: (values: any) => void;
  users: any;
  isLoading: boolean;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  userSearch: string;
  setUserSearch: (search: string) => void;
  filteredUsers: any[];
}

export function TaskFormDialog({
  isOpen,
  setIsOpen,
  isEditMode,
  form,
  onSubmit,
  isLoading,
  selectedFiles,
  setSelectedFiles,
  userSearch,
  setUserSearch,
  filteredUsers,
  users,
}: TaskFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                            }
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
                            <span className="text-xs">{user?.fullName}</span>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading
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
  );
}
