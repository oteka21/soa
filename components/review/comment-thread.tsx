"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, MessageSquare, Send } from "lucide-react"

interface Comment {
  id: string
  sectionId: string
  authorId: string
  authorName: string | null
  authorEmail: string | null
  content: string
  status: "open" | "resolved"
  createdAt: string
}

interface CommentThreadProps {
  sectionId: string
  sectionTitle: string
  comments: Comment[]
  onAddComment: (content: string) => Promise<void>
  onResolveComment: (commentId: string) => Promise<void>
  isLoading?: boolean
}

export function CommentThread({
  sectionId,
  sectionTitle,
  comments,
  onAddComment,
  onResolveComment,
  isLoading,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onAddComment(newComment)
      setNewComment("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openComments = comments.filter((c) => c.status === "open")
  const resolvedComments = comments.filter((c) => c.status === "resolved")

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return "?"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4" />
            {sectionTitle}
          </CardTitle>
          <Badge variant="secondary">
            {openComments.length} open
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="max-h-64">
          {comments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No comments yet
            </p>
          ) : (
            <div className="space-y-3">
              {openComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onResolve={() => onResolveComment(comment.id)}
                  getInitials={getInitials}
                />
              ))}
              {resolvedComments.length > 0 && (
                <div className="pt-2">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Resolved ({resolvedComments.length})
                  </p>
                  {resolvedComments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onResolve={() => onResolveComment(comment.id)}
                      getInitials={getInitials}
                      resolved
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] resize-none"
            disabled={isLoading || isSubmitting}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isLoading || isSubmitting}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CommentItem({
  comment,
  onResolve,
  getInitials,
  resolved,
}: {
  comment: Comment
  onResolve: () => void
  getInitials: (name: string | null, email: string | null) => string
  resolved?: boolean
}) {
  return (
    <div
      className={`flex gap-3 rounded-lg border p-3 ${
        resolved ? "bg-muted/50 opacity-60" : ""
      }`}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {getInitials(comment.authorName, comment.authorEmail)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {comment.authorName ?? comment.authorEmail}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{comment.content}</p>
        {!resolved && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-0 py-1 text-xs"
            onClick={onResolve}
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Resolve
          </Button>
        )}
      </div>
    </div>
  )
}
