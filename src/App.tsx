import "./Background.css"; // your wallpaper CSS
import "./App.css"; // any additional overrides (optional)
import { ThemeProvider } from "@mui/material/styles"; // MUI ThemeProvider
import React, { useState, useRef, useEffect } from "react";
import Calendar from "./Components/Calendar";
import Login from "./Components/Login";
import Sidebar from "./Components/sidebar";
//import { useUserRole, UserRoleProvider, useUser } from "./Components/UserContext";
import { Role, Roles } from "./Components/roles";
import Poll from "./Components/poll";
import Message from "./Components/message";
import { useUser } from "./Components/UserContext";
import { supabase } from "./supabase";
import { User } from "./Components/message";
import EventInbox from "./Components/EventInbox";

export interface UserRecord {
  id: string;
  name: string;
  role: string;
  password_hash: string;
}
type Props = {
  color: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};
const Button = ({
  color,
  onClick,
  children,
  className,
  disabled = false,
}: Props) => {
  return (
    <button
      disabled={disabled}
      className={`btn btn-${color}${className ? ` ${className}` : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

function App() {
  const [calendarActive, setCalendarActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [brotherVisible, setBrotherVisible] = useState(true);
  const [whatFraternity, setWhatFraternity] = useState(false);
  const [isBrother, setIsBrother] = useState(false);
  const [isSister, setIsSister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [sorority, setSorority] = useState("");
  const [brotherNumber, setBrotherNumber] = useState("");
  const [sisterPassword, setSisterPassword] = useState("");
  const [showIntroUI, setShowIntroUI] = useState(false);
  const [showBrotherQuestion, setShowBrotherQuestion] = useState(false);
  const [sisterPasswordVisible, setSisterPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentUser, setCurrentUser } = useUser();
  const [currentView, setCurrentView] = useState("Calendar");
  const [sisterName, setSisterName] = useState("");
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fraternity, setFraternity] = useState("");
  // When login succeeds, show the Calendar “card”
  useEffect(() => {
    if (isLoggedIn) setCalendarActive(true);
  }, [isLoggedIn]);
  console.log("🍺 App render:", {
    brotherVisible,
    whatFraternity,
    isBrother,
    fraternity,
    currentUser,
    isLoggedIn,
  });
  // Intro animation logic…
  useEffect(() => {
    const letters = document.querySelectorAll(".animated-text .word");
    const symbol = document.querySelector(".symbol-delay");
    letters.forEach((letter, i) => {
      setTimeout(() => {
        (letter as HTMLElement).style.opacity = "1";
        (letter as HTMLElement).style.transform = "translateY(0)";
      }, 450 * i);
    });
    setTimeout(() => {
      if (symbol) (symbol as HTMLElement).classList.add("plugged");
      setShowIntroUI(true);
    }, 450 * letters.length + 300);
    setTimeout(() => {
      if (symbol) (symbol as HTMLElement).classList.add("glow");
    }, 450 * letters.length + 600);
    setTimeout(() => {
      setShowBrotherQuestion(true);
    }, 1600);
  }, []);

  const handleNoClick = () => {
    setBrotherVisible(false);
    setIsBrother(false);
    setIsSister(true);
    setSisterPasswordVisible(false);
    setWhatFraternity(false);
    setErrorMessage("");
  };
  const handleNextClick = () => {
    if (sorority === sorority.trim()) {
      setIsSister(false);
      setSisterPasswordVisible(true);
      setErrorMessage("");
    } else {
      setErrorMessage("Invalid sorority name.");
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) audioRef.current.volume = newVol;
  };
  const handleBrotherLogin = async () => {
    if (loading) {
      setErrorMessage("Still loading users…");
      return;
    }

    const lookup = name.trim().toLowerCase();
    const user = allUsers.find((u) => u.name.trim().toLowerCase() === lookup);
    if (!user) {
      setErrorMessage("Name not found");
      return;
    }

    // Validate fraternity membership
    if (!isUserInHouse(fraternity, user.role)) {
      setErrorMessage("You are not in this fraternity.");
      return;
    }

    // Password check
    if (user.password_hash !== brotherNumber) {
      setErrorMessage("Bad password");
      return;
    }

    // Success: set currentUser and show calendar
    setCurrentUser({ id: user.id, name: user.name, role: user.role as Role });
    // clear and advance UI...
    setErrorMessage("");
    setName("");
    setBrotherNumber("");
    setBrotherVisible(false);
    setIsBrother(false);
    setIsLoggedIn(true);
  };

  const houseToRolesMap: Record<string, string[]> = {
    KKG: [Roles.KKG_SISTER, Roles.KKG_SOCIAL],
    APHI: [Roles.APHI_SISTER, Roles.APHI_SOCIAL],
    TRIDELT: [Roles.TRIDELT_SISTER, Roles.TRIDELT_SOCIAL],
    DG: [Roles.DG_SISTER, Roles.DG_SOCIAL],
    PHISIG: [Roles.PHISIG_SISTER, Roles.PHISIG_SOCIAL],
    AXO: [Roles.AXO_SISTER, Roles.AXO_SOCIAL],
    AEPHI: [Roles.AEPHI_SISTER, Roles.AEPHI_SOCIAL],
    SDT: [Roles.SDT_SISTER, Roles.SDT_SOCIAL],
    AXID: [Roles.AXID_SISTER, Roles.AXID_SOCIAL],
    THETA: [Roles.THETA_SISTER, Roles.THETA_SOCIAL],
    AGD: [Roles.AGD_SISTER, Roles.AGD_SOCIAL],
    DPHIE: [Roles.DPHIE_SISTER, Roles.DPHIE_SOCIAL],
    THETA_CHI: [Roles.THETA_CHI_BROTHER, Roles.THETA_CHI_SOCIAL],
    DKE: [Roles.DKE_BROTHER, Roles.DKE_SOCIAL],
    DU: [Roles.DU_BROTHER, Roles.DU_SOCIAL],
    ZBT: [Roles.ZBT_BROTHER, Roles.ZBT_SOCIAL],
    AEPI: [Roles.AEPI_BROTHER, Roles.AEPI_SOCIAL],
    SAE: [Roles.SAE_BROTHER, Roles.SAE_SOCIAL],
    PIKE: [Roles.PIKE_BROTHER, Roles.PIKE_SOCIAL],
    SAMMY: [Roles.SAMMY_BROTHER, Roles.SAMMY_SOCIAL],
    TKE: [Roles.TKE_BROTHER, Roles.TKE_SOCIAL],
    PSI_U: [Roles.PSI_U_BROTHER, Roles.PSI_U_SOCIAL],
    SIG_CHI: [Roles.BROTHER, Roles.BLUECH_SOCIAL, Roles.OWNER, Roles.NEO],
    DTD: [Roles.DTD_BROTHER, Roles.DTD_SOCIAL],
  };
  const handleSisterLogin = () => {
    // only keep users in the chosen sorority’s sister role

     if (loading) {
      setErrorMessage("Still loading users…");
      return;
    }

    const lookup = sisterName.trim().toLowerCase();
    const user = allUsers.find((u) => u.name.trim().toLowerCase() === lookup);
    if (!user) {
      setErrorMessage("Name not found");
      return;
    }

    // Validate sorority membership
    if (!isUserInHouse(sorority, user.role)) {
      setErrorMessage("You are not in this sorority.");
      return;
    }

    // Password check
    if (user.password_hash !== sisterPassword) {
      setErrorMessage("Bad password");
      return;
    }

    // Success: set currentUser and show calendar
    setCurrentUser({ id: user.id, name: user.name, role: user.role as Role });

    setErrorMessage("");
    setSisterName("");
    setSisterPassword("");
    setSisterPasswordVisible(false);
    setIsSister(false);
    setIsLoggedIn(true);
  };
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role, password_hash");

      if (error) {
        console.error("Failed to load users:", error);
      } else {
        setAllUsers(data);
      }
      setLoading(false);
    };
    loadUsers();
  }, []);
  const handleYesClick = () => {
    setBrotherVisible(false);
    setIsBrother(false);
    setWhatFraternity(true);
    setIsSister(false);
    setSisterPasswordVisible(false);
    setErrorMessage("");
  };
  console.log({
    brotherVisible,
    showIntroUI,
    showBrotherQuestion,
    isBrother,
    isSister,
    sisterPasswordVisible,
    isLoggedIn,
    currentUser,
  });
  const logout = () => {
    console.log("🔥 logout() fired");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setBrotherVisible(true);
    setIsBrother(false);
    setIsSister(false);
    setSisterPasswordVisible(false);
    setName("");
    setBrotherNumber("");
    setSorority("");
    setSisterName("");
    setSisterPassword("");
    setErrorMessage("");
    setShowIntroUI(true);
    setShowBrotherQuestion(true);
    setWhatFraternity(false);
    setFraternity("");
    console.log({
      brotherVisible,
      showIntroUI,
      showBrotherQuestion,
      isBrother,
      isSister,
      sisterPasswordVisible,
      isLoggedIn,
      currentUser,
    });
  };
  const handleNextClickFrat = () => {
    if (fraternity.trim()) {
      setIsBrother(true);
      setWhatFraternity(false);
    } else {
      setErrorMessage("Invalid fraternity name.");
    }
  };
  function getHouseFromRole(role: string): string {
    // e.g. "KKG_SISTER" → "KKG"
    const [house] = role.split("_");
    return house;
  }

  function normalizeHouseKey(input: string): string {
  return input
    .trim()
    .toUpperCase()
    // collapse any non-alphanumeric sequence into underscore
    .replace(/[^A-Z0-9]+/g, "_")
    // drop leading/trailing underscores
    .replace(/^_+|_+$/g, "");
}
function normalizeRole(value: string): string {
  return value
    .trim()
    .toLowerCase()
    // collapse non-alphanumeric into empty ("_") or space
    .replace(/[^a-z0-9]+/g, "");
}
const fraternityKeys = [
  "THETA_CHI",
  "DKE",
  "DU",
  "ZBT",
  "AEPI",
  "SAE",
  "PIKE",
  "SAMMY",
  "TKE",
  "PSI_U",
  "SIG_CHI",
  "DTD"
];
 function isUserInHouse(enteredHouse: string, userRole: string): boolean {
  const houseKey = normalizeHouseKey(enteredHouse);
  const allowedRoles = houseToRolesMap[houseKey];

  console.log(`Checking house membership:`, {
    enteredHouse,
    houseKey,
    userRole,
    allowedRoles
  });

  if (!allowedRoles) {
    console.warn(`Unknown house key: ${houseKey}`);
    return false;
  }

  const userNorm = normalizeRole(userRole);
  return allowedRoles.some(role => normalizeRole(role) === userNorm);
}


  return (
    <div className="app-container">
      <div className={`main-title ${calendarActive ? "minimized-title" : ""}`}>
        <h1 className="intro-title">
          <span className="animated-text">
            <span className="word">S</span>
            <span className="word">Y</span>
            <span className="word">N</span>
            <span className="word">C</span>
            <span className="word">E</span>
            <span className="word">D</span>
          </span>
          <span className="symbol symbol-delay">Ψ</span>
        </h1>
      </div>

      {isLoggedIn ? (
        <>
          <div className="sidebar-container">
            <Sidebar onNavigate={setCurrentView} onLogout={logout} />
          </div>
          <div className="calendar-container" style={{ marginLeft: 200 }}>
            {currentView === "Calendar" && <Calendar />}
            {currentView === "Poll" && <Poll />}
            {currentView === "Message" && <Message />}
            {currentView === "Event Inbox" && <EventInbox />}
          </div>
        </>
      ) : !isLoggedIn && brotherVisible && showBrotherQuestion ? (
        <div
          className={`brother-question-container ${
            showBrotherQuestion ? "fade-in-up" : "hidden"
          }`}
        >
          <h2 className="question">Are You A Brother?</h2>
          <div className="button-container">
            <Button color="success" onClick={handleYesClick}>
              Yes
            </Button>
            <Button color="danger" onClick={handleNoClick}>
              No
            </Button>
          </div>
        </div>
      ) : whatFraternity ? (
        <div className="fraternity-question-container">
          <h2 className="question">What Fraternity Are You In?</h2>
          <input
            type="text"
            placeholder="Enter your fraternity name"
            value={fraternity}
            onChange={(e) => setFraternity(e.target.value)}
            className="text-box"
          />
          <Button
            disabled={!fraternity.trim()}
            className="next-button next-frat"
            color="primary"
            onClick={handleNextClickFrat}
          >
            Next
          </Button>
          <Button
            className="back-button back-frat"
            color="primary"
            onClick={() => {
              setBrotherVisible(true);
              setFraternity("");
            }}
          >
            Back
          </Button>
        </div>
      ) : isBrother ? (
        <div className="login-form">
          <h2>Brother Login</h2>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-box"
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={brotherNumber}
            onChange={(e) => setBrotherNumber(e.target.value)}
            className="text-box"
          />
          <Button
            className="login-button login-brother"
            color="primary"
            disabled={loading || !name.trim() || !brotherNumber.trim()}
            onClick={handleBrotherLogin}
          >
            {loading ? "Loading…" : "Log In"}
          </Button>
          <Button
            className="back-button back-brother"
            color="primary"
            onClick={() => {
              setWhatFraternity(true);
              setIsBrother(false);
              setName("");
              setBrotherNumber("");
              setErrorMessage("");
            }}
          >
            Back
          </Button>
          {errorMessage && (
            <p
              className="error-message"
              style={{ color: "red", marginTop: "10px" }}
            >
              {errorMessage}
            </p>
          )}
        </div>
      ) : isSister ? (
        <div className="sister-option">
          <h2>What Sorority Are You In?</h2>
          <input
            type="text"
            placeholder="Enter your sorority name"
            value={sorority}
            onChange={(e) => setSorority(e.target.value)}
            className="text-box"
          />
          <Button
            disabled={!sorority.trim()}
            className="next-button next-sister"
            color="primary"
            onClick={handleNextClick}
          >
            Next
          </Button>
          <Button
            className="back-button back-sister"
            color="primary"
            onClick={() => {
              setBrotherVisible(true);
              setSorority("");
            }}
          >
            Back
          </Button>
        </div>
      ) : sisterPasswordVisible ? (
        <div className="sister-password-form">
          <div className="sister-password-form">
            <h2>Sister Login</h2>
            <input
              type="text"
              placeholder="Enter your name"
              value={sisterName}
              onChange={(e) => setSisterName(e.target.value)}
              className="text-box"
            />
            <input
              type="password"
              placeholder="Enter your sister password"
              value={sisterPassword}
              onChange={(e) => setSisterPassword(e.target.value)}
              className="text-box"
            />
            …
          </div>
          <Button
            className="login-button login-sister"
            color="primary"
            disabled={loading || !sisterName.trim() || !sisterPassword.trim()}
            onClick={handleSisterLogin}
          >
            {loading ? "Loading…" : "Log In"}
          </Button>
          <Button
            className="back-button back-sister-password"
            color="primary"
            onClick={() => {
              setIsSister(true);
              setSisterName("");
              setSisterPassword("");
            }}
          >
            Back
          </Button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      ) : null}

      <div className="footer">
        <p>&copy; 2025 ΨSynced. All rights reserved.</p>
      </div>
    </div>
  );
}

export default App;
