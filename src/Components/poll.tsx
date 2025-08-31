import { Box, TextField, Button, Typography, Divider } from "@mui/material";
import { useNotifications } from "./NotificationsContext";
import React, { useState, useEffect } from "react";
import { Roles, Role } from "./roles";
import { supabase } from "../supabase"; // If using .ts extension, remove it here!
import { useUser} from "./UserContext";

interface PollData {
  id: number;
  question: string;
  options: string[];
  expiresAt: string;
  votes: Record<string, number>;
  housesAllowed: string[];
}

const getExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString();
};

const getUserHouse = (role: Role): string | null => {
  switch (role) {
    // Sororities (existing)
    case Roles.KKG_SISTER:
    case Roles.KKG_SOCIAL:
      return "KKG";
    case Roles.APHI_SISTER:
    case Roles.APHI_SOCIAL:
      return "APHI";
    case Roles.TRIDELT_SISTER:
    case Roles.TRIDELT_SOCIAL:
      return "TRIDELT";
    case Roles.DG_SISTER:
    case Roles.DG_SOCIAL:
      return "DG";
    case Roles.PHISIG_SISTER:
    case Roles.PHISIG_SOCIAL:
      return "PHISIG";
    case Roles.AXO_SISTER:
    case Roles.AXO_SOCIAL:
      return "AXO";
    case Roles.AEPHI_SISTER:
    case Roles.AEPHI_SOCIAL:
      return "AEPHI";
    case Roles.SDT_SISTER:
    case Roles.SDT_SOCIAL:
      return "SDT";
    case Roles.AXID_SISTER:
    case Roles.AXID_SOCIAL:
      return "AXID";
    case Roles.THETA_SISTER:
    case Roles.THETA_SOCIAL:
      return "THETA";
    case Roles.AGD_SISTER:
    case Roles.AGD_SOCIAL:
      return "AGD";
    case Roles.DPHIE_SISTER:
    case Roles.DPHIE_SOCIAL:
      return "DPHIE";

    // Fraternities (NEW)
    case Roles.OWNER:
    case Roles.NEO:
    case Roles.BLUECH_SOCIAL:
    case Roles.BROTHER: // if this BROTHER is your SIG_CHI brother role
      return "SIG_CHI";
    case Roles.THETA_CHI_BROTHER:
    case Roles.THETA_CHI_SOCIAL:
      return "THETA_CHI";
    case Roles.DKE_BROTHER:
    case Roles.DKE_SOCIAL:
      return "DKE";
    case Roles.DU_BROTHER:
    case Roles.DU_SOCIAL:
      return "DU";
    case Roles.ZBT_BROTHER:
    case Roles.ZBT_SOCIAL:
      return "ZBT";
    case Roles.AEPI_BROTHER:
    case Roles.AEPI_SOCIAL:
      return "AEPI";
    case Roles.SAE_BROTHER:
    case Roles.SAE_SOCIAL:
      return "SAE";
    case Roles.PIKE_BROTHER:
    case Roles.PIKE_SOCIAL:
      return "PIKE";
    case Roles.SAMMY_BROTHER:
    case Roles.SAMMY_SOCIAL:
      return "SAMMY";
    case Roles.TKE_BROTHER:
    case Roles.TKE_SOCIAL:
      return "TKE";
    case Roles.PSI_U_BROTHER:
    case Roles.PSI_U_SOCIAL:
      return "PSI_U";
    case Roles.DTD_BROTHER:
    case Roles.DTD_SOCIAL:
      return "DTD";

    default:
      return null;
  }
};

