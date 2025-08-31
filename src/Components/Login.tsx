



export const Roles = {
  BROTHER: "Brother",
  BLUECH_SOCIAL: "Bluech Social",
  OWNER: "Owner",
  NEO: "Neo",
  KKG_SISTER: "KKG Sister",
  KKG_SOCIAL: "KKG Social",
  APHI_SISTER: "APhi Sister",
  APHI_SOCIAL: "APhi Social",
  TRIDELT_SISTER: "TriDelt Sister",
  TRIDELT_SOCIAL: "TriDelt Social",
  DG_SISTER: "DG Sister",
  DG_SOCIAL: "DG Social",
  PHISIG_SISTER: "PhiSig Sister",
  PHISIG_SOCIAL: "PhiSig Social",
  AXO_SISTER: "AXO Sister",
  AXO_SOCIAL: "AXO Social",
  AEPHI_SISTER: "AEPhi Sister",
  AEPHI_SOCIAL: "AEPhi Social",
  SDT_SISTER: "SDT Sister",
  SDT_SOCIAL: "SDT Social",
  AXID_SISTER: "AXID Sister",
  AXID_SOCIAL: "AXID Social",
  THETA_SISTER: "Theta Sister",
  THETA_SOCIAL: "Theta Social",
  AGD_SISTER: "AGD Sister",
  AGD_SOCIAL: "AGD Social",
  DPHIE_SISTER: "DphiE Sister",
  DPHIE_SOCIAL: "DphiE Social",
};

export type Role = keyof typeof Roles;
import React, { useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { supabase } from "../supabase";
import { useEffect } from "react";
import { UserRecord } from "../App.tsx"; // Assuming you have a UserRecord type defined in your types file

type LoginProps = {
  onLogin: (role: string) => void; // Pass the determined role back to the parent or update a global state
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userType, setUserType] = useState<"sister" | "brother" | "Owner" | "Social">("sister");
  const [sorority, setSorority] = useState<string>(""); // Default value; adjust as needed
  const [username, setUsername] = useState<string>(""); // Only used by brothers
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from<"users", UserRecord>("users")
        .select("id, name, role, password_hash");
      if (error) {
        console.error("Failed to load users:", error);
      } else {
        setAllUsers(data);
      }
      setLoading(false);
    })();
  }, []);

  const handleLogin = () => {
    setError("");
    if (userType === "sister") {
      // For sisters, the expected password is "OMN" + sorority abbreviation (e.g. "OMNKKG")
      const expectedSisterPassword = "OMN" + sorority;
      if (password === expectedSisterPassword) {
        // Determine sister role based on the sorority selection.
        switch (sorority) {
          case "KKG":
            onLogin(Roles.KKG_SISTER);
            break;
          case "APHI":
            onLogin(Roles.APHI_SISTER);
            break;
          case "TRIDELT":
            onLogin(Roles.TRIDELT_SISTER);
            break;
          case "DG":
            onLogin(Roles.DG_SISTER);
            break;
          case "PHISIG":
            onLogin(Roles.PHISIG_SISTER);
            break;
          case "AXO":
            onLogin(Roles.AXO_SISTER);
            break;
          case "AEPHI":
            onLogin(Roles.AEPHI_SISTER);
            break;
          case "SDT":
            onLogin(Roles.SDT_SISTER);
            break;
          case "AXID":
            onLogin(Roles.AXID_SISTER);
            break;
          case "THETA":
            onLogin(Roles.THETA_SISTER);
            break;
          case "AGD":
            onLogin(Roles.AGD_SISTER);
            break;
          case "DPHIE":
            onLogin(Roles.DPHIE_SISTER);
            break;
          default:
            setError("Invalid sorority selection.");
        }
      } else {
        setError("Invalid password for sister login.");
      }
    
    }
    if (userType === "Owner") {
      onLogin(Roles.OWNER);
    }
  };
  
  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Login
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>User Type</InputLabel>
        <Select
          value={userType}
          label="User Type"
          onChange={(e) => setUserType(e.target.value as "sister" | "brother" |"Owner" | "Social")}
        >
          <MenuItem value="sister">Sister</MenuItem>
          <MenuItem value="brother">Brother</MenuItem>
        </Select>
      </FormControl>
      {userType === "sister" && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Sorority</InputLabel>
          <Select
            value={sorority}
            label="Sorority"
            onChange={(e) => setSorority(e.target.value)}
          >
            <MenuItem value="KKG">KKG</MenuItem>
            <MenuItem value="APHI">APHI</MenuItem>
            <MenuItem value="TRIDELT">TRIDELT</MenuItem>
            <MenuItem value="DG">DG</MenuItem>
            <MenuItem value="PHISIG">PHISIG</MenuItem>
            <MenuItem value="AXO">AXO</MenuItem>
            <MenuItem value="AEPHI">AEPHI</MenuItem>
            <MenuItem value="SDT">SDT</MenuItem>
            <MenuItem value="AXID">AXID</MenuItem>
            <MenuItem value="THETA">THETA</MenuItem>
            <MenuItem value="AGD">AGD</MenuItem>
            <MenuItem value="DPHIE">DPHIE</MenuItem>
          </Select>
        </FormControl>
      )}
      {userType === "brother" && (
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 2 }}
        />
      )}
      <TextField
        fullWidth
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{ mb: 2 }}
      />
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Button variant="contained" fullWidth onClick={handleLogin}>
        Login
      </Button>
    </Box>
  );
};

export default Login;

function setLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}
