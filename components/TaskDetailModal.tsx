"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Send,
  User as UserIcon,
  X,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TaskDetailModalProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  currentUser,
}: TaskDetailModalProps) {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset comment when modal opens/closes or task changes
  useEffect(() => {
    setComment("");
  }, [isOpen, task?._id]);

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["comments", task?._id],
    queryFn: async () => {
      if (!task?._id) return [];
      const res = await api.get(`/comments/${task._id}`);
      return res.data.comments;
    },
    enabled: !!task?._id && isOpen,
  });

  // Scroll to bottom when comments change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isOpen]);

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await api.post("/comments", {
        taskId: task._id,
        content,
        // Simple mention logic: find words starting with @
        mentions: [], // For now we rely on backend or just text mentions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", task._id] });
      setComment("");
    },
  });

  const handleSendComment = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment);
  };

  const insertMention = (userName: string) => {
    setComment((prev) => `${prev} @${userName} `);
  };

  if (!task) return null;

  const canComment =
    task.assignedUsers?.some((u: any) => u._id === currentUser?.id) ||
    task.createdBy?._id === currentUser?.id ||
    currentUser?.roles?.includes("Admin");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <div className="flex justify-between items-start pr-8">
            <DialogTitle className="text-xl mr-4">{task.title}</DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{task.priority}</Badge>
            <Badge variant="secondary">{task.status}</Badge>
            {task.dueDate && (
              <span className="text-xs text-muted-foreground">
                Due: {format(new Date(task.dueDate), "PPP")}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-12 flex-1 overflow-hidden min-h-0">
          {/* Left Column: Details */}
          <div className="md:col-span-7 space-y-6 overflow-y-auto p-6 pt-2">
            <div>
              <h4 className="font-semibold mb-2 text-foreground/80">
                Description
              </h4>
              <div className="bg-secondary/20 p-4 rounded-lg border">
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {task.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-foreground/80">
                  Assigned To
                </h4>
                <div className="flex flex-wrap gap-2">
                  {task.assignedUsers?.map((user: any) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-2 bg-secondary p-2 rounded-md px-3 border"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {user.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {user.fullName}
                      </span>
                    </div>
                  ))}
                  {(!task.assignedUsers || task.assignedUsers.length === 0) && (
                    <span className="text-sm text-muted-foreground italic">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground/80">
                  Created By
                </h4>
                <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md border w-fit">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {task.createdBy?.fullName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">
                      {task.createdBy?.fullName || "Unknown"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(task.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {task.attachments && task.attachments.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-foreground/80 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" /> Attachments
                </h4>
                <div className="flex flex-wrap gap-3">
                  {task.attachments.map((attachment: string, index: number) => {
                    const fileName = attachment.split("/").pop();
                    const fileUrl = `${
                      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
                      "http://localhost:5000"
                    }/${attachment}`;
                    return (
                      <a
                        key={index}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-secondary/50 p-2 rounded-md px-3 border hover:bg-secondary transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium truncate max-w-[150px]">
                            {fileName}
                          </span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Comments */}
          <div className="md:col-span-5 flex flex-col h-full border-l bg-secondary/5 overflow-hidden min-h-0">
            <div className="p-4 border-b bg-background/50 backdrop-blur-sm flex justify-between items-center shrink-0">
              <h4 className="font-semibold text-sm">Comments</h4>
              <Badge variant="outline" className="px-1.5 py-0 h-5 text-[10px]">
                {comments?.length || 0}
              </Badge>
            </div>

            {/* ScrollArea needs flex-1 to take remaining space, but NOT h-full which forces it to parent height ignoring siblings */}
            <ScrollArea className="flex-1 w-full bg-slate-50/50 dark:bg-transparent min-h-0">
              <div className="p-4 space-y-6">
                {isLoadingComments ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="text-xs">Loading conversation...</span>
                  </div>
                ) : comments?.length > 0 ? (
                  <>
                    {comments.map((c: any) => {
                      const isMe = c.userId?._id === currentUser?.id;
                      return (
                        <div
                          key={c._id}
                          className={cn(
                            "flex gap-3 max-w-[90%]",
                            isMe ? "ml-auto flex-row-reverse" : ""
                          )}
                        >
                          <Avatar className="h-8 w-8 mt-1 border shadow-sm shrink-0">
                            <AvatarFallback
                              className={cn(
                                "text-xs",
                                isMe
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                            >
                              {c.userId?.fullName?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "flex flex-col space-y-1 min-w-0",
                              isMe ? "items-end" : "items-start"
                            )}
                          >
                            <div className="flex items-center gap-2 px-1">
                              {!isMe && (
                                <span className="text-xs font-semibold text-foreground/80">
                                  {c.userId?.fullName}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(c.createdAt), "h:mm a")}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "px-3 py-2 rounded-2xl text-sm shadow-sm whitespace-pre-wrap break-words",
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-tr-none"
                                  : "bg-white dark:bg-secondary border rounded-tl-none"
                              )}
                            >
                              {c.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2 opacity-60">
                    <div className="bg-secondary p-3 rounded-full">
                      <Send className="h-4 w-4" />
                    </div>
                    <p className="text-xs">
                      No comments yet. Start the discussion!
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Comment Input */}
            <div className="p-3 border-t bg-background shrink-0 z-10">
              {canComment ? (
                <div className="relative">
                  <Textarea
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[48px] max-h-[120px] pr-12 py-3 text-sm resize-none rounded-xl focus-visible:ring-primary/20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                  />
                  <div className="absolute right-2 bottom-2">
                    <Button
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={handleSendComment}
                      disabled={!comment.trim() || addCommentMutation.isPending}
                    >
                      {addCommentMutation.isPending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-secondary/30 rounded-md text-center">
                  <span className="text-xs text-muted-foreground font-medium">
                    You do not have permission to comment on this task.
                  </span>
                </div>
              )}
              {/* Quick Mentions below input */}
              {canComment && task.assignedUsers?.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                  {task.assignedUsers.map((u: any) => (
                    <button
                      key={u._id}
                      onClick={() => insertMention(u.fullName)}
                      className="flex-shrink-0 text-[10px] bg-secondary hover:bg-secondary/80 px-2 py-1 rounded-md text-muted-foreground transition-all hover:text-foreground border"
                      title={`Mention ${u.fullName}`}
                    >
                      @{u.fullName.split(" ")[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