const Poll: React.FC = () => {
  
  const [polls, setPolls] = useState<PollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // Create Poll states
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const { addNotification } = useNotifications();
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);

  useEffect(() => {
    const fetchPolls = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .order("id", { ascending: false });
      if (error) {
        alert("Failed to fetch polls: " + error.message);
      } else {
        setPolls(
          (data as any[]).map((p) => ({
            ...p,
            options: p.options || [],
            votes: p.votes || {},
            housesAllowed: p.housesallowed || [],
            expiresAt: p.expiresat,
          }))
        );
      }
      setLoading(false);
    };
    fetchPolls();
  }, []);

  const { currentUser } = useUser();
  if (!currentUser) {
    // You can return a spinner, "Loading...", or simply null
    return null;
  }
  const FRAT_KEYS = new Set([
  "SIG CHI",
  "DKE",
  "Theta CHI",
  "SAE",
  "PSI U",
  "DU",
  "PIKE",
  "SAMMY",
  "TKE",
  "ZBT",
  "AEPI",
  "DTD"
]);

  const ROLE = String(currentUser?.role || "").trim().toUpperCase();
  const canRemovePoll =
  ROLE === "OWNER" || ROLE === "BLUECH_SOCIAL" || ROLE.includes("SOCIAL");
  const isFratSocial   = ROLE.endsWith("_SOCIAL") 
                       && FRAT_KEYS.has(ROLE.replace(/_SOCIAL$/, ""));
  const userHouse = getUserHouse(currentUser.role); // <- add this
  const now = new Date();

  const activePolls = polls.filter(
    (p) =>
      new Date(p.expiresAt) > now &&
      (!userHouse || p.housesAllowed.includes(userHouse))
  );
  const showCreatePollButton =
    ROLE === "OWNER" ||
    ROLE === "BLUECH_SOCIAL" ||
    ROLE.includes("SOCIAL");

  // Sorority list
  const houseData: { name: string; roles: Role[] }[] = [
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

  const handleAddOption = () => setOptions((o) => [...o, ""]);
  const handleOptionChange = (idx: number, val: string) =>
    setOptions((o) => o.map((v, i) => (i === idx ? val : v)));

  const handleCreatePoll = async () => {
  if (!question.trim() || options.some((o) => !o.trim())) {
    alert("Please enter a question and all options.");
    return;
  }

  // NEW: always include the creator's house
  const creatorHouse = getUserHouse(currentUser.role);
  const finalHousesAllowed = Array.from(new Set([
    ...selectedHouses,
    ...(creatorHouse ? [creatorHouse] : []),
  ]));

  const pollToInsert = {
    question,
    options,
    expiresat: getExpiryDate(),
    votes: {},
    housesallowed: finalHousesAllowed, // <- use the merged list
  };

  const { data, error } = await supabase
    .from("polls")
    .insert([pollToInsert])
    .select("*")
    .single();

  if (error) {
    alert("Could not create poll: " + error.message);
    return;
  }
  setPolls((prev) => [data as PollData, ...prev]);
  addNotification({
    id: String(data.id),
    message: `New poll created: ${question}`,
    type: "poll",
  });
  setQuestion("");
  setOptions(["", ""]);
  setShowCreate(false);
};
  // VOTING
  const getVotedOption = (pollId: number) =>
    localStorage.getItem(`poll-voted-${pollId}`);

  const vote = async (pollId: number, option: string) => {
    const poll = polls.find((p) => p.id === pollId);
    if (!poll) return;
    const prevOption = getVotedOption(pollId);

    if (prevOption === option) {
      alert("You already voted for this option.");
      return;
    }
    const newVotes = { ...poll.votes };
    if (prevOption && newVotes[prevOption]) {
      newVotes[prevOption] -= 1;
    }
    newVotes[option] = (newVotes[option] || 0) + 1;

    const { data, error } = await supabase
      .from("polls")
      .update({ votes: newVotes })
      .eq("id", pollId)
      .select("*")
      .single();
    if (error) {
      alert("Vote failed: " + error.message);
      return;
    }
    setPolls((ps) =>
      ps.map((p) => (p.id !== pollId ? p : { ...p, votes: newVotes }))
    );
    localStorage.setItem(`poll-voted-${pollId}`, option);
  };

  const handleRemovePoll = async (pollId: number) => {
  if (!canRemovePoll) {
    alert("Only the owner or socials can remove polls.");
    return;
  }
  if (!window.confirm("Remove this poll?")) return;
  const { error } = await supabase.from("polls").delete().eq("id", pollId);
  if (!error) {
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
    localStorage.removeItem(`poll-voted-${pollId}`);
  }
};

  // Sorority color logic
  const roleColors: Record<string, string> = {
    KKG: "#FF0000",
    APHI: "#2e86c1",
    TRIDELT: "#5D3FD3",
    DG: "#186a3b",
    PHISIG: "#009688",
    AXO: "#82e0aa",
    AEPHI: "#FFC107",
    SDT: "#d35400",
    AXID: "#f9e79f",
    THETA: "#607D8B",
    AGD: "#673AB7",
    DPHIE: "#795548",
    BROTHER: "#ADD8E6",
    OWNER: "#000000",
    NEO: "#8BC34A",
    BLUECH_SOCIAL: "#00BCD4",
    
  };

  const getColor = (role: string) => {
    return roleColors[role.toUpperCase()] || "#cccccc";
  };

  // Render each poll
  const renderPoll = (poll: PollData) => {
    const votedOption = getVotedOption(poll.id);
    return (
      <Box
        key={poll.id}
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "#222",
          borderRadius: 2,
          position: "relative",
          minHeight: 90,
        }}
      >
        <Typography fontWeight={700}>{poll.question}</Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          {poll.options.map((option) => (
            <Button
              key={option}
              size="small"
              variant={votedOption === option ? "contained" : "outlined"}
              color={votedOption === option ? "success" : "primary"}
              onClick={() => vote(poll.id, option)}
            >
              {option}
              <span style={{ marginLeft: 6, fontSize: "0.9em", color: "#aaa" }}>
                ({poll.votes[option] || 0})
              </span>
            </Button>
          ))}
        </Box>
        <Typography
          variant="caption"
          sx={{ color: "#aaa", mt: 1, display: "block" }}
        >
          Expires:{" "}
          {new Date(poll.expiresAt).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      {canRemovePoll && (
         <Button
    size="small"
    color="error"
    sx={{
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "#1D1901",
      color: "#1D1901",
      fontFamily: "'Lilita One', sans-serif",
      height: 50,
      width: 90,
      boxShadow: "0 0 10px #ff0000",
      transition: "box-shadow 0.3s ease",
      textShadow: "0px 0px 15px #ff0000",
      "&:hover": {
        boxShadow: "0 0 20px rgb(214, 104, 0)",
        textShadow: "0px 0px 20px rgb(214, 104, 0)",
      },
    }}
    onClick={() => handleRemovePoll(poll.id)}
  >
    Remove
  </Button>
)}
      </Box>
    );
  };

  // --- Render
  return (
    <Box
      sx={{
        ml: 5,
        maxWidth: 1667,
        my: -26,
        p: 4,
        bgcolor: "#1a1a1a",
        borderRadius: 4,
        boxShadow: 6,
        color: "#fff",
        minHeight: 900,
      }}
    >
      <Typography
        variant="h2"
        sx={{
          mx: 65,
          mb: 2,
          fontFamily: "'Lilita One', sans-serif",
          color: "#008080",
        }}
      >
        Active Polls
      </Typography>
      {loading && <Typography sx={{ ml: 65 }}>Loading...</Typography>}
      {!loading && activePolls.length === 0 && (
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ ml: 91, mb: 2, fontFamily: "'Lilita One', sans-serif" }}
        >
          No active polls.
        </Typography>
      )}
      {activePolls.map(renderPoll)}

      <Divider sx={{ my: 9 }} />

      {showCreate ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
            gap: 1,
            mt: 3,
          }}
        >
          <h2 style={{ marginLeft: 9, color: "rgb(183, 5, 228)" }}>
            What houses U wanna Poll?
          </h2>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "center",
              mb: 3,
              maxWidth: 900,
              mx: "auto",
            }}
          >
            {houseData.map((house) => {
              const isSelected = selectedHouses.includes(house.name);
              const glowColor = getColor(house.name);
              return (
                <Button
                  key={house.name}
                  variant={isSelected ? "contained" : "outlined"}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    fontFamily: "'Lilita One', sans-serif",
                    height: 60,
                    width: 110,
                    boxShadow: isSelected ? `0 0 10px ${glowColor}` : undefined,
                    textShadow: isSelected
                      ? `0px 0px 15px ${glowColor}`
                      : undefined,
                    transition: "box-shadow 0.3s ease, text-shadow 0.3s ease",
                    backgroundColor: isSelected ? "#1D1901" : undefined,
                    color: isSelected ? glowColor : "#1D1901",
                    "&:hover": {
                      boxShadow: `0 0 20px ${glowColor}`,
                      textShadow: `0px 0px 60px ${glowColor}`,
                      color: glowColor || "#fff",
                    },
                  }}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedHouses(
                        selectedHouses.filter((h) => h !== house.name)
                      );
                    } else {
                      setSelectedHouses([...selectedHouses, house.name]);
                    }
                  }}
                >
                  {house.name}
                </Button>
              );
            })}
          </Box>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              mx: 65,
              mb: 2,
              fontFamily: "'Lilita One', sans-serif",
              color: "#008080",
            }}
          >
            Create a Poll
          </Typography>
          <TextField
            fullWidth
            label="Your question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            InputLabelProps={{
              sx: { fontFamily: "'Lilita One', sans-serif", color: "#008080" },
            }}
            InputProps={{
              sx: { fontFamily: "'Lilita One', sans-serif", color: "#008080" },
            }}
            sx={{ mb: 2 }}
          />
          {options.map((opt, i) => (
            <TextField
              key={i}
              fullWidth
              label={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              InputLabelProps={{
                sx: {
                  fontFamily: "'Lilita One', sans-serif",
                  color: "#008080",
                },
              }}
              InputProps={{
                sx: {
                  fontFamily: "'Lilita One', sans-serif",
                  color: "#008080",
                },
              }}
              sx={{ mb: 1 }}
            />
          ))}
          <Box
            sx={{ display: "flex", flexDirection: "row", gap: 2, mt: 2, mb: 2 }}
          >
            <Button
              onClick={handleAddOption}
              sx={{
                fontFamily: "'Lilita One', sans-serif",
                height: 50,
                width: 150,
                color: "#008080",
                boxShadow: `0 0 20px #008080`,
              }}
            >
              + Add Option
            </Button>
            <Button
              variant="contained"
              onClick={handleCreatePoll}
              sx={{
                fontFamily: "'Lilita One', sans-serif",
                height: 50,
                width: 150,
                color: "#fff",
              }}
            >
              Create Poll
            </Button>
            <Button
              onClick={() => setShowCreate(false)}
              sx={{
                fontFamily: "'Lilita One', sans-serif",
                height: 50,
                width: 150,
                color: "#008080",
                boxShadow: `0 0 20px #008080`,
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (showCreatePollButton && (
        <Button
          variant="contained"
          onClick={() => {
            setShowCreate(true);
            setOptions(["", ""]); // Reset options to 2 empty fields
          }}
          sx={{
            mt: 2,
            ml: 89.9,
            color: "rgb(255, 153, 0)",
            bgcolor: "#222",
            fontFamily: "'Lilita One', sans-serif",
            textShadow: "0px 0px 15px rgb(243, 203, 25)",
            boxShadow: "0 0 10px rgb(255, 153, 0)",
            transition: "box-shadow 0.3s ease",
            opacity: "2500%",
            height: 70,
            width: 150,
            "&:hover": {
              boxShadow: "0 0 20px rgb(80, 147, 235)",
              textShadow: "0px 0px 20px rgb(80, 147, 235)",
              color: "rgb(80, 147, 235)",
            },
          }}
        >
          Create Poll
        </Button>
      ))}
    </Box>
  );
};

export default Poll;
