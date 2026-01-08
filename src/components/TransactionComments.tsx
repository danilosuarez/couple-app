"use client";

import { useState, useRef, useEffect } from "react";
import { addComment } from "@/app/actions/comments";
import { Send, User as UserIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { labels } from "@/lib/i18n";

type Comment = {
    id: string;
    content: string;
    createdAt: Date;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
};

export function TransactionComments({
    transactionId,
    initialComments,
    currentUser
}: {
    transactionId: string;
    initialComments: Comment[];
    currentUser: { id: string; name: string | null };
}) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        // Optimistic update
        const tempId = Math.random().toString();
        const optimisticComment: Comment = {
            id: tempId,
            content: newComment,
            createdAt: new Date(),
            user: { id: currentUser.id, name: currentUser.name, image: null },
        };

        setComments([...comments, optimisticComment]);
        setNewComment("");

        const res = await addComment(transactionId, optimisticComment.content);

        if (res?.success && res.comment) {
            // Replace optimistic with real
            setComments(prev => prev.map(c => c.id === tempId ? { ...res.comment, user: optimisticComment.user } as Comment : c));
        } else {
            // Revert on failure
            setComments(prev => prev.filter(c => c.id !== tempId));
        }
        setIsSubmitting(false);
    }

    return (
        <div className="flex flex-col h-[400px] border-t border-gray-800">
            <div className="p-4 bg-gray-950 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300">{labels.transactions.comments}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {comments.length === 0 ? (
                    <div className="text-center text-gray-600 text-sm py-10">
                        {labels.transactions.noComments}
                    </div>
                ) : (
                    comments.map((comment) => {
                        const isMe = comment.user.id === currentUser.id;
                        return (
                            <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                                    {comment.user.image ? (
                                        <img src={comment.user.image} alt={comment.user.name || "User"} className="w-8 h-8 rounded-full" />
                                    ) : (
                                        <span className="text-xs font-bold text-gray-400">
                                            {comment.user.name?.[0] || <UserIcon className="w-4 h-4" />}
                                        </span>
                                    )}
                                </div>
                                <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end flex flex-col' : ''}`}>
                                    <div className={`rounded-xl px-4 py-2 text-sm ${isMe ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                                        {comment.content}
                                    </div>
                                    <span className="text-[10px] text-gray-500 px-1">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2">
                <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={labels.transactions.addComment}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={isSubmitting}
                />
                <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
