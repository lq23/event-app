// src/Messaging.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Modal,
  Autocomplete,
  CircularProgress,
  Chip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from "@mui/material";
import { Role, Roles } from "./roles";
import { useUser } from "./UserContext";
import { supabase } from "../supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { UserRecord } from "../App";

export interface User {
  id: string;
  name: string;
  role: Role;
}

function formatRole(role: Role): string {
  if (typeof role === "string") {
    return role.replace(/_/g, " ");
  }
  return String(role).replace(/_/g, " ").toUpperCase();
}

// ---- USERS (for autocomplete) ----
const houseData = [
  { name: "KKG", roles: [Roles.KKG_SISTER, Roles.KKG_SOCIAL] },
  { name: "APHI", roles: [Roles.APHI_SISTER, Roles.APHI_SOCIAL] },
  { name: "TRIDELT", roles: [Roles.TRIDELT_SISTER, Roles.TRIDELT_SOCIAL] },
  { name: "DG", roles: [Roles.DG_SISTER, Roles.DG_SOCIAL] },
  { name: "PHISIG", roles: [Roles.PHISIG_SISTER, Roles.PHISIG_SOCIAL] },
  { name: "AXO", roles: [Roles.AXO_SISTER, Roles.AXO_SOCIAL] },
  { name: "AEPHI", roles: [Roles.AEPHI_SISTER, Roles.AEPHI_SOCIAL] },
  { name: "SDT", roles: [Roles.SDT_SISTER, Roles.SDT_SOCIAL] },
  { name: "AXID", roles: [Roles.AXID_SISTER, Roles.AXID_SOCIAL] },
  { name: "THETA", roles: [Roles.THETA_SISTER, Roles.THETA_SOCIAL] },
  { name: "AGD", roles: [Roles.AGD_SISTER, Roles.AGD_SOCIAL] },
  { name: "DPHIE", roles: [Roles.DPHIE_SISTER, Roles.DPHIE_SOCIAL] },
];

const sisterLists: Record<string, string[]> = {
  AXO: ["Alice Smith", "Barbara Jones"],
  KKG: ["Kelly Clarkson", "Kate Winslet"],
  // …etc…
};

export const realUsers: User[] = Object.entries(sisterLists).flatMap(
  ([houseCode, sisters]) =>
    sisters.map((name, i) => ({
      id: `${houseCode.toLowerCase()}_sister_${i + 1}`,
      name,
      role: `${houseCode.toUpperCase()}_SISTER` as Role,
    }))
);

interface GroupChat {
  id: number;
  name: string | null;
  members: string[];
  created_at: string;
}

interface MessageItem {
  id: number;
  sender: string;
  group_id: number | null;
  recipients: string[];
  text: string;
  timestamp: string;
}

interface DMThread {
  members: string[];
}

