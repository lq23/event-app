import React, { useState } from "react";
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useUser } from "./UserContext";
import { Role, Roles } from "./roles";
import { Button } from "@mui/material";
import { supabase } from "../supabase";
import {UserRecord} from "../App.tsx"; // Assuming you have a UserRecord type defined in your types file
import {houseToRolesMap} from "./roles";


interface RoleAvatarProps {
  role: Role;
  size?: number;
  house: string; // Optional house prop, can be used to display house information
  onLogout: () => void; // Optional callback for logout action
}

const roleColors: Record<string, string> = {
  KKG: "#E91E63",
  APHI: "#9C27B0",
  TRIDELT: "#3F51B5",
  DG: "#2196F3",
  PHISIG: "#009688",
  AXO: "#4CAF50",
  AEPHI: "#FFC107",
  SDT: "#FF5722",
  AXID: "#795548",
  THETA: "#607D8B",
  AGD: "#673AB7",
  DPHIE: "#F44336",
  BROTHER: "#ADD8E6",
  OWNER: "#000000",
  NEO: "#8BC34A",
  BLUECH_SOCIAL: "#00BCD4",
};

const getInitials = (role: string) => {
  const match = role.match(/[A-Z]+/g);
  return match ? match[0] : role.slice(0, 2).toUpperCase();
};

const getColor = (role: string) => {
  return roleColors[role.toUpperCase()] || "gray";
};

const getRoleIcon = (avatarRole: Role, size: number) => {
  const key = avatarRole.toString().toUpperCase();
  if (key === Roles.OWNER.toUpperCase()) {
    return (
      <span
        style={{
          fontSize: size * 0.8,
          WebkitTextStroke: `0.39px #ffd600`,
          color: "black",
          fontFamily: "'Lilita One', sans-serif",
        }}
      >
        O
      </span>
    );
  }
  if (key === Roles.BROTHER.toUpperCase()) {
    return (
      <span
        style={{
          fontWeight: "bold",
          fontSize: size * 0.8,
          WebkitTextStroke: `1px #ffd600`,
          color: "white",
        }}
      >
        B
      </span>
    );
  }
  return <span style={{ fontSize: size * 0.4 }}>{getInitials(avatarRole)}</span>;
};

const RoleAvatar: React.FC<RoleAvatarProps> = ({ role, size = 60, onLogout }) => {
  // ← hook must be inside the component
  const { currentUser } = useUser();
  const [showDetails, setShowDetails] = useState(false);
  
  if (!currentUser) return null;

  const backgroundColor = getColor(role);
  function getHouseFromRole(role: string): string {
  // e.g. "KKG_SISTER" → "KKG"
  if (role.includes("_")) {
    return role.split("_")[0];
  }
  // fallback for Roles.BROTHER (σχη brothers):
  return "SIG_CHI";
}

// usage:
const house = getHouseFromRole(currentUser.role);
  
  return (
    <>
      <Box
        sx={{ display: "inline-block", cursor: "pointer" }}
        onClick={() => setShowDetails((v) => !v)}
        title={role}
      >
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
          }}
        >
          {getRoleIcon(role, size)}
        </div>
      </Box>

      <Collapse in={showDetails} sx={{ mt: 1 }}>
        <Box sx={{ bgcolor: "#222", p: 2, borderRadius: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ color: "#ffd600" }}>
            {currentUser.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "#fff" }}>
            Role: {role}
          </Typography>
          <Typography variant="body2" sx={{ color: "#fff" }}>
            House: {house}
          </Typography>
          <Button
           onClick= {() => {
               console.log("🔔 RoleAvatar onClick");
               onLogout();
               console.log("currentUser status =>", currentUser?.name);
           }}
            sx={{bgcolor:"aaa", mt: 5, borderColor: "#ffd600", color: "#ffd600",
                boxShadow: "0 0 10px rgb(255, 230, 0)",
                textShadow: "0px 0px 15px rgb(255, 230, 0)",
                "&:hover": {
                  boxShadow: "0 0 20px rgb(214, 104, 0)",
                  textShadow: "0px 0px 20px rgb(214, 104, 0)",}}}
          >
            Log Out
          </Button>
        </Box>
      </Collapse>
    </>
  );
};

export default RoleAvatar;
