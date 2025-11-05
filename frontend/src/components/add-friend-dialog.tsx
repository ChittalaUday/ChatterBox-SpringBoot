"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FriendsService from "@/services/friends.service";
import { User } from "@/services/chat.types";

interface AddFriendDialogProps {
  onFriendAdded: () => void;
}

export function AddFriendDialog({ onFriendAdded }: AddFriendDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }
    
    try {
      setSearching(true);
      setError(null);
      const users = await FriendsService.searchUsers(searchQuery);
      setUsers(users);
    } catch (err) {
      setError("Failed to search users");
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (friendId: number) => {
    if (friendId === undefined) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await FriendsService.sendFriendRequest(friendId);
      setSuccess("Friend request sent successfully!");
      
      // Refresh the user list
      handleSearch();
      
      // Notify parent component
      setTimeout(() => {
        onFriendAdded();
      }, 1500);
    } catch (err) {
      setError("Failed to send friend request");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Friend</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Search for users by name or email to send a friend request.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="search" className="text-right">
              Search
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or email"
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-500 text-sm">{success}</div>}
          
          <ScrollArea className="h-60">
            {users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => {
                  // Add defensive check for user object
                  if (!user || user.id === undefined) {
                    return null;
                  }
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.name}`} />
                          <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">{user.email || 'No email'}</div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleSendRequest(user.id)}
                        disabled={loading}
                      >
                        Add
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <div className="text-center text-muted-foreground py-4">
                No users found
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Search for users to add as friends
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}