const Messaging: React.FC = () => {
  const { currentUser } = useUser();

  // Early return with proper loading state
  if (!currentUser) {
    return null;
  }

  const userID = currentUser.id;
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [dmThreads, setDmThreads] = useState<DMThread[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [dmMembers, setDmMembers] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [allUsers, setAllUsers] = useState<User[]>(realUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const getUserDetails = (id: string) => allUsers.find((u) => u.id === id);

  // Initialize user in database
  useEffect(() => {
    if (!currentUser) return;

    const initUser = async () => {
      try {
        await supabase.from("users").upsert({
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        });
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };

    initUser();
  }, [currentUser]);

  // Fetch group chats with better error handling
  const fetchGroupChats = async () => {
    if (!userID) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("groupchats")
        .select("*")
        .contains("members", [userID]) // Use contains instead of cs filter
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching group chats:", error);
        return;
      }

      if (data) {
        setGroupChats(data as GroupChat[]);
      }
    } catch (error) {
      console.error("Error fetching group chats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch DM threads with improved logic
  const fetchDmThreads = async () => {
    if (!userID) return;

    console.log("→ fetchDmThreads() for userID=", userID);

    try {
      setLoading(true);

      // Use cs (contains) filter which is more reliable
      const { data, error } = await supabase
        .from("messages")
        .select("recipients")
        .is("group_id", null)
        .filter(
          "recipients",
          "cs", // "contains" operator
          JSON.stringify([userID]) // -> produces recipients=cs.%5B%22owner_1%22%5D
        );
      console.log("← got threads data:", data);

      if (error) {
        console.error("Error fetching DM threads:", error);
        return;
      }

      if (data) {
        const threads = new Set<string>();
        const list: DMThread[] = [];

        data.forEach((r: any) => {
          const members = (r.recipients as string[]).sort();
          // Make sure the current user is in the thread and it's actually a DM (2 people)
          if (members.includes(userID) && members.length === 2) {
            const key = members.join(",");
            if (!threads.has(key)) {
              threads.add(key);
              list.push({ members });
            }
          }
        });

        console.log("← processed DM threads:", list);
        setDmThreads(list);
      }
    } catch (error) {
      console.error("Error fetching DM threads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages with better error handling
  const loadMessages = async () => {
    if (!userID || (!dmMembers && !activeChatId)) return;

    console.log(
      "→ loadMessages(), dmMembers=",
      dmMembers,
      "activeChatId=",
      activeChatId
    );

    try {
      setLoading(true);
      let res: any;

      if (dmMembers) {
        res = await supabase
          .from("messages")
          .select("*")
          .filter("recipients", "cs", JSON.stringify(dmMembers))
          .order("timestamp", { ascending: true });
      } else if (activeChatId) {
        res = await supabase
          .from("messages")
          .select("*")
          .eq("group_id", activeChatId)
          .order("timestamp", { ascending: true });
      }

      if (res?.error) {
        console.error("Error loading messages:", res.error);
        return;
      }

      if (res?.data) {
        setMessages(res.data as MessageItem[]);

        // Scroll to bottom after messages load
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load users from database
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, role");

        if (error) {
          console.error("Error loading users:", error);
          return;
        }

        if (data) {
          setAllUsers((prev) => {
            const byId = new Set(prev.map((u) => u.id));
            const merged = [...prev];
            for (const u of data) {
              if (!byId.has(u.id)) {
                merged.push(u as User);
              }
            }
            return merged;
          });
        }
      } catch (error) {
        console.error("Error loading users:", error);
      }
    };

    loadUsers();
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!userID) return;

    fetchGroupChats();
    fetchDmThreads();
  }, [userID]);

  // Load messages when chat changes
  useEffect(() => {
    loadMessages();
  }, [activeChatId, dmMembers]);

  // Real-time subscriptions with better error handling
  useEffect(() => {
    if (!userID) return;

    console.log("Setting up real-time subscriptions for userID:", userID);

    const msgChannel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=is.null`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log("🔔 New message received:", payload);

          const newMessage = payload.new;
          if (
            newMessage?.recipients &&
            Array.isArray(newMessage.recipients) &&
            newMessage.recipients.includes(userID)
          ) {
            console.log("📨 New DM involving current user, refreshing threads");
            fetchDmThreads();

            // If we're in the same thread, reload messages
            if (
              dmMembers &&
              dmMembers.length === newMessage.recipients.length &&
              dmMembers.every((member) =>
                newMessage.recipients.includes(member)
              )
            ) {
              loadMessages();
            }
          }
        }
      )
      .subscribe();

    const gcChannel = supabase
      .channel("public:groupchats")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "groupchats" },
        (payload) => {
          console.log("🔔 New group chat:", payload);
          const newGroupChat = payload.new;
          if (
            newGroupChat?.members &&
            Array.isArray(newGroupChat.members) &&
            newGroupChat.members.includes(userID)
          ) {
            fetchGroupChats();
          }
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up subscriptions");
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(gcChannel);
    };
  }, [userID, dmMembers]);

  // Start new chat with improved logic
  const handleStartChat = async (user: User) => {
    if (!currentUser) return;

    const me = currentUser.id;
    const them = user.id;

    if (them === me) {
      alert("You can't message yourself!");
      return;
    }

    try {
      const members = [me, them].sort();
      console.log("Creating DM between:", members);

      // Check if a thread already exists using contains
      const { data: existingThreads, error: checkError } = await supabase
        .from("messages")
        .select("recipients")
        .is("group_id", null)
        .contains("recipients", [me])
        .contains("recipients", [them]);

      if (checkError) {
        console.error("Error checking existing threads:", checkError);
        // Continue anyway to create the thread
      }

      // Check if we already have a thread with exactly these two members
      const existingThread = existingThreads?.find(
        (thread) =>
          thread.recipients.length === 2 &&
          thread.recipients.includes(me) &&
          thread.recipients.includes(them)
      );

      if (!existingThread) {
        // Create starter message
        const { error: insertErr } = await supabase.from("messages").insert([
          {
            sender: me,
            group_id: null,
            recipients: members,
            text: `Chat started between ${currentUser.name} and ${user.name}`,
            timestamp: new Date().toISOString(),
          },
        ]);

        if (insertErr) {
          console.error("Failed to create DM:", insertErr);
          return;
        }
        console.log("✅ New DM thread created");
      } else {
        console.log("✅ Using existing DM thread");
      }

      // Refresh and switch to thread
      await fetchDmThreads();
      setDmMembers(members);
      setActiveChatId(null);
      setShowModal(false);
      setSelectedUser(null);

      // Load messages
      setTimeout(() => {
        loadMessages();
      }, 500);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  // Send message with better error handling
  const sendMessage = async () => {
    if (!input.trim() || !userID) return;

    try {
      const payload = {
        sender: userID,
        group_id: dmMembers ? null : activeChatId,
        recipients: dmMembers || [],
        text: input.trim(),
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("messages")
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        console.error("Error sending message:", error);
        return;
      }

      if (data) {
        setMessages((prev) => [...prev, data as MessageItem]);
        setInput("");

        // Scroll to bottom
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Delete chat with better error handling
  const handleDeleteChat = async () => {
  if (!window.confirm("Are you sure you want to delete this chat?")) return;

  try {
    if (dmMembers) {
      // Delete all DM messages for this two-person thread
      const { data, error, count } = await supabase
        .from("messages")
        .delete({ count: "exact" })
        .contains("recipients", dmMembers) // both members are in recipients
        .is("group_id", null)              // DM only
        .select("id");                     // return deleted ids for visibility

      if (error) {
        console.error("DM delete failed:", error);
        alert(error.message);
        return;
      }
      if (!count) {
        console.warn("DM delete matched 0 rows (check RLS / recipients type).");
      }

      setDmMembers(null);
      setMessages([]);
      fetchDmThreads();
    } else if (activeChatId) {
      // Delete group messages first
      const { error: mErr, count: mCount } = await supabase
        .from("messages")
        .delete({ count: "exact" })
        .eq("group_id", activeChatId)
        .select("id");
      if (mErr) {
        console.error("Group messages delete failed:", mErr);
        alert(mErr.message);
        return;
      }

      // Then delete the group chat row
      const { error: gErr, count: gCount } = await supabase
        .from("groupchats")
        .delete({ count: "exact" })
        .eq("id", activeChatId)
        .select("id");
      if (gErr) {
        console.error("Group chat delete failed:", gErr);
        alert(gErr.message);
        return;
      }
      if (!gCount) {
        console.warn("Group chat delete matched 0 rows (check RLS).");
      }

      setActiveChatId(null);
      setMessages([]);
      fetchGroupChats();
    }
  } catch (e) {
    console.error("Error deleting chat:", e);
  }
};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getUserName = (id: string) => {
    const user = allUsers.find((u) => u.id === id);
    return user?.name ?? id;
  };

  const chatLabel = dmMembers
    ? (() => {
        const other = dmMembers.find((m) => m !== userID);
        if (!other) return "";
        const user = allUsers.find((u) => u.id === other);
        return user
          ? `${user.name} - ${formatRole(user.role)}`
          : getUserName(other);
      })()
    : groupChats.find((g) => g.id === activeChatId)?.name || "";

  return (
    <Box
      sx={{
        mt: -15,
        ml: 12,
        display: "flex",
        width: "93%",
        height: 700,
        bgcolor: "#1a1a1a",
        color: "#fff",
        boxShadow: "0 0 20px rgba(0,0,0,0.5)",
        borderRadius: 3,
        position: "relative",
        zIndex: 5,
      }}
    >
      {/* Sidebar */}
      <Box sx={{ width: 300, borderRight: "1px solid #333", p: 2 }}>
        <Typography
          sx={{
            mb: 2,
            color: "#ffd600",
            fontFamily: "'Lilita One'",
            textShadow: "0 0 10px #ffd600",
          }}
        >
          Group Chats
        </Typography>
        {groupChats.map((gc) => (
          <Button
            key={gc.id}
            onClick={() => {
              setActiveChatId(gc.id);
              setDmMembers(null);
              setShowMembers(false);
            }}
            sx={{
              display: "block",
              width: "100%",
              mb: 1,
              textAlign: "left",
              bgcolor:
                activeChatId === gc.id && !dmMembers ? "#333" : "#212121",
              color: "#ffd600",
              fontFamily: "'Lilita One'",
            }}
          >
            {gc.name}
          </Button>
        ))}

        <Typography
          sx={{
            mt: 3,
            mb: 2,
            color: "#ffd600",
            fontFamily: "'Lilita One'",
            textShadow: "0 0 10px #ffd600",
          }}
        >
          Direct Messages
        </Typography>
        {dmThreads.map((dm) => {
          const other = dm.members.find((m) => m !== userID);
          if (!other) return null;
          const user = allUsers.find((u) => u.id === other);

          return (
            <ListItemButton
              key={other}
              onClick={() => {
                setDmMembers(dm.members);
                setActiveChatId(null);
                loadMessages();
              }}
              selected={dmMembers?.join() === dm.members.join()}
            >
              <ListItemText
                primary={getUserName(other)}
                secondary={user ? formatRole(user.role) : ""}
                primaryTypographyProps={{ sx: { color: "#ffd600" } }}
                secondaryTypographyProps={{
                  sx: { color: "#aaa", fontSize: "0.75rem" },
                }}
              />
            </ListItemButton>
          );
        })}

        <Button
          fullWidth
          variant="contained"
          onClick={() => setShowModal(true)}
          sx={{
            mt: 4,
            bgcolor: "#ffd600",
            color: "#181818",
            fontFamily: "'Lilita One'",
          }}
        >
          New Chat
        </Button>
      </Box>

      {/* Chat Window */}
      <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Typography
            sx={{
              flex: 1,
              color: "#FFD600",
              fontWeight: 300,
              fontFamily: "'Lilita One'",
              textShadow: "0 0 10px #ffd600",
              fontSize: "1.2rem",
            }}
          >
            {chatLabel ? chatLabel.toUpperCase() : "Select a chat"}
          </Typography>
          {!dmMembers && activeChatId && (
            <Button
              size="small"
              onClick={() => setShowMembers((s) => !s)}
              sx={{
                bgcolor: "#0640df",
                color: "#181818",
                textTransform: "none",
                fontFamily: "'Lilita One'",
              }}
            >
              Members
            </Button>
          )}
          {(activeChatId !== null || dmMembers) && (
            <Button
              size="small"
              color="error"
              sx={{ ml: 2, fontFamily: "'Lilita One'" }}
              onClick={handleDeleteChat}
            >
              Delete Chat
            </Button>
          )}
        </Box>

        {!dmMembers && activeChatId && (
          <Collapse in={showMembers}>
            <List dense sx={{ bgcolor: "#222", mb: 1, borderRadius: 1 }}>
              {groupChats
                .find((g) => g.id === activeChatId)
                ?.members.map((m) => (
                  <ListItem key={m}>
                    <ListItemText
                      primary={(() => {
                        const user = getUserDetails(m);
                        return user ? `${user.name} (${user.role})` : m;
                      })()}
                    />
                  </ListItem>
                ))}
            </List>
          </Collapse>
        )}

        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            overflowY: "auto",
            bgcolor: "#181818",
            p: 2,
            borderRadius: 1,
          }}
        >
          {loading && <CircularProgress color="warning" />}
          {!loading && messages.length === 0 && (
            <Typography sx={{ fontFamily: "'Lilita One'", color: "#aaa" }}>
              No messages.
            </Typography>
          )}
          {!loading &&
            messages.map((msg) => {
              const user = allUsers.find((u) => u.id === msg.sender);
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent:
                      msg.sender === userID ? "flex-end" : "flex-start",
                    alignItems: "flex-start",
                    mt: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: msg.sender === userID ? "#ffd600" : "#333",
                      color: msg.sender === userID ? "#181818" : "#fff",
                      borderRadius: 1,
                      maxWidth: "80%",
                      wordBreak: "break-word",
                      fontFamily: "'Lilita One'",
                    }}
                  >
                    {msg.text || <i>(new chat)</i>}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      ml: 1,
                      minWidth: 60,
                    }}
                  >
                    {!dmMembers && (
                      <Typography variant="caption" sx={{ color: "#aaa" }}>
                        {user?.name ?? msg.sender}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: "#555" }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
        </Box>

        {(activeChatId !== null || dmMembers) && (
          <Box
            sx={{
              display: "flex",
              mt: 1,
              position: "relative",
              zIndex: 1000, // <— be loud
              pointerEvents: "auto", // <— accept clicks even if a parent disabled them
              backgroundColor: "#1a1a1a", // guard against overlapped semi-transparency
              pt: 1,
            }}
          >
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              inputProps={{ "data-id": "composer-input" }} // for quick debugging
              sx={{ bgcolor: "#222", input: { color: "#fff" }, mr: 1 ,position: "relative",
        zIndex: 1001,                   // above anything in the chat pane
        pointerEvents: "auto",}}
            />
            <Button
              variant="contained"
              onClick={sendMessage}
              sx={{ bgcolor: "#ffd600", color: "#181818", zIndex: 1001 }}
            >
              Send
            </Button>
          </Box>
        )}
      </Box>

      {/* New Chat Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "25%",
            left: "50%",
            transform: "translate(-50%, -25%)",
            bgcolor: "#232323",
            p: 4,
            borderRadius: 2,
            minWidth: 350,
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "#ffd600", fontFamily: "'Lilita One'" }}
          >
            Start New Chat
          </Typography>

          <Autocomplete
            options={allUsers.filter((u) => u.id !== userID)}
            getOptionLabel={(u) => u.name}
            value={selectedUser}
            onChange={(_, user) => setSelectedUser(user)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search users"
                size="small"
                fullWidth
                variant="outlined"
                placeholder="Type a name…"
                sx={{ bgcolor: "#ffd600", color: "#181818", mb: 2 }}
              />
            )}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              if (!selectedUser) return;
              handleStartChat(selectedUser);
            }}
            disabled={!selectedUser}
            sx={{ bgcolor: "#ffd600", color: "#181818" }}
          >
            Create
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Messaging;
