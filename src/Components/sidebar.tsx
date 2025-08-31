import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  ListItemButton,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PollIcon from "@mui/icons-material/Poll";
import InboxIcon from "@mui/icons-material/Inbox";
import MessageIcon from "@mui/icons-material/Message";
import DateRangeIcon from "@mui/icons-material/CalendarToday";
import Badge from "@mui/material/Badge";
import RoleAvatar from "./RoleAvatar";
import { useUser } from "./UserContext";
import { Roles } from "../Components/roles";

const drawerWidth = 240;

export interface SidebarProps {
  onNavigate: (view: string) => void;
  onLogout: () => void;
}
interface Notification {
  id: string;
  text: string;
  read: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, onLogout }) => {
  const [notifications] = useState<Notification[]>([]);
  const theme = useTheme();
  const { currentUser } = useUser();
  if (!currentUser) return null;

  const pollCount = notifications.filter(
    (n) => n.id.startsWith("poll") && !n.read
  ).length;
  const messageCount = notifications.filter(
    (n) => n.id.startsWith("msg") && !n.read
  ).length;
  const inboxCount = notifications.filter(
    (n) => n.id.startsWith("inbox") && !n.read
  ).length;

  const calendarCount = notifications.filter(
    (n) => n.id.startsWith("calendar") && !n.read
  ).length;
   function getHouseFromRole(role: string): string {
  // e.g. "KKG_SISTER" → "KKG"
  if (role.includes("_")) {
    return role.split("_")[0];
  }
  // fallback for Roles.BROTHER (σχη brothers):
  return "SIG_CHI";
}
const house = getHouseFromRole(currentUser.role);


  const sidebarItems = [
     {
      type: "custom",
      // inject onLogout here:
      node: <RoleAvatar role={currentUser.role} size={56} onLogout={onLogout} house={house} />
    },
    
    {
      type: "standard",
      text: "Poll",
      icon: (
        <Badge
          badgeContent={pollCount}
          color="error"
          overlap="circular"
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ mt: 4 }}
        >
          <PollIcon
            sx={{
              mt: 0,
              ml: -0.5,
              fontSize: 65,
              color: "#CD7F32",
              "&:hover": {
                color: " #ffd600",
                transform: "scale(1.1)",
              },
              transition: "0.2s ease",
            }}
          />
        </Badge>
      ),
    },

    {
      badgeContent: messageCount,
      anchorOrigin: { vertical: "top", horizontal: "right" },
      type: "standard",
      text: "Message",
      icon: (
        <MessageIcon
          sx={{
            mt: 2,
            ml: -0.5,
            fontSize: 65,
            color: "#87CEEB",
            "&:hover": {
              color: " #50C878",
              transform: "scale(1.1)",
            },
            transition: "0.2s ease",
          }}
        />
      ),
    },

    { badgeContent: inboxCount,
      type: "standard",
      text: "Event Inbox",
      icon: (
        <InboxIcon
          sx={{
            mt: 2,
            ml: -0.5,
            fontSize: 65,
            color: "#FFC0CB",
            "&:hover": {
              color: " #800080",
              transform: "scale(1.1)",
            },
            transition: "0.2s ease",
          }}
        />
      ),
    },
    { badgeContent: calendarCount,
      type: "standard",
      text: "Calendar",
      icon: (
        <DateRangeIcon
          sx={{
            mt: 2,
            ml: -0.5,
            fontSize: 65,
            color: "#b1c485",
            "&:hover": {
              color: " #1e3a1c",
              transform: "scale(1.1)",
            },
            transition: "0.2s ease",
          }}
        />
      ),
    },
  ];
  const getTextStyles = (text: string) => {
  switch (text) {
    case "Poll":
      return {
        color: "#CD7F32",
        fontSize: "1.1rem",
        fontFamily: "'Lilita One', sans-serif",
      };
    case "Message":
      return {
        color: "#87CEEB",
        fontSize: "1.1rem",
        fontFamily: "'Lilita One', sans-serif",
      };
    case "Event Inbox":
      return {
        color: "#FFC0CB",
        fontSize: "1.1rem",
        fontFamily: "'Lilita One', sans-serif",
      };
    case "Calendar":
      return {
        color: "#b1c485",
        fontSize: "1.1rem",
        fontFamily: "'Lilita One', sans-serif",
      };
    default:
      return {};
  }
};

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      PaperProps={{
        sx: {
          width: drawerWidth,
          top: "auto",
          bottom: 0,
          boxSizing: "border-box",
          bgcolor: "#121212",
          opacity: 1,
          color: theme.palette.text.primary,
        },
      }}
      sx={{
        "& .MuiDrawer-root": {
          opacity: 1,
        },
      }}
    >
      <Toolbar />
      <Divider />
      <List>
        {sidebarItems.map((item, idx) =>
          item.type === "custom" ? (
            <ListItemButton key={idx}>
              <ListItemIcon>{item.node}</ListItemIcon>
            </ListItemButton>
          ) : (
            <ListItemButton
              key={item.text ?? idx}
              onClick={() => onNavigate(item.text ?? "")}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  sx: getTextStyles(item.text ?? ""),
                }}
              />
            </ListItemButton>
          )
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;