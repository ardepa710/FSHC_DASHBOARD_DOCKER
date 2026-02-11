import { useState } from 'react';
import { Send, Trash2, MessageSquare, Reply } from 'lucide-react';
import toast from 'react-hot-toast';
import { useComments, useCreateComment, useDeleteComment, useUsers } from '../hooks/useData';
import useStore from '../store/useStore';
import clsx from 'clsx';

const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'just now';
};

export default function CommentsSection({ taskId }) {
  const { user } = useStore();
  const { data: comments = [], isLoading } = useComments(taskId);
  const { data: users = [] } = useUsers();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    // Extract mentions from comment
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      const mentionedUser = users.find(u => u.username.toLowerCase() === match[1].toLowerCase());
      if (mentionedUser) {
        mentions.push(mentionedUser.id);
      }
    }

    try {
      await createComment.mutateAsync({
        taskId,
        content: newComment.trim(),
        mentions,
        parentId: replyTo,
      });
      setNewComment('');
      setReplyTo(null);
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await deleteComment.mutateAsync(commentId);
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === '@') {
      setShowMentions(true);
    }
  };

  const insertMention = (username) => {
    setNewComment(prev => prev + `@${username} `);
    setShowMentions(false);
    setMentionSearch('');
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    u.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Group comments by parent
  const topLevelComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);

  const renderComment = (comment, isReply = false) => (
    <div
      key={comment.id}
      className={clsx(
        'bg-[#1a2035] rounded-lg p-3 group',
        isReply && 'ml-6 border-l-2 border-[#1e2640]'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ background: '#6c8cff' }}
        >
          {comment.author?.name?.slice(0, 2).toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-white">
              {comment.author?.name || 'Unknown'}
            </span>
            <span className="text-[10px] text-[#556]">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-[13px] text-[#e0e0e0] mt-1 whitespace-pre-wrap">
            {comment.content.split(/(@\w+)/g).map((part, i) => {
              if (part.startsWith('@')) {
                return (
                  <span key={i} className="text-[#6c8cff] font-medium">
                    {part}
                  </span>
                );
              }
              return part;
            })}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {!isReply && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="text-[11px] text-[#8892a4] hover:text-[#6c8cff] flex items-center gap-1"
              >
                <Reply size={12} />
                Reply
              </button>
            )}
            {comment.authorId === user?.id && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-[11px] text-[#8892a4] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {!isReply && getReplies(comment.id).map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="mt-5 pt-5 border-t border-[#1e2640]">
      <h4 className="text-[12px] font-semibold text-[#8892a4] mb-3 flex items-center gap-2">
        <MessageSquare size={14} />
        Comments ({comments.length})
      </h4>

      {/* Comment Input */}
      <div className="relative mb-4">
        {replyTo && (
          <div className="mb-2 text-[11px] text-[#8892a4] flex items-center gap-2">
            <Reply size={12} />
            Replying to comment
            <button
              onClick={() => setReplyTo(null)}
              className="text-[#ef4444] hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment... Use @ to mention"
              rows={2}
              className="w-full bg-[#1a2035] border border-[#1e2640] rounded-lg py-2 px-3 text-[12px] text-[#e0e0e0] outline-none focus:border-[#6c8cff] placeholder:text-[#556] resize-none"
            />
            {showMentions && (
              <div className="absolute bottom-full left-0 mb-1 w-48 bg-[#1a2035] border border-[#1e2640] rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                <input
                  type="text"
                  value={mentionSearch}
                  onChange={(e) => setMentionSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-transparent border-b border-[#1e2640] p-2 text-[11px] text-white outline-none"
                  autoFocus
                />
                {filteredUsers.slice(0, 5).map(u => (
                  <button
                    key={u.id}
                    onClick={() => insertMention(u.username)}
                    className="w-full text-left px-3 py-2 text-[11px] text-[#e0e0e0] hover:bg-[#253050]"
                  >
                    @{u.username} - {u.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowMentions(false)}
                  className="w-full text-center py-1 text-[10px] text-[#556] border-t border-[#1e2640]"
                >
                  Close
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || createComment.isPending}
            className="px-3 self-end py-2 bg-[#6c8cff] text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center text-[#8892a4] py-4">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-[#556] py-4 text-[12px]">No comments yet</div>
      ) : (
        <div className="space-y-3">
          {topLevelComments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